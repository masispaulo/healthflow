export interface AnalysisResults {
  mean: number;
  stdDev: number;
  percentiles: {
    [key: number]: number;
  };
}

export const calculateGaussianStats = (data: number[]): AnalysisResults | null => {
  if (!data || data.length < 2) return null;

  // Média
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / data.length;

  // Desvio Padrão (População ou Amostra - usando Amostra n-1 para maior precisão com poucos dados)
  const squareDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squareDiffs.reduce((acc, val) => acc + val, 0) / (data.length - 1 || 1);
  const stdDev = Math.sqrt(variance);

  // Percentil 95
  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil(0.95 * sorted.length) - 1;
  const p95 = sorted[index];

  return {
    mean,
    stdDev,
    percentiles: {
      95: p95
    }
  };
};