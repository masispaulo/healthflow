import React, { useState, useEffect } from 'react';
import { useShifts } from '../services/useShifts';
import { User } from 'firebase/auth';
import { TrashIcon, PlusIcon, CalendarIcon, ClockIcon, MapPinIcon } from './Icons';

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
  locations = [], 
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
          // Define datas padrão se estiver vazio
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
        setError("Datas inválidas. Verifique os campos de início e fim.");
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
      console.error(err);
      setError("Erro ao salvar: " + (err.message || "Erro desconhecido"));
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
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
      <div className="flex items-center gap-2 mb-6 text-slate-100">
        <CalendarIcon className="w-6 h-6 text-indigo-400" />
        <h2 className="text-xl font-bold">
          {selectedShiftId ? 'Editar Escala' : 'Nova Escala de Plantão'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300">Título</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Plantão UTI"
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-300 flex items-center gap-1">
            <MapPinIcon className="w-4 h-4" /> Local
          </label>
          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2.5 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          >
            <option value="" disabled>Selecione...</option>
            {locations && locations.length > 0 ? (
              locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name}</option>)
            ) : (
              <option disabled>Cadastre um local primeiro</option>
            )}
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Início</label>
            <input type="datetime-local" value={startStr} onChange={(e) => setStartStr(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-300">Fim</label>
            <input type="datetime-local" value={endStr} onChange={(e) => setEndStr(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-white outline-none" />
          </div>
        </div>

        {error && <div className="p-3 bg-red-900/50 border border-red-800 rounded text-red-200 text-sm">{error}</div>}

        <div className="flex gap-3 pt-4">
          {selectedShiftId ? (
            <>
              <button type="button" onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded flex justify-center"><TrashIcon className="w-5 h-5"/></button>
              <button type="button" onClick={() => onSelectShift(null)} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white p-2 rounded">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-[2] bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded">Salvar</button>
            </>
          ) : (
            <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded shadow-lg flex items-center justify-center gap-2">
              <PlusIcon className="w-5 h-5" /> Criar Plantão
            </button>
          )}
        </div>
      </form>

      <div className="mt-8 border-t border-slate-700 pt-4">
        <h3 className="text-slate-400 text-xs uppercase mb-3">Plantões Agendados</h3>
        <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {loading ? <p className="text-slate-500 text-sm">Carregando...</p> : 
           shifts.length === 0 ? <p className="text-slate-500 text-sm italic">Nenhum plantão.</p> : (
            shifts
              .sort((a, b) => (a.startTime?.getTime() || 0) - (b.startTime?.getTime() || 0)) // Proteção contra erro getTime
              .map(shift => {
                const locName = locations?.find(l => l.id === shift.locationId)?.name || 'Local desconhecido';
                return (
                  <div key={shift.id} onClick={() => onSelectShift(shift.id)} className="bg-slate-750 hover:bg-slate-700 border border-slate-700 p-3 rounded cursor-pointer transition-colors flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-200">{shift.title}</div>
                      <div className="text-xs text-slate-400">
                        {shift.startTime ? shift.startTime.toLocaleDateString() : 'Data inválida'} • 
                        {shift.startTime ? shift.startTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--:--'}
                      </div>
                      <div className="text-xs text-indigo-400 mt-1">{locName}</div>
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