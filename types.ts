export interface Procedure {
  id: string;
  name: string;
  startTime: string; // HH:mm format
  endTime: string;   // HH:mm format
  duration: number;  // in minutes
}

export interface AnalysisResults {
  mean: number; // μ
  stdDev: number; // σ
  dataPoints: number[];
  percentile95: number;
}

export interface BellCurveDataPoint {
  x: number;
  y: number;
}

export type DoctorStatus = 'Em Atendimento' | 'Em Standby' | 'Em Repouso';

export interface Doctor {
  id: string;
  name: string;
  status: DoctorStatus;
  lastStatusChange: Date;
  fatigueScore: number; // New field for fatigue modeling
}

export interface DemandProfile {
  peakStart: string;
  peakEnd: string;
  lowStart: string;
  lowEnd: string;
}

export interface ScheduleEntry {
  doctorName: string;
  startTime: Date;
  endTime: Date;
  duration: number;  // in minutes
  status: DoctorStatus; // Changed to use DoctorStatus type
}

export interface FatigueRiskAnalysis {
  peakFatigueTime: string;
  averageFatigueScore: number;
  recommendedRestBlockMinutes: number;
  totalAttendances: number;
  totalRestBlocks: number;
  scheduleEfficiency: number; // Percentage of attending time vs total time
}
