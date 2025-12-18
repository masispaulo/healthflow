import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { User } from 'firebase/auth';

export interface ShiftRequest {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  toUserEmail: string;
  shiftData: any;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: any;
}

export const useShiftExchange = (user: User | null) => {
  const [incomingRequests, setIncomingRequests] = useState<ShiftRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. BUSCAR SOLICITAÇÕES (Ouvir o banco em tempo real)
  useEffect(() => {
    if (!user || !user.email) return;

    // A: Solicitações que EU recebi
    // ATENÇÃO: Use 'shift_requests' (com underline) conforme suas regras
    const qIncoming = query(
      collection(db, 'shift_requests'),
      where('toUserEmail', '==', user.email),
      where('status', '==', 'pending')
    );

    const unsubIncoming = onSnapshot(qIncoming, (snap) => {
      setIncomingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as ShiftRequest)));
    });

    return () => { unsubIncoming(); };
  }, [user]);

  // 2. ENVIAR SOLICITAÇÃO
  const sendRequest = async (targetEmail: string, shift: any) => {
    if (!user || !user.email) throw new Error("Usuário não autenticado");
    setLoading(true);
    
    try {
      await addDoc(collection(db, 'shift_requests'), {
        fromUserId: user.uid,
        fromUserEmail: user.email,
        toUserEmail: targetEmail,
        shiftData: shift, 
        status: 'pending',
        createdAt: serverTimestamp()
      });
      alert(`Convite enviado para ${targetEmail}!`);
    } catch (error) {
      console.error("Erro ao enviar:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 3. ACEITAR SOLICITAÇÃO (A Mágica acontece aqui) 🎩✨
  const acceptRequest = async (request: ShiftRequest) => {
    if (!user) return;
    setLoading(true);

    try {
      // TRATAMENTO DE DATAS: Converte string ISO de volta para Objeto Date
      // Isso é vital para o Calendário reconhecer o plantão
      const newStart = new Date(request.shiftData.startTime);
      const newEnd = new Date(request.shiftData.endTime);

      // Adiciona o plantão na MINHA agenda
      await addDoc(collection(db, 'users', user.uid, 'shifts'), {
        ...request.shiftData,
        startTime: newStart, // Data corrigida
        endTime: newEnd,     // Data corrigida
        title: `${request.shiftData.title} (Transferido)`,
        color: '#10B981', // Verde (Indica sucesso/novo)
        transferredFrom: request.fromUserEmail,
        originalOwnerId: request.fromUserId
      });

      // Marca a solicitação como ACEITA no banco de trocas
      await updateDoc(doc(db, 'shift_requests', request.id), {
        status: 'accepted',
        acceptedBy: user.email,
        acceptedAt: serverTimestamp()
      });
      
      alert("Plantão aceito! Ele já deve aparecer no seu calendário.");
    } catch (error) {
      console.error("Erro ao aceitar:", error);
      alert("Erro ao aceitar a troca.");
    } finally {
      setLoading(false);
    }
  };

  // 4. RECUSAR
  const rejectRequest = async (requestId: string) => {
    if (!confirm("Recusar este plantão?")) return;
    try {
      await updateDoc(doc(db, 'shift_requests', requestId), {
        status: 'rejected'
      });
    } catch (error) {
      console.error(error);
    }
  };

  return { incomingRequests, sendRequest, acceptRequest, rejectRequest, loading };
};