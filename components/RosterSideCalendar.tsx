import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useShifts } from '../services/useShifts';
import { XMarkIcon } from './icons'; 

interface RosterSideCalendarProps {
  user: User | null;
  locations: any[];
  onDateSelect: (date: Date) => void;
}

const RosterSideCalendar: React.FC<RosterSideCalendarProps> = ({ user, locations, onDateSelect }) => {
  const { shifts } = useShifts(user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    onDateSelect(selectedDate);
    setIsExpanded(false);
  };

  const getLocationName = (id: string) => {
    const loc = locations.find(l => l.id === id);
    return loc ? loc.name : 'Local Desconhecido';
  };

  const renderCalendarDays = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const days = [];

    // Dias vazios (padding inicial)
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className={`${isExpanded ? 'bg-slate-800/20 border border-slate-700/10' : 'h-8'}`}></div>);
    }

    // Dias do mês
    for (let i = 1; i <= totalDays; i++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      
      const shiftsOnDay = shifts.filter(s => 
        s.startTime.getDate() === i && 
        s.startTime.getMonth() === currentDate.getMonth() &&
        s.startTime.getFullYear() === currentDate.getFullYear()
      );
      const hasShift = shiftsOnDay.length > 0;
      
      // --- MODO EXPANDIDO (FULL SCREEN) ---
      if (isExpanded) {
        days.push(
          <div
            key={i}
            onClick={(e) => { e.stopPropagation(); handleDayClick(i); }}
            className={`
              min-h-[140px] p-1 border border-slate-700 cursor-pointer flex flex-col gap-1 transition-colors relative
              ${hasShift ? 'bg-slate-800 hover:bg-slate-750' : 'bg-slate-900 hover:bg-slate-800'}
            `}
          >
            <span className={`text-sm font-bold ml-1 ${hasShift ? 'text-indigo-400' : 'text-slate-500'}`}>
              {i}
            </span>
            
            {/* Lista de Plantões no dia */}
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[110px] custom-scrollbar">
              {shiftsOnDay.map(shift => (
                <div key={shift.id} className="text-[10px] sm:text-xs bg-indigo-600/90 text-white p-1.5 rounded shadow-sm border-l-2 border-indigo-300 leading-tight">
                  <div className="font-bold">
                    {shift.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="opacity-90 line-clamp-2">
                    {getLocationName(shift.locationId)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      } 
      // --- MODO MINI (LATERAL) ---
      else {
        days.push(
          <button
            key={i}
            onClick={(e) => { e.stopPropagation(); handleDayClick(i); }}
            className={`
              relative flex items-center justify-center rounded-full transition-all duration-200 h-8 w-8 text-xs
              ${hasShift 
                ? 'bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/50 hover:bg-indigo-500' 
                : 'text-slate-400 hover:bg-slate-700 hover:text-white'}
            `}
          >
            {i}
            {hasShift && <span className="absolute bottom-0.5 w-1 h-1 bg-indigo-400 rounded-full"></span>}
          </button>
        );
      }
    }
    return days;
  };

  // Classes para Full Screen (Expandido) vs Widget (Pequeno)
  const containerClasses = isExpanded
    ? "fixed inset-0 z-[9999] bg-slate-900 flex flex-col p-2 animate-fade-in overflow-hidden" // Tela cheia total
    : "relative w-full h-full";

  const cardClasses = isExpanded
    ? "w-full h-full flex flex-col bg-slate-900"
    : "bg-slate-800 rounded-lg border border-slate-700 shadow-lg p-2 cursor-pointer hover:border-slate-500 transition-colors";

  return (
    <div className={containerClasses} onClick={() => !isExpanded && setIsExpanded(true)}>
      
      {isExpanded && (
        <div className="flex justify-between items-center mb-2 px-2 pt-2 md:pt-4">
           <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
             <span className="text-indigo-500">📅</span> Calendário Geral
           </h2>
           <button 
            onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
            className="text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 border border-slate-700"
           >
            <XMarkIcon className="w-6 h-6" />
           </button>
        </div>
      )}

      <div className={cardClasses} onClick={(e) => isExpanded && e.stopPropagation()}>
        <div className={`flex justify-between items-center mb-4 ${isExpanded ? 'px-2' : 'px-1'}`}>
          <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded text-lg">&lt;</button>
          <span className={`font-bold text-slate-200 capitalize ${isExpanded ? 'text-xl' : 'text-sm'}`}>
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded text-lg">&gt;</button>
        </div>

        <div className={`grid grid-cols-7 text-center mb-2 border-b border-slate-700 pb-2 ${isExpanded ? 'gap-1' : 'gap-1'}`}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className={`font-bold text-slate-500 ${isExpanded ? 'text-sm uppercase tracking-wider' : 'text-[10px]'}`}>
              {isExpanded ? day : day.charAt(0)}
            </div>
          ))}
        </div>

        <div className={`grid grid-cols-7 ${isExpanded ? 'flex-1 overflow-y-auto bg-slate-900 gap-px border border-slate-700' : 'place-items-center gap-1'}`}>
          {renderCalendarDays()}
        </div>

        {!isExpanded && (
          <div className="mt-3 pt-2 border-t border-slate-700 text-center text-[10px] text-slate-500">
            Toque para ampliar
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterSideCalendar;