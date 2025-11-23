// src/components/ScheduleCalendar.tsx
// VERSÃO FINAL E PADRONIZADA (DARK MODE)

import React, { useState } from 'react';
import { useShifts } from '../services/useShifts';
import { useLocations } from '../services/useLocations';
import { useProcedures } from '../services/useProcedures';

// Componentes
import ProcedureInputForm from './ProcedureInputForm';
import ProcedureTable from './ProcedureTable';

// Interfaces
interface ProcedureFormData {
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ProcedureData {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
}

const formatDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) return 'Data inválida';
  return date.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
  });
};

interface ScheduleCalendarProps {
  selectedShiftId: string | null;
  onShiftSelected: (id: string | null) => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  selectedShiftId,
  onShiftSelected,
}) => {
  const { shifts, loading: loadingShifts, addShift, deleteShift } = useShifts();
  const { locations, loading: loadingLocations } = useLocations();

  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  const {
    procedures,
    loading: loadingProcedures,
    addProcedure,
    deleteProcedure,
  } = useProcedures(selectedShiftId);

  const handleSubmitShift = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !locationId || !startTime || !endTime) {
      setError('Preencha todos os campos.');
      return;
    }
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate <= startDate) {
      setError('Data final deve ser após a inicial.');
      return;
    }

    addShift(title, locationId, startDate, endDate);
    // Limpa o formulário após adicionar com sucesso
    setTitle('');
    setLocationId('');
    setStartTime('');
    setEndTime('');
  };

  const handleAddProcedure = (proc: ProcedureFormData) => {
    if (!selectedShiftId) return;
    addProcedure(proc as any);
  };

  const handleDeleteProcedure = (id: string) => {
    deleteProcedure(id);
  };

  const getLocationColor = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? loc.color : '#888';
  };

  return (
    <div className="space-y-8">
      {/* === BLOCO 1: ADICIONAR PLANTÃO === */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          📅 Minhas Escalas
        </h2>

        <form onSubmit={handleSubmitShift} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-slate-400 mb-1">Título do Plantão</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Plantão UTI Noturno"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          
          <div>
             <label className="block text-sm text-slate-400 mb-1">Local</label>
             <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="">Selecione o Local...</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="block text-sm text-slate-400 mb-1">Início</label>
                <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none [color-scheme:dark]"
                />
            </div>
            <div>
                <label className="block text-sm text-slate-400 mb-1">Fim</label>
                <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-2 py-2 bg-slate-900 border border-slate-600 rounded-md text-white focus:ring-2 focus:ring-blue-500 focus:outline-none [color-scheme:dark]"
                />
            </div>
          </div>

          <button
            type="submit"
            className="md:col-span-2 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-all shadow-md"
          >
            + Criar Plantão
          </button>
          {error && <p className="text-red-400 text-sm md:col-span-2">{error}</p>}
        </form>

        {/* LISTA DE PLANTÕES */}
        <div className="mt-6 space-y-3">
           <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Próximos Plantões</h3>
           {loadingShifts ? <p className="text-slate-500 text-center">Carregando...</p> : null}
           
           {shifts.length === 0 && !loadingShifts && (
             <p className="text-slate-500 text-center italic text-sm py-4">Nenhum plantão agendado.</p>
           )}

           {shifts
            .sort((a, b) => a.start.toDate().getTime() - b.start.toDate().getTime())
            .map((shift) => (
              <div
                key={shift.id}
                onClick={() => onShiftSelected(shift.id)}
                className={`relative p-4 rounded-lg border transition-all cursor-pointer group ${
                  selectedShiftId === shift.id 
                    ? 'bg-slate-700 border-blue-500 ring-1 ring-blue-500 shadow-lg' 
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750 hover:border-slate-600'
                }`}
              >
                {/* Barra Colorida Lateral */}
                <div 
                    className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg"
                    style={{ backgroundColor: getLocationColor(shift.locationId) }}
                />
                
                <div className="pl-3 flex justify-between items-start">
                    <div>
                        <h4 className="font-bold text-white text-lg">{shift.title}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                            {formatDate(shift.start.toDate())} até {formatDate(shift.end.toDate())}
                        </p>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if(window.confirm('Tem certeza que deseja excluir este plantão?')) {
                                deleteShift(shift.id);
                                if (selectedShiftId === shift.id) onShiftSelected(null);
                            }
                        }}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors"
                        title="Excluir"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* === BLOCO 2: PROCEDIMENTOS (CONDICIONAL) === */}
      {selectedShiftId && (
        <div className="bg-slate-800 p-6 rounded-lg shadow-xl border-t-4 border-blue-500 animation-fade-in">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-xl font-bold text-white">
               📋 Procedimentos do Plantão
             </h3>
             <span className="text-xs bg-blue-900 text-blue-200 px-2 py-1 rounded border border-blue-700">
                Plantão Selecionado
             </span>
          </div>
          
          {/* Formulário corrigido (Dark Mode) */}
          <ProcedureInputForm onAddProcedure={handleAddProcedure} />

          {loadingProcedures ? (
             <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
             </div>
          ) : (
            <div className="mt-4">
                <ProcedureTable
                procedures={procedures as ProcedureData[]}
                onDeleteProcedure={handleDeleteProcedure}
                onClearProcedures={() => procedures.forEach(p => handleDeleteProcedure(p.id))}
                />
            </div>
          )}
        </div>
      )}
    </div>
  );
};