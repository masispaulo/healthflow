// src/App.tsx
// VERSÃO CORRIGIDA (com e sem chaves, corretamente)

import React, { useState, useMemo } from 'react';
import { useAuth } from './services/useAuth'; // Seu hook de autenticação
import { useProcedures } from './services/useProcedures'; // O hook de procedimentos

// --- Seus Componentes Visuais ---

// Componentes que VOCÊ JÁ TINHA (export default) -> SEM CHAVES {}
import Header from './components/Header';
import AnalysisDashboard from './components/AnalysisDashboard';
import RosterPlanner from './components/RosterPlanner';
import GeminiInsights from './components/GeminiInsights';

// Componentes NOVOS QUE CRIAMOS (export const) -> COM CHAVES {}
import { LocationsManager } from './components/LocationsManager';
import { ScheduleCalendar } from './components/ScheduleCalendar';

// Seus Tipos (do types.ts) -> COM CHAVES {}
import { Procedure, AnalysisResults, ScheduleEntry } from './types';

// --- Componente de Login (Simples) ---
const LoginScreen = () => {
  const { signInWithGoogle } = useAuth(); // Supondo que useAuth tem essa função
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <button
        onClick={signInWithGoogle}
        className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg"
      >
        Entrar com Google
      </button>
    </div>
  );
};

// --- O Aplicativo Principal ---
export const App: React.FC = () => {
  // 1. Gerenciamento de Estado Centralizado
  const { user, loading: authLoading } = useAuth();

  // ID do plantão (shift) que o usuário selecionou no ScheduleCalendar
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);

  // 2. Busca de Dados
  // Busca os procedimentos APENAS para o plantão selecionado
  const { procedures, loading: proceduresLoading } =
    useProcedures(selectedShiftId);

  // 3. Funções de Análise (do seu App.tsx original)
  // Re-calcula a análise SOMENTE quando a lista de procedimentos mudar
  const analysis = useMemo(() => {
    if (procedures.length === 0) return null;
    // Chame sua função de cálculo (provavelmente do gaussianService)
    // Exemplo: return calculateAnalysis(procedures);
    // Por enquanto, vamos passar os procedimentos brutos
    return { procedures: procedures as Procedure[] }; // Adapte para o tipo AnalysisResults
  }, [procedures]);

  // (Lógica para RosterPlanner e GeminiInsights - pode ser adicionada depois)
  const [analysisResults, setAnalysisResults] =
    useState<AnalysisResults | null>(null);
  const [geminiInsights, setGeminiInsights] = useState<string>('');
  const [isGeminiLoading, setIsGeminiLoading] = useState(false);
  const [schedule, setSchedule] = useState<ScheduleEntry[] | null>(null);

  // --- Renderização ---

  if (authLoading) {
    return <div className="bg-slate-900 min-h-screen text-white">Carregando...</div>;
  }

  if (!user) {
    return <LoginScreen />;
  }

  // O Médico está logado
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <Header />
      <main className="container mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        {/* === COLUNA DA ESQUERDA: Gerenciamento === */}
        <div className="lg:col-span-2 space-y-6">
          {/* Componente para gerenciar locais (Passo 1) */}
          <LocationsManager />

          {/* Componente de Calendário/Plantões (Passo 2+3) */}
          <ScheduleCalendar
            selectedShiftId={selectedShiftId}
            onShiftSelected={setSelectedShiftId}
          />
        </div>

        {/* === COLUNA DA DIREITA: Análise === */}
        <div className="lg:col-span-1 space-y-6">
          {/* SEU DASHBOARD DE ANÁLISE! */}
          {proceduresLoading && selectedShiftId && (
            <p>Carregando análise do plantão...</p>
          )}

          {analysis && !proceduresLoading && (
            <AnalysisDashboard
              analysis={analysis}
              procedureCount={procedures.length}
            />
          )}

          {!analysis && !proceduresLoading && selectedShiftId && (
            <p className="text-center p-4 bg-slate-800 rounded-lg">
              Nenhum procedimento registrado para este plantão.
            </p>
          )}

          {!selectedShiftId && (
            <p className="text-center p-4 bg-slate-800 rounded-lg">
              Selecione um plantão na lista à esquerda para ver a análise.
            </p>
          )}

          {/* Seus outros componentes de IA podem ser alimentados
            com 'analysis' ou 'procedures' da mesma forma.
          */}
          {/* <GeminiInsights ... /> */}
          {/* <RosterPlanner ... /> */}
        </div>
      </main>
    </div>
  );
};

export default App;