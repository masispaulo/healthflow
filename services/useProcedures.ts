import { useState, useEffect } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Procedure {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  duration: number;
  type?: 'WORK' | 'STANDBY' | 'SLEEP'; // O tipo agora faz parte da interface
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
      orderBy('startTime', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const procs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Procedure[];
      setProcedures(procs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, shiftId]);

  // AQUI ESTÁ A MUDANÇA: Aceita o 'type' (padrão é WORK)
  const addProcedure = async (name: string, startTime: string, endTime: string, type: string = 'WORK') => {
    if (!user || !shiftId) return;

    try {
        const start = new Date(`2000-01-01T${startTime}`);
        const end = new Date(`2000-01-01T${endTime}`);
        
        // Ajuste para virada de noite (ex: 23:00 as 02:00)
        if (end < start) {
            end.setDate(end.getDate() + 1);
        }

        const duration = Math.round((end.getTime() - start.getTime()) / 60000);

        const newProc = {
            name,
            startTime,
            endTime,
            duration,
            type, // SALVA NO BANCO SE É SLEEP, STANDBY OU WORK
            createdAt: new Date()
        };

        await addDoc(collection(db, 'users', user.uid, 'shifts', shiftId, 'procedures'), newProc);
    } catch (error) {
        console.error("Erro ao adicionar procedimento:", error);
        throw error;
    }
  };

  const deleteProcedure = async (id: string) => {
    if (!user || !shiftId) return;
    await deleteDoc(doc(db, 'users', user.uid, 'shifts', shiftId, 'procedures', id));
  };

  return { procedures, addProcedure, deleteProcedure, loading };
};