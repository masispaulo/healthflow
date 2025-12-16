import React, { useState } from 'react';
import { usePatients } from '../services/patientService';
import { useAuth } from '../services/useAuth';

interface PatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (patient: any) => void; // Opcional: se quisermos selecionar para um procedimento
}

const PatientsModal: React.FC<PatientsModalProps> = ({ isOpen, onClose, onSelect }) => {
  const { user } = useAuth();
  const { patients, addPatient, deletePatient } = usePatients(user);
  
  const [newName, setNewName] = useState('');
  const [newRecord, setNewRecord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newRecord) return alert("Preencha nome e prontuário");
    
    await addPatient(newName, newRecord);
    setNewName('');
    setNewRecord('');
  };

  // Filtra a lista pelo termo de busca
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.recordNumber.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    📂 Base de Pacientes
                </h2>
                <p className="text-xs text-slate-400">Gerencie seus prontuários e históricos.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">✕</button>
        </div>

        {/* Corpo (Scrollável) */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
            
            {/* Formulário de Adição */}
            <form onSubmit={handleAdd} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase">Nome Completo</label>
                    <input 
                        type="text" 
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                        placeholder="Ex: Maria Silva"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase">Nº Prontuário</label>
                    <input 
                        type="text" 
                        value={newRecord}
                        onChange={e => setNewRecord(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white outline-none focus:border-indigo-500"
                        placeholder="Ex: 123456"
                    />
                </div>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors h-[42px] flex items-center justify-center gap-2">
                    <span>+ Cadastrar</span>
                </button>
            </form>

            {/* Lista e Busca */}
            <div className="space-y-4">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="🔍 Buscar por nome ou prontuário..." 
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 px-4 text-white focus:border-indigo-500 outline-none"
                    />
                </div>

                <div className="space-y-2">
                    {filteredPatients.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Nenhum paciente encontrado.
                        </div>
                    ) : (
                        filteredPatients.map(patient => (
                            <div key={patient.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex justify-between items-center group hover:border-indigo-500/50 transition-colors">
                                <div>
                                    <p className="font-bold text-white text-lg">{patient.name}</p>
                                    <p className="text-xs text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded w-fit">
                                        PRONT: {patient.recordNumber}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {onSelect ? (
                                        <button 
                                            onClick={() => { onSelect(patient); onClose(); }}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded"
                                        >
                                            Selecionar
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={() => deletePatient(patient.id)}
                                            className="text-slate-500 hover:text-red-400 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Excluir
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PatientsModal;