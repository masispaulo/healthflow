export interface FatigueResult {
  score: number;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  label: string;
  color: string;
  dayMinutes: number;
  nightMinutes: number;
  recoveryMinutes: number;
  limitRatio: number; 
}

// --- CONSTANTES DO MODELO SAFTE-FAST (Do seu vídeo) ---
const CONSTANTS = {
  // Taxas Base (Pontos por Hora)
  RATE_WORK_DAY: 1.0,
  RATE_STANDBY_DAY: 0.3,   // O "Paralisador" (cansaço leve)
  RATE_SLEEP: -1.75,       // O "Redutor" (recuperação rápida)

  // Fator Circadiano
  NIGHT_MULTIPLIER: 1.8, 

  // Janela Noturna (22h às 08h)
  NIGHT_START_HOUR: 22,
  NIGHT_END_HOUR: 8,

  // Limites de Segurança
  LIMIT_WARNING: 16.9, // Alerta Amarelo
  LIMIT_CRITICAL: 20.0 // Alerta Vermelho (Bloqueio)
};

/**
 * Função auxiliar que separa quantos minutos foram de DIA e quantos de NOITE
 * numa determinada faixa de horário.
 */
const splitDayNightMinutes = (start: Date, end: Date) => {
    let totalMinutes = (end.getTime() - start.getTime()) / 60000;
    let nightMinutes = 0;
    
    // Varredura minuto a minuto para precisão máxima na virada de turno
    let current = new Date(start);
    while (current < end) {
        const hour = current.getHours();
        // É noite se for >= 22h OU < 08h
        if (hour >= CONSTANTS.NIGHT_START_HOUR || hour < CONSTANTS.NIGHT_END_HOUR) {
            nightMinutes++;
        }
        current.setMinutes(current.getMinutes() + 1);
    }

    return {
        day: totalMinutes - nightMinutes,
        night: nightMinutes
    };
};

export const calculateFatigueScore = (procedures: any[]): FatigueResult => {
  let score = 0;
  let totalDayMin = 0;
  let totalNightMin = 0;
  let totalRecoveryMin = 0;

  if (!procedures || procedures.length === 0) {
      return { 
          score: 0, status: 'SAFE', label: 'Descansado', color: 'text-emerald-400', 
          dayMinutes: 0, nightMinutes: 0, recoveryMinutes: 0, limitRatio: 0 
      };
  }

  // Ordena cronologicamente
  const sortedProcs = [...procedures].sort((a, b) => a.startTime.localeCompare(b.startTime));

  sortedProcs.forEach(proc => {
      const start = new Date(`2000-01-01T${proc.startTime}`);
      const end = new Date(`2000-01-01T${proc.endTime}`);
      if (end < start) end.setDate(end.getDate() + 1); // Passou da meia-noite

      // Separa o tempo biológico
      const { day, night } = splitDayNightMinutes(start, end);

      // Aplica a regra baseada no TIPO (Work, Standby, Sleep)
      const type = proc.type || 'WORK';

      if (type === 'SLEEP') {
          // Dormir recupera -1.75/h (independente do horário, conforme estudo)
          const hours = (day + night) / 60;
          score += hours * CONSTANTS.RATE_SLEEP; 
          totalRecoveryMin += (day + night);
      } 
      else if (type === 'STANDBY') {
          // Dia: 0.3/h | Noite: 0.54/h (0.3 * 1.8)
          score += (day / 60) * CONSTANTS.RATE_STANDBY_DAY;
          score += (night / 60) * (CONSTANTS.RATE_STANDBY_DAY * CONSTANTS.NIGHT_MULTIPLIER);
          
          totalDayMin += day;
          totalNightMin += night;
      } 
      else { // WORK (Padrão)
          // Dia: 1.0/h | Noite: 1.8/h
          score += (day / 60) * CONSTANTS.RATE_WORK_DAY;
          score += (night / 60) * (CONSTANTS.RATE_WORK_DAY * CONSTANTS.NIGHT_MULTIPLIER);
          
          totalDayMin += day;
          totalNightMin += night;
      }
  });

  // O Score não pode ser negativo (mínimo zero = descansado)
  if (score < 0) score = 0;

  // Classificação dos Alertas (16.9 e 20.0)
  let status: 'SAFE' | 'WARNING' | 'CRITICAL' = 'SAFE';
  let label = 'Zona Segura';
  let color = 'text-emerald-400';

  if (score >= CONSTANTS.LIMIT_CRITICAL) {
      status = 'CRITICAL';
      label = 'Risco Crítico (Bloqueio)';
      color = 'text-red-500';
  } else if (score >= CONSTANTS.LIMIT_WARNING) {
      status = 'WARNING';
      label = 'Alerta Amarelo (Fadiga)';
      color = 'text-yellow-400';
  }

  return {
      score,
      status,
      label,
      color,
      dayMinutes: totalDayMin,
      nightMinutes: totalNightMin,
      recoveryMinutes: totalRecoveryMin,
      limitRatio: Math.min((score / CONSTANTS.LIMIT_CRITICAL) * 100, 100)
  };
};