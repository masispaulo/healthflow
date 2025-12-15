import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

interface BellCurveChartProps {
  mean: number;
  stdDev: number;
  targetTime: number;
}

const BellCurveChart: React.FC<BellCurveChartProps> = ({ mean, stdDev, targetTime }) => {
  if (!mean || !stdDev) return null;

  // Gera os dados matemáticos para a curva suave
  const data = [];
  const range = stdDev * 4;
  const startX = Math.max(0, mean - range);
  const endX = mean + range;
  const steps = 100; // Resolução da curva

  for (let i = 0; i <= steps; i++) {
    const x = startX + (i * (endX - startX)) / steps;
    // Fórmula da Distribuição Normal
    const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
    const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
    data.push({
      x: Number(x.toFixed(1)), // Arredonda para ficar bonito no eixo
      y: y,
      prob: (y * 100).toFixed(4) // Para o tooltip
    });
  }

  // Tooltip customizado igual ao da nuvem
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl text-xs">
          <p className="text-slate-400 mb-1">Duração: <span className="text-white font-bold">{label} min</span></p>
          <p className="text-indigo-400">Probabilidade: {payload[0].value.toFixed(5)}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorProb" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        
        <XAxis 
            dataKey="x" 
            tick={{ fill: '#64748b', fontSize: 10 }} 
            axisLine={false}
            tickLine={false}
            interval={10}
        />
        <YAxis hide />
        <Tooltip content={<CustomTooltip />} />
        
        <Area 
            type="monotone" 
            dataKey="y" 
            stroke="#6366f1" 
            strokeWidth={3}
            fill="url(#colorProb)" 
            animationDuration={1500}
        />
        
        {/* Linha da Média */}
        <ReferenceLine x={mean} stroke="#94a3b8" strokeDasharray="3 3">
           <text x={mean} y={10} fill="#94a3b8" fontSize={10} textAnchor="middle">Média</text>
        </ReferenceLine>

        {/* Linha do Alvo (Simulação) */}
        <ReferenceLine x={targetTime} stroke="#f87171" strokeDasharray="3 3" />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default BellCurveChart;