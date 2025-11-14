import React, { useState, useMemo } from 'react';
import { AnalysisResults } from '../types';
import BellCurveChart from './BellCurveChart';
import { calculateProbability } from '../services/gaussianService';
import { ClockIcon, ChartPieIcon, ShieldExclamationIcon, TrendingUpIcon } from './icons';

interface AnalysisDashboardProps {
  analysis: AnalysisResults | null;
  procedureCount: number;
}

const AnalysisCard: React.FC<{ title: string; value: string; icon: React.ReactNode; unit?: string }> = ({ title, value, icon, unit }) => (
  <div className="bg-white p-4 rounded-xl shadow-lg flex items-start gap-4">
    <div className="p-3 bg-indigo-100 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="text-2xl font-bold text-slate-800">
        {value}
        {unit && <span className="text-lg font-medium text-slate-500 ml-1">{unit}</span>}
      </p>
    </div>
  </div>
);

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ analysis, procedureCount }) => {
  const [riskThreshold, setRiskThreshold] = useState<number>(150);

  const riskProbability = useMemo(() => {
    if (!analysis) return 0;
    return calculateProbability(riskThreshold, analysis.mean, analysis.stdDev);
  }, [analysis, riskThreshold]);
  
  if (!analysis) {
    return (
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
        <h2 className="text-2xl font-bold text-slate-700">Painel de Análise</h2>
        <p className="mt-2 text-slate-500">
          {procedureCount < 2 
            ? `Adicione pelo menos ${2 - procedureCount} procedimento(s) para gerar a análise estatística.`
            : 'Aguardando dados suficientes para a análise.'
          }
        </p>
      </div>
    );
  }

  const { mean, stdDev, percentile95 } = analysis;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalysisCard title="Tempo Médio (μ)" value={mean.toFixed(1)} icon={<ClockIcon />} unit="min" />
        <AnalysisCard title="Desvio Padrão (σ)" value={stdDev.toFixed(1)} icon={<TrendingUpIcon />} unit="min" />
        <AnalysisCard title="Previsão de Risco" value={(riskProbability * 100).toFixed(1)} icon={<ShieldExclamationIcon />} unit="%" />
        <AnalysisCard title="Percentil 95%" value={percentile95.toFixed(0)} icon={<ChartPieIcon />} unit="min" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-lg">
          <h3 className="text-lg font-bold text-slate-700 mb-4">Curva de Distribuição Normal (Gaussiana)</h3>
          <BellCurveChart analysis={analysis} />
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col justify-center">
            <h3 className="text-lg font-bold text-slate-700 mb-2">Previsão de Risco de Atraso</h3>
            <p className="text-sm text-slate-500 mb-4">Calcule a probabilidade de um procedimento ultrapassar um tempo limite.</p>
            <div>
              <label htmlFor="risk-threshold" className="block text-sm font-medium text-slate-700">Tempo limite (minutos)</label>
              <input
                id="risk-threshold"
                type="number"
                value={riskThreshold}
                onChange={(e) => setRiskThreshold(Number(e.target.value))}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <p className="mt-4 text-center">
              <span className="text-4xl font-bold text-indigo-600">{(riskProbability * 100).toFixed(1)}%</span>
              <span className="block text-slate-500">de chance de ultrapassar {riskThreshold} min.</span>
            </p>
        </div>
      </div>
    </div>
  );
};

export default AnalysisDashboard;