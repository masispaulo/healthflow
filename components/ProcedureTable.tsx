import React from 'react';

// Interface dos dados (deve bater com o que é passado no ScheduleCalendar)
interface ProcedureData {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
}

interface ProcedureTableProps {
  procedures: ProcedureData[];
  onDeleteProcedure: (id: string) => void;
  onClearProcedures: () => void;
}

const ProcedureTable: React.FC<ProcedureTableProps> = ({
  procedures,
  onDeleteProcedure,
  onClearProcedures,
}) => {
  // Função simples de exportação para CSV (interna ao componente visual)
  const handleExportCsv = () => {
    if (procedures.length === 0) return;
    
    const headers = ['Nome', 'Início', 'Fim', 'Duração (min)'];
    const rows = procedures.map(p => [p.name, p.startTime, p.endTime, p.duration]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'procedimentos_healthflow.csv';
    link.click();
  };

  if (procedures.length === 0) {
    return (
      <div className="text-center p-8 bg-slate-800/50 rounded-lg border border-dashed border-slate-700 text-slate-500">
        <p>Nenhum procedimento registrado ainda.</p>
        <p className="text-sm mt-1">Use o formulário acima para adicionar.</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-slate-700">
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">Nome do Procedimento</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Início</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Fim</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center">Duração (min)</th>
              <th className="p-4 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {procedures.map((proc) => (
              <tr key={proc.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="p-4 text-sm font-medium text-white">{proc.name}</td>
                <td className="p-4 text-sm text-slate-300 text-center font-mono">{proc.startTime}</td>
                <td className="p-4 text-sm text-slate-300 text-center font-mono">{proc.endTime}</td>
                <td className="p-4 text-sm text-blue-300 font-bold text-center">{Math.round(proc.duration)}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => onDeleteProcedure(proc.id)}
                    className="text-slate-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-slate-700"
                    title="Remover"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rodapé da Tabela com Botões de Ação */}
      <div className="p-4 bg-slate-800 border-t border-slate-700 flex flex-col sm:flex-row justify-end gap-3">
        
        <button
          onClick={onClearProcedures}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/50 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Limpar Todos os Dados
        </button>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar para CSV
        </button>
      </div>
    </div>
  );
};

export default ProcedureTable;