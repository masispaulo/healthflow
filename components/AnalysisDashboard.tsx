import React, { useState, useEffect } from 'react';
import { AnalysisResults } from '../services/gaussianService';
import { calculateFatigueScore, FatigueResult } from '../services/fatigueService';
import BellCurveChart from './BellCurveChart';

interface ProcedureRaw {
  startTime: string;
  endTime: string;
}

interface AnalysisDashboardProps {
  analysis: AnalysisResults | null;
  procedures: ProcedureRaw[]; 
  procedureCount: number;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, procedures }) => {
  const mean = analysis?.mean ?? 0;
  const stdDev = analysis?.stdDev ?? 0;
  const percentiles = analysis?.percentiles ?? { 95: 0 };
   
  const [targetTime, setTargetTime] = useState<number>(0);
  const [fatigue, setFatigue] = useState<FatigueResult | null>(null);

  // Atualiza o targetTime inicial quando a análise carrega
  useEffect(() => {
    if (mean && stdDev) {
        setTargetTime(Math.round(mean + stdDev));
    }
  }, [mean, stdDev]);

  useEffect(() => {
      if (!procedures || procedures.length === 0) return;

      let earliestStart = procedures[0].startTime;
      let latestEnd = procedures[0].endTime;

      procedures.forEach(p => {
          if (p.startTime < earliestStart) earliestStart = p.startTime;
          if (p.endTime > latestEnd) latestEnd = p.endTime; 
      });

      const result = calculateFatigueScore(earliestStart, latestEnd);
      setFatigue(result);
  }, [procedures]);

  const calculateProbability = (target: number, mean: number, stdDev: number) => {
    if (stdDev === 0 || mean === 0) return 0;
    const z = (target - mean) / stdDev;
    // Aproximação da função erro para probabilidade cumulativa
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014337 * Math.exp(-z * z / 2);
    let prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    if (z > 0) prob = 1 - prob;
    return prob;
  };

  const riskProbability = (1 - calculateProbability(targetTime, mean, stdDev)) * 100;

  return (
    <div className="space-y-6 animate-fade-in-up">
       
      {/* 1. SEÇÃO DE FADIGA (Topo) */}
      {fatigue && (
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg relative overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-6">
                <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${fatigue.status === 'SAFE' ? 'bg-green-500' : fatigue.status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                        Carga Biológica (Fadiga)
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className={`text-6xl font-black ${fatigue.color} tracking-tighter`}>{fatigue.score.toFixed(1)}</span>
                        <span className="text-slate-500 font-medium">pontos</span>
                    </div>
                    <p className="text-slate-400 text-sm mt-3">
                        Jornada com <span className="text-white font-mono">{Math.floor(fatigue.dayMinutes/60)}h</span> diurnas + <span className="text-indigo-400 font-mono font-bold">{Math.floor(fatigue.nightMinutes/60)}h</span> noturnas (peso 1.8x).
                    </p>
                </div>
                <div className={`px-8 py-4 rounded-2xl border flex items-center gap-4 ${fatigue.status === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' : fatigue.status === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                    <div>
                        <p className={`font-bold text-xl ${fatigue.color}`}>{fatigue.label}</p>
                    </div>
                </div>
            </div>
            {/* Barra de Progresso da Fadiga */}
            <div className="w-full bg-slate-700/50 h-3 rounded-full mt-8 overflow-hidden relative">
                {/* Marcadores de limite */}
                <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-500/50 z-20" style={{ left: `${(16.9/25)*100}%` }} title="Início Atenção"></div>
                <div className="absolute top-0 bottom-0 w-0.5 bg-red-500/50 z-20" style={{ left: `${(20.0/25)*100}%` }} title="Início Crítico"></div>
                
                <div 
                    className={`h-full transition-all duration-1000 ease-out ${fatigue.status === 'CRITICAL' ? 'bg-red-600' : fatigue.status === 'WARNING' ? 'bg-yellow-500' : 'bg-green-500'}`} 
                    style={{ width: `${Math.min((fatigue.score / 25) * 100, 100)}%` }}
                ></div>
            </div>
        </div>
      )}

      {/* 2. DADOS ESTATÍSTICOS E GRÁFICO */}
      {analysis ? (
        <>
          {/* Grid de 4 Cards Informativos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg hover:border-indigo-500/50 transition-colors">
                <p className="text-xs text-slate-400 uppercase font-semibold">Tempo Médio (μ)</p>
                <p className="text-2xl font-bold text-white">{mean.toFixed(1)} <span className="text-sm font-normal text-slate-500">min</span></p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg hover:border-indigo-500/50 transition-colors">
                <p className="text-xs text-slate-400 uppercase font-semibold">Desvio Padrão (σ)</p>
                <p className="text-2xl font-bold text-white">{stdDev.toFixed(1)} <span className="text-sm font-normal text-slate-500">min</span></p>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg hover:border-indigo-500/50 transition-colors">
                <p className="text-xs text-slate-400 uppercase font-semibold">P95 (Teto)</p>
                <p className="text-2xl font-bold text-white">{percentiles[95]?.toFixed(0)} <span className="text-sm font-normal text-slate-500">min</span></p>
            </div>
             <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg hover:border-indigo-500/50 transition-colors">
                <p className="text-xs text-slate-400 uppercase font-semibold">Risco Estimado</p>
                <p className={`text-2xl font-bold ${riskProbability > 50 ? 'text-red-400' : 'text-emerald-400'}`}>{riskProbability.toFixed(1)}%</p>
            </div>
          </div>

          {/* Gráfico + Simulador */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna Larga: Gráfico */}
            <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4">Curva de Distribuição Normal</h3>
              <div className="h-[300px] w-full">
                {/* AQUI ESTÁ O GRÁFICO RECHARTS */}
                <BellCurveChart mean={mean} stdDev={stdDev} targetTime={targetTime} />
              </div>
            </div>
            
            {/* Coluna Estreita: Simulador */}
            <div className="lg:col-span-1 bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg flex flex-col justify-center">
              <h3 className="text-lg font-bold text-white mb-4">Simular Risco</h3>
              <label className="text-xs text-slate-400 mb-1">Definir tempo alvo (min)</label>
              <input 
                type="number" 
                value={targetTime} 
                onChange={(e) => setTargetTime(Number(e.target.value))} 
                className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white mb-6 text-center text-xl font-bold focus:ring-2 focus:ring-indigo-500 outline-none" 
              />
              <div className="text-center p-4 bg-slate-900 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 uppercase mb-1">Probabilidade de Exceder</p>
                <p className={`text-5xl font-black ${riskProbability > 50 ? 'text-red-500' : 'text-indigo-500'}`}>
                    {riskProbability.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center p-12 bg-slate-800/30 rounded-lg border border-dashed border-slate-700 text-slate-400">
            <p className="text-lg mb-2">📊 Coletando Dados...</p>
            <p className="text-sm">O sistema precisa de pelo menos 2 procedimentos para traçar a curva de normalidade.</p>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;