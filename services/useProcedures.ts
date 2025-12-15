import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';

// CORREÇÃO AQUI: O ponto único (.) busca na mesma pasta
import { db } from './firebaseConfig'; 
import { User } from 'firebase/auth';

export interface Procedure {
  id: string;
  name: string;
  startTime: string; // HH:MM
  endTime: string;   // HH:MM
  duration: number;  // minutos
}

export function useProcedures(user: User | null, shiftId: string | null) {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(false);

  // Ler Procedimentos em Tempo Real
  useEffect(() => {
    if (!user || !shiftId) {
      setProcedures([]);
      return;
    }

    setLoading(true);
    // Caminho: users -> uid -> shifts -> shiftId -> procedures
    const proceduresRef = collection(db, 'users', user.uid, 'shifts', shiftId, 'procedures');
    const q = query(proceduresRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedParams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Procedure[];
      
      setProcedures(loadedParams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, shiftId]);

  // Adicionar Procedimento
  const addProcedure = async (name: string, start: string, end: string) => {
    if (!user || !shiftId) return;

    // Calcular duração em minutos
    const [h1, m1] = start.split(':').map(Number);
    const [h2, m2] = end.split(':').map(Number);
    const startMins = h1 * 60 + m1;
    const endMins = h2 * 60 + m2;
    let diff = endMins - startMins;
    if (diff < 0) diff += 24 * 60; // Ajuste para virada de dia

    await addDoc(collection(db, 'users', user.uid, 'shifts', shiftId, 'procedures'), {
      name,
      startTime: start,
      endTime: end,
      duration: diff,
      createdAt: Timestamp.now()
    });
  };

  // Deletar Procedimento
  const deleteProcedure = async (procId: string) => {
    if (!user || !shiftId) return;
    await deleteDoc(doc(db, 'users', user.uid, 'shifts', shiftId, 'procedures', procId));
  };

  return { procedures, loading, addProcedure, deleteProcedure };
}