// src/services/gaussianService.ts

export interface AnalysisResults {
  mean: number;
  stdDev: number;
  percentiles: { [key: number]: number }; // <--- O Dashboard precisa disto aqui
  dataPoints: number[];
}

// Função auxiliar para calcular a média
const calculateMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((a, b) => a + b, 0);
  return sum / data.length;
};

// Função auxiliar para calcular o desvio padrão
const calculateStdDev = (data: number[], mean: number): number => {
  if (data.length < 2) return 0;
  const squareDiffs = data.map((value) => Math.pow(value - mean, 2));
  const avgSquareDiff = calculateMean(squareDiffs);
  return Math.sqrt(avgSquareDiff);
};

// Função auxiliar para calcular percentis
const calculatePercentile = (data: number[], percentile: number): number => {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;
  
  if (upper >= sorted.length) return sorted[sorted.length - 1];
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
};

export const calculateAnalysis = (dataPoints: number[]): AnalysisResults | null => {
  // Trava de segurança
  if (!dataPoints || dataPoints.length < 2) return null;

  const mean = calculateMean(dataPoints);
  const stdDev = calculateStdDev(dataPoints, mean);
  
  // AQUI ESTÁ A CORREÇÃO: Criamos o objeto completo 'percentiles'
  const percentiles = {
      50: calculatePercentile(dataPoints, 50),
      75: calculatePercentile(dataPoints, 75),
      90: calculatePercentile(dataPoints, 90),
      95: calculatePercentile(dataPoints, 95),
      99: calculatePercentile(dataPoints, 99),
  };

  return {
    mean,
    stdDev,
    percentiles, // Enviamos o objeto completo
    dataPoints
  };
};