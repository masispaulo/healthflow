// src/components/BellCurveChart.tsx
import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts';

interface BellCurveChartProps {
  mean: number;
  stdDev: number;
  targetTime?: number;
}

const BellCurveChart: React.FC<BellCurveChartProps> = ({ mean, stdDev, targetTime }) => {
  
  const data = useMemo(() => {
    if (stdDev === 0) return [];
    
    const points = [];
    // Gera pontos de -3 desvios até +4 desvios
    const start = Math.max(0, mean - 3 * stdDev);
    const end = mean + 4 * stdDev;
    const steps = 100;
    const stepSize = (end - start) / steps;

    for (let i = 0; i <= steps; i++) {
      const x = start + i * stepSize;
      // Função de densidade de probabilidade (PDF)
      const exponent = -((x - mean) ** 2) / (2 * stdDev ** 2);
      const y = (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
      points.push({ x, y });
    }
    return points;
  }, [mean, stdDev]);

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        
        {/* Grid sutil */}
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
        
        {/* Eixos adaptados para Dark Mode */}
        <XAxis 
          dataKey="x" 
          type="number" 
          domain={['auto', 'auto']} 
          tickFormatter={(val) => val.toFixed(0) + 'm'}
          stroke="#94a3b8" // Cor do texto do eixo X
          tick={{ fill: '#94a3b8', fontSize: 12 }}
        />
        <YAxis 
          hide={true} // Escondemos o eixo Y pois o valor absoluto da densidade não importa tanto para o usuário
        />
        
        <Tooltip 
          contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
          itemStyle={{ color: '#818cf8' }}
          labelFormatter={(label) => `Duração: ${Number(label).toFixed(1)} min`}
          formatter={(value: number) => [value.toFixed(4), 'Probabilidade']}
        />

        {/* A Área preenchida sob a curva */}
        <Area 
          type="monotone" 
          dataKey="y" 
          stroke="none" 
          fill="url(#colorCurve)" 
        />

        {/* A Linha da curva */}
        <Line 
          type="monotone" 
          dataKey="y" 
          stroke="#6366f1" 
          strokeWidth={3} 
          dot={false} 
          activeDot={{ r: 6 }}
        />

        {/* Linha vertical da Média */}
        <ReferenceLine x={mean} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'top', value: 'Média', fill: '#10b981', fontSize: 12 }} />

        {/* Linha vertical do Tempo Alvo (Risco) */}
        {targetTime && (
          <ReferenceLine 
            x={targetTime} 
            stroke="#ef4444" 
            label={{ position: 'top', value: 'Limite', fill: '#ef4444', fontSize: 12 }} 
          />
        )}

      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default BellCurveChart;