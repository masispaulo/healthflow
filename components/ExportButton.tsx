
import React from 'react';
import { Procedure } from '../types';
import { DownloadIcon } from './icons';
import { exportToCsv } from '../services/geminiService'; // Using centralized export function

interface ExportButtonProps {
  data: Procedure[];
}

const ExportButton: React.FC<ExportButtonProps> = ({ data }) => {
  const handleExport = () => {
    if (data.length === 0) {
      alert("Não há dados para exportar.");
      return;
    }

    const headers = ["ID", "Nome do Procedimento", "Início", "Fim", "Duração (min)"];
    const rows = data.map(proc => [
      proc.id,
      proc.name,
      proc.startTime,
      proc.endTime,
      proc.duration
    ]);

    exportToCsv("healthflow_procedimentos.csv", headers, rows);
  };

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 disabled:bg-slate-300"
      disabled={data.length === 0}
    >
      <DownloadIcon />
      Exportar para CSV
    </button>
  );
};

export default ExportButton;