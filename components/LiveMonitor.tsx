import React, { useState, useEffect, useMemo } from 'react';
import { ScheduleEntry, AnalysisResults, DoctorStatus } from '../types';
import { SignalIcon, StethoscopeIcon, CoffeeIcon, BedIcon, UsersIcon, ClockIcon } from './icons';

interface LiveMonitorProps {
  schedule: ScheduleEntry[];
  analysis: AnalysisResults;
}

const statusConfig: { [key in DoctorStatus]: { icon: React.ReactNode; color: string; label: string } } = {
    'Em Atendimento': { icon: <StethoscopeIcon className="w-5 h-5 text-green-600" />, color: 'bg-green-100 text-green-800', label: 'Em Atendimento' },
    'Em Standby': { icon: <CoffeeIcon className="w-5 h-5 text-yellow-600" />, color: 'bg-yellow-100 text-yellow-800', label: 'Em Standby' },
    'Em Repouso': { icon: <BedIcon className="w-5 h-5 text-blue-600" />, color: 'bg-blue-100 text-blue-800', label: 'Em Repouso' },
};

const LiveMonitor: React.FC<LiveMonitorProps> = ({ schedule, analysis }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [demandModifier, setDemandModifier] = useState(0); // -2 to +2

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000); // Update every second for the clock
    return () => clearInterval(timer);
  }, []);

  const uniqueDoctors = useMemo(() => [...new Set(schedule.map(s => s.doctorName))].sort(), [schedule]);

  const liveStatus = useMemo(() => {
    const shiftStartDate = schedule.length > 0 ? new Date(schedule[0].startTime) : new Date();
    shiftStartDate.setHours(8, 0, 0, 0); // Assuming shift starts at 8 AM for simulation clock

    // Simulate time passing faster for demonstration if needed, otherwise use real time.
    // For this implementation, we map the real-time hour to the shift's timeline.
    const realHoursPassed = (currentTime.getTime() - new Date().setHours(8,0,0,0)) / (1000 * 60 * 60);
    const simulatedShiftTime = new Date(shiftStartDate.getTime() + realHoursPassed * (1000 * 60 * 60));


    return uniqueDoctors.map(doctorName => {
      const entry = schedule.find(s => s.doctorName === doctorName && simulatedShiftTime >= s.startTime && simulatedShiftTime < s.endTime);
      return {
        name: doctorName,
        status: entry ? entry.status : 'Fora de Escala',
      };
    });
  }, [schedule, uniqueDoctors, currentTime]);
  
  // Base demand profile (simple version: peak at midday)
  const currentHour = currentTime.getHours();
  const baseDemand = (currentHour >= 9 && currentHour < 12) ? 3 : (currentHour >= 12 && currentHour < 16) ? 4 : 2;
  const totalDemand = Math.max(1, baseDemand + demandModifier);

  const doctorsAttending = liveStatus.filter(d => d.status === 'Em Atendimento').length;
  const doctorsOnStandby = liveStatus.filter(d => d.status === 'Em Standby').length;
  
  const estimatedWaitTime = doctorsAttending > 0 
    ? (totalDemand * analysis.mean) / doctorsAttending 
    : Infinity;

  const getStrategicSuggestion = () => {
    if (doctorsAttending < totalDemand) {
        if (doctorsOnStandby > 0) {
            return `A demanda (${totalDemand}) está maior que a oferta (${doctorsAttending}). Considere acionar ${Math.min(doctorsOnStandby, totalDemand - doctorsAttending)} médico(s) em standby.`;
        }
        return `ALERTA: Demanda (${totalDemand}) maior que a oferta (${doctorsAttending}) e sem médicos em standby. Risco de sobrecarga.`;
    }
    if (doctorsAttending > totalDemand + 1) {
        return `A oferta (${doctorsAttending}) está maior que a demanda (${totalDemand}). Uma boa oportunidade para rodízio ou descanso da equipe.`;
    }
    return `Operação estável. A oferta de médicos (${doctorsAttending}) está alinhada com a demanda atual (${totalDemand}).`;
  }

  return (
    <div className="p-6 border border-slate-200 rounded-2xl bg-slate-50 space-y-6">
      <div className="flex items-center gap-3">
        <div className="relative">
            <SignalIcon className="text-indigo-600 w-7 h-7" />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-green-400 ring-2 ring-white"></span>
        </div>
        <h3 className="text-2xl font-bold text-slate-700">Monitoramento em Tempo Real</h3>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Status Column */}
        <div className="lg:col-span-1 bg-white p-4 rounded-xl shadow-md space-y-3">
            <div className="text-center pb-2 border-b border-slate-200">
                <p className="font-bold text-4xl text-slate-800">{currentTime.toLocaleTimeString('pt-BR')}</p>
                <p className="text-sm text-slate-500">Horário Atual</p>
            </div>
            <div className="space-y-2 pt-2">
                {liveStatus.map(doctor => (
                    <div key={doctor.name} className="flex justify-between items-center p-2 rounded-md hover:bg-slate-50">
                        <span className="font-medium text-slate-700">{doctor.name}</span>
                        <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[doctor.status as DoctorStatus]?.color ?? 'bg-slate-100 text-slate-800'}`}>
                           {statusConfig[doctor.status as DoctorStatus]?.icon}
                           {statusConfig[doctor.status as DoctorStatus]?.label ?? 'N/A'}
                        </span>
                    </div>
                ))}
            </div>
        </div>
        
        {/* Metrics & Controls Column */}
        <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-xl shadow-md flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg"><ClockIcon/></div>
                    <div>
                        <p className="text-sm font-medium text-slate-500">Tempo de Espera Estimado</p>
                        <p className="text-2xl font-bold text-slate-800">
                            {isFinite(estimatedWaitTime) ? estimatedWaitTime.toFixed(0) : 'N/A'}
                            <span className="text-lg font-medium text-slate-500 ml-1">min</span>
                        </p>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md flex items-start gap-4">
                    <div className="p-3 bg-indigo-100 rounded-lg"><UsersIcon /></div>
                     <div>
                        <p className="text-sm font-medium text-slate-500">Médicos Necessários (Demanda)</p>
                        <p className="text-2xl font-bold text-slate-800">{totalDemand}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-md">
                <label htmlFor="demand-modifier" className="block text-sm font-medium text-slate-700 mb-2">Ajustar Demanda Inesperada</label>
                <input
                    id="demand-modifier"
                    type="range"
                    min="-2"
                    max="2"
                    step="1"
                    value={demandModifier}
                    onChange={(e) => setDemandModifier(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                />
                 <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>- Calmo</span>
                    <span>Normal</span>
                    <span>+ Intenso</span>
                </div>
            </div>
            
             <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                <h4 className="font-semibold text-indigo-800">Sugestão Estratégica da IA</h4>
                <p className="text-sm text-indigo-700 mt-1">{getStrategicSuggestion()}</p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default LiveMonitor;
