import React from 'react';
import {
  AreaChart,
  Area,
  Line,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import type { FlowPoint, InflectionPoint } from '../services/flowPlannerService';

interface FlowCurveChartProps {
  data: FlowPoint[];
  shiftStart: number;
  shiftEnd: number;
  inflectionPoints?: InflectionPoint[];
}

const FlowCurveChart: React.FC<FlowCurveChartProps> = ({
  data,
  shiftStart,
  shiftEnd,
  inflectionPoints = [],
}) => {
  const chartData = data.map(p => ({
    hora: p.hour % 1 === 0 ? `${Math.floor(p.hour)}h` : `${Math.floor(p.hour)}h${Math.round((p.hour % 1) * 60)}`,
    hourNum: p.hour,
    agendados: Math.round(p.scheduled * 10) / 10,
    encaixe: Math.round(p.encaixe * 10) / 10,
    total: Math.round(p.total * 10) / 10,
    velocidade: p.velocity !== undefined ? Math.round(p.velocity * 100) / 100 : undefined,
  }));

  return (
    <div className="w-full space-y-4">
      {/* Curva 1+2: Fluxo (Agendados + Encaixe empilhados) */}
      <div>
        <p className="text-xs text-slate-500 mb-2 font-bold">Curva 1: Agendados | Curva 2: Encaixe | Curva 3: Velocidade (derivada)</p>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 50, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScheduled" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="colorEncaixe" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="hora" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 10 }} allowDecimals />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" tick={{ fontSize: 9 }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }}
                formatter={(value: number, name: string) => [
                  typeof value === 'number' ? value.toFixed(2) : value,
                  name === 'velocidade' ? 'Velocidade (d/dt)' : name,
                ]}
                labelFormatter={(label) => `Horário: ${label}`}
              />
              <Legend />

              {/* Curvas separadas de fluxo */}
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="agendados"
                name="Agendados"
                stroke="#6366f1"
                fill="url(#colorScheduled)"
                stackId="1"
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="encaixe"
                name="Encaixe"
                stroke="#f59e0b"
                fill="url(#colorEncaixe)"
                stackId="1"
              />

              {/* Curva 3: Velocidade (derivada) */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="velocidade"
                name="Velocidade"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                connectNulls
              />

              {/* Linhas de inflexão - marcam quando trocar escala */}
              {inflectionPoints.map((ip, i) => {
                const closest = chartData.reduce((a, b) =>
                  Math.abs(b.hourNum - ip.hour) < Math.abs(a.hourNum - ip.hour) ? b : a
                );
                return (
                  <ReferenceLine
                    key={i}
                    x={closest.hora}
                    stroke={ip.type === 'peak' ? '#ef4444' : ip.type === 'valley' ? '#22c55e' : '#a78bfa'}
                    strokeDasharray="4 2"
                    strokeWidth={1.5}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda das inflexões */}
        {inflectionPoints.length > 0 && (
          <div className="flex flex-wrap gap-4 mt-2 text-xs">
            <span className="text-red-400">— Pico (vel=0)</span>
            <span className="text-emerald-400">— Vale (vel=0)</span>
            <span className="text-violet-400">— Inflexão (2ª derivada=0)</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowCurveChart;
