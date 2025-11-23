import React, { useState } from 'react';

// Definindo a interface das props
interface ProcedureInputFormProps {
  onAddProcedure: (procedure: {
    name: string;
    startTime: string;
    endTime: string;
    duration: number;
  }) => void;
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

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    
    // Cálculo simples da diferença em minutos
    let diff = (end.getTime() - start.getTime()) / 1000 / 60;
    
    // Se o fim for menor que o início, assume-se que virou o dia (madrugada)
    if (diff < 0) {
      diff += 24 * 60;
    }

    onAddProcedure({
      name,
      startTime,
      endTime,
      duration: diff,
    });

    // Limpa o formulário para permitir nova inserção
    setName('');
    setStartTime('');
    setEndTime('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-700/50 p-4 rounded-lg border border-slate-600 mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Nome do Procedimento */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Nome do Procedimento
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Cirurgia ACL"
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          />
        </div>

        {/* Início */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Tempo de Início
          </label>
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors [color-scheme:dark]"
          />
        </div>

        {/* Fim */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Tempo de Fim
          </label>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors [color-scheme:dark]"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md transition-colors duration-200 flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Adicionar Procedimento
        </button>
      </div>
    </form>
  );
};

export default ProcedureInputForm;