// services/gaussianService.ts

export interface AnalysisResults {
  mean: number;
  stdDev: number;
  minTime: number;
  maxTime: number;
  sampleSize: number;
  percentiles: {
    [key: number]: number;
  };
  plotData: { x: number; y: number }[];
}

export const calculateGaussianStats = (data: number[]): AnalysisResults | null => {
  if (!data || data.length < 2) return null;

  // Média
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / data.length;

  // Desvio padrão amostral
  const variance =
    data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
    (data.length - 1);

  const stdDev = Math.sqrt(variance);

  // Percentil 95 com interpolação
  const sorted = [...data].sort((a, b) => a - b);
  const pos = 0.95 * (sorted.length - 1);
  const base = Math.floor(pos);
  const rest = pos - base;

  const p95 =
    sorted[base] +
    (sorted[base + 1] - sorted[base]) * rest;

  // Curva Gaussiana
  const plotData: { x: number; y: number }[] = [];

  // Evita curva achatada
  const visualStdDev = stdDev < 0.3 ? 0.3 : stdDev;

  const startX = Math.max(0, mean - visualStdDev * 4);
  const endX = mean + visualStdDev * 4;
  const steps = 80; // curva mais suave

  for (let i = 0; i <= steps; i++) {
    const x = startX + (i * (endX - startX)) / steps;

    const exponent = -0.5 * Math.pow((x - mean) / visualStdDev, 2);
    const y =
      (1 / (visualStdDev * Math.sqrt(2 * Math.PI))) *
      Math.exp(exponent);

    plotData.push({ x, y }); // ✅ sem arredondar
  }

  return {
    mean,
    stdDev,
    minTime: Math.min(...data),
    maxTime: Math.max(...data),
    sampleSize: data.length,
    percentiles: {
      95: p95,
    },
    plotData,
  };
};