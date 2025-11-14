// src/components/ScheduleCalendar.tsx
// VERSÃO FINAL CORRIGIDA (SEM CHAVES NOS IMPORTS)

import React, { useState } from 'react';
import { Timestamp } from 'firebase/firestore'; // Importe o Timestamp

// Nossos hooks de dados
import { useShifts, Shift } from '../services/useShifts';
import { useLocations } from '../services/useLocations';
import { useProcedures } from '../services/useProcedures';

// Seus componentes existentes que serão "plugados"
import ProcedureInputForm from './ProcedureInputForm'; // <-- CORRIGIDO (sem chaves)
import ProcedureTable from './ProcedureTable';     // <-- CORRIGIDO (sem chaves)

// --- Tipos que seu App.tsx usava (adapte se necessário) ---
// Este é o tipo que seu ProcedureInputForm espera
interface ProcedureFormData {
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
}
// Este é o tipo que seu ProcedureTable espera
interface ProcedureData {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
}
// --- Fim dos Tipos ---

// Componente simples para formatar a data
const formatDate = (date: Date) => {
  if (!date || isNaN(date.getTime())) {
    return 'Data inválida';
  }
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// --- NOVO: O componente agora recebe props do App.tsx ---
interface ScheduleCalendarProps {
  selectedShiftId: string | null;
  onShiftSelected: (id: string | null) => void;
}

export const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({
  selectedShiftId, // <-- Vem do App.tsx
  onShiftSelected, // <-- Avisa o App.tsx
}) => {
  // --- Hooks de Gerenciamento de Dados (Plantões e Locais) ---
  const { shifts, loading: loadingShifts, addShift, deleteShift } = useShifts();
  const { locations, loading: loadingLocations } = useLocations();

  // --- Estado do Formulário de Plantão (Shift) ---
  const [title, setTitle] = useState('');
  const [locationId, setLocationId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [error, setError] = useState('');

  // --- Hook de Procedimentos ---
  // Busca procedimentos SÓ para o plantão selecionado (que vem da prop)
  const {
    procedures,
    loading: loadingProcedures,
    addProcedure,
    deleteProcedure,
  } = useProcedures(selectedShiftId);

  // --- Função: Adicionar Plantão (Shift) ---
  const handleSubmitShift = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !locationId || !startTime || !endTime) {
      setError('Todos os campos do plantão são obrigatórios.');
      return;
    }
    const startDate = new Date(startTime);
    const endDate = new Date(endTime);

    if (endDate <= startDate) {
      setError('A data/hora final do plantão deve ser após a inicial.');
      return;
    }

    addShift(title, locationId, startDate, endDate);
    setTitle('');
    setLocationId('');
    setStartTime('');
    setEndTime('');
  };

  // --- Função: Adicionar Procedimento ---
  // Esta função é chamada pelo seu ProcedureInputForm
  const handleAddProcedure = (proc: ProcedureFormData) => {
    if (!selectedShiftId) return;

    const procedureData = {
      name: proc.name,
      startTime: proc.startTime,
      endTime: proc.endTime,
      duration: proc.duration,
      // ... quaisquer outros campos do seu tipo 'Procedure' ...
    };

    addProcedure(procedureData as any); // Use 'as any' se os tipos não baterem 100%
  };

  // --- Função: Deletar Procedimento ---
  // Esta função é chamada pela sua ProcedureTable
  const handleDeleteProcedure = (id: string) => {
    deleteProcedure(id);
  };

  // --- Função Auxiliar: Obter Cor do Local ---
  const getLocationColor = (id: string) => {
    const loc = locations.find((l) => l.id === id);
    return loc ? loc.color : '#888';
  };

  // --- Renderização ---
  return (
    <>
      {/* === SEÇÃO 1: GERENCIADOR DE PLANTÕES (SHIFTS) === */}
      <div className="bg-slate-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-white mb-4">Minhas Escalas (Plantões)</h2>

        {/* --- Formulário de Adição de Plantão --- */}
        <form onSubmit={handleSubmitShift} className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Título */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-300">Título</label>
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Plantão UTI"
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Local (Dropdown) */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Local</label>
            <select
              value={locationId} onChange={(e) => setLocationId(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {loadingLocations ? (
                <option disabled>Carregando...</option>
              ) : (
                locations.map((loc) => (
                  <option key={loc.id} value={loc.id}> {loc.name} </option>
                ))
              )}
            </select>
          </div>
          {/* Início */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Início</label>
            <input
              type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {/* Fim */}
          <div>
            <label className="block text-sm font-medium text-slate-300">Fim</label>
            <input
              type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button type="submit" className="md:col-span-5 w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none">
            Adicionar Escala
          </button>
          {error && <p className="text-red-400 md:col-span-5">{error}</p>}
        </form>

        {/* --- Lista de Escalas (Plantões) --- */}
        <h3 className="text-lg font-bold text-white mb-3">Seus Próximos Plantões</h3>
        <div className="space-y-3">
          {loadingShifts && <p className="text-slate-400">Carregando escalas...</p>}
          {shifts
            .sort((a, b) => a.start.toDate().getTime() - b.start.toDate().getTime()) // Mais cedo primeiro
            .map((shift) => (
              <div
                key={shift.id}
                className={`p-4 rounded-lg cursor-pointer ${
                  selectedShiftId === shift.id ? 'bg-slate-600' : 'bg-slate-700'
                } hover:bg-slate-600`}
                style={{ borderLeft: `5px solid ${getLocationColor(shift.locationId)}` }}
                onClick={() => onShiftSelected(shift.id)} // <-- AVISA O App.tsx QUEM FOI CLICADO
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold text-white">{shift.title}</p>
                    <p className="text-sm text-slate-300">
                      {formatDate(shift.start.toDate())} até {formatDate(shift.end.toDate())}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Impede o clique no 'div' pai
                      deleteShift(shift.id);
                      if (selectedShiftId === shift.id) onShiftSelected(null); // Avisa o App.tsx para limpar a seleção
                    }}
                    className="text-slate-400 hover:text-red-500 px-2 py-1"
                  >
                    Excluir Plantão
                  </button>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* === SEÇÃO 2: GERENCIADOR DE PROCEDIMENTOS (SÓ APARECE SE UM PLANTÃO ESTIVER SELECIONADO) === */}
      {selectedShiftId && (
        <div className="bg-slate-800 p-6 rounded-lg shadow-lg mt-6 border-t-2 border-blue-500">
          <h3 className="text-xl font-bold text-white mb-4">
            Registrar Procedimentos do Plantão Selecionado
          </h3>
          
          <ProcedureInputForm onAddProcedure={handleAddProcedure} />
          
          {loadingProcedures ? (
            <p className="text-slate-400 mt-4">Carregando procedimentos...</p>
          ) : (
            <ProcedureTable
              procedures={procedures as ProcedureData[]}
              onDeleteProcedure={handleDeleteProcedure}
              onClearProcedures={() => {
                // Lógica para deletar todos
                procedures.forEach(p => deleteProcedure(p.id));
              }}
            />
          )}
        </div>
      )}
    </>
  );
};