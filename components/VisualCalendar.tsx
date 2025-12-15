import React from 'react';
import { Doctor } from './DoctorManager';

// Interface simples para um Plantão (usando os dados que já temos)
export interface ShiftEvent {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;     // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  type: 'DIURNO' | 'NOTURNO';
}

interface VisualCalendarProps {
  shifts: ShiftEvent[];
  doctors: Doctor[];
}

export const VisualCalendar: React.FC<VisualCalendarProps> = ({ shifts }) => {
  // Vamos simular uma visualização dos próximos 3 dias
  const daysToShow = 3;
  const today = new Date();
  
  const getDates = () => {
    const dates = [];
    for(let i=0; i<daysToShow; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d);
    }
    return dates;
  };

  const dates = getDates();

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg h-full">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        📅 Agenda de Plantões
      </h3>

      <div className="space-y-6">
        {dates.map((date) => {
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
            // Filtra plantões deste dia
            const dayShifts = shifts.filter(s => s.date === dateStr);

            return (
                <div key={dateStr} className="border-l-2 border-slate-600 pl-4 relative">
                    {/* Bolinha da timeline */}
                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-4 border-slate-800"></div>
                    
                    <h4 className="text-lg font-semibold text-slate-300 mb-3 capitalize">
                        {date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h4>

                    {dayShifts.length === 0 ? (
                        <p className="text-slate-600 italic text-sm">Sem plantões agendados.</p>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {dayShifts.map(shift => (
                                <div key={shift.id} className={`p-3 rounded-md border flex justify-between items-center ${
                                    shift.type === 'NOTURNO' 
                                    ? 'bg-indigo-900/30 border-indigo-500/50' 
                                    : 'bg-emerald-900/30 border-emerald-500/50'
                                }`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded text-xs font-bold ${
                                            shift.type === 'NOTURNO' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                                        }`}>
                                            {shift.startTime} - {shift.endTime}
                                        </div>
                                        <div>
                                            <p className="text-white font-medium">{shift.doctorName}</p>
                                            <p className="text-xs text-slate-400 uppercase tracking-wider">{shift.type}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};