import React, { useState } from 'react';
import { useNetwork } from '../services/networkService';
import { transferShift } from '../services/transferService';
import { useAuth } from '../services/useAuth';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftId: string | null;
  onSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, shiftId, onSuccess }) => {
  const { user } = useAuth();
  const { colleagues } = useNetwork(user);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !shiftId) return null;

  const handleTransfer = async (colleagueUid: string, colleagueName: string) => {
    if (!window.confirm(`Confirma a transferência deste plantão para ${colleagueName}? Ele sairá da sua agenda.`)) return;
    
    setLoading(true);
    try {
      await transferShift(user.uid, colleagueUid, shiftId);
      alert("Plantão transferido com sucesso!");
      onSuccess(); // Atualiza a tela
      onClose();
    } catch (error) {
      alert("Erro ao transferir plantão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        <div className="bg-indigo-900/30 p-6 border-b border-indigo-500/30 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📲 Transferir Plantão
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6">
            <p className="text-slate-400 text-sm mb-4">Selecione um colega da sua rede para receber este plantão completo (incluindo procedimentos lançados).</p>
            
            {loading ? (
                <div className="text-center py-8 text-indigo-400 animate-pulse font-bold">Transferindo dados...</div>
            ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {colleagues.length === 0 ? (
                        <p className="text-center text-slate-500 py-4 border border-dashed border-slate-700 rounded-lg">
                            Você não tem colegas na rede.<br/>Adicione alguém no menu "Networking".
                        </p>
                    ) : (
                        colleagues.map(colleague => (
                            <button 
                                key={colleague.id}
                                onClick={() => handleTransfer(colleague.friendUid, colleague.displayName)}
                                className="w-full flex items-center gap-3 bg-slate-800 p-3 rounded-lg border border-slate-700 hover:border-indigo-500 hover:bg-slate-750 transition-all text-left group"
                            >
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    {colleague.photoURL ? <img src={colleague.photoURL} className="w-full h-full rounded-full"/> : colleague.displayName?.[0]}
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{colleague.displayName}</p>
                                    <p className="text-xs text-slate-500 group-hover:text-indigo-300">{colleague.specialty}</p>
                                </div>
                                <div className="ml-auto text-slate-500 group-hover:text-indigo-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TransferModal;