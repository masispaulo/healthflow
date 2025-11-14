// src/services/useProcedures.ts

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  deleteDoc,
  doc,
  Timestamp,
  CollectionReference,
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { db } from './firebaseConfig';

// 1. Seu tipo 'Procedure'. Ajuste os campos conforme o seu 'types.ts'
// Eu vi 'name', 'startTime', 'endTime' no seu vídeo.
export interface Procedure {
  id: string;
  name: string;
  startTime: string; // Ou Timestamp, dependendo de como você salvou
  endTime: string;
  duration: number; // Vi isso no seu App.tsx
  // ... outros campos que você já usa ...
  userId: string;
}

// 2. O hook agora recebe o 'shiftId' como argumento
export const useProcedures = (shiftId: string | null) => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // Não busca nada se o usuário não estiver logado ou se nenhum plantão (shift) for selecionado
    if (!user || !shiftId) {
      setProcedures([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 3. A MÁGICA: A consulta agora é na sub-coleção
    // /users/{userID}/shifts/{shiftId}/procedures
    const proceduresColRef = collection(
      db,
      'users',
      user.uid,
      'shifts',
      shiftId,
      'procedures'
    ) as CollectionReference<Omit<Procedure, 'id'>>;

    const q = query(proceduresColRef);

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const shiftProcedures: Procedure[] = [];
        querySnapshot.forEach((doc) => {
          shiftProcedures.push({ id: doc.id, ...doc.data() });
        });
        setProcedures(shiftProcedures);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar procedimentos: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, shiftId]); // <-- Re-executa se o usuário ou o shiftId mudar

  // --- Funções de CRUD ---

  // O addProcedure agora só precisa dos dados do procedimento
  const addProcedure = async (procedureData: Omit<Procedure, 'id' | 'userId'>) => {
    if (!user || !shiftId) return;

    const proceduresColRef = collection(
      db, 'users', user.uid, 'shifts', shiftId, 'procedures'
    );
    
    await addDoc(proceduresColRef, {
      ...procedureData,
      userId: user.uid,
      shiftId: shiftId, // Opcional, mas bom para referência
    });
  };

  const deleteProcedure = async (id: string) => {
    if (!user || !shiftId) return;

    const procedureDocRef = doc(
      db, 'users', user.uid, 'shifts', shiftId, 'procedures', id
    );
    await deleteDoc(procedureDocRef);
  };

  return { procedures, loading, addProcedure, deleteProcedure };
};