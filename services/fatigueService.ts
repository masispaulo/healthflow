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
  
  /** Normaliza startTime/endTime para Date (aceita HH:mm, ISO, Timestamp) */
  const parseProcTime = (val: any): Date => {
    if (!val) return new Date(0);
    if (val && typeof val.toDate === 'function') return val.toDate();
    const str = String(val);
    if (/^\d{1,2}:\d{2}/.test(str)) return new Date(`2000-01-01T${str}`);
    const d = new Date(str);
    return isNaN(d.getTime()) ? new Date(0) : d;
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
  
    const sortedProcs = [...procedures]
      .map(p => ({ ...p, _start: parseProcTime(p.startTime), _end: parseProcTime(p.endTime) }))
      .filter(p => !isNaN(p._start.getTime()) && !isNaN(p._end.getTime()))
      .sort((a, b) => a._start.getTime() - b._start.getTime());
  
    sortedProcs.forEach(proc => {
        const start = new Date(proc._start);
        const end = new Date(proc._end);
        if (end < start) end.setDate(end.getDate() + 1);
  
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
  
    if (score < 0) score = 0;
    if (isNaN(score) || !isFinite(score)) score = 0;
  
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
        dayMinutes: isNaN(totalDayMin) ? 0 : totalDayMin,
        nightMinutes: isNaN(totalNightMin) ? 0 : totalNightMin,
        recoveryMinutes: isNaN(totalRecoveryMin) ? 0 : totalRecoveryMin,
        limitRatio: Math.min(((isNaN(score) ? 0 : score) / CONSTANTS.LIMIT_CRITICAL) * 100, 100)
    };
  };