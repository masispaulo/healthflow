
import React from 'react';
import { Procedure } from '../types';
import ExportButton from './ExportButton';
import { TrashIcon } from './icons';

interface ProcedureTableProps {
  procedures: Procedure[];
  onDeleteProcedure: (id: string) => void;
  onClearProcedures: () => void;
}

const ProcedureTable: React.FC<ProcedureTableProps> = ({ procedures, onDeleteProcedure, onClearProcedures }) => {
  if (procedures.length === 0) {
    return (
      <div className="text-center py-10 px-6 bg-slate-50 rounded-lg">
        <p className="text-slate-500">Nenhum procedimento registrado ainda.</p>
        <p className="text-sm text-slate-400 mt-2">Use o botão "Novo Registro" para começar a adicionar dados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nome do Procedimento</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Início</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fim</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duração (min)</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Delete</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {procedures.map((proc) => (
              <tr key={proc.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{proc.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{proc.startTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{proc.endTime}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{proc.duration}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onDeleteProcedure(proc.id)} className="text-red-500 hover:text-red-700">
                    <TrashIcon />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex justify-end gap-4">
        <button 
          onClick={onClearProcedures}
          className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-300"
        >
          Limpar Todos os Dados
        </button>
        <ExportButton data={procedures} />
      </div>
    </>
  );
};

export default ProcedureTable;
