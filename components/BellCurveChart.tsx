
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AnalysisResults, BellCurveDataPoint } from '../types';
import { probabilityDensityFunction } from '../services/gaussianService';

interface BellCurveChartProps {
  analysis: AnalysisResults;
}

const generateCurveData = (mean: number, stdDev: number): BellCurveDataPoint[] => {
  // CRITICAL FIX: Handle stdDev = 0 to prevent crashes.
  // Instead of a single point, create a small, sharp "spike" for visualization.
  if (stdDev < 0.1) {
    const verySmallNumber = 0.001; // To form the base of the spike
    return [
      { x: mean - verySmallNumber, y: 0 },
      { x: mean, y: probabilityDensityFunction(mean, mean, stdDev) > 100 ? 1 : probabilityDensityFunction(mean, mean, stdDev) }, // A normalized peak
      { x: mean + verySmallNumber, y: 0 },
    ];
  }

  const data: BellCurveDataPoint[] = [];
  const start = Math.max(0, mean - 4 * stdDev);
  const end = mean + 4 * stdDev;
  const step = (end - start) / 200;

  for (let x = start; x <= end; x += step) {
    data.push({
      x: Number(x.toFixed(2)),
      y: probabilityDensityFunction(x, mean, stdDev),
    });
  }
  return data;
};


const BellCurveChart: React.FC<BellCurveChartProps> = ({ analysis }) => {
  const curveData = generateCurveData(analysis.mean, analysis.stdDev);

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart
          data={curveData}
          margin={{
            top: 5, right: 30, left: 20, bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="x" 
            type="number"
            domain={['dataMin', 'dataMax']}
            label={{ value: 'Duração do Procedimento (min)', position: 'insideBottom', offset: -10 }}
            tick={{ fontSize: 12 }}
            allowDataOverflow={true}
          />
          <YAxis 
            tickFormatter={(tick) => (typeof tick === 'number' ? tick.toFixed(4) : tick)} 
            label={{ value: 'Densidade de Probabilidade', angle: -90, position: 'insideLeft', offset: -10, style: { textAnchor: 'middle' } }}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value: number, name, props) => [`${value.toFixed(4)}`, `Densidade em ${props.payload.x} min`]} 
          />
          <Legend verticalAlign="top" height={36} />
          <Line
            type="monotone"
            dataKey="y"
            name="Distribuição de Probabilidade"
            stroke="#4f46e5"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default BellCurveChart;