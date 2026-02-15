import React, { useState, useEffect } from 'react';
import { useProcedures } from '../services/useProcedures';
import { useAuth } from '../services/useAuth'; 
import { TrashIcon, PlusIcon, ClockIcon } from './icons';
import PatientsModal from './PatientsModal';
import { User } from 'firebase/auth'; 

// Ícones
const SleepIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>;
const StandbyIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const WorkIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const SearchIcon = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

interface ProcedureInputProps {
  shiftId: string;
  targetUserId?: string; 
  onUpdate?: () => void;
  // Nova prop para preenchimento automático vindo da Fila
  initialPatientName?: string;
}

const ProcedureInput: React.FC<ProcedureInputProps> = ({ shiftId, targetUserId, onUpdate, initialPatientName }) => {
  const { user: authUser } = useAuth();
  
  const effectiveUser = targetUserId ? { uid: targetUserId } as User : authUser;

  const { procedures, addProcedure, deleteProcedure } = useProcedures(effectiveUser, shiftId);

  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [type, setType] = useState<'WORK' | 'STANDBY' | 'SLEEP'>('WORK');

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);

  // Efeito para preencher automaticamente se vier da Fila
  useEffect(() => {
    if (initialPatientName) {
      setName(initialPatientName);
      // Opcional: Já setar o horário de início como "Agora" para agilizar
      const now = new Date();
      setStart(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    }
  }, [initialPatientName]);

  const fillCurrentTime = (setter: React.Dispatch<React.SetStateAction<string>>) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setter(timeString);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalName = name;
    if (!finalName) {
      if (type === 'SLEEP') finalName = 'Descanso (Dormindo)';
      else if (type === 'STANDBY') finalName = 'Stand-by (Aguardo)';
      else return alert("Digite a descrição ou selecione um paciente.");
    }

    if (!start || !end) return alert("Preencha os horários");

    try {
      await addProcedure(finalName, start, end, type);

      // Limpa os campos após salvar
      setName('');
      setStart('');
      setEnd('');
      setType('WORK');

      onUpdate?.(); 
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Remover item?")) {
      await deleteProcedure(id);
      onUpdate?.();
    }
  };

  const handleSelectPatient = (patient: any) => {
    setName(`${patient.name} (Pront: ${patient.recordNumber})`);
    setType('WORK');
  };

  const getTypeBadge = (t: string) => {
    if (t === 'SLEEP') return <span className="bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded text-xs border border-indigo-500/30 flex items-center gap-1 w-fit"><SleepIcon/> Dormindo</span>;
    if (t === 'STANDBY') return <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs border border-yellow-500/30 flex items-center gap-1 w-fit"><StandbyIcon/> Stand-by</span>;
    return <span className="bg-slate-700 text-slate-300 px-2 py-1 rounded text-xs flex items-center gap-1 w-fit"><WorkIcon/> Trabalho</span>;
  };

  return (
    <div className="space-y-6">
      
      <div className="flex gap-2 mb-2">
        <button type="button" onClick={() => setType('WORK')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === 'WORK' ? 'bg-slate-700 text-white ring-2 ring-indigo-500' : 'bg-slate-800 text-slate-500 hover:bg-slate-750'}`}><WorkIcon /> Trabalho</button>
        <button type="button" onClick={() => setType('STANDBY')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === 'STANDBY' ? 'bg-yellow-900/30 text-yellow-400 ring-2 ring-yellow-500' : 'bg-slate-800 text-slate-500 hover:bg-slate-750'}`}><StandbyIcon /> Stand-by</button>
        <button type="button" onClick={() => setType('SLEEP')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${type === 'SLEEP' ? 'bg-indigo-900/30 text-indigo-400 ring-2 ring-indigo-500' : 'bg-slate-800 text-slate-500 hover:bg-slate-750'}`}><SleepIcon /> Dormindo</button>
      </div>

      <form onSubmit={handleSubmit} className={`grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-4 rounded-lg border transition-colors ${type === 'WORK' ? 'bg-slate-750 border-slate-700' : type === 'SLEEP' ? 'bg-indigo-900/10 border-indigo-500/30' : 'bg-yellow-900/10 border-yellow-500/30'}`}>
        <div className="md:col-span-1 space-y-1 relative">
          <label className="text-xs text-slate-400 uppercase font-bold flex justify-between">
            <span>Descrição / Paciente</span>
            {type === 'WORK' && (
              <span className="text-[10px] text-indigo-400 cursor-pointer hover:underline" onClick={() => setIsPatientModalOpen(true)}>Buscar na lista</span>
            )}
          </label>
          <div className="flex gap-2">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={type === 'WORK' ? "Nome do paciente..." : "Automático..."} className="w-full bg-slate-900 border border-slate-600 rounded-l p-2 text-white outline-none focus:border-indigo-500"/>
            {type === 'WORK' && (<button type="button" onClick={() => setIsPatientModalOpen(true)} className="bg-slate-700 hover:bg-slate-600 px-3 rounded-r border border-l-0 border-slate-600 text-white transition-colors"><SearchIcon /></button>)}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Início</label>
          <div className="flex gap-1">
            <input type="time" value={start} onChange={e => setStart(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-indigo-500"/>
            <button type="button" onClick={() => fillCurrentTime(setStart)} className="px-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold border border-slate-600" title="Preencher horário atual">Agora</button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 uppercase font-bold flex items-center gap-1"><ClockIcon className="w-3 h-3"/> Fim</label>
          <div className="flex gap-1">
            <input type="time" value={end} onChange={e => setEnd(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white outline-none focus:border-indigo-500"/>
            <button type="button" onClick={() => fillCurrentTime(setEnd)} className="px-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-bold border border-slate-600" title="Preencher horário atual">Agora</button>
          </div>
        </div>

        <button type="submit" className={`font-bold py-2 px-4 rounded h-[42px] flex items-center justify-center gap-2 transition-colors text-white ${type === 'WORK' ? 'bg-indigo-600 hover:bg-indigo-700' : type === 'SLEEP' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-yellow-600 hover:bg-yellow-700'}`}>
          <PlusIcon className="w-5 h-5" /> Lançar
        </button>
      </form>

      <div className="overflow-hidden rounded-lg border border-slate-700">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-xs text-slate-300 uppercase bg-slate-800">
            <tr>
              <th className="px-4 py-3">Evento</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Horário</th><th className="px-4 py-3 text-center">Duração</th><th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {procedures.map((proc) => (
              <tr key={proc.id} className="border-b border-slate-700 hover:bg-slate-800/50 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{proc.name}</td>
                <td className="px-4 py-3">{getTypeBadge(proc.type || 'WORK')}</td>
                <td className="px-4 py-3">{proc.startTime} - {proc.endTime}</td>
                <td className="px-4 py-3 text-center"><span className="bg-slate-700 text-white px-2 py-1 rounded text-xs">{proc.duration} min</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleDelete(proc.id)} className="text-red-400 hover:text-red-300 p-1 hover:bg-red-400/10 rounded"><TrashIcon className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PatientsModal 
  isOpen={isPatientModalOpen}
  onClose={() => setIsPatientModalOpen(false)}
  onSelect={handleSelectPatient}
  user={effectiveUser}          // ← AQUI
  doctorId={effectiveUser?.uid} // ← AQUI
/>
    </div>
  );
};

export default ProcedureInput;