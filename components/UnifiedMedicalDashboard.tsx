import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../services/firebaseConfig';
import { useAuthState } from 'react-firebase-hooks/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  getDocs
} from 'firebase/firestore';

import AnalysisDashboard from '../components/AnalysisDashboard';
import { ClinicManager } from '../components/ClinicManager'; 
import Header from '../components/Header';
import { usePatients } from '../services/usePatients';
import { LayoutDashboard, Settings } from 'lucide-react';

const UnifiedMedicalDashboard: React.FC = () => {
  const [user, loadingAuth] = useAuthState(auth);
  const { addPatient } = usePatients(user?.uid ?? null);
  
  const [activeTab, setActiveTab] = useState<'DOCTOR' | 'MANAGER'>('DOCTOR');
  const [clinicData, setClinicData] = useState<any>(null);
  const [proceduresFromShifts, setProceduresFromShifts] = useState<any[]>([]);

  /** 1 clique: paciente da fila → cadastra no banco do médico */
  const handlePatientClickFromQueue = useCallback(async (patient: any) => {
    if (!user?.uid) return;
    const raw = patient.raw || patient;
    const name = patient.name || raw?.patientName || raw?.name;
    if (!name) return;
    try {
      await addPatient({
        name,
        age: raw?.age ?? '',
        bed: raw?.bed ?? '',
        diagnosis: raw?.diagnosis ?? ''
      });
      alert(`✅ ${name} registrado no seu banco de pacientes.`);
    } catch (e) {
      console.error(e);
      alert('Erro ao registrar paciente.');
    }
  }, [user?.uid, addPatient]);

  // 1. ESCUTAR DADOS DO FIREBASE (shifts + appointments)
  useEffect(() => {
    if (!user) return;

    let unsubAppointments: (() => void) | null = null;

    const shiftsQuery = query(
      collection(db, 'shifts'),
      where('doctorId', '==', user.uid),
      orderBy('start', 'asc')
    );

    const unsubShifts = onSnapshot(shiftsQuery, (shiftSnap) => {
      const shifts = shiftSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startTime: doc.data().start?.toDate ? doc.data().start.toDate() : new Date(doc.data().start),
        endTime: doc.data().end?.toDate ? doc.data().end.toDate() : new Date(doc.data().end),
      }));

      const appointmentsQuery = query(
        collection(db, 'appointments'),
        where('doctorId', '==', user.uid), 
        orderBy('scheduledTime', 'asc')
      );

      unsubAppointments?.();
      unsubAppointments = onSnapshot(appointmentsQuery, (aptSnap) => {
        const appointments = aptSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().scheduledTime?.toDate ? doc.data().scheduledTime.toDate() : new Date(doc.data().scheduledTime),
          endTime: doc.data().endTime?.toDate ? doc.data().endTime.toDate() : new Date(new Date(doc.data().scheduledTime).getTime() + 30*60000),
          type: 'WORK'
        }));

        setClinicData((prev: any) => ({
          ...prev,
          doctor: { id: user.uid, name: user.displayName },
          shifts: shifts,
          patients: appointments
        }));
      });
    });

    return () => {
      unsubShifts();
      unsubAppointments?.();
    };
  }, [user]);

  // 2. BUSCAR PROCEDURES de users/uid/shifts (pacientes vindos do hospital, plantão de hoje)
  useEffect(() => {
    if (!user) return;

    const fetchProcedures = async () => {
      try {
        const userShiftsRef = collection(db, 'users', user.uid, 'shifts');
        const userShiftsSnap = await getDocs(userShiftsRef);
        const allProcedures: any[] = [];
        const today = new Date().toDateString();
        for (const shiftDoc of userShiftsSnap.docs) {
          const shiftData = shiftDoc.data();
          const shiftStart = shiftData.startTime?.toDate?.() ?? new Date(shiftData.startTime ?? 0);
          if (shiftStart.toDateString() === today) {
            const pRef = collection(db, 'users', user.uid, 'shifts', shiftDoc.id, 'procedures');
            const pSnap = await getDocs(pRef);
            pSnap.forEach(d => allProcedures.push({ ...d.data(), id: d.id, shiftId: shiftDoc.id }));
          }
        }
        setProceduresFromShifts(allProcedures);
      } catch (e) { console.error(e); }
    };

    fetchProcedures();
    const interval = setInterval(fetchProcedures, 30000);
    return () => clearInterval(interval);
  }, [user]);

  // Função para receber dados diretos do ClinicManager (quando você mexe na agenda)
  const handleManagerUpdate = (data: any) => {
    console.log("Dados recebidos da Gerência:", data);
    setClinicData({
      doctor: data.doctor,
      shifts: data.shifts,
      patients: data.patients
    });
  };

  if (loadingAuth) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;
  if (!user) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Faça login.</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col font-sans">
      <Header user={user} onLogout={() => auth.signOut()} />

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-6 overflow-hidden">
        
        {/* NAVEGAÇÃO SUPERIOR */}
        <div className="flex gap-4 border-b border-slate-800 pb-4">
            <button 
                onClick={() => setActiveTab('DOCTOR')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                    activeTab === 'DOCTOR' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                }`}
            >
                <LayoutDashboard size={18} /> Painel Médico
            </button>
            <button 
                onClick={() => setActiveTab('MANAGER')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold transition-all ${
                    activeTab === 'MANAGER' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'
                }`}
            >
                <Settings size={18} /> Gerência & Agenda
            </button>
        </div>

        {/* CONTEÚDO */}
        <div className="flex-1 min-h-0 relative">
            {activeTab === 'DOCTOR' ? (
                // MODO MÉDICO (Analysis)
                <div className="h-full overflow-y-auto">
                     <AnalysisDashboard 
                        clinicData={clinicData}
                        procedures={proceduresFromShifts.length > 0 ? proceduresFromShifts : undefined}
                        onPatientClick={handlePatientClickFromQueue}
                     />
                </div>
            ) : (
                // MODO GERENTE (ClinicManager Antigo/Restaurado)
                <div className="h-full overflow-y-auto">
                    {/* AQUI ESTAVA O ERRO: Removemos hospitalId e doctorId que travavam.
                       Passamos apenas o currentUser e a função de update.
                    */}
                    <ClinicManager 
                        currentUser={user}
                        onDataUpdate={handleManagerUpdate}
                    />
                </div>
            )}
        </div>
      </main>
    </div>
  );
};

export default UnifiedMedicalDashboard;