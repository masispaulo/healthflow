import React, { useState } from 'react';

// Define como é um médico no sistema
export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  crm: string;
}

interface DoctorManagerProps {
  doctors: Doctor[];
  onAddDoctor: (doc: Doctor) => void;
  onRemoveDoctor: (id: string) => void;
}

export const DoctorManager: React.FC<DoctorManagerProps> = ({ doctors, onAddDoctor, onRemoveDoctor }) => {
  const [name, setName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [crm, setCrm] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !crm) return;

    const newDoc: Doctor = {
      id: Date.now().toString(),
      name,
      specialty,
      crm
    };

    onAddDoctor(newDoc);
    setName('');
    setSpecialty('');
    setCrm('');
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-lg">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        👨‍⚕️ Cadastro de Médicos
      </h3>

      {/* Formulário */}
      <form onSubmit={handleSubmit} className="space-y-4 mb-6">
        <div>
          <label className="block text-sm text-slate-400 mb-1">Nome do Médico</label>
          <input 
            type="text" 
            value={name} 
            onChange={e => setName(e.target.value)} 
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white focus:border-blue-500 outline-none"
            placeholder="Ex: Dr. João Silva"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm text-slate-400 mb-1">Especialidade</label>
            <input 
                type="text" 
                value={specialty} 
                onChange={e => setSpecialty(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                placeholder="Ex: Cardiologia"
            />
            </div>
            <div>
            <label className="block text-sm text-slate-400 mb-1">CRM</label>
            <input 
                type="text" 
                value={crm} 
                onChange={e => setCrm(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                placeholder="0000/UF"
            />
            </div>
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded transition-colors">
          Cadastrar Médico
        </button>
      </form>

      {/* Lista de Médicos Cadastrados */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {doctors.length === 0 && <p className="text-slate-500 text-center text-sm">Nenhum médico cadastrado.</p>}
        
        {doctors.map(doc => (
          <div key={doc.id} className="flex justify-between items-center bg-slate-700/50 p-3 rounded border border-slate-600">
            <div>
              <p className="font-bold text-white">{doc.name}</p>
              <p className="text-xs text-slate-400">{doc.specialty} • CRM: {doc.crm}</p>
            </div>
            <button 
              onClick={() => onRemoveDoctor(doc.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 p-2 rounded transition-colors"
              title="Remover"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};