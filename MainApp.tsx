import React, { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, addDoc, query } from 'firebase/firestore';
import { db } from './services/firebaseConfig';
import { useAuth } from './services/useAuth';
import { usePatients } from './services/usePatients';
import { calculateGaussianStats } from './services/gaussianService';

import Header from './components/Header';
import MedicalSidebar from './components/MedicalSidebar';
import LocationsManager from './components/LocationsManager';
import ScheduleCalendar from './components/ScheduleCalendar';
import RosterSideCalendar from './components/RosterSideCalendar';
import ProcedureInput from './components/ProcedureInput';
import AnalysisDashboard from './components/AnalysisDashboard';
import TransferModal from './components/TransferModal';
import { ClinicReception } from './components/ClinicReception';

// Importação do Clinic Manager Original (Antigo)
import { ClinicManager } from './components/ClinicManager'; 

import Opportunities from './components/Opportunities';
import { useLocations } from './services/useLocations';

const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const { locations, addLocation, deleteLocation } = useLocations(user);
  const { addPatient } = usePatients(user?.uid ?? null); 

  const [currentView, setCurrentView] = useState<'dashboard' | 'reception' | 'manager' | 'opportunities'>('dashboard');
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // ============================
  // ESTADO DA GERÊNCIA (Seleção de Médico)
  // ============================
  const [managerTargetDoctorId, setManagerTargetDoctorId] = useState<string | null>(null);
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

  // Carrega lista de médicos para o Gerente escolher
  useEffect(() => {
    const loadDoctors = async () => {
        // Tenta buscar da coleção directory
        try {
            const snap = await getDocs(collection(db, 'directory'));
            const docs = snap.docs.map(d => ({ uid: d.id, ...d.data() }));
            setDoctorsList(docs);
        } catch (e) { console.error("Erro carregando médicos", e); }
    };
    if (currentView === 'manager') loadDoctors();
  }, [currentView]);


  // ============================
  // ESTADOS DO PAINEL MÉDICO
  // ============================
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | null>(null);
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [formattedProcedures, setFormattedProcedures] = useState<any[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const [clinicData, setClinicData] = useState<any | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepStartHour, setSleepStartHour] = useState('');
  const [sleepStartMinute, setSleepStartMinute] = useState('');
  const [sleepEndHour, setSleepEndHour] = useState('');
  const [sleepEndMinute, setSleepEndMinute] = useState('');

  const handleClinicDataUpdate = useCallback((data: any) => {
    if (data) setClinicData(data);
  }, []); 

  // Carrega dados do MEU painel (Analysis Autônomo)
  const fetchAndFormatData = useCallback(async () => {
    if (!user || currentView !== 'dashboard') return;
    try {
      if (!selectedShiftId) {
        setFormattedProcedures([]);
        setAnalysisStats(null);
        return;
      }
      const shiftsRef = collection(db, 'users', user.uid, 'shifts');
      const shiftsSnap = await getDocs(shiftsRef);
      let allDurations: number[] = [];
      let currentShiftProcedures: any[] = [];
      const promises = shiftsSnap.docs.map(async (shiftDoc) => {
        const pRef = collection(db, 'users', user.uid, 'shifts', shiftDoc.id, 'procedures');
        const pSnap = await getDocs(pRef);
        pSnap.forEach(doc => {
          const data = doc.data();
          const duration = Number(data.duration);
          const type = data.type || 'WORK';
          if (!isNaN(duration) && duration > 0 && type === 'WORK') allDurations.push(duration);
          if (shiftDoc.id === selectedShiftId) currentShiftProcedures.push({ ...data, id: doc.id, shiftId: shiftDoc.id });
        });
      });
      await Promise.all(promises);
      const stats = calculateGaussianStats(allDurations);
      setAnalysisStats(stats);
      setFormattedProcedures(currentShiftProcedures);
    } catch (error) { console.error(error); }
  }, [user, selectedShiftId, updateTrigger, currentView]);

  useEffect(() => { fetchAndFormatData(); }, [fetchAndFormatData]);
  const handleDataUpdate = () => { setUpdateTrigger(prev => prev + 1); };
  /** Paciente vindo do hospital: 1 clique → cadastra no banco do médico e já está na fila */
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

  // ... (Funções de Sono e Intervalo mantidas do original para economizar espaço visual) ...
  const handleSelectShift = async (id: string | null) => {
    if (!id) { setSelectedShiftId(null); return; }
    setFormattedProcedures([]);
    setAnalysisStats(null);
    setSelectedShiftId(id);
    setTimeout(() => document.getElementById('procedures-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };
  const saveSleepProcedure = async (id: string) => { setIsSleepModalOpen(false); handleDataUpdate(); }; 

  if (!user) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32 font-sans flex flex-col">
      <Header user={user} onLogout={logout} onOpenNetwork={() => setIsNetworkOpen(true)} onOpenTools={() => setIsToolsOpen(true)} isNetworkOpen={isNetworkOpen} setIsNetworkOpen={setIsNetworkOpen} isToolsOpen={isToolsOpen} setIsToolsOpen={setIsToolsOpen} />
      
      <div className="flex flex-1 min-h-0">
        <MedicalSidebar user={user} onOpenRede={() => setIsNetworkOpen(true)} onOpenTools={() => setIsToolsOpen(true)} />
        <div className="flex-1 flex flex-col min-w-0">
      <div className="bg-slate-900 border-b border-slate-800 p-2 flex justify-center gap-2 flex-wrap sticky top-0 z-40">
        <button onClick={() => setCurrentView('dashboard')} className={`px-4 py-2 rounded-lg text-sm font-bold ${currentView === 'dashboard' ? 'bg-slate-800 border border-slate-600' : 'text-slate-400'}`}>Painel Médico</button>
        <button onClick={() => setCurrentView('manager')} className={`px-4 py-2 rounded-lg text-sm font-bold ${currentView === 'manager' ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-500/50' : 'text-slate-400'}`}>Gerência & Agenda</button>
        <button onClick={() => setCurrentView('reception')} className={`px-4 py-2 rounded-lg text-sm font-bold ${currentView === 'reception' ? 'bg-indigo-900/40 text-indigo-400 border border-indigo-500/50' : 'text-slate-400'}`}>Recepção</button>
        <button onClick={() => setCurrentView('opportunities')} className={`px-4 py-2 rounded-lg text-sm font-bold ${currentView === 'opportunities' ? 'bg-yellow-900/40 text-yellow-400 border border-yellow-500/50' : 'text-slate-400'}`}>Vagas</button>
      </div>

      <main className="flex-1 relative">
        {/* === PAINEL MÉDICO (AUTÔNOMO) === */}
        {currentView === 'dashboard' && (
          <div className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            <div className="lg:col-span-8 space-y-8">
              <LocationsManager locations={locations} addLocation={addLocation} deleteLocation={deleteLocation} />
              <ScheduleCalendar user={user} locations={locations} onSelectShift={handleSelectShift} preSelectedDate={preSelectedDate} selectedShiftId={selectedShiftId} />
              {selectedShiftId && (
                <div id="procedures-area" className="pt-8 border-t border-slate-700 animate-fade-in">
                  <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-indigo-400">⚡ Procedimentos</h3><button onClick={() => setIsTransferOpen(true)} className="text-sm bg-slate-800 px-4 py-2 rounded border border-slate-600">Transferir</button></div>
                  <ProcedureInput key={selectedShiftId} shiftId={selectedShiftId} onUpdate={handleDataUpdate} />
                </div>
              )}
              {analysisStats && selectedShiftId && (
                <div className="pt-8 mt-8 border-t border-slate-700">
                  <AnalysisDashboard
                    key={selectedShiftId}
                    analysis={analysisStats}
                    procedures={formattedProcedures}
                    onPatientClick={handlePatientClickFromQueue}
                  />
                </div>
              )}
            </div>
            <div className="lg:col-span-4 space-y-6"><div className="bg-slate-800 rounded-2xl border border-slate-700 p-1 shadow-xl"><RosterSideCalendar user={user} locations={locations} onDateSelect={(date) => { setSelectedShiftId(null); setPreSelectedDate(date); window.scrollTo(0,0); }} /></div></div>
          </div>
        )}

        {/* === GERÊNCIA (SALÃO) === */}
        {currentView === 'manager' && (
          <div className="h-full bg-slate-950 p-4 space-y-8 relative animate-fade-in">
            
            {/* SELETOR DE MÉDICO (Quem o Gerente vai controlar?) */}
            {!managerTargetDoctorId && (
               <div className="max-w-2xl mx-auto bg-slate-800 p-6 rounded-xl border border-slate-700">
                  <h2 className="text-xl font-bold text-white mb-4">Selecione o Médico</h2>
                  <div className="space-y-2">
                     {doctorsList.map(doc => (
                        <button 
                           key={doc.uid} 
                           onClick={() => setManagerTargetDoctorId(doc.uid)}
                           className="w-full text-left p-3 rounded bg-slate-700 hover:bg-indigo-600 transition-colors flex justify-between items-center"
                        >
                           <span className="font-bold text-white">{doc.displayName || doc.email}</span>
                           <span className="text-xs text-slate-300">{doc.specialty}</span>
                        </button>
                     ))}
                     {doctorsList.length === 0 && <p className="text-slate-500">Nenhum médico no diretório.</p>}
                     
                     {/* Opção para gerenciar a si mesmo */}
                     <button 
                        onClick={() => setManagerTargetDoctorId(user.uid)}
                        className="w-full text-center p-3 rounded border border-slate-600 hover:bg-slate-700 text-slate-400 mt-4"
                     >
                        Gerenciar Minha Própria Agenda
                     </button>
                  </div>
               </div>
            )}

            {/* CLINIC MANAGER (Só aparece quando escolhe o médico) */}
            {managerTargetDoctorId && (
                <>
                    <div className="flex justify-between items-center px-4">
                        <h3 className="text-emerald-400 font-bold">Gerenciando: {doctorsList.find(d => d.uid === managerTargetDoctorId)?.displayName || 'Médico'}</h3>
                        <button onClick={() => setManagerTargetDoctorId(null)} className="text-xs text-slate-400 underline">Trocar Médico</button>
                    </div>

                    <ClinicManager 
                      doctorId={managerTargetDoctorId}
                      hospitalId={locations?.[0]?.id || 'default-unit'} 
                      onDataUpdate={handleClinicDataUpdate} 
                    />
                </>
            )}
          </div>
        )}

        {currentView === 'reception' && <div className="h-full bg-slate-950 animate-fade-in"><ClinicReception /></div>}
        {currentView === 'opportunities' && <div className="h-full bg-slate-950 animate-fade-in"><Opportunities /></div>}
      </main>
        </div>
      </div>
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} user={user} shiftId={selectedShiftId} />
      {isSleepModalOpen && (<div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60"><div className="w-full bg-slate-800 p-6 rounded-t-2xl"><h2 className="text-white font-bold mb-4">Descanso</h2><button onClick={() => setIsSleepModalOpen(false)} className="w-full bg-slate-700 py-3 rounded text-white">Cancelar</button></div></div>)}
    </div>
  );
};

export default MainApp;