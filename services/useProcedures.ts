import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Procedure {
  id: string;
  name: string;
  startTime: string;   // sempre HH:mm
  endTime: string;     // sempre HH:mm
  duration: number;
  type: 'WORK' | 'STANDBY' | 'SLEEP';
}

export const useProcedures = (user: any, shiftId: string | null) => {
  const [procedures, setProcedures] = useState<Procedure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !shiftId) {
      setProcedures([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'users', user.uid, 'shifts', shiftId, 'procedures'),
      orderBy('createdAt', 'asc')   // ✅ ORDENAR PELO TIMESTAMP REAL
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const procs = snapshot.docs.map(doc => {
        const data = doc.data() as any;

        return {
          id: doc.id,
          name: data.name,
          startTime: data.startTime,   // já salvo como string
          endTime: data.endTime,
          duration: data.duration,
          type: data.type || 'WORK'
        } as Procedure;
      });

      setProcedures(procs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, shiftId]);

  // ✅ SALVA TUDO FORMATADO E CONSISTENTE
  const addProcedure = async (
    name: string, 
    startTime: string, 
    endTime: string, 
    type: 'WORK' | 'STANDBY' | 'SLEEP' = 'WORK'
  ) => {
    if (!user || !shiftId) return;

    try {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);

      if (end < start) {
        end.setDate(end.getDate() + 1);
      }

      const duration = Math.max(
        1,
        Math.round((end.getTime() - start.getTime()) / 60000)
      );

      const newProc = {
        name,
        startTime,
        endTime,
        duration,
        type,
        createdAt: new Date()  // ✅ ordenação correta
      };

      await addDoc(
        collection(db, 'users', user.uid, 'shifts', shiftId, 'procedures'),
        newProc
      );
    } catch (error) {
      console.error("Erro ao adicionar procedimento:", error);
      throw error;
    }
  };

  const deleteProcedure = async (id: string) => {
    if (!user || !shiftId) return;
    await deleteDoc(
      doc(db, 'users', user.uid, 'shifts', shiftId, 'procedures', id)
    );
  };

  return { procedures, addProcedure, deleteProcedure, loading };
};