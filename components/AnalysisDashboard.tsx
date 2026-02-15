import React, { useState, useEffect } from 'react';
import BellCurveChart from './BellCurveChart';
import { calculateFatigueScore, FatigueResult } from '../services/fatigueService';
import { AnalysisResults, calculateGaussianStats } from '../services/gaussianService';
import { 
  Users, Activity, Zap, Target, 
  GripHorizontal, X, Minimize2, Clock, RotateCcw 
} from 'lucide-react';

interface ProcedureRaw {
  id?: string;
  patientName?: string;
  name?: string;
  startTime: string;
  endTime: string;
  type?: string;
  status?: string;
  priority?: string;
  age?: string;
  bed?: string;
  diagnosis?: string;
  source?: 'hospital' | 'local'; // Pacientes vindos do hospital têm prioridade no "1 clique"
}

interface QueuePatient {
  id: string;
  name: string;
  procedure: string;
  timeEstimate: string;
  status: 'waiting' | 'ready';
  priority?: string;
  raw?: ProcedureRaw; // Dados completos para addPatient no banco do médico
}

interface AnalysisDashboardProps {
  analysis?: AnalysisResults | null;
  procedures?: ProcedureRaw[];
  clinicData?: any;
  onPatientClick?: (patient: QueuePatient) => void;
  onPatientSelect?: (patient: any) => void;
}

const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({
  analysis,
  procedures,
  onPatientClick,
  onPatientSelect,
}) => {
  // Inicializa stats. Se analysis for nulo, usa valores zerados mas NÃO bloqueia a tela
  const [localStats, setLocalStats] = useState<AnalysisResults>(analysis || { mean: 60, stdDev: 15 });
  const [currentShiftProcedures, setCurrentShiftProcedures] = useState<ProcedureRaw[]>([]);
  
  // ESTADO DA FILA (Começa vazio e preenche com dados reais)
  const [queue, setQueue] = useState<QueuePatient[]>([]);

  // 1. Processamento dos Dados Reais (Fila e Stats)
  useEffect(() => {
    // Atualiza stats se vierem do pai
    if (analysis) {
      setLocalStats(analysis);
    }

    if (procedures && procedures.length > 0) {
      setCurrentShiftProcedures(procedures);
      
      // Se não veio analysis pronto, calcula localmente para garantir o gráfico
      if (!analysis) {
          const durations = procedures.map(p => 
            (new Date(p.endTime).getTime() - new Date(p.startTime).getTime()) / 60000
          );
          if (durations.length > 0) {
             setLocalStats(calculateGaussianStats(durations));
          }
      }

      // 🔥 CONVERTE PROCEDIMENTOS REAIS PARA A FILA VISUAL (mantém raw para onPatientClick)
      const realQueue: QueuePatient[] = procedures.map(p => {
        const start = new Date(p.startTime);
        const end = new Date(p.endTime);
        const diffMins = Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 0);

        return {
          id: p.id || Math.random().toString(),
          name: p.patientName || (p as any).name || 'Paciente Sem Nome',
          procedure: p.name || 'Atendimento',
          timeEstimate: `${diffMins}m`,
          status: p.status === 'completed' ? 'ready' : 'waiting',
          priority: p.priority,
          raw: p
        };
      });

      setQueue(realQueue);
    } else {
      // Se não tem procedimentos, fila vazia
      setQueue([]);
    }
  }, [procedures, analysis]);

  const [fatigue, setFatigue] = useState<FatigueResult | null>(null);
  const [userResetFatigue, setUserResetFatigue] = useState(false);
  const [userResetCurva, setUserResetCurva] = useState(false);

  const { mean: rawMean, stdDev: rawStdDev } = localStats || { mean: 60, stdDev: 15 };
  const mean = userResetCurva ? 0 : rawMean;
  const stdDev = userResetCurva ? 0 : rawStdDev;
  const p95 = userResetCurva ? 0 : mean + 1.645 * stdDev;

  const [targetTime, setTargetTime] = useState(60);

  useEffect(() => {
    if (userResetCurva) setTargetTime(60);
  }, [userResetCurva]);

  useEffect(() => {
    if (!userResetCurva && rawMean > 0 && targetTime === 60) {
      setTargetTime(Math.round(rawMean + rawStdDev));
    }
  }, [rawMean, rawStdDev, userResetCurva]);

  useEffect(() => {
    if (userResetFatigue) {
      setFatigue({ score: 0, status: 'SAFE', label: 'Descansado', color: 'text-emerald-400', dayMinutes: 0, nightMinutes: 0, recoveryMinutes: 0, limitRatio: 0 });
      return;
    }
    if (currentShiftProcedures.length === 0) {
      setFatigue({ score: 0, status: 'SAFE', label: 'Descansado', color: 'text-emerald-400', dayMinutes: 0, nightMinutes: 0, recoveryMinutes: 0, limitRatio: 0 });
      return;
    }
    const formatted = currentShiftProcedures.map(p => ({
      startTime: p.startTime, endTime: p.endTime, type: (p.type as any) || 'WORK'
    }));
    const result = calculateFatigueScore(formatted);
    const safeResult = {
      ...result,
      score: isNaN(result.score) || !isFinite(result.score) ? 0 : result.score,
    };
    setFatigue(safeResult);
  }, [currentShiftProcedures, userResetFatigue]);

  const handleResetFatigue = () => setUserResetFatigue(true);
  const handleResetCurva = () => setUserResetCurva(true);

  // Probabilidade de Risco
  const calculateProbability = (target: number, mean: number, stdDev: number) => {
    if (stdDev === 0 || mean === 0) return 0;
    const z = (target - mean) / stdDev;
    const t = 1 / (1 + 0.2316419 * Math.abs(z));
    const d = 0.3989422804014337 * Math.exp(-z * z / 2);
    let prob = d * t * (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
    if (z > 0) prob = 1 - prob;
    return prob;
  };
  const riskProbability = (1 - calculateProbability(targetTime, mean, stdDev)) * 100;

  // UI da Fila Flutuante
  const [queuePosition, setQueuePosition] = useState({ x: window.innerWidth - 350, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({ x: e.clientX - queuePosition.x, y: e.clientY - queuePosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setQueuePosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div 
      className="min-h-screen relative p-6 space-y-8 animate-fade-in font-sans text-slate-200 pb-20 max-w-6xl mx-auto"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      
      {/* 1. HEADER: CARDS DE MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 max-w-4xl mx-auto w-full">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm uppercase font-bold">Fila</p>
            <p className="text-3xl font-bold text-white">{queue.length}</p>
          </div>
          <div className="p-4 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20"><Users size={28} /></div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm uppercase font-bold">Eficiência</p>
            <p className="text-3xl font-bold text-emerald-400">92%</p>
          </div>
          <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20"><Activity size={28} /></div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm uppercase font-bold">Carga</p>
            <p className={`text-3xl font-bold ${fatigue?.status === 'CRITICAL' ? 'text-red-500' : 'text-yellow-400'}`}>
              {fatigue && !isNaN(fatigue.score) ? fatigue.score.toFixed(0) : '0'}
            </p>
          </div>
          <div className={`p-4 rounded-xl border ${fatigue?.status === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}><Zap size={28} /></div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-sm uppercase font-bold">Meta</p>
            <p className="text-3xl font-bold text-indigo-400">{targetTime}m</p>
          </div>
          <div className="p-4 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20"><Target size={28} /></div>
        </div>
      </div>

      {/* 2. PAINEL DE FADIGA */}
      {fatigue ? (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative z-10 gap-6">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${fatigue.status === 'SAFE' ? 'bg-emerald-500' : fatigue.status === 'WARNING' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                Carga Biológica (Plantão Atual)
              </h3>
              <div className="flex items-baseline gap-4">
                <span className={`text-7xl font-black ${fatigue.color} tracking-tighter`}>
                  {!isNaN(fatigue.score) ? fatigue.score.toFixed(1) : '0.0'}
                </span>
                <div className="flex flex-col">
                  <span className="text-slate-500 font-bold text-base uppercase">Pontos</span>
                  <span className="text-slate-600 text-sm">Acumulados</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`px-6 py-4 rounded-xl border flex flex-col items-end min-w-[180px] ${
                fatigue.status === 'CRITICAL' ? 'bg-red-500/10 border-red-500/30' :
                fatigue.status === 'WARNING' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-emerald-500/10 border-emerald-500/30'
              }`}>
                <span className="text-xs uppercase font-bold opacity-70 mb-2 tracking-widest">Status Atual</span>
                <p className={`font-black text-2xl ${fatigue.color}`}>{fatigue.label}</p>
              </div>
              <button
                onClick={handleResetFatigue}
                className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
                title="Zerar fadiga (novo plantão / recomeçar)"
              >
                <RotateCcw size={16} /> Zerar
              </button>
            </div>
          </div>
          <div className="w-full bg-slate-900/50 h-4 rounded-full mt-8 overflow-hidden relative">
            <div 
              className={`h-full transition-all duration-1000 ease-out ${
                fatigue.status === 'CRITICAL' ? 'bg-gradient-to-r from-red-600 to-red-500' :
                fatigue.status === 'WARNING' ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                'bg-gradient-to-r from-emerald-600 to-emerald-400'
              }`} 
              style={{ width: `${Math.min(((isNaN(fatigue.score) ? 0 : fatigue.score) / 25) * 100, 100)}%` }}
            ></div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 border-dashed flex justify-center items-center h-40">
           <p className="text-slate-500 font-bold">Aguardando dados de fadiga...</p>
        </div>
      )}

      {/* 3. PAINEL GAUSSIANA E SIMULADOR */}
      <div className="rounded-2xl border border-slate-700/60 bg-gradient-to-b from-slate-800/90 to-slate-900/80 shadow-2xl overflow-hidden max-w-5xl mx-auto backdrop-blur-sm">
        <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
          <h3 className="text-base font-bold text-slate-200 uppercase tracking-widest flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-xl">📊</span>
            Performance vs Média
          </h3>
          <button
            onClick={handleResetCurva}
            className="px-5 py-2.5 rounded-xl bg-slate-700/80 hover:bg-indigo-500/20 border border-slate-600/50 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-400 flex items-center gap-2 text-sm font-bold transition-all duration-300"
            title="Zerar curva gaussiana"
          >
            <RotateCcw size={16} /> Zerar curva
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-700/50">
          <div className="lg:col-span-2 p-8 flex flex-col items-center justify-center">
            <div className="h-[420px] w-full max-w-2xl mx-auto">
              <BellCurveChart mean={mean} stdDev={stdDev} targetTime={targetTime} zerado={userResetCurva} />
            </div>
            <div className="grid grid-cols-3 gap-4 w-full mt-6 pt-6 border-t border-slate-700/50">
              <div className="text-center p-5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-indigo-500/30 transition-colors">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Tempo Médio</p>
                <p className="text-3xl font-black text-white tracking-tight">{(isNaN(mean) ? 0 : mean).toFixed(1)} <span className="text-base text-slate-500 font-normal">min</span></p>
              </div>
              <div className="text-center p-5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-indigo-500/30 transition-colors">
                <p className="text-xs text-indigo-400 uppercase font-bold tracking-wider mb-2">P95 (Teto Seguro)</p>
                <p className="text-3xl font-black text-indigo-400 tracking-tight">{(isNaN(p95) ? 0 : p95).toFixed(1)} <span className="text-base text-indigo-400/70 font-normal">min</span></p>
              </div>
              <div className="text-center p-5 rounded-xl bg-slate-800/40 border border-slate-700/30 hover:border-indigo-500/30 transition-colors">
                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-2">Variação</p>
                <p className="text-3xl font-black text-slate-300 tracking-tight">±{(isNaN(stdDev) ? 0 : stdDev).toFixed(1)} <span className="text-base text-slate-500 font-normal">min</span></p>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 p-8 flex flex-col justify-center bg-slate-900/40">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 text-center">Simulador de Risco</h3>
            <div className="mb-8">
              <label className="text-xs text-slate-500 mb-2 block font-bold tracking-wider">DEFINIR META (MINUTOS)</label>
              <div className="relative">
                <input
                  type="number"
                  value={targetTime}
                  onChange={(e) => setTargetTime(Number(e.target.value))}
                  className="w-full pl-4 pr-14 py-5 bg-slate-800/80 border border-slate-600/50 rounded-xl text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 outline-none font-mono text-3xl text-center transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-bold">min</span>
              </div>
            </div>
            <div className="text-center rounded-xl p-8 bg-gradient-to-b from-slate-800/60 to-slate-900/40 border border-slate-700/50">
              <p className="text-slate-400 text-xs uppercase font-bold tracking-wider mb-3">Probabilidade de Atraso</p>
              <p className={`text-6xl font-black tracking-tighter ${riskProbability > 50 ? 'text-red-400' : riskProbability > 20 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {(isNaN(riskProbability) ? 0 : riskProbability).toFixed(1)}<span className="text-3xl align-top opacity-80">%</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FILA FLUTUANTE (DADOS REAIS) */}
      <div 
        style={{ 
          position: 'fixed', 
          left: `${queuePosition.x}px`, 
          top: `${queuePosition.y}px`,
          zIndex: 100,
          cursor: isDragging ? 'grabbing' : 'auto'
        }}
        className="w-80 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div 
          onMouseDown={handleMouseDown}
          className="bg-slate-800 p-3 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-slate-700 select-none"
        >
          <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
            <GripHorizontal size={18} className="text-slate-500" />
            <span>Fila de Espera</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-slate-500 hover:text-white"><Minimize2 size={14}/></button>
            <button className="text-slate-500 hover:text-red-400"><X size={14}/></button>
          </div>
        </div>

        <div className="p-2 max-h-[300px] overflow-y-auto bg-slate-900/95">
          {queue.length > 0 ? queue.map((p) => {
            const hasClickHandler = onPatientClick || onPatientSelect;
            return (
            <div
              key={p.id}
              role={hasClickHandler ? 'button' : undefined}
              tabIndex={hasClickHandler ? 0 : undefined}
              onClick={() => hasClickHandler && (onPatientClick?.(p) ?? onPatientSelect?.({ patientName: p.name, ...p.raw }))}
              onKeyDown={(e) => hasClickHandler && (e.key === 'Enter' || e.key === ' ') && (onPatientClick?.(p) ?? onPatientSelect?.({ patientName: p.name, ...p.raw }))}
              className={`p-3 mb-2 rounded border transition-all ${
                hasClickHandler
                  ? 'bg-slate-800/40 border-slate-700 hover:border-emerald-500/60 hover:bg-slate-800 cursor-pointer'
                  : 'bg-slate-800/40 border-slate-700'
              }`}
              title={hasClickHandler ? 'Clique para registrar no banco de pacientes' : undefined}
            >
              <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-bold text-slate-200">{p.name}</p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  p.priority === 'ALTA' ? 'bg-red-500 text-white' : 
                  p.priority === 'MEDIA' ? 'bg-yellow-500 text-black' :
                  'bg-slate-700 text-slate-500'
                }`}>
                  {p.priority || 'Normal'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500">{p.procedure}</p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                  <Clock size={10} /> {p.timeEstimate}
                </div>
              </div>
              {hasClickHandler && <p className="text-[9px] text-emerald-500/80 mt-1">↪ Clique para cadastrar</p>}
            </div>
          );
          }) : (
            <p className="text-center text-xs text-slate-500 py-4">Fila vazia. Aguardando...</p>
          )}
        </div>
      </div>

    </div>
  );
};

export default AnalysisDashboard;