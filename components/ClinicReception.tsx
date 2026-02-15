import React, { useState, useMemo } from 'react';
import FlowCurveChart from './FlowCurveChart';
import {
  generatePatientFlowCurve,
  enrichWithVelocityAndInflections,
  optimizeDoctorSchedules,
  getScheduleMetrics,
  type FlowPlannerInput,
  type DoctorSchedule,
  type InflectionPoint,
} from '../services/flowPlannerService';
import { Activity, Zap, Users, TrendingUp, Settings2 } from 'lucide-react';

export const ClinicReception: React.FC = () => {
  const [shiftStart, setShiftStart] = useState(7);
  const [shiftEnd, setShiftEnd] = useState(19);
  const [totalDoctors, setTotalDoctors] = useState(3);
  const [totalScheduled, setTotalScheduled] = useState(24);
  const [encaixeRatio, setEncaixeRatio] = useState(0.3);
  const [avgMinutesPerPatient, setAvgMinutesPerPatient] = useState(25);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);

  const input: FlowPlannerInput = {
    shiftStartHour: shiftStart,
    shiftEndHour: shiftEnd,
    totalDoctors,
    totalScheduled,
    encaixeRatio,
    avgMinutesPerPatient,
  };

  const flowPoints = useMemo(() => generatePatientFlowCurve(input), [
    shiftStart, shiftEnd, totalScheduled, encaixeRatio,
  ]);

  const { points: enrichedPoints, inflectionPoints } = useMemo(
    () => enrichWithVelocityAndInflections(flowPoints),
    [flowPoints]
  );

  const scheduleMetrics = useMemo(
    () => (schedules.length > 0 ? getScheduleMetrics(schedules) : null),
    [schedules]
  );

  const handleOptimize = () => {
    const result = optimizeDoctorSchedules(input, enrichedPoints, inflectionPoints);
    setSchedules(result);
  };

  const getBlockColor = (type: string) => {
    switch (type) {
      case 'WORK': return 'bg-emerald-500/80';
      case 'STANDBY': return 'bg-yellow-500/60';
      case 'SLEEP': return 'bg-indigo-500/60';
      default: return 'bg-slate-600';
    }
  };

  const getBlockLabel = (type: string) => {
    switch (type) {
      case 'WORK': return 'Atendimento';
      case 'STANDBY': return 'Prontidão';
      case 'SLEEP': return 'Descanso';
      default: return type;
    }
  };

  // Tabela por hora: colunas Trabalho | Prontidão | Descanso
  const hourlyMatrix = useMemo(() => {
    if (schedules.length === 0) return [];
    const hours = new Set<number>();
    schedules.forEach(s => s.blocks.forEach(b => {
      for (let h = b.start; h < b.end; h++) hours.add(h);
    }));
    const sortedHours = [...hours].sort((a, b) => a - b);
    return sortedHours.map(hour => {
      const work: number[] = [];
      const standby: number[] = [];
      const sleep: number[] = [];
      schedules.forEach((s, d) => {
        const block = s.blocks.find(b => hour >= b.start && hour < b.end);
        if (!block) return;
        if (block.type === 'WORK') work.push(d + 1);
        else if (block.type === 'STANDBY') standby.push(d + 1);
        else sleep.push(d + 1);
      });
      return { hour, work, standby, sleep };
    });
  }, [schedules]);

  const hasEmptyWindow = (row: { work: number[]; standby: number[]; sleep: number[] }) =>
    row.work.length === 0 || (row.standby.length === 0 && row.sleep.length === 0);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans p-6 overflow-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-indigo-400 flex items-center gap-2">
          <TrendingUp size={28} />
          Planejador de Escalas (Cuidado com o Médico)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Prioridade: todos descansam iguais. Trabalho pode variar. Mudança a cada curva de velocidade.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna 1: Parâmetros */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
            <Settings2 size={18} /> Parâmetros
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 font-bold block mb-1">Horário do Plantão</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={shiftStart}
                  onChange={(e) => setShiftStart(Number(e.target.value))}
                  className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                />
                <span className="self-center text-slate-500">—</span>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={shiftEnd}
                  onChange={(e) => setShiftEnd(Number(e.target.value))}
                  className="w-20 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
                />
                <span className="self-center text-slate-400 text-sm">h</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold block mb-1">Nº de Médicos</label>
              <input
                type="number"
                min={1}
                max={20}
                value={totalDoctors}
                onChange={(e) => setTotalDoctors(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold block mb-1">Pacientes Agendados (hoje)</label>
              <input
                type="number"
                min={0}
                value={totalScheduled}
                onChange={(e) => setTotalScheduled(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold block mb-1">Encaixe esperado ({Math.round(encaixeRatio * 100)}%)</label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.1}
                value={encaixeRatio}
                onChange={(e) => setEncaixeRatio(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <span className="text-xs text-slate-500">~{Math.round(totalScheduled * encaixeRatio)} encaixes</span>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-bold block mb-1">Min/atendimento</label>
              <input
                type="number"
                min={10}
                max={60}
                value={avgMinutesPerPatient}
                onChange={(e) => setAvgMinutesPerPatient(Number(e.target.value))}
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-white"
              />
            </div>
            <button
              onClick={handleOptimize}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Zap size={18} /> Gerar Escalas
            </button>
          </div>
        </div>

        {/* Coluna 2: Curvas Gaussianas */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
            <Activity size={18} /> Fluxo de Pacientes (Gaussiano)
          </h2>
          <p className="text-slate-500 text-xs mb-4">
            Curva 1 (azul): agendados. Curva 2 (amarela): encaixe. Curva 3 (verde): velocidade (derivada).
            Linhas tracejadas: pontos de inflexão (troca de escala). Modelo capacitivo: freia no pico, descarrega no vale.
          </p>
          <FlowCurveChart
            data={enrichedPoints}
            shiftStart={shiftStart}
            shiftEnd={shiftEnd}
            inflectionPoints={inflectionPoints}
          />

          {/* Legenda de Status */}
          <div className="flex gap-6 mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500/80" />
              <span className="text-sm text-slate-400">WORK (Atendimento)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500/60" />
              <span className="text-sm text-slate-400">STANDBY (Prontidão)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-indigo-500/60" />
              <span className="text-sm text-slate-400">SLEEP (Descanso)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Escalas (Móvel e Flexível) */}
      {schedules.length > 0 && (
        <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-6">
          {/* Métricas de equidade e fadiga */}
          {scheduleMetrics && (
            <div className="mb-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <h3 className="text-sm font-bold text-indigo-400 mb-3">Métricas (prioridade: descanso equitativo)</h3>
              <div className="flex flex-wrap gap-4">
                {scheduleMetrics.workMinutesPerDoctor.map((mins, i) => (
                  <div key={i} className="text-xs">
                    <span className="text-slate-500">Médico {i + 1}:</span>{' '}
                    <span className="text-indigo-400 font-mono font-bold">{scheduleMetrics.sleepMinutesPerDoctor[i]}min</span> descanso,{' '}
                    <span className="text-emerald-400 font-mono">{mins}min</span> trabalho
                  </div>
                ))}
                <div className={`text-xs font-bold ${scheduleMetrics.isRestEquitable ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {scheduleMetrics.isRestEquitable ? '✓ Descanso equitativo' : '⚠ Diferença no descanso'}
                </div>
              </div>
            </div>
          )}
          <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2 mb-4">
            <Users size={18} /> Escalas Sugeridas (Editáveis)
          </h2>
          <p className="text-slate-500 text-xs mb-6">
            Prioridade: todos descansam iguais. Mudança de quem faz o quê a cada curva de velocidade (inflexão).
          </p>

          {/* Tabela: colunas Trabalho | Prontidão | Descanso */}
          <div className="overflow-x-auto rounded-xl border border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 border-b border-slate-700">
                  <th className="px-4 py-3 text-left text-slate-400 font-bold">Horário</th>
                  <th className="px-4 py-3 text-left text-emerald-400 font-bold">Trabalho</th>
                  <th className="px-4 py-3 text-left text-yellow-400 font-bold">Prontidão</th>
                  <th className="px-4 py-3 text-left text-indigo-400 font-bold">Descanso</th>
                  <th className="px-2 py-3 text-center text-slate-500 font-bold w-12">⚙</th>
                </tr>
              </thead>
              <tbody>
                {hourlyMatrix.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-slate-800 hover:bg-slate-800/50 ${
                      hasEmptyWindow(row) ? 'bg-red-900/10' : ''
                    }`}
                  >
                    <td className="px-4 py-2 font-mono text-white">{row.hour}h–{row.hour + 1}h</td>
                    <td className="px-4 py-2">
                      <span className={row.work.length === 0 ? 'text-red-400' : 'text-emerald-400'}>
                        {row.work.length > 0 ? row.work.map(m => `M${m}`).join(', ') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={row.standby.length === 0 ? 'text-slate-600' : 'text-yellow-400'}>
                        {row.standby.length > 0 ? row.standby.map(m => `M${m}`).join(', ') : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={row.sleep.length === 0 ? 'text-slate-600' : 'text-indigo-400'}>
                        {row.sleep.length > 0 ? row.sleep.map(m => `M${m}`).join(', ') : '—'}
                      </span>
                    </td>
                    <td className="px-2 py-2 text-center">
                      {hasEmptyWindow(row) && (
                        <span className="text-red-500 text-xs" title="Janela vazia">⚠</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-4 text-xs text-slate-500">
            M1, M2… = Médico 1, Médico 2. Linhas destacadas = janela vazia (ninguém em trabalho ou sem prontidão/descanso).
          </p>

          {/* Vista por médico (compacta) */}
          <details className="mt-6">
            <summary className="text-sm text-slate-400 cursor-pointer hover:text-white">Ver escala por médico</summary>
            <div className="space-y-4 mt-4">
              {schedules.map((s, idx) => (
                <div key={idx} className="border border-slate-800 rounded-lg p-4 bg-slate-800/30">
                  <div className="font-bold text-indigo-400 mb-3 flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm">M{idx + 1}</div>
                    Médico {idx + 1}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.blocks.map((b, bi) => (
                      <div
                        key={bi}
                        className={`px-4 py-2 rounded-lg border ${getBlockColor(b.type)} flex items-center gap-2`}
                      >
                        <span className="text-xs font-mono">{b.start}h–{b.end}h</span>
                        <span className="text-xs font-bold">{getBlockLabel(b.type)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

      {schedules.length === 0 && (
        <div className="mt-8 p-12 border border-dashed border-slate-700 rounded-xl text-center text-slate-500">
          <Activity size={48} className="mx-auto mb-4 opacity-40" />
          <p>Ajuste os parâmetros e clique em &quot;Gerar Escalas&quot; para ver as sugestões.</p>
        </div>
      )}
    </div>
  );
};

export default ClinicReception;
