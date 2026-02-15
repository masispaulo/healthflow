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

    // A: Solicitações que EU recebi (seja de médico ou do gerente)
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

  // 2. ENVIAR SOLICITAÇÃO (Uso entre médicos)
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

  // 3. ACEITAR SOLICITAÇÃO (Onde a mágica acontece) 🎩✨
  const acceptRequest = async (request: ShiftRequest) => {
    if (!user) return;
    setLoading(true);

    try {
      // TRATAMENTO DE DATAS
      const newStart = new Date(request.shiftData.startTime);
      const newEnd = new Date(request.shiftData.endTime);

      // A. Adiciona o plantão na MINHA agenda
      const shiftRef = await addDoc(collection(db, 'users', user.uid, 'shifts'), {
        startTime: newStart,
        endTime: newEnd,
        locationName: request.shiftData.locationName || 'Unidade Central',
        title: request.shiftData.title || 'Plantão Aceito',
        color: '#10B981', // Verde
        status: 'CONFIRMED',
        type: 'WORK',
        transferredFrom: request.fromUserEmail,
        originalOwnerId: request.fromUserId,
        createdAt: new Date()
      });

      // B. (NOVO) Se tiver pacientes no pacote, salva eles na sub-coleção procedures
      // Cada paciente usa scheduledAt para startTime/endTime (compatível com painel médico + 1 clique)
      if (request.shiftData.patients && Array.isArray(request.shiftData.patients) && request.shiftData.patients.length > 0) {
        const batchPromises = request.shiftData.patients.map((p: any) => {
          const patientStart = p.scheduledAt ? new Date(p.scheduledAt) : newStart;
          const patientEnd = new Date(patientStart.getTime() + 30 * 60000); // 30 min padrão

          return addDoc(collection(db, 'users', user.uid, 'shifts', shiftRef.id, 'procedures'), {
            patientName: p.patientName,
            name: p.procedureType || 'Consulta',
            age: p.age || '',
            bed: p.bed || '',
            diagnosis: p.diagnosis || '',
            priority: p.priority || 'MEDIA',
            status: 'AGUARDANDO',
            type: 'WORK',
            startTime: patientStart.toISOString(),
            endTime: patientEnd.toISOString(),
            source: 'hospital',
            createdAt: new Date()
          });
        });
        await Promise.all(batchPromises);
      }

      // C. Marca a solicitação como ACEITA
      await updateDoc(doc(db, 'shift_requests', request.id), {
        status: 'accepted',
        acceptedBy: user.email,
        acceptedAt: serverTimestamp()
      });
      
      alert("✅ Plantão aceito! Pacientes e horários adicionados à sua agenda.");
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