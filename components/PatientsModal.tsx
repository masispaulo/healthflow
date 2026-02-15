import React, { useState } from 'react';
import { usePatients } from '../services/usePatients';
import { User } from 'firebase/auth';
import { X, Search, Plus, CheckCircle, LogOut, Skull, Activity } from 'lucide-react';

interface PatientsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  doctorId?: string;
  onSelect?: (patient: any) => void; // ← ESSENCIAL
}

const PatientsModal: React.FC<PatientsModalProps> = ({
  isOpen,
  onClose,
  user,
  doctorId,
  onSelect
}) => {

  const ownerId = doctorId || user?.uid || null;

  const {
    patients,
    addPatient,
    togglePrescription,
    dischargePatient,
    recordDeath,
    loading
  } = usePatients(ownerId);

  const [view, setView] = useState<'list' | 'add'>('list');
  const [searchTerm, setSearchTerm] = useState('');

  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newBed, setNewBed] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState('');

  if (!isOpen) return null;

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.bed.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addPatient({
        name: newName,
        age: newAge,
        bed: newBed,
        diagnosis: newDiagnosis
      });

      setNewName('');
      setNewAge('');
      setNewBed('');
      setNewDiagnosis('');
      setView('list');
    } catch (error) {
      alert("Erro ao salvar paciente");
    }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">

        {/* HEADER */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="text-indigo-500" />
            {view === 'list' ? 'Meus Pacientes' : 'Novo Paciente'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">

          {view === 'list' ? (
            <>
              {/* SEARCH BAR */}
              <div className="flex gap-2 mb-6 sticky top-0 bg-slate-900 pt-2 pb-4 z-0">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 text-slate-500" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou leito..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-slate-600"
                  />
                </div>
                <button
                  onClick={() => setView('add')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-3 rounded-xl shadow-lg shadow-indigo-900/20 transition-all active:scale-95"
                >
                  <Plus size={24} />
                </button>
              </div>

              {/* LIST */}
              {loading ? (
                <p className="text-center text-slate-500 mt-10">Carregando pacientes...</p>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center text-slate-500 mt-10 flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <Activity size={32} className="opacity-20" />
                  </div>
                  <p>Nenhum paciente encontrado.</p>
                  {searchTerm && <p className="text-xs">Tente outro termo de busca.</p>}
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredPatients.map(patient => (
                    <div
                      key={patient.id}
                      className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between group hover:border-slate-600 transition-all"
                    >

                      {/* PATIENT INFO */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-slate-700 text-slate-300 text-xs font-bold px-2 py-0.5 rounded uppercase">
                            {patient.bed || 'S/ Leito'}
                          </span>
                          <h3 className="font-bold text-white truncate text-lg">{patient.name}</h3>
                        </div>

                        {/* DIAGNÓSTICO */}
                        <textarea
                          readOnly
                          value={patient.diagnosis || ''}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-indigo-300 text-sm mt-2 resize-none"
                          rows={3}
                        />

                        {patient.age && (
                          <p className="text-slate-400 text-sm mt-1">{patient.age}</p>
                        )}
                      </div>

                      {/* ACTIONS */}
                      <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">

                        {/* SELECIONAR PARA PROCEDIMENTO */}
                        <button
                          onClick={() => {
                            if (onSelect) onSelect(patient);
                            onClose();
                          }}
                          className="flex-1 sm:flex-none p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-bold"
                        >
                          Selecionar
                        </button>

                        {/* PRESCRIÇÃO */}
                        <button
                          onClick={() => togglePrescription(patient.id, patient.prescriptionDone)}
                          className={`flex-1 sm:flex-none py-2 px-3 rounded-lg border transition-all flex items-center justify-center gap-2 text-xs font-bold ${
                            patient.prescriptionDone
                              ? 'bg-green-500/10 border-green-500/50 text-green-400'
                              : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600 hover:text-white'
                          }`}
                        >
                          <CheckCircle size={16} />
                        </button>

                        {/* ALTA */}
                        <button
                          onClick={() => dischargePatient(patient.id)}
                          className="flex-1 sm:flex-none p-2 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                        >
                          <LogOut size={20} />
                        </button>

                        {/* ÓBITO */}
                        <button
                          onClick={() => recordDeath(patient.id)}
                          className="flex-1 sm:flex-none p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <Skull size={20} />
                        </button>

                      </div>

                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* FORM ADD */
            <form onSubmit={handleSave} className="space-y-4 animate-slide-up">

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
                <input
                  autoFocus
                  required
                  type="text"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                  placeholder="Ex: Maria da Silva"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Idade</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                    placeholder="Ex: 68 anos"
                    value={newAge}
                    onChange={e => setNewAge(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Leito / Box</label>
                  <input
                    type="text"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                    placeholder="Ex: 304-A"
                    value={newBed}
                    onChange={e => setNewBed(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Diagnóstico / Hipótese</label>

                <textarea
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white focus:border-indigo-500 outline-none resize-none"
                  placeholder="Ex: Pneumonia Comunitária"
                  rows={4}
                  value={newDiagnosis}
                  onChange={e => setNewDiagnosis(e.target.value)}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setView('list')}
                  className="flex-1 bg-slate-800 text-slate-300 py-3 rounded-xl font-bold hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-500 shadow-lg shadow-indigo-900/20 transition-colors"
                >
                  Salvar Paciente
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default PatientsModal;