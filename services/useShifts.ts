import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  doc, 
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { User } from 'firebase/auth';

export interface Shift {
  id: string;
  title: string;
  locationId: string;
  startTime: Date;
  endTime: Date;
  color?: string;           // ✅ A cor (Verde para transferidos)
  transferredFrom?: string; // ✅ Quem enviou (para mostrar no detalhe)
}

export const useShifts = (user: User | null) => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setShifts([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users', user.uid, 'shifts'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedShifts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          // Converte Timestamp do Firebase para Date do JS
          startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
          endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
        } as Shift;
      });
      setShifts(loadedShifts);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Adicionar Plantão (Padrão: Azul)
  const addShift = async (shift: Omit<Shift, 'id'>) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'shifts'), {
      ...shift,
      color: '#4F46E5' // Indigo-600 padrão
    });
  };

  const updateShift = async (id: string, shift: Partial<Shift>) => {
    if (!user) return;
    const ref = doc(db, 'users', user.uid, 'shifts', id);
    await updateDoc(ref, shift);
  };

  const deleteShift = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'shifts', id));
  };

  return { shifts, addShift, updateShift, deleteShift, loading };
};