import React, { useState } from 'react';
import { useProcedures } from '../services/useProcedures';
import { useAuth } from '../services/useAuth'; 
import { TrashIcon, PlusIcon, ClockIcon } from './icons';

interface ProcedureInputProps {
  shiftId: string;
  onUpdate?: () => void; // A campainha para avisar o App
}

const ProcedureInput: React.FC<ProcedureInputProps> = ({ shiftId, onUpdate }) => {
  const { user } = useAuth();
  const { procedures, addProcedure, deleteProcedure, loading } = useProcedures(user, shiftId);

  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !start || !end) return alert("Preencha todos os campos");
    
    try {
      await addProcedure(name, start, end);
      setName('');
      setStart('');
      setEnd('');
      // Avisa o App para atualizar o gráfico
      if (onUpdate) setTimeout(onUpdate, 500); 
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar procedimento.");
    }
  };

  const handleDelete = async (id: string) => {
      if(window.confirm("Remover procedimento?")) {
          await deleteProcedure(id);
          if (onUpdate) setTimeout(onUpdate, 500);
      }
  }

  return (
    <div className="space-y-6">
      
      {/* Formulário */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-slate-750 p-4 rounded-lg border border-slate-700/50">
        <div className="md:col-span-1 space-y-1">
          <label className="text-xs text-slate-400 uppercase font-bold">Nome do Procedimento</label>
          <input 
            type="text" 
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Cirurgia ACL"
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Início</label>
          <input 
            type="time" 
            value={start}
            onChange={e => setStart(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-indigo-500"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Fim</label>
          <input 
            type="time" 
            value={end}
            onChange={e => setEnd(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-indigo-500"
          />
        </div>
        <button 
          type="submit" 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded h-[42px] flex items-center justify-center gap-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" /> Adicionar
        </button>
      </form>

      {/* Tabela */}
      <div className="overflow-hidden rounded-lg border border-slate-700">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-300 uppercase bg-slate-800">
            <tr>
              <th className="px-4 py-3">Procedimento</th>
              <th className="px-4 py-3">Horário</th>
              <th className="px-4 py-3 text-center">Duração</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {procedures.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-500 italic">
                  Nenhum procedimento registrado neste plantão ainda.
                </td>
              </tr>
            ) : (
              procedures.map((proc) => (
                <tr key={proc.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{proc.name}</td>
                  <td className="px-4 py-3">{proc.startTime} - {proc.endTime}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="bg-slate-700 text-white px-2 py-1 rounded text-xs">
                      {proc.duration} min
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button 
                      onClick={() => handleDelete(proc.id)}
                      className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProcedureInput;