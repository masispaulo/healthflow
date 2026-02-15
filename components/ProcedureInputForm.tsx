
import React, { useState } from 'react';

interface ProcedureInputFormProps {
  onAddProcedure: (procedure: { name: string; startTime: string; endTime: string }) => void;
}

const ProcedureInputForm: React.FC<ProcedureInputFormProps> = ({ onAddProcedure }) => {
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !startTime || !endTime) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    onAddProcedure({ name, startTime, endTime });
    setName('');
    setStartTime('');
    setEndTime('');
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 border border-slate-200 rounded-lg bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div className="md:col-span-2">
        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Nome do Procedimento</label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Cirurgia ACL"
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="startTime" className="block text-sm font-medium text-slate-700 mb-1">Tempo de Início</label>
        <input
          type="time"
          id="startTime"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <div>
        <label htmlFor="endTime" className="block text-sm font-medium text-slate-700 mb-1">Tempo de Fim</label>
        <input
          type="time"
          id="endTime"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
       <button type="submit" className="md:col-start-4 w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 transition-colors duration-300">
        Adicionar Procedimento
      </button>
    </form>
  );
};

export default ProcedureInputForm;
