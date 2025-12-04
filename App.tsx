import React, { useState, useMemo } from 'react';
import { useAuth } from './services/useAuth';
import { useProcedures } from './services/useProcedures';
import { calculateAnalysis } from './services/gaussianService'; 

import Header from './components/Header';
import AnalysisDashboard from './components/AnalysisDashboard';
import { LocationsManager } from './components/LocationsManager';
import { ScheduleCalendar } from './components/ScheduleCalendar';
import { Procedure } from './types';

const LoginScreen = () => {
  const { signInWithGoogle } = useAuth();
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-6">HealthFlow Platform</h1>
        <button onClick={signInWithGoogle} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all">Entrar com Google</button>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const { procedures, loading: proceduresLoading } = useProcedures(selectedShiftId);

  const analysis = useMemo(() => {
    if (!procedures || procedures.length < 2) return null;
    const durations = procedures.map(p => Number(p.duration));
    const result = calculateAnalysis(durations);
    return { ...result, procedures: procedures as Procedure[] }; 
  }, [procedures]);

  if (authLoading) return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">Carregando...</div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <Header />
      <main className="container mx-auto mt-6 space-y-8 max-w-5xl">
        <section><LocationsManager /></section>
        <section><ScheduleCalendar selectedShiftId={selectedShiftId} onShiftSelected={setSelectedShiftId} /></section>

        <section className="border-t border-slate-700 pt-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">📊 Análise de Performance & Risco</h2>
            
            {proceduresLoading && selectedShiftId && <div className="text-center p-4 text-slate-400">Carregando dados...</div>}

            {((analysis || (procedures && procedures.length > 0)) && !proceduresLoading) ? (
                <AnalysisDashboard 
                    analysis={analysis as any} 
                    procedures={procedures as any} 
                    procedureCount={procedures.length}
                />
            ) : null}
            
            {!selectedShiftId && (
                <div className="text-center p-12 bg-slate-800/50 rounded-lg border border-dashed border-slate-700 text-slate-500">
                <p className="text-lg">👈 Selecione um plantão para ver a análise.</p>
                </div>
            )}
        </section>
      </main>
    </div>
  );
};

export default App;