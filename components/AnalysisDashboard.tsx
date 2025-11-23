// src/components/AnalysisDashboard.tsx
import React, { useState } from 'react';
import { AnalysisResults } from '../services/gaussianService';
import BellCurveChart from './BellCurveChart'; // Vamos atualizar este também

interface AnalysisDashboardProps {
  analysis: AnalysisResults;
  procedureCount: number;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, procedureCount }) => {
  const { mean, stdDev, percentiles } = analysis;
  
  // Estado para a calculadora de risco (input do usuário)
  const [targetTime, setTargetTime] = useState<number>(Math.round(mean + stdDev));

  // Função para calcular a probabilidade (Área sob a curva)
  // Probabilidade de ser MENOR que o tempo alvo
  const calculateProbability = (target: number, mean: number, stdDev: number) => {
    if (stdDev === 0) return target >= mean ? 1 : 0;
    const z = (target - mean) / stdDev;
    // Aproximação da função de erro (erf)
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014337 * Math.exp(-z * z / 2);
    let prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    if (z > 0) prob = 1 - prob;
    return prob;
  };

  const riskProbability = (1 - calculateProbability(targetTime, mean, stdDev)) * 100;

  return (
    <div className="space-y-6 animation-fade-in">
      
      {/* === CARTÕES DE MÉTRICAS (DARK MODE) === */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Média */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-blue-900/30 text-blue-400 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Tempo Médio (μ)</p>
            <p className="text-2xl font-bold text-white">{mean.toFixed(1)} <span className="text-sm font-normal text-slate-500">min</span></p>
          </div>
        </div>

        {/* Card 2: Desvio Padrão */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-purple-900/30 text-purple-400 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Desvio Padrão (σ)</p>
            <p className="text-2xl font-bold text-white">{stdDev.toFixed(1)} <span className="text-sm font-normal text-slate-500">min</span></p>
          </div>
        </div>

        {/* Card 3: Risco Calculado (Dinâmico) */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg flex items-center gap-4">
          <div className={`p-3 rounded-full ${riskProbability > 50 ? 'bg-red-900/30 text-red-400' : 'bg-green-900/30 text-green-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Risco de Atraso (&gt;{targetTime}m)</p>
            <p className={`text-2xl font-bold ${riskProbability > 50 ? 'text-red-400' : 'text-green-400'}`}>
              {riskProbability.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Card 4: Percentil 95 */}
        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg flex items-center gap-4">
          <div className="p-3 bg-indigo-900/30 text-indigo-400 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase font-semibold">Percentil 95%</p>
            <p className="text-2xl font-bold text-white">{percentiles[95]?.toFixed(0)} <span className="text-sm font-normal text-slate-500">min</span></p>
          </div>
        </div>
      </div>

      {/* === ÁREA DOS GRÁFICOS === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Coluna da Esquerda: Gráfico de Gauss (Ocupa 2/3) */}
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
          <h3 className="text-lg font-bold text-white mb-1">Curva de Distribuição Normal</h3>
          <p className="text-sm text-slate-400 mb-6">Probabilidade de duração baseada no histórico.</p>
          
          <div className="h-[300px] w-full">
            {/* Passamos as cores escuras para o gráfico */}
            <BellCurveChart 
              mean={mean} 
              stdDev={stdDev} 
              targetTime={targetTime}
            />
          </div>
        </div>

        {/* Coluna da Direita: Calculadora de Risco (Ocupa 1/3) */}
        <div className="lg:col-span-1 bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-center">
          <h3 className="text-lg font-bold text-white mb-4">Previsão de Risco</h3>
          
          <div className="mb-6">
            <label className="block text-sm text-slate-400 mb-2">
              Definir Tempo Limite (minutos)
            </label>
            <input
              type="number"
              value={targetTime}
              onChange={(e) => setTargetTime(Number(e.target.value))}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white text-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            />
          </div>

          <div className="text-center p-6 bg-slate-900/50 rounded-xl border border-slate-700">
            <p className="text-slate-400 text-sm mb-1">Chance de ultrapassar o limite</p>
            <p className={`text-5xl font-black ${riskProbability > 50 ? 'text-red-500' : 'text-blue-500'}`}>
              {riskProbability.toFixed(1)}%
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {riskProbability > 50 ? 'Alto risco de atraso' : 'Dentro da margem segura'}
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalysisDashboard;