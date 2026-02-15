import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  orderBy,
  setDoc, // <--- Importante para criar o espelho com o mesmo ID
  getDoc
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { User } from 'firebase/auth';

export interface Shift {
  id: string;
  userId?: string;     // Novo: Pra gente saber de QUEM é esse plantão no espelho
  doctorName?: string; // Novo: O nome pra aparecer na agenda do gerente
  startTime: Date;
  endTime: Date;
  type: 'WORK' | 'STANDBY' | 'SLEEP';
  locationId?: string;
  locationName?: string; // Novo: Útil pro filtro "Santa Casa"
  notes?: string;
}

export const useShifts = (user: User | null, targetUserId?: string | null) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  // Define o ID alvo (Médico selecionado ou o próprio Usuário logado)
  const uidToUse = targetUserId || user?.uid;

  // LEITURA (READ) - Continua lendo da pasta específica (Isso tá certo)
  useEffect(() => {
    if (!uidToUse) {
      setShifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'users', uidToUse, 'shifts'),
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
        } as Shift;
      });
      setShifts(docs);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar plantões:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [uidToUse]);

  // === AQUI COMEÇA A MÁGICA DO ESPELHO ===

  // 1. ADICIONAR (Cria na gaveta do médico E no livro público)
  const addShift = async (shiftData: Partial<Shift>) => {
    if (!uidToUse || !user) return;
    try {
      // A. Adiciona na coleção PRIVADA (users/{id}/shifts)
      // O Firestore gera um ID automático aqui
      const docRef = await addDoc(collection(db, 'users', uidToUse, 'shifts'), {
        ...shiftData,
        userId: uidToUse // Garante que o ID do dono tá salvo
      });

      // B. O ESPELHO: Cria uma cópia na coleção PÚBLICA ('roster')
      // Usamos docRef.id para garantir que o ID seja IGUAL nos dois lugares
      const publicRef = doc(db, 'roster', docRef.id);
      
      await setDoc(publicRef, {
        ...shiftData,
        originalShiftId: docRef.id, // Referência técnica
        userId: uidToUse,           // "De quem é esse plantão?"
        doctorName: user.displayName || 'Médico', // O nome pra aparecer na tela do Gerente
        updatedAt: new Date()
      });

    } catch (error) {
      console.error("Erro ao adicionar plantão:", error);
      throw error;
    }
  };

  // 2. ATUALIZAR (Atualiza nos dois lugares)
  const updateShift = async (id: string, updates: Partial<Shift>) => {
    if (!uidToUse) return;
    try {
      // A. Atualiza Privado
      const privateRef = doc(db, 'users', uidToUse, 'shifts', id);
      await updateDoc(privateRef, updates);

      // B. Atualiza Público (Espelho)
      // Como usamos o mesmo ID, é fácil achar
      const publicRef = doc(db, 'roster', id);
      
      // Verificação de segurança: só tenta atualizar o espelho se ele existir
      // (Alguns plantões antigos podem não ter espelho ainda)
      try {
        await updateDoc(publicRef, updates);
      } catch (e) {
        console.log("Aviso: Espelho público não encontrado ou erro ao atualizar cópia.", e);
      }

    } catch (error) {
      console.error("Erro ao atualizar:", error);
      throw error;
    }
  };

  // 3. DELETAR (Apaga dos dois lugares)
  const deleteShift = async (id: string) => {
    if (!uidToUse) return;
    try {
      // A. Deleta Privado
      await deleteDoc(doc(db, 'users', uidToUse, 'shifts', id));

      // B. Deleta Público (Espelho)
      const publicRef = doc(db, 'roster', id);
      await deleteDoc(publicRef);

    } catch (error) {
      console.error("Erro ao deletar:", error);
      throw error;
    }
  };

  return { shifts, loading, addShift, updateShift, deleteShift };
};