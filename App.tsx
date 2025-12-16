import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import LocationsManager from './components/LocationsManager';
import ScheduleCalendar from './components/ScheduleCalendar';
import RosterSideCalendar from './components/RosterSideCalendar';
import ProcedureInput from './components/ProcedureInput'; 
import AnalysisDashboard from './components/AnalysisDashboard';
import TransferModal from './components/TransferModal'; // <--- O novo Modal de Transferência

import { useAuth } from './services/useAuth';
import { useLocations } from './services/useLocations';
import { calculateGaussianStats } from './services/gaussianService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './services/firebaseConfig';

const App: React.FC = () => {
  const { user, loginWithGoogle, logout, loading: authLoading } = useAuth();
  const { locations, addLocation, deleteLocation } = useLocations(user);

  // Estados de Seleção
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | null>(null);
  
  // Estado para o Modal de Transferência
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Estados de Dados (Análise e Procedimentos)
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [formattedProcedures, setFormattedProcedures] = useState<any[]>([]);
  
  // Gatilho para forçar atualização
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // --- BUSCA E FORMATAÇÃO DE DADOS ---
  const fetchAndFormatData = useCallback(async () => {
        if (!user) return;
        
        try {
            const shiftsRef = collection(db, 'users', user.uid, 'shifts');
            const shiftsSnap = await getDocs(shiftsRef);
            
            let durations: number[] = [];
            let proceduresList: any[] = [];

            const promises = shiftsSnap.docs.map(async (shiftDoc) => {
                const pRef = collection(db, 'users', user.uid, 'shifts', shiftDoc.id, 'procedures');
                const pSnap = await getDocs(pRef);
                
                pSnap.forEach(doc => {
                    const data = doc.data();
                    const duration = Number(data.duration);
                    
                    // Lê o TIPO (Work, Standby, Sleep). Se não tiver, assume WORK.
                    const type = data.type || 'WORK'; 
                    
                    // 1. Para a Curva de Gauss (Só entra Trabalho Real)
                    if (!isNaN(duration) && duration > 0 && type === 'WORK') {
                        durations.push(duration);
                    }
                    
                    // 2. Para a Barra de Fadiga (Entra TUDO)
                    if (data.startTime && data.endTime) {
                        proceduresList.push({ 
                            startTime: data.startTime, 
                            endTime: data.endTime,
                            duration: duration,
                            type: type, 
                            shiftId: shiftDoc.id,
                            name: data.name
                        });
                    }
                });
            });

            await Promise.all(promises);

            const stats = calculateGaussianStats(durations);
            setAnalysisStats(stats);

            let relevantProcedures = [];
            if (selectedShiftId) {
                relevantProcedures = proceduresList.filter(p => p.shiftId === selectedShiftId);
            } else {
                relevantProcedures = proceduresList; 
            }
            setFormattedProcedures(relevantProcedures);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }

  }, [user, selectedShiftId, updateTrigger]); 

  useEffect(() => {
    fetchAndFormatData();
  }, [fetchAndFormatData]);

  // --- HANDLERS ---

  const handleSelectShift = (id: string | null) => {
    setSelectedShiftId(id);
    if(id) setTimeout(() => document.getElementById('procedures-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDateSelectFromRoster = (date: Date) => {
     setPreSelectedDate(date);
     setSelectedShiftId(null); 
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDataUpdate = () => {
      setUpdateTrigger(prev => prev + 1); 
  };

  // Quando o plantão é transferido com sucesso
  const handleTransferSuccess = () => {
      setSelectedShiftId(null); // Fecha o painel pois o plantão foi embora
      setUpdateTrigger(prev => prev + 1); // Atualiza tudo
  };

  // --- RENDERIZAÇÃO ---

  if (authLoading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center font-bold animate-pulse">Carregando HealthFlow...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-6">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600 mb-2">HealthFlow</h1>
            <p className="text-slate-400">Gestão Inteligente de Escalas e Fadiga Médica</p>
            <button onClick={loginWithGoogle} className="bg-white text-slate-900 px-8 py-3 rounded-full font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center gap-2 mx-auto">
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81z"/></svg>
                Entrar com Google
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 font-sans selection:bg-indigo-500/30">
      
      {/* O Header agora tem Networking e Pacientes */}
      <Header user={user} onLogout={logout} />

      <main className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUNA ESQUERDA (Principal) */}
          <div className="lg:col-span-8 space-y-8">
            
            <LocationsManager locations={locations} addLocation={addLocation} deleteLocation={deleteLocation} />
            
            <ScheduleCalendar 
              user={user} 
              locations={locations} 
              selectedShiftId={selectedShiftId}
              onSelectShift={handleSelectShift}
              preSelectedDate={preSelectedDate}
            />

            {/* ÁREA DE PROCEDIMENTOS (Só aparece se clicar num plantão) */}
            {selectedShiftId && (
                <div id="procedures-area" className="pt-8 border-t border-slate-700 animate-fade-in">
                    
                    {/* Cabeçalho com Botão de Transferência */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                        <h3 className="text-xl font-bold text-indigo-400 flex items-center gap-2">
                            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
                            Procedimentos do Plantão
                        </h3>
                        
                        <button 
                            onClick={() => setIsTransferOpen(true)}
                            className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-4 py-2 rounded-lg text-sm font-bold border border-slate-700 hover:border-indigo-500/50 transition-all shadow-sm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                            Transferir Plantão
                        </button>
                    </div>

                    {/* Input (Agora com Busca de Pacientes) */}
                    <ProcedureInput shiftId={selectedShiftId} onUpdate={handleDataUpdate} />
                    
                    {/* Modal de Transferência */}
                    <TransferModal 
                        isOpen={isTransferOpen} 
                        onClose={() => setIsTransferOpen(false)} 
                        shiftId={selectedShiftId}
                        onSuccess={handleTransferSuccess}
                    />
                </div>
            )}

            {/* DASHBOARD (Fadiga + Gauss) */}
            <div className="pt-8 mt-8 border-t border-slate-700">
                <AnalysisDashboard 
                    analysis={analysisStats} 
                    procedures={formattedProcedures} 
                    procedureCount={formattedProcedures.length}
                />
            </div>
          </div>

          {/* COLUNA DIREITA (Lateral) */}
          <div className="lg:col-span-4 sticky top-24 z-10 space-y-6">
             {/* Card Agenda */}
             <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden">
                <div className="p-4 border-b border-slate-700 bg-slate-800/50">
                    <h3 className="font-bold text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        Minha Agenda
                    </h3>
                </div>
                <div className="p-2">
                    <RosterSideCalendar user={user} locations={locations} onDateSelect={handleDateSelectFromRoster} />
                </div>
             </div>

             {/* Dica Rápida (Opcional) */}
             <div className="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4">
                <p className="text-xs text-indigo-300 font-bold mb-1">DICA PRO</p>
                <p className="text-xs text-indigo-200/70">
                    Adicione colegas no menu <strong>Networking</strong> para habilitar a troca rápida de plantões.
                </p>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;