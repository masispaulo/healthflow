import React from 'react';
import { ScheduleEntry, DoctorStatus } from '../types';
import { BedIcon, CoffeeIcon, StethoscopeIcon } from './icons';

interface ShiftScheduleTableProps {
  schedule: ScheduleEntry[];
}

const statusConfig: { [key in DoctorStatus]: { icon: React.ReactNode; color: string; label: string } } = {
    'Em Atendimento': {
        icon: <StethoscopeIcon className="w-5 h-5" />,
        color: 'bg-green-100 text-green-800',
        label: 'Atendimento'
    },
    'Em Standby': {
        icon: <CoffeeIcon className="w-5 h-5" />,
        color: 'bg-yellow-100 text-yellow-800',
        label: 'Standby'
    },
    'Em Repouso': {
        icon: <BedIcon className="w-5 h-5" />,
        color: 'bg-blue-100 text-blue-800',
        label: 'Repouso'
    }
};

const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const ShiftScheduleTable: React.FC<ShiftScheduleTableProps> = ({ schedule }) => {
  if (schedule.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto border border-slate-200 rounded-lg">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Médico</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Início</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fim</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Duração (min)</th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {schedule.map((entry, index) => (
            <tr key={`${entry.doctorName}-${index}`} className="hover:bg-slate-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{entry.doctorName}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTime(entry.startTime)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{formatTime(entry.endTime)}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-indigo-600">{entry.duration}</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                <span className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[entry.status].color}`}>
                  {statusConfig[entry.status].icon}
                  {statusConfig[entry.status].label}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ShiftScheduleTable;
