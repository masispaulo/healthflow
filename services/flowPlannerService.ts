/**
 * flowPlannerService.ts
 * Motor de planejamento de escalas baseado em curvas gaussianas.
 * PROPÓSITO: Cuidar do médico (controle de fadiga) — é o centro da plataforma.
 * - Horários de trabalho INVERSAMENTE proporcionais à curva de velocidade
 * - EQUIDADE: nenhum trabalha mais que o outro
 * - ROTAÇÃO: horários trocam entre os médicos
 * - Integrado ao modelo SAFTE-FAST (fatigueService)
 */

export interface FlowPoint {
  hour: number;       // 0-24
  scheduled: number;  // Pacientes agendados nessa hora
  encaixe: number;   // Pacientes de encaixe estimados
  total: number;     // scheduled + encaixe
  velocity?: number; // Derivada (taxa de variação) = "velocidade" do fluxo
}

export interface InflectionPoint {
  hour: number;
  type: 'peak' | 'valley' | 'inflection';  // peak/valley = derivada 0; inflection = 2ª derivada 0
  value: number;     // valor do fluxo nesse ponto
}

export interface TimeBlock {
  start: number;      // Hora início (0-24)
  end: number;        // Hora fim
  type: 'WORK' | 'STANDBY' | 'SLEEP';
}

export interface DoctorSchedule {
  doctorIndex: number;
  blocks: TimeBlock[];
}

export interface FlowPlannerInput {
  shiftStartHour: number;      // Ex: 7
  shiftEndHour: number;        // Ex: 19
  totalDoctors: number;
  totalScheduled: number;      // Total de pacientes agendados no dia
  encaixeRatio?: number;       // 0-1, proporção esperada de encaixe (ex: 0.3 = 30%)
  avgMinutesPerPatient?: number;
}

// --- MODELO GAUSSIANO DE FLUXO ---
// Picos típicos: manhã (9-11h) e tarde (14-16h)
// Vale: almoço (12-13h)
const PEAK_MORNING = 10;
const PEAK_AFTERNOON = 15;
const PEAK_STD = 1.5;

/**
 * Distribui N pacientes numa curva gaussiana bimodal (manhã + tarde)
 */
function gaussianBimodal(hour: number, total: number): number {
  const p1 = (1 / (PEAK_STD * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((hour - PEAK_MORNING) / PEAK_STD, 2));
  const p2 = (1 / (PEAK_STD * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((hour - PEAK_AFTERNOON) / PEAK_STD, 2));
  return (p1 + p2) * total;
}

/**
 * Curva de encaixe: mais espalhada (std maior), segue padrão similar
 */
function encaixeCurve(hour: number, total: number): number {
  const std = 2.5;
  const p1 = (1 / (std * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((hour - PEAK_MORNING) / std, 2));
  const p2 = (1 / (std * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((hour - PEAK_AFTERNOON) / std, 2));
  return (p1 + p2) * total;
}

/**
 * Normaliza array para somar totalTarget
 */
function normalizeToTotal(arr: number[], totalTarget: number): number[] {
  const sum = arr.reduce((a, b) => a + b, 0);
  if (sum <= 0) return arr;
  const factor = totalTarget / sum;
  return arr.map(v => v * factor);
}

/**
 * Gera a curva de fluxo de pacientes ao longo das horas
 */
export function generatePatientFlowCurve(input: FlowPlannerInput): FlowPoint[] {
  const {
    shiftStartHour,
    shiftEndHour,
    totalScheduled,
    encaixeRatio = 0.3,
  } = input;

  const totalEncaixe = Math.round(totalScheduled * encaixeRatio);
  const points: FlowPoint[] = [];
  const step = 0.5; // a cada 30 min

  const rawScheduled: number[] = [];
  const rawEncaixe: number[] = [];

  for (let h = shiftStartHour; h <= shiftEndHour; h += step) {
    rawScheduled.push(gaussianBimodal(h, 1));
    rawEncaixe.push(encaixeCurve(h, 1));
  }

  const normScheduled = normalizeToTotal(rawScheduled, totalScheduled);
  const normEncaixe = normalizeToTotal(rawEncaixe, totalEncaixe);

  let i = 0;
  for (let h = shiftStartHour; h <= shiftEndHour; h += step) {
    const s = normScheduled[i] ?? 0;
    const e = normEncaixe[i] ?? 0;
    points.push({
      hour: Math.round(h * 10) / 10,
      scheduled: Math.max(0, Math.round(s * 10) / 10),
      encaixe: Math.max(0, Math.round(e * 10) / 10),
      total: Math.max(0, Math.round((s + e) * 10) / 10),
    });
    i++;
  }

  return points;
}

/**
 * Enriquece FlowPoints com derivada (velocidade) e detecta pontos de inflexão.
 * - Derivada > 0: fluxo subindo
 * - Derivada < 0: fluxo caindo
 * - 2ª derivada = 0: ponto de inflexão (mudança de regime = hora de trocar escala)
 */
export function enrichWithVelocityAndInflections(points: FlowPoint[]): {
  points: FlowPoint[];
  inflectionPoints: InflectionPoint[];
} {
  if (points.length < 3) return { points, inflectionPoints: [] };

  const withVelocity: FlowPoint[] = [];
  for (let i = 0; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];
    let velocity = 0;
    if (prev && next) {
      velocity = (next.total - prev.total) / (next.hour - prev.hour);
    } else if (next) {
      velocity = (next.total - curr.total) / (next.hour - curr.hour);
    } else if (prev) {
      velocity = (curr.total - prev.total) / (curr.hour - prev.hour);
    }
    withVelocity.push({ ...curr, velocity });
  }

  // Segunda derivada (aceleração) para inflexões
  const secondDerivatives: number[] = [];
  for (let i = 0; i < withVelocity.length; i++) {
    const prev = withVelocity[i - 1];
    const curr = withVelocity[i];
    const next = withVelocity[i + 1];
    let acc = 0;
    if (prev && next && prev.velocity !== undefined && next.velocity !== undefined) {
      acc = (next.velocity - prev.velocity) / (next.hour - prev.hour);
    }
    secondDerivatives[i] = acc;
  }

  // Inflexões: onde 2ª derivada cruza zero (mudança de concavidade)
  const inflectionPoints: InflectionPoint[] = [];
  for (let i = 1; i < secondDerivatives.length; i++) {
    const prevAcc = secondDerivatives[i - 1];
    const currAcc = secondDerivatives[i];
    if ((prevAcc >= 0 && currAcc < 0) || (prevAcc <= 0 && currAcc > 0)) {
      const p = withVelocity[i];
      inflectionPoints.push({
        hour: p.hour,
        type: 'inflection',
        value: p.total,
      });
    }
  }

  // Picos e vales: derivada cruza zero
  for (let i = 1; i < withVelocity.length; i++) {
    const prev = withVelocity[i - 1];
    const curr = withVelocity[i];
    if (prev.velocity === undefined || curr.velocity === undefined) continue;
    if ((prev.velocity >= 0 && curr.velocity < 0) || (prev.velocity > 0 && curr.velocity <= 0)) {
      inflectionPoints.push({ hour: curr.hour, type: 'peak', value: curr.total });
    }
    if ((prev.velocity <= 0 && curr.velocity > 0) || (prev.velocity < 0 && curr.velocity >= 0)) {
      inflectionPoints.push({ hour: curr.hour, type: 'valley', value: curr.total });
    }
  }

  // Ordena por hora e remove duplicatas próximas
  inflectionPoints.sort((a, b) => a.hour - b.hour);
  const deduped: InflectionPoint[] = [];
  for (const ip of inflectionPoints) {
    const last = deduped[deduped.length - 1];
    if (!last || Math.abs(ip.hour - last.hour) > 0.3) {
      deduped.push(ip);
    }
  }

  return { points: withVelocity, inflectionPoints: deduped };
}

/**
 * Calcula quantos médicos em WORK são necessários em cada janela
 * para manter o fluxo estável (sem gargalo).
 * Capacidade: ~3 pacientes/hora por médico em WORK
 */
export function computeRequiredDoctors(
  flowPoints: FlowPoint[],
  avgMinutesPerPatient: number = 25
): number[] {
  const patientsPerHourPerDoctor = 60 / avgMinutesPerPatient;
  return flowPoints.map(p => {
    const needed = p.total / patientsPerHourPerDoctor;
    return Math.ceil(Math.max(0, needed));
  });
}

/**
 * MODELO: EQUIDADE NO DESCANSO + MUDANÇA A CADA CURVA DE VELOCIDADE
 * - Horários INVERSAMENTE proporcionais à velocidade (capacitivo)
 * - PRIORIDADE: todos descansam iguais (SLEEP equitativo)
 * - WORK pode variar entre médicos (sem problema)
 * - Mudança de quem faz o quê a cada ponto de inflexão da curva
 */
export function optimizeDoctorSchedules(
  input: FlowPlannerInput,
  flowPoints: FlowPoint[],
  inflectionPoints: InflectionPoint[] = []
): DoctorSchedule[] {
  const { shiftStartHour, shiftEndHour, totalDoctors, avgMinutesPerPatient = 25 } = input;

  const { points: enrichedPoints } = flowPoints[0]?.velocity !== undefined
    ? { points: flowPoints }
    : enrichWithVelocityAndInflections(flowPoints);

  const avgVelocity = enrichedPoints.reduce((s, p) => s + (p.velocity ?? 0), 0) / (enrichedPoints.length || 1);
  const patientsPerHourPerDoctor = 60 / avgMinutesPerPatient;

  // 1. Para cada hora: workSlots = INVERSAMENTE proporcional à velocidade (capacitivo)
  const hourlySlots: { hour: number; work: number; sleep: number; standby: number }[] = [];
  for (let h = Math.floor(shiftStartHour); h < Math.ceil(shiftEndHour); h++) {
    const idx = Math.round((h - shiftStartHour) * 2);
    const p = enrichedPoints[Math.min(idx, enrichedPoints.length - 1)];
    const velocity = p?.velocity ?? 0;
    const total = p?.total ?? 0;
    const isPeak = velocity > avgVelocity * 0.5 || velocity > 0.5;

    const demandBased = Math.ceil(total / patientsPerHourPerDoctor);
    const workSlots = isPeak
      ? Math.max(1, Math.floor(demandBased * 0.6))
      : Math.min(totalDoctors, Math.ceil(demandBased * 1.2));
    const cappedWork = Math.min(workSlots, totalDoctors);

    // Janela 12-14h: priorizar SLEEP (controle de fadiga SAFTE-FAST)
    const inRestWindow = h >= 12 && h < 14;
    const sleepSlots = inRestWindow
      ? Math.min(totalDoctors - cappedWork, Math.ceil((totalDoctors - cappedWork) / 2) + 1)
      : isPeak ? Math.floor((totalDoctors - cappedWork) / 2) : 0;
    const standbySlots = totalDoctors - cappedWork - sleepSlots;

    hourlySlots.push({
      hour: h,
      work: cappedWork,
      sleep: Math.max(0, sleepSlots),
      standby: Math.max(0, standbySlots),
    });
  }

  // 2. Fases definidas por pontos de inflexão (mudança a cada curva de velocidade)
  let inflections = inflectionPoints;
  if (inflections.length === 0) {
    const enriched = enrichWithVelocityAndInflections(flowPoints);
    inflections = enriched.inflectionPoints;
  }
  const allBounds = [Math.floor(shiftStartHour), ...inflections.map(ip => Math.floor(ip.hour)), Math.ceil(shiftEndHour)];
  const unique = [...new Set(allBounds)].filter(h => h >= shiftStartHour && h <= shiftEndHour).sort((a, b) => a - b);
  const phases: { start: number; end: number }[] = [];
  for (let i = 0; i < unique.length - 1; i++) {
    if (unique[i + 1] > unique[i]) phases.push({ start: unique[i], end: unique[i + 1] });
  }
  if (phases.length === 0) phases.push({ start: Math.floor(shiftStartHour), end: Math.ceil(shiftEndHour) });

  // 3. PRIORIDADE: equidade no DESCANSO. WORK pode variar (rotação por fase).
  const sleepAccumulated = new Array(totalDoctors).fill(0);
  const assignments: { hour: number; doctorIndex: number; type: 'WORK' | 'STANDBY' | 'SLEEP' }[] = [];
  let phaseRotation = 0;

  hourlySlots.forEach(({ hour, work, sleep, standby }) => {
    // Nova fase? Rotaciona quem começa
    const phaseIdx = phases.findIndex(p => hour >= p.start && hour < p.end);
    if (phaseIdx >= 0) phaseRotation = phaseIdx % totalDoctors;

    // WORK: rotação simples (pode variar, sem forçar equidade)
    const workOrder = [...Array(totalDoctors).keys()].map((_, i) => (phaseRotation + i) % totalDoctors);
    const workDoctors = workOrder.slice(0, work);

    workDoctors.forEach(d => assignments.push({ hour, doctorIndex: d, type: 'WORK' }));

    // SLEEP: EQUIDADE — quem tem menos descanso vai descansar (prioridade)
    const restDoctors = [...Array(totalDoctors).keys()].filter(d => !workDoctors.includes(d));
    const restSorted = restDoctors.sort((a, b) => sleepAccumulated[a] - sleepAccumulated[b]);
    const sleepCount = Math.min(sleep, restSorted.length);
    restSorted.forEach((d, i) => {
      const type = i < sleepCount ? 'SLEEP' : 'STANDBY';
      assignments.push({ hour, doctorIndex: d, type });
      if (type === 'SLEEP') sleepAccumulated[d] += 1;
    });
  });

  // 4. Agrupar por médico e mesclar blocos contíguos
  const byDoctor = new Map<number, { hour: number; type: 'WORK' | 'STANDBY' | 'SLEEP' }[]>();
  for (let d = 0; d < totalDoctors; d++) {
    byDoctor.set(
      d,
      assignments.filter(a => a.doctorIndex === d).map(a => ({ hour: a.hour, type: a.type }))
    );
  }

  const doctorSchedules: DoctorSchedule[] = [];
  byDoctor.forEach((list, doctorIndex) => {
    list.sort((a, b) => a.hour - b.hour);
    const blocks: TimeBlock[] = [];
    let i = 0;
    while (i < list.length) {
      const type = list[i].type;
      let end = list[i].hour + 1;
      while (i + 1 < list.length && list[i + 1].type === type && list[i + 1].hour === end) {
        i++;
        end = list[i].hour + 1;
      }
      blocks.push({ start: list[i].hour, end, type });
      i++;
    }
    doctorSchedules.push({ doctorIndex, blocks });
  });

  return doctorSchedules;
}

/**
 * Retorna métricas: prioridade na equidade do DESCANSO.
 */
export function getScheduleMetrics(schedules: DoctorSchedule[]): {
  workMinutesPerDoctor: number[];
  sleepMinutesPerDoctor: number[];
  standbyMinutesPerDoctor: number[];
  isRestEquitable: boolean; // todos descansam iguais?
} {
  const workMinutes = schedules.map(() => 0);
  const sleepMinutes = schedules.map(() => 0);
  const standbyMinutes = schedules.map(() => 0);

  schedules.forEach((s, d) => {
    s.blocks.forEach(b => {
      const mins = (b.end - b.start) * 60;
      if (b.type === 'WORK') workMinutes[d] += mins;
      else if (b.type === 'SLEEP') sleepMinutes[d] += mins;
      else standbyMinutes[d] += mins;
    });
  });

  const maxSleep = Math.max(...sleepMinutes);
  const minSleep = Math.min(...sleepMinutes);
  const isRestEquitable = maxSleep - minSleep <= 30; // diferença máx 30min no descanso

  return {
    workMinutesPerDoctor: workMinutes,
    sleepMinutesPerDoctor: sleepMinutes,
    standbyMinutesPerDoctor: standbyMinutes,
    isRestEquitable,
  };
}
