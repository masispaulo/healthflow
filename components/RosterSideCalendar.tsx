import React, { useState } from 'react';
import { User } from 'firebase/auth';
import { useShifts } from '../services/useShifts';
import { XMarkIcon } from './Icons'; 

interface RosterSideCalendarProps {
  user: User | null;
  locations: any[]; // Recebe a lista de locais para mostrar o nome
  onDateSelect: (date: Date) => void;
}

const RosterSideCalendar: React.FC<RosterSideCalendarProps> = ({ user, locations, onDateSelect }) => {
  const { shifts } = useShifts(user);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isExpanded, setIsExpanded] = useState(false); // ESTADO DE ZOOM

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
    setIsExpanded(false); // Fecha o modal ao selecionar
  };

  // Função auxiliar para achar o nome do local pelo ID
  const getLocationName = (id: string) => {
    const loc = locations.find(l => l.id === id);
    return loc ? loc.name : 'Local Desconhecido';
  };

  const renderCalendarDays = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const days = [];

    // Dias vazios
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className={`${isExpanded ? 'bg-slate-800/30 border border-slate-700/20' : 'h-8'}`}></div>);
    }

    // Dias do mês
    for (let i = 1; i <= totalDays; i++) {
      const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      
      // Verifica se tem plantão nesse dia
      const shiftsOnDay = shifts.filter(s => 
        s.startTime.getDate() === i && 
        s.startTime.getMonth() === currentDate.getMonth() &&
        s.startTime.getFullYear() === currentDate.getFullYear()
      );
      const hasShift = shiftsOnDay.length > 0;
      
      // --- MODO EXPANDIDO (QUADRADOS GRANDES) ---
      if (isExpanded) {
        days.push(
          <div
            key={i}
            onClick={(e) => { e.stopPropagation(); handleDayClick(i); }}
            className={`
              min-h-[120px] p-2 border border-slate-700 cursor-pointer flex flex-col gap-1 transition-colors
              ${hasShift ? 'bg-slate-800 hover:bg-slate-750' : 'bg-slate-800 hover:bg-slate-700'}
            `}
          >
            {/* Número do Dia */}
            <span className={`text-lg font-bold mb-1 ${hasShift ? 'text-indigo-400' : 'text-slate-400'}`}>
              {i}
            </span>
            
            {/* Lista de Plantões (Horário + Local) */}
            <div className="flex flex-col gap-1 overflow-y-auto max-h-[90px] custom-scrollbar">
              {shiftsOnDay.map(shift => (
                <div key={shift.id} className="text-[11px] bg-indigo-600/90 text-white px-2 py-1 rounded shadow-sm border-l-2 border-indigo-300">
                  <div className="font-bold">
                    {shift.startTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div className="truncate opacity-90">
                    {getLocationName(shift.locationId)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      } 
      // --- MODO PEQUENO (LATERAL) ---
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
            {hasShift && (
               <span className="absolute bottom-0.5 w-1 h-1 bg-indigo-400 rounded-full"></span>
            )}
          </button>
        );
      }
    }
    return days;
  };

  // Classes para quando está expandido (Modal) vs Pequeno (Sidebar)
  const containerClasses = isExpanded
    ? "fixed inset-0 z-50 bg-slate-900/95 flex flex-col items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
    : "relative w-full h-full";

  const cardClasses = isExpanded
    ? "bg-slate-900 w-full max-w-6xl h-[90vh] rounded-xl border border-slate-700 shadow-2xl flex flex-col"
    : "bg-slate-800 rounded-lg border border-slate-700 shadow-lg p-2 cursor-pointer hover:border-slate-500 transition-colors";

  return (
    <div className={containerClasses} onClick={() => !isExpanded && setIsExpanded(true)}>
      
      {/* Botão de Fechar (Só aparece se estiver expandido) */}
      {isExpanded && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsExpanded(false); }}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800 border border-slate-700 transition-colors z-50"
        >
          <XMarkIcon className="w-8 h-8" />
        </button>
      )}

      <div className={cardClasses} onClick={(e) => isExpanded && e.stopPropagation()}>
        {/* Cabeçalho do Calendário */}
        <div className={`flex justify-between items-center mb-4 ${isExpanded ? 'px-4' : 'px-1'}`}>
          <button onClick={handlePrevMonth} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded">&lt;</button>
          <span className={`font-bold text-slate-200 capitalize ${isExpanded ? 'text-2xl' : 'text-sm'}`}>
            {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={handleNextMonth} className="text-slate-400 hover:text-white p-1 hover:bg-slate-700 rounded">&gt;</button>
        </div>

        {/* Dias da Semana */}
        <div className={`grid grid-cols-7 text-center mb-2 border-b border-slate-700 pb-2 ${isExpanded ? 'gap-4' : 'gap-1'}`}>
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className={`font-bold text-slate-500 ${isExpanded ? 'text-base' : 'text-[10px]'}`}>
              {isExpanded ? day : day.charAt(0)}
            </div>
          ))}
        </div>

        {/* Grid de Dias */}
        <div className={`grid grid-cols-7 ${isExpanded ? 'flex-1 overflow-y-auto bg-slate-900 gap-px border-l border-t border-slate-700' : 'place-items-center gap-1'}`}>
          {renderCalendarDays()}
        </div>

        {/* Dica no rodapé se estiver pequeno */}
        {!isExpanded && (
          <div className="mt-3 pt-2 border-t border-slate-700 text-center text-[10px] text-slate-500">
            Clique para ampliar
          </div>
        )}
      </div>
    </div>
  );
};

export default RosterSideCalendar;