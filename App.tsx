// src/App.tsx
// VERSÃO FINAL: Com regra de segurança (Mínimo 2 procedimentos)

import React, { useState, useMemo } from 'react';
import { useAuth } from './services/useAuth';
import { useProcedures } from './services/useProcedures';

// Cérebro Matemático
import { calculateAnalysis } from './services/gaussianService'; 

// Componentes Visuais
import Header from './components/Header';
import AnalysisDashboard from './components/AnalysisDashboard';
import { LocationsManager } from './components/LocationsManager';
import { ScheduleCalendar } from './components/ScheduleCalendar';

// Tipos
import { Procedure } from './types';

const LoginScreen = () => {
  const { signInWithGoogle } = useAuth();
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-6">HealthFlow Platform</h1>
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all"
        >
          Entrar com Google
        </button>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  const { procedures, loading: proceduresLoading } = useProcedures(selectedShiftId);

  const analysis = useMemo(() => {
    // --- REGRA DE SEGURANÇA ---
    // Precisamos de pelo menos 2 procedimentos para ter desvio padrão.
    // Se tiver menos de 2, retornamos null para não quebrar o gráfico.
    if (!procedures || procedures.length < 2) return null;

    const durations = procedures.map(p => Number(p.duration));
    const result = calculateAnalysis(durations);

    return {
        ...result,
        procedures: procedures as Procedure[] 
    }; 
  }, [procedures]);

  if (authLoading) return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">Carregando...</div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <Header />
      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        
        {/* ESQUERDA */}
        <div className="lg:col-span-2 space-y-6">
          <LocationsManager />
          <ScheduleCalendar 
            selectedShiftId={selectedShiftId}
            onShiftSelected={setSelectedShiftId}
          />
        </div>

        {/* DIREITA */}
        <div className="lg:col-span-1 space-y-6">
          
          {proceduresLoading && selectedShiftId && (
             <div className="text-center p-4 text-slate-400">Carregando dados...</div>
          )}

          {/* Só mostra o Dashboard se tiver análise válida (2+ procedimentos) */}
          {analysis && !proceduresLoading && (
            <AnalysisDashboard 
                analysis={analysis as any} 
                procedureCount={procedures.length} 
            />
          )}

          {/* Mensagem específica para quando tem pouco dado */}
          {!analysis && !proceduresLoading && selectedShiftId && (
             <div className="text-center p-6 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">
                <p className="mb-2 text-xl">📉 Dados Insuficientes</p>
                <p className="text-sm mb-4">
                  Você tem <strong>{procedures.length}</strong> procedimento(s) registrado(s).
                </p>
                <p className="text-sm text-yellow-400">
                  ⚠️ Adicione pelo menos <strong>2 procedimentos</strong> para que o sistema possa calcular a variabilidade e gerar a Curva de Gauss.
                </p>
             </div>
          )}
          
          {!selectedShiftId && (
            <div className="text-center p-6 bg-slate-800 rounded-lg border border-slate-700 text-slate-400">
              <p>👈 Selecione um plantão ao lado para ver a análise.</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;