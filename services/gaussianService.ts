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
  // ADICIONADO: O gráfico precisa disso para desenhar a linha
  plotData: { x: number; y: number }[];
}

export const calculateGaussianStats = (data: number[]): AnalysisResults | null => {
  // Se não tiver dados suficientes, não calcula
  if (!data || data.length < 2) return null;

  // 1. Cálculo da Média
  const sum = data.reduce((acc, val) => acc + val, 0);
  const mean = sum / data.length;

  // 2. Cálculo do Desvio Padrão (Amostral n-1)
  const squareDiffs = data.map(val => Math.pow(val - mean, 2));
  const variance = squareDiffs.reduce((acc, val) => acc + val, 0) / (data.length - 1);
  const stdDev = Math.sqrt(variance);

  // 3. Percentil 95
  const sorted = [...data].sort((a, b) => a - b);
  const pIndex = Math.ceil(0.95 * sorted.length) - 1;
  const p95 = sorted[pIndex];

  // 4. GERAÇÃO DOS PONTOS DO GRÁFICO (A CORREÇÃO)
  // O gráfico precisa de coordenadas X e Y para desenhar a curva.
  const plotData = [];
  
  // Se os números forem todos iguais, desvio é 0. O gráfico travaria.
  // Usamos um valor mínimo visual (0.5) APENAS para o desenho, sem mudar o stdDev real.
  const visualStdDev = stdDev === 0 ? 0.5 : stdDev;

  // Desenhamos a curva cobrindo 4 desvios para cada lado da média
  const startX = Math.max(0, mean - (visualStdDev * 4));
  const endX = mean + (visualStdDev * 4);
  const steps = 60; // Qualidade da curva

  for (let i = 0; i <= steps; i++) {
    const x = startX + (i * (endX - startX)) / steps;
    
    // Fórmula de Gauss (Distribuição Normal)
    const exponent = -0.5 * Math.pow((x - mean) / visualStdDev, 2);
    const y = (1 / (visualStdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);

    plotData.push({ x: Math.round(x), y });
  }

  return {
    mean,
    stdDev,
    minTime: Math.min(...data),
    maxTime: Math.max(...data),
    sampleSize: data.length,
    percentiles: {
      95: p95
    },
    plotData // <--- Entrega os pontos para o componente renderizar
  };
};