import React, { useState } from 'react';
import { useNetwork } from '../services/networkService';
import { useAuth } from '../services/useAuth';

interface NetworkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NetworkModal: React.FC<NetworkModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { colleagues, searchDoctorByEmail, addColleague, removeColleague } = useNetwork(user);
  
  const [searchEmail, setSearchEmail] = useState('');
  const [foundDoctor, setFoundDoctor] = useState<any | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  if (!isOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    setIsSearching(true);
    setFoundDoctor(null);
    
    const result = await searchDoctorByEmail(searchEmail);
    if (result) {
        if (result.uid === user.uid) alert("Você não pode adicionar a si mesmo!");
        else setFoundDoctor(result);
    } else {
        alert("Médico não encontrado com este e-mail.");
    }
    setIsSearching(false);
  };

  const handleAddFound = async () => {
      if (foundDoctor) {
          await addColleague(foundDoctor);
          setFoundDoctor(null);
          setSearchEmail('');
      }
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">🌐 Minha Rede (Networking)</h2>
                <p className="text-xs text-slate-400">Adicione colegas para trocar plantões.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 overflow-y-auto space-y-8">
            
            {/* BUSCA */}
            <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                <h3 className="text-sm font-bold text-indigo-300 mb-2 uppercase">Adicionar Novo Colega</h3>
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input 
                        type="email" 
                        value={searchEmail}
                        onChange={e => setSearchEmail(e.target.value)}
                        placeholder="Digite o e-mail do médico..."
                        className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-4 py-2 text-white outline-none focus:border-indigo-500"
                    />
                    <button disabled={isSearching} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-bold text-white transition-colors">
                        {isSearching ? '...' : 'Buscar'}
                    </button>
                </form>

                {/* Resultado da Busca */}
                {foundDoctor && (
                    <div className="mt-4 flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-indigo-500">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
                                {foundDoctor.photoURL ? <img src={foundDoctor.photoURL} className="w-full h-full rounded-full"/> : foundDoctor.displayName?.[0]}
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm">{foundDoctor.displayName}</p>
                                <p className="text-xs text-slate-400">{foundDoctor.specialty || 'Médico'}</p>
                            </div>
                        </div>
                        <button onClick={handleAddFound} className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded font-bold">
                            + Adicionar
                        </button>
                    </div>
                )}
            </div>

            {/* LISTA DE AMIGOS */}
            <div>
                <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase border-b border-slate-700 pb-2">Meus Conexões ({colleagues.length})</h3>
                <div className="space-y-3">
                    {colleagues.length === 0 ? (
                        <p className="text-center text-slate-600 py-4 italic">Sua rede está vazia.</p>
                    ) : (
                        colleagues.map(colleague => (
                            <div key={colleague.id} className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                        {colleague.photoURL ? <img src={colleague.photoURL} className="w-full h-full rounded-full"/> : colleague.displayName?.[0]}
                                    </div>
                                    <div>
                                        <p className="font-bold text-white text-sm">{colleague.displayName}</p>
                                        <p className="text-xs text-slate-500">{colleague.specialty} • {colleague.email}</p>
                                    </div>
                                </div>
                                <button onClick={() => removeColleague(colleague.id)} className="text-slate-500 hover:text-red-400 text-xs font-bold px-2">
                                    Remover
                                </button>
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

export default NetworkModal;