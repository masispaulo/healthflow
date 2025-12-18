import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { useShiftExchange } from '../services/useShiftExchange';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  shiftId: string | null;
}

const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose, user, shiftId }) => {
  const [email, setEmail] = useState('');
  const [shiftData, setShiftData] = useState<any>(null);
  const { sendRequest, loading } = useShiftExchange(user);

  const formatShiftDate = (dateValue: any) => {
    if (!dateValue) return 'Data não definida';
    if (dateValue.toDate) {
      return dateValue.toDate().toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    }
    const d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return d.toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
      });
    }
    return 'Data inválida';
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const fetchShift = async () => {
      setShiftData(null);
      if (user && shiftId && isOpen) {
        try {
          const ref = doc(db, 'users', user.uid, 'shifts', shiftId);
          const snap = await getDoc(ref);
          if (snap.exists()) {
            setShiftData(snap.data());
          }
        } catch (error) {
          console.error("Erro ao buscar plantão:", error);
        }
      }
    };
    fetchShift();
  }, [user, shiftId, isOpen]);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!isValidEmail(email)) {
      alert("Digite um e-mail válido.");
      return;
    }
    if (!shiftData) {
      alert("Erro: Dados do plantão não carregados.");
      return;
    }

    const requestData = {
      ...shiftData,
      startTime: shiftData.startTime?.toDate ? shiftData.startTime.toDate().toISOString() : shiftData.startTime,
      endTime: shiftData.endTime?.toDate ? shiftData.endTime.toDate().toISOString() : shiftData.endTime,
    };

    try {
      await sendRequest(email, requestData);
      setEmail('');
      onClose();
    } catch (error: any) {
      console.error("Erro ao enviar solicitação:", error);
      alert("Erro ao enviar solicitação: " + (error.message || 'verifique os dados e tente novamente.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-md p-6 shadow-2xl animate-slide-up">
        <h2 className="text-xl font-bold text-white mb-4">Transferir Plantão</h2>

        {shiftData ? (
          <div className="bg-slate-900/50 p-4 rounded-lg mb-6 border border-slate-700 flex flex-col gap-1">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Resumo da Troca</span>
            <p className="text-indigo-400 font-bold text-lg">{shiftData.title}</p>
            <p className="text-white text-sm flex items-center gap-2">
              📅 {formatShiftDate(shiftData.startTime)}
            </p>
            <p className="text-slate-400 text-xs mt-1">
              Local ID: {shiftData.locationId || 'N/A'}
            </p>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 animate-pulse">
            Carregando dados do plantão...
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-300 block mb-2 font-medium">Para quem vai este plantão?</label>
            <input
              type="email"
              placeholder="Ex: medico@hospital.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
            <p className="text-xs text-slate-500 mt-2">
              ⚠️ O colega receberá um aviso para aceitar ou recusar.
            </p>
          </div>

          <div className="flex gap-3 mt-6 pt-4 border-t border-slate-700">
            <button
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-3 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSend}
              disabled={loading || !shiftData}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg shadow-lg disabled:opacity-50 transition-transform transform active:scale-95 disabled:scale-100"
            >
              {loading ? 'Enviando...' : 'Enviar Convite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferModal;