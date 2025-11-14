import { AnalysisResults } from '../types';

const calculateMean = (data: number[]): number => {
  if (data.length === 0) return 0;
  const sum = data.reduce((acc, val) => acc + val, 0);
  return sum / data.length;
};

const calculateStdDev = (data: number[], mean: number): number => {
  if (data.length < 2) return 0;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (data.length - 1);
  return Math.sqrt(variance);
};

// Probability Density Function (PDF) for a normal distribution
export const probabilityDensityFunction = (x: number, mean: number, stdDev: number): number => {
  if (stdDev === 0) return x === mean ? Infinity : 0;
  const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2));
  return (1 / (stdDev * Math.sqrt(2 * Math.PI))) * Math.exp(exponent);
};


// Approximation of the error function erf(x)
const erf = (x: number): number => {
  // constants
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;

  const sign = (x >= 0) ? 1 : -1;
  x = Math.abs(x);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return sign * y;
}

// Cumulative Distribution Function (CDF) for a standard normal distribution
const standardNormalCDF = (z: number): number => {
    return 0.5 * (1 + erf(z / Math.sqrt(2)));
}

// Calculate P(X > limit)
export const calculateProbability = (limit: number, mean: number, stdDev: number): number => {
    if (stdDev === 0) return limit < mean ? 1 : 0;
    const z = (limit - mean) / stdDev;
    return 1 - standardNormalCDF(z);
};

// Calculate value at a given percentile (Inverse CDF)
// This is a simple numerical approximation
export const calculatePercentile = (percentile: number, mean: number, stdDev: number): number => {
    if (stdDev === 0) return mean;
    if (percentile <= 0) return mean - 5 * stdDev; // Practical lower bound
    if (percentile >= 1) return mean + 5 * stdDev; // Practical upper bound
    
    // Start with a reasonable guess and iterate
    let x = mean;
    const step = stdDev / 10;
    
    // Find a bracketing interval [low, high]
    let low = mean - 5 * stdDev;
    let high = mean + 5 * stdDev;

    // Bisection method for finding the root
    for(let i=0; i<100; i++){ // 100 iterations for precision
        let mid = (low + high) / 2;
        let z = (mid - mean) / stdDev;
        if(standardNormalCDF(z) < percentile) {
            low = mid;
        } else {
            high = mid;
        }
    }
    return (low + high) / 2;
}

export const calculateAnalysis = (dataPoints: number[]): AnalysisResults | null => {
  if (dataPoints.length < 2) return null;

  const mean = calculateMean(dataPoints);
  const stdDev = calculateStdDev(dataPoints, mean);
  const percentile95 = calculatePercentile(0.95, mean, stdDev);

  return { mean, stdDev, dataPoints, percentile95 };
};