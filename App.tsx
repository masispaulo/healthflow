import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import LocationsManager from './components/LocationsManager';
import ScheduleCalendar from './components/ScheduleCalendar';
import RosterSideCalendar from './components/RosterSideCalendar';
import ProcedureInput from './components/ProcedureInput';
import AnalysisDashboard from './components/AnalysisDashboard';
import TransferModal from './components/TransferModal';

import { useAuth } from './services/useAuth';
import { useLocations } from './services/useLocations';
import { calculateGaussianStats } from './services/gaussianService';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from './services/firebaseConfig';

const App: React.FC = () => {
  const { user, loginWithGoogle, logout } = useAuth();
  const { locations, addLocation, deleteLocation } = useLocations(user);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | null>(null);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // === ESTADOS DE DADOS ===
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [formattedProcedures, setFormattedProcedures] = useState<any[]>([]);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // === ESTADOS DO MODAL DE SONO ===
  const [isSleepModalOpen, setIsSleepModalOpen] = useState(false);
  const [sleepStartHour, setSleepStartHour] = useState('');
  const [sleepStartMinute, setSleepStartMinute] = useState('');
  const [sleepEndHour, setSleepEndHour] = useState('');
  const [sleepEndMinute, setSleepEndMinute] = useState('');

  // 1. BUSCA INTELIGENTE
  const fetchAndFormatData = useCallback(async () => {
    if (!user) return;
    try {
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
          
          if (!isNaN(duration) && duration > 0 && type === 'WORK') {
            allDurations.push(duration);
          }
          
          if (shiftDoc.id === selectedShiftId) {
            currentShiftProcedures.push({ 
              ...data,
              id: doc.id,
              shiftId: shiftDoc.id
            });
          }
        });
      });

      await Promise.all(promises);

      const stats = calculateGaussianStats(allDurations);
      setAnalysisStats(stats);
      setFormattedProcedures(currentShiftProcedures);

    } catch (error) {
      console.error("Erro ao processar dados:", error);
    }
  }, [user, selectedShiftId, updateTrigger]);

  useEffect(() => {
    fetchAndFormatData();
  }, [fetchAndFormatData]);

  const handleDataUpdate = () => {
      setUpdateTrigger(prev => prev + 1); 
  };

  // 2. LÓGICA DE DETECÇÃO DE SONO E INTERVALO
  const detectIntervalBetweenShifts = async (currentShiftId: string) => {
    if (!user) return false;
    const shiftsRef = collection(db, 'users', user.uid, 'shifts');
    const shiftsSnap = await getDocs(shiftsRef);
    let shifts: any[] = [];
    shiftsSnap.forEach(doc => {
      const data = doc.data();
      shifts.push({ id: doc.id, date: data.date, startTime: data.startTime, endTime: data.endTime });
    });
    shifts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const index = shifts.findIndex(s => s.id === currentShiftId);
    if (index <= 0) return false;
    const previous = shifts[index - 1];
    const current = shifts[index];
    if (!previous.endTime || !current.startTime) return false;
    const prevEnd = new Date(`2000-01-01T${previous.endTime}`);
    const currStart = new Date(`2000-01-01T${current.startTime}`);
    if (currStart < prevEnd) currStart.setDate(currStart.getDate() + 1);
    const diffMinutes = (currStart.getTime() - prevEnd.getTime()) / 60000;
    return diffMinutes >= 60;
  };

  const saveSleepProcedure = async (shiftId: string) => {
    if (!user) return;
    const startTime = `${sleepStartHour.padStart(2, '0')}:${sleepStartMinute.padStart(2, '0')}`;
    const endTime = `${sleepEndHour.padStart(2, '0')}:${sleepEndMinute.padStart(2, '0')}`;
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    if (end < start) end.setDate(end.getDate() + 1);
    const duration = (end.getTime() - start.getTime()) / 60000;
    
    await addDoc(collection(db, 'users', user.uid, 'shifts', shiftId, 'procedures'), {
      type: 'SLEEP', startTime, endTime, duration, name: 'Descanso'
    });
    setIsSleepModalOpen(false);
    handleDataUpdate(); 
  };

  const handleSelectShift = async (id: string | null) => {
    if (!id) { setSelectedShiftId(null); return; }
    setSelectedShiftId(id);
    setTimeout(() => { document.getElementById("procedures-area")?.scrollIntoView({ behavior: "smooth" }); }, 100);
    const hasInterval = await detectIntervalBetweenShifts(id);
    if (hasInterval) {
      const slept = window.confirm("Você dormiu entre os plantões? Deseja registrar descanso?");
      if (slept) setIsSleepModalOpen(true);
    }
  };

  const SleepModal = () => {
    if (!isSleepModalOpen) return null;
    return (
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
        <div className="w-full bg-slate-800 border-t border-slate-700 rounded-t-2xl p-6 animate-slide-up shadow-2xl">
          <h2 className="text-lg font-bold text-white mb-4">Registrar Descanso</h2>
          <div className="space-y-4">
            <div><label className="text-sm text-slate-300">Início</label><div className="flex items-center gap-2 mt-1"><input type="number" placeholder="HH" value={sleepStartHour} onChange={(e) => setSleepStartHour(e.target.value)} className="w-16 bg-slate-700 text-white p-3 rounded-lg text-center text-lg outline-none focus:ring-2 focus:ring-indigo-500" /><span className="text-white text-xl">:</span><input type="number" placeholder="MM" value={sleepStartMinute} onChange={(e) => setSleepStartMinute(e.target.value)} className="w-16 bg-slate-700 text-white p-3 rounded-lg text-center text-lg outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
            <div><label className="text-sm text-slate-300">Fim</label><div className="flex items-center gap-2 mt-1"><input type="number" placeholder="HH" value={sleepEndHour} onChange={(e) => setSleepEndHour(e.target.value)} className="w-16 bg-slate-700 text-white p-3 rounded-lg text-center text-lg outline-none focus:ring-2 focus:ring-indigo-500" /><span className="text-white text-xl">:</span><input type="number" placeholder="MM" value={sleepEndMinute} onChange={(e) => setSleepEndMinute(e.target.value)} className="w-16 bg-slate-700 text-white p-3 rounded-lg text-center text-lg outline-none focus:ring-2 focus:ring-indigo-500" /></div></div>
          </div>
          <div className="mt-6 flex flex-col gap-3">
            <button onClick={() => saveSleepProcedure(selectedShiftId!)} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-xl text-lg shadow-lg">Salvar Descanso</button>
            <button onClick={() => setIsSleepModalOpen(false)} className="w-full bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-4 rounded-xl text-lg">Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white pb-32">
      {user && <Header user={user} onLogout={logout} />}

      {!user ? (
        <div className="flex flex-col items-center justify-center h-[70vh]">
          <button onClick={loginWithGoogle} className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-transform transform hover:scale-105">
            Entrar com Google
          </button>
        </div>
      ) : (
        // LAYOUT COM GAP MAIOR E SEM POSIÇÃO RELATIVA/ABSOLUTA PROBLEMÁTICA
        <div className="container mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* === COLUNA DA ESQUERDA === */}
          <div className="lg:col-span-8 space-y-8">
            <LocationsManager 
                locations={locations} 
                addLocation={addLocation} 
                deleteLocation={deleteLocation} 
            />

            <ScheduleCalendar 
                user={user} 
                locations={locations} 
                onSelectShift={handleSelectShift} 
                preSelectedDate={preSelectedDate} 
                selectedShiftId={selectedShiftId} 
            />
            
            {selectedShiftId && (
                <div id="procedures-area" className="pt-8 border-t border-slate-700 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">⚡ Procedimentos</h3>
                        <button onClick={() => setIsTransferOpen(true)} className="text-sm bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-lg border border-slate-600 transition-colors">Transferir Plantão</button>
                    </div>
                    <ProcedureInput shiftId={selectedShiftId} onUpdate={handleDataUpdate} />
                </div>
            )}

            {analysisStats && (
                <div className="pt-8 mt-8 border-t border-slate-700 animate-fade-in">
                    <AnalysisDashboard analysis={analysisStats} procedures={formattedProcedures} />
                </div>
            )}
          </div>

          {/* === COLUNA DA DIREITA (CALENDÁRIO) === */}
          {/* Removi o sticky para parar de flutuar e sobrepor */}
          <div className="lg:col-span-4 space-y-6">
             <div className="bg-slate-800 rounded-2xl border border-slate-700 p-1 shadow-xl overflow-hidden">
                <RosterSideCalendar 
                    user={user} 
                    locations={locations} 
                    onDateSelect={(date) => {
                       setSelectedShiftId(null);
                       setPreSelectedDate(date);
                       if (window.innerWidth < 1024) {
                         window.scrollTo({ top: 0, behavior: 'smooth' });
                       }
                    }}
                />
             </div>
          </div>

        </div>
      )}

      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} user={user} shiftId={selectedShiftId} />
      <SleepModal />
    </div>
  );
};

export default App;