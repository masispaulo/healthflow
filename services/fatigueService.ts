export interface FatigueResult {
    score: number;
    status: 'SAFE' | 'WARNING' | 'CRITICAL';
    color: string;
    label: string;
    nightMinutes: number;
    dayMinutes: number;
  }
  
  const CONFIG = {
    NIGHT_START_HOUR: 22,
    NIGHT_END_HOUR: 8,
    DAY_RATE: 1.0,
    NIGHT_RATE: 1.8,
    THRESHOLD_WARNING: 16.9,
    THRESHOLD_CRITICAL: 20.0
  };
  
  export const calculateFatigueScore = (startTimeStr: string, endTimeStr: string): FatigueResult => {
    const baseDate = '2000-01-01';
    let start = new Date(`${baseDate}T${startTimeStr}`);
    let end = new Date(`${baseDate}T${endTimeStr}`);
  
    if (end < start) {
      end = new Date(`2000-01-02T${endTimeStr}`);
    }
  
    let totalScore = 0;
    let dayMinutes = 0;
    let nightMinutes = 0;
  
    const current = new Date(start);
    let safety = 0;
    
    while (current < end && safety < 2880) {
      const hour = current.getHours();
      
      const isNight = hour >= CONFIG.NIGHT_START_HOUR || hour < CONFIG.NIGHT_END_HOUR;
  
      if (isNight) {
        totalScore += CONFIG.NIGHT_RATE / 60;
        nightMinutes++;
      } else {
        totalScore += CONFIG.DAY_RATE / 60;
        dayMinutes++;
      }
  
      current.setMinutes(current.getMinutes() + 1);
      safety++;
    }
  
    let status: FatigueResult['status'] = 'SAFE';
    let color = 'text-green-400';
    let label = 'Zona Segura';
  
    if (totalScore >= CONFIG.THRESHOLD_CRITICAL) {
      status = 'CRITICAL';
      color = 'text-red-500';
      label = 'Risco Crítico';
    } else if (totalScore >= CONFIG.THRESHOLD_WARNING) {
      status = 'WARNING';
      color = 'text-yellow-400';
      label = 'Alerta de Fadiga';
    }
  
    return {
      score: totalScore,
      status,
      color,
      label,
      nightMinutes,
      dayMinutes
    };
  };