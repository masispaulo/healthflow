import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import LocationsManager from './components/LocationsManager';
import ScheduleCalendar from './components/ScheduleCalendar';
import RosterSideCalendar from './components/RosterSideCalendar';
import ProcedureInput from './components/ProcedureInput'; 
import AnalysisDashboard from './components/AnalysisDashboard'; // O App chama o Dashboard

import { useAuth } from './services/useAuth';
import { useLocations } from './services/useLocations';
import { calculateGaussianStats } from './services/gaussianService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './services/firebaseConfig';

const App: React.FC = () => {
  const { user, loginWithGoogle, logout, loading: authLoading } = useAuth();
  const { locations, addLocation, deleteLocation } = useLocations(user);

  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [preSelectedDate, setPreSelectedDate] = useState<Date | null>(null);
  
  // Estados que serão passados para a Análise
  const [analysisStats, setAnalysisStats] = useState<any>(null);
  const [formattedProcedures, setFormattedProcedures] = useState<any[]>([]);
  
  // Gatilho para atualizar a tela assim que adicionar algo novo
  const [updateTrigger, setUpdateTrigger] = useState(0);

  // --- FUNÇÃO QUE BUSCA E LIMPA OS DADOS DO BANCO ---
  const fetchAndFormatData = useCallback(async () => {
        if (!user) return;
        
        try {
            // 1. Busca TODOS os plantões (para a Estatística Global / Curva)
            const shiftsRef = collection(db, 'users', user.uid, 'shifts');
            const shiftsSnap = await getDocs(shiftsRef);
            
            let durations: number[] = [];
            let proceduresList: any[] = [];

            // Varre plantões e procedimentos
            const promises = shiftsSnap.docs.map(async (shiftDoc) => {
                const pRef = collection(db, 'users', user.uid, 'shifts', shiftDoc.id, 'procedures');
                const pSnap = await getDocs(pRef);
                
                pSnap.forEach(doc => {
                    const data = doc.data();
                    
                    // SEGURANÇA: Garante que duração é número (evita erro de texto "10")
                    const duration = Number(data.duration);
                    
                    // Só adiciona na estatística se for válido
                    if (!isNaN(duration) && duration > 0) {
                        durations.push(duration);
                    }
                    
                    if (data.startTime && data.endTime) {
                        proceduresList.push({ 
                            startTime: data.startTime, 
                            endTime: data.endTime,
                            duration: duration,
                            shiftId: shiftDoc.id 
                        });
                    }
                });
            });

            await Promise.all(promises);

            // 2. Calcula a Curva Gaussiana com os dados limpos
            const stats = calculateGaussianStats(durations);
            setAnalysisStats(stats);

            // 3. Filtra procedimentos para o cálculo de Fadiga
            let relevantProcedures = [];
            if (selectedShiftId) {
                // Se tem plantão aberto, calcula fadiga só dele
                relevantProcedures = proceduresList.filter(p => p.shiftId === selectedShiftId);
            } else {
                // Se não, usa todos
                relevantProcedures = proceduresList; 
            }
            setFormattedProcedures(relevantProcedures);

        } catch (error) {
            console.error("Erro ao carregar dados:", error);
        }

  }, [user, selectedShiftId, updateTrigger]); 

  // Executa a busca ao carregar ou mudar algo
  useEffect(() => {
    fetchAndFormatData();
  }, [fetchAndFormatData]);

  if (authLoading) return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Carregando...</div>;

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <button onClick={loginWithGoogle} className="bg-indigo-600 text-white px-6 py-3 rounded font-bold">Entrar com Google</button>
      </div>
    );
  }

  const handleSelectShift = (id: string | null) => {
    setSelectedShiftId(id);
    if(id) setTimeout(() => document.getElementById('procedures-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleDateSelectFromRoster = (date: Date) => {
     setPreSelectedDate(date);
     setSelectedShiftId(null); 
     window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Função chamada quando um novo procedimento é salvo
  const handleDataUpdate = () => {
      setUpdateTrigger(prev => prev + 1); // Força recarregar tudo
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20 font-sans">
      <Header user={user} onLogout={logout} />

      <main className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Coluna Esquerda (Principal) */}
          <div className="lg:col-span-8 space-y-6">
            <LocationsManager locations={locations} addLocation={addLocation} deleteLocation={deleteLocation} />
            
            <ScheduleCalendar 
              user={user} 
              locations={locations} 
              selectedShiftId={selectedShiftId}
              onSelectShift={handleSelectShift}
              preSelectedDate={preSelectedDate}
            />

            {/* Área de Input (Aparece ao selecionar plantão) */}
            {selectedShiftId && (
                <div id="procedures-area" className="pt-6 border-t border-slate-700">
                    <h3 className="text-xl font-bold text-indigo-400 mb-4">Procedimentos do Plantão</h3>
                    <ProcedureInput shiftId={selectedShiftId} onUpdate={handleDataUpdate} />
                </div>
            )}

            {/* DASHBOARD DE ANÁLISE (Aqui ele recebe os dados processados) */}
            <div className="pt-8 mt-8 border-t border-slate-700">
                <AnalysisDashboard 
                    analysis={analysisStats} 
                    procedures={formattedProcedures} 
                    procedureCount={formattedProcedures.length}
                />
            </div>
          </div>

          {/* Coluna Direita (Calendário Lateral) */}
          <div className="lg:col-span-4 sticky top-4 z-10">
             <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-lg p-2">
                <div className="p-2 mb-2 border-b border-slate-700"><h3 className="font-bold text-white">Minha Agenda</h3></div>
                <RosterSideCalendar user={user} locations={locations} onDateSelect={handleDateSelectFromRoster} />
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;