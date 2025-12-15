export interface FatigueResult {
  score: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  color: string;
  label: string;
  dayMinutes: number;
  nightMinutes: number;
}

export const calculateFatigueScore = (startTime: string, endTime: string): FatigueResult => {
  if (!startTime || !endTime) {
    return { score: 0, status: 'SAFE', color: 'text-green-500', label: 'Zona Segura', dayMinutes: 0, nightMinutes: 0 };
  }

  // Converte "HH:MM" para minutos absolutos (0 a 1440)
  const parseMins = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };

  let start = parseMins(startTime);
  let end = parseMins(endTime);
  
  // Tratamento de virada de dia
  if (end < start) end += 24 * 60; 

  let dayMinutes = 0;
  let nightMinutes = 0;

  // Itera minuto a minuto para classificar
  for (let m = start; m < end; m++) {
    // Normaliza para 24h
    const timeOfDay = m % 1440; 
    
    // Regra: Noturno das 22:00 (1320) às 05:00 (300)
    // Ajuste conforme sua regra de negócio específica se for diferente
    if (timeOfDay >= 1320 || timeOfDay < 300) {
      nightMinutes++;
    } else {
      dayMinutes++;
    }
  }

  // Cálculo da Carga: Diurno (1.0) + Noturno (1.8) / 60 (para converter em "Pontos/Hora")
  const score = (dayMinutes * 1.0 + nightMinutes * 1.8) / 60;

  let status: FatigueResult['status'] = 'SAFE';
  let color = 'text-green-400';
  let label = 'Zona Segura';

  // Seus limites: 16.9 (Atenção) e 20.0 (Crítico)
  if (score >= 20.0) {
    status = 'CRITICAL';
    color = 'text-red-500';
    label = 'Risco Crítico';
  } else if (score >= 16.9) {
    status = 'WARNING';
    color = 'text-yellow-400';
    label = 'Atenção';
  }

  return {
    score,
    status,
    color,
    label,
    dayMinutes,
    nightMinutes
  };
};