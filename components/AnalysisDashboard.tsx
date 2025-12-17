import React, { useState, useEffect } from 'react';
import { AnalysisResults } from '../services/gaussianService';
import { calculateFatigueScore, FatigueResult } from '../services/fatigueService';
import BellCurveChart from './BellCurveChart';

interface ProcedureRaw {
  startTime: string;
  endTime: string;
  type?: string;
}

interface AnalysisDashboardProps {
  analysis: AnalysisResults | null;
  procedures: ProcedureRaw[];
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, procedures }) => {
  const mean = analysis?.mean ?? 0;
  const stdDev = analysis?.stdDev ?? 0;

  // Percentil 95
  const p95 = mean + (1.645 * stdDev);

  const [targetTime, setTargetTime] = useState<number>(Math.round(mean + stdDev) || 60);
  const [fatigue, setFatigue] = useState<FatigueResult | null>(null);

  useEffect(() => {
    if (!procedures) return;
    const result = calculateFatigueScore(procedures);
    setFatigue(result);
  }, [procedures]);

  // Função de probabilidade acumulada
  const calculateProbability = (target: number, mean: number, stdDev: number) => {
    if (stdDev === 0 || mean === 0) return 0;
    const z = (target - mean) / stdDev;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014337 * Math.exp(-z * z / 2);
    let prob = d * t * (0.319381530 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    if (z > 0) prob = 1 - prob;
    return prob;
  };

  const riskProbability = (1 - calculateProbability(targetTime, mean, stdDev)) * 100;

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* 1. PAINEL DE FADIGA */}
      {fatigue && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${
                  fatigue.status === 'SAFE' ? 'bg-emerald-500' :
                  fatigue.status === 'WARNING' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}></span>
                Carga Biológica (Modelo SAFTE-FAST)
              </h3>

              <div className="flex items-baseline gap-3">
                <span className={`text-6xl font-black ${fatigue.color} tracking-tighter`}>
                  {fatigue.score.toFixed(1)}
                </span>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold text-sm uppercase">Pontos</span>
                  <span className="text-slate-600 text-xs">Acumulados</span>
                </div>
              </div>

              <div className="flex gap-4 mt-4 text-xs font-medium text-slate-400 bg-slate-900/50 p-2 rounded-lg inline-flex border border-slate-700/50">
                <div>☀️ {Math.floor(fatigue.dayMinutes/60)}h <span className="opacity-50">Dia</span></div>
                <div className="w-[1px] bg-slate-700"></div>
                <div>🌙 {Math.floor(fatigue.nightMinutes/60)}h <span className="opacity-50">Noite</span></div>
                <div className="w-[1px] bg-slate-700"></div>
                <div className="text-emerald-400">💤 {Math.floor(fatigue.recoveryMinutes/60)}h <span className="opacity-50">Recup.</span></div>
              </div>
            </div>

            <div className={`px-6 py-4 rounded-xl border flex flex-col items-end min-w-[180px] ${
              fatigue.status === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' :
              fatigue.status === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30' :
              'bg-emerald-500/10 border-emerald-500/30'
            }`}>
              <span className="text-[10px] uppercase font-bold opacity-70 mb-1 tracking-widest">Status Atual</span>
              <p className={`font-black text-xl ${fatigue.color}`}>{fatigue.label}</p>
            </div>
          </div>

          <div className="w-full bg-slate-900/50 h-3 rounded-full mt-8 overflow-hidden relative">
            <div className="absolute top-0 bottom-0 w-[2px] bg-slate-600 z-20" style={{ left: `${(16.9/25)*100}%` }}></div>
            <div className="absolute top-0 bottom-0 w-[2px] bg-red-900 z-20" style={{ left: `${(20/25)*100}%` }}></div>
            <div
              className={`h-full transition-all duration-1000 ease-out ${
                fatigue.status === 'CRITICAL' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                fatigue.status === 'WARNING' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`}
              style={{ width: `${Math.min((fatigue.score / 25) * 100, 100)}%` }}
            ></div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono uppercase">
            <span>Início (0.0)</span>
            <span className="pl-8">Alerta (16.9)</span>
            <span>Bloqueio (20.0)</span>
          </div>
        </div>
      )}

      {/* 2. GRÁFICO E ESTATÍSTICAS */}
      {analysis && analysis.mean > 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">

          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              📊 Performance vs Média (Curva Gaussiana)
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-700">

            {/* COLUNA 1: Gráfico */}
            <div className="lg:col-span-2 p-6 flex flex-col items-center justify-center bg-slate-800/50">
              <div className="h-[280px] w-full max-w-2xl relative">
                <BellCurveChart mean={mean} stdDev={stdDev} targetTime={targetTime} />

                <div className="absolute top-2 right-2 flex items-center gap-2 bg-slate-900/80 px-2 py-1 rounded border border-slate-700 text-[10px] text-slate-400 pointer-events-none">
                  <div className="w-3 h-[1px] bg-red-400 border border-red-400 border-dashed"></div>
                  <span>Sua Meta: {targetTime} min</span>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-6 border-t border-slate-700/50">
                <div className="text-center group hover:bg-slate-700/30 p-2 rounded transition-colors">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Tempo Médio</p>
                  <p className="text-2xl font-black text-white">{mean.toFixed(1)} <span className="text-sm text-slate-500">min</span></p>
                </div>

                <div className="text-center group hover:bg-slate-700/30 p-2 rounded transition-colors border-l border-r border-slate-700/50">
                  <p className="text-xs text-indigo-400 uppercase font-bold mb-1">P95 (Teto Seguro)</p>
                  <p className="text-2xl font-black text-indigo-400">{p95.toFixed(1)} <span className="text-sm text-indigo-400/70">min</span></p>
                  <p className="text-[10px] text-slate-500">95% dos casos abaixo disso</p>
                </div>

                <div className="text-center group hover:bg-slate-700/30 p-2 rounded transition-colors">
                  <p className="text-xs text-slate-500 uppercase font-bold mb-1">Variação (Desvio)</p>
                  <p className="text-2xl font-black text-slate-400">±{stdDev.toFixed(1)} <span className="text-sm text-slate-600">min</span></p>
                </div>
              </div>
            </div>

            {/* COLUNA 2: Simulador */}
            <div className="lg:col-span-1 p-8 bg-slate-900/30 flex flex-col justify-center relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent"></div>

              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">
                Simulador de Risco
              </h3>

              <div className="mb-8">
                <label className="text-xs text-slate-500 mb-2 block font-bold ml-1">DEFINIR META (MINUTOS)</label>
                <div className="relative">
                  <input
                    type="number"
                    value={targetTime}
                    onChange={(e) => setTargetTime(Number(e.target.value))}
                    className="w-full pl-4 pr-12 py-4 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none font-mono text-2xl text-center shadow-inner transition-all"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">min</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                  Mova a <span className="text-red-400 font-bold">linha vermelha</span> no gráfico alterando este valor.
                </p>
              </div>

              <div className="text-center bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                <p className="text-slate-400 text-xs uppercase font-bold mb-2">Probabilidade de Atraso</p>
                <p className={`text-5xl font-black tracking-tighter ${
                  riskProbability > 50 ? 'text-red-500' :
                  riskProbability > 20 ? 'text-yellow-400' :
                  'text-emerald-400'
                }`}>
                  {riskProbability.toFixed(1)}<span className="text-2xl align-top">%</span>
                </p>
                <p className="text-[10px] text-slate-500 mt-2">
                  Chance real de exceder {targetTime} min baseada no seu histórico.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 bg-slate-800/30 rounded-xl border border-dashed border-slate-700 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-600 mb-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
          </div>
          <p className="text-slate-300 font-bold">Gráfico de Performance em espera</p>
          <p className="text-sm text-slate-500 max-w-sm">
            Cadastre pelo menos <strong className="text-indigo-400">2 procedimentos de Trabalho</strong> para que a IA trace sua curva de consistência.
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalysisDashboard;