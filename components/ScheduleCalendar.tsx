import React, { useState, useEffect } from 'react';
import { useShifts } from '../services/useShifts';
import { User } from 'firebase/auth';
import { TrashIcon, PlusIcon, CalendarIcon, MapPinIcon } from './icons';

interface ScheduleCalendarProps {
  user: User | null;
  locations: any[]; 
  selectedShiftId: string | null;
  onSelectShift: (id: string | null) => void;
  preSelectedDate?: Date | null;
}

const formatDateForInput = (date: Date) => {
  if (!date || isNaN(date.getTime())) return '';
  const pad = (n: number) => n < 10 ? `0${n}` : n;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ 
  user, 
  locations, // Removi o valor padrão [] para o "undefined" funcionar na verificação de carregamento
  selectedShiftId, 
  onSelectShift,
  preSelectedDate 
}) => {
  
  const { shifts, addShift, updateShift, deleteShift, loading } = useShifts(user);

  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [startStr, setStartStr] = useState('');
  const [endStr, setEndStr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedShiftId && shifts.length > 0) {
      const shiftToEdit = shifts.find(s => s.id === selectedShiftId);
      if (shiftToEdit) {
        setTitle(shiftToEdit.title);
        setLocationId(shiftToEdit.locationId);
        setStartStr(formatDateForInput(shiftToEdit.startTime));
        setEndStr(formatDateForInput(shiftToEdit.endTime));
      }
    } else {
      if (!selectedShiftId) {
          setTitle('');
          const baseDate = preSelectedDate || new Date();
          const startDate = new Date(baseDate);
          startDate.setMinutes(0);
          const endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 12);

          setStartStr(formatDateForInput(startDate));
          setEndStr(formatDateForInput(endDate));
      }
    }
  }, [selectedShiftId, preSelectedDate, shifts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!title || !locationId || !startStr || !endStr) {
      setError("Por favor, preencha todos os campos.");
      setIsSubmitting(false);
      return;
    }

    const startDate = new Date(startStr);
    const endDate = new Date(endStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError("Datas inválidas.");
        setIsSubmitting(false);
        return;
    }

    if (endDate <= startDate) {
      setError("A data final deve ser posterior à data inicial.");
      setIsSubmitting(false);
      return;
    }

    try {
      if (selectedShiftId) {
        await updateShift(selectedShiftId, {
          title, locationId, startTime: startDate, endTime: endDate
        });
        alert("Escala atualizada!");
        onSelectShift(null); 
      } else {
        await addShift({
          title, locationId, startTime: startDate, endTime: endDate
        });
        setTitle('');
        alert("Plantão criado com sucesso!");
      }
    } catch (err: any) {
      setError("Erro: " + (err.message || "Erro desconhecido"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedShiftId || !window.confirm("Excluir esta escala?")) return;
    try {
      await deleteShift(selectedShiftId);
      onSelectShift(null);
    } catch (err) { alert("Erro ao excluir."); }
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg relative h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 text-slate-100">
        <CalendarIcon className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold">
          {selectedShiftId ? 'Editar Escala' : 'Nova Escala'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pb-32 md:pb-0 overflow-y-auto">
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Plantão UTI"
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        {/* --- CORREÇÃO DO SELECT DE LOCAIS --- */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
            <MapPinIcon className="w-4 h-4" /> Local
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="" disabled>Selecione...</option>
            
            {locations === undefined ? (
              <option disabled>Carregando...</option>
            ) : locations.length === 0 ? (
              <option disabled>Nenhum local cadastrado</option>
            ) : (
              locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))
            )}
            
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Início</label>
            <input type="datetime-local" value={startStr} onChange={(e) => setStartStr(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-white outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Fim</label>
            <input type="datetime-local" value={endStr} onChange={(e) => setEndStr(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-white outline-none" />
          </div>
        </div>

        {error && <div className="p-3 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">{error}</div>}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-800 border-t border-slate-700 z-50 md:relative md:bg-transparent md:border-0 md:p-0 md:pt-4 flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.3)] md:shadow-none">
          {selectedShiftId ? (
            <>
              <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white p-3 rounded flex justify-center items-center"><TrashIcon className="w-5 h-5"/></button>
              <button type="button" onClick={() => onSelectShift(null)} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white p-3 rounded font-medium">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded font-bold shadow-lg">Salvar Alterações</button>
            </>
          ) : (
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-4 rounded-lg shadow-xl flex items-center justify-center gap-2 text-lg transition-transform transform active:scale-95">
              <PlusIcon className="w-6 h-6" /> Definir Plantão
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 border-t border-slate-700 pt-4 hidden md:block">
        <h3 className="text-slate-400 text-xs uppercase mb-3">Seus Agendamentos</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
           {loading ? <p className="text-slate-500 text-sm">Carregando...</p> : 
            shifts.length === 0 ? <p className="text-slate-500 text-sm italic">Nenhum plantão.</p> : (
              shifts
                .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0))
                .map(shift => {
                  const locName = locations?.find(l => l.id === shift.locationId)?.name || 'Local desconhecido';
                  return (
                    <div key={shift.id} onClick={() => onSelectShift(shift.id)} className="bg-slate-750 hover:bg-slate-700 border border-slate-700 p-3 rounded cursor-pointer transition-colors flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-200">{shift.title}</div>
                        <div className="text-xs text-slate-400">
                          {shift.startTime ? shift.startTime.toLocaleDateString() : ''} • {locName}
                        </div>
                      </div>
                      <span className="text-xs bg-slate-800 px-2 py-1 rounded border border-slate-600 text-slate-400">Editar</span>
                    </div>
                )})
            )}
        </div>
      </div>
    </div>
  );
};

export default ScheduleCalendar;