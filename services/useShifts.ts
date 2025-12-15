import { useState, useEffect } from 'react';
import { 
  collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc, Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig'; 
import { User } from 'firebase/auth';

export interface Shift {
  id: string;
  title: string;
  locationId: string;
  startTime: Date;
  endTime: Date;
  userId: string;
}

export function useShifts(user: User | null) {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setShifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'users', user.uid, 'shifts'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedShifts: Shift[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        // Conversão segura: se falhar, usa data atual para não quebrar a tela
        let start = new Date();
        let end = new Date();
        try {
            if (data.startTime?.toDate) start = data.startTime.toDate();
            else if (data.startTime) start = new Date(data.startTime);
            
            if (data.endTime?.toDate) end = data.endTime.toDate();
            else if (data.endTime) end = new Date(data.endTime);
        } catch(e) { console.warn("Erro data", e); }

        return {
          id: doc.id,
          title: data.title || 'Sem Título',
          locationId: data.locationId || '',
          startTime: start,
          endTime: end,
          userId: data.userId,
        };
      });
      setShifts(loadedShifts);
      setLoading(false);
    }, (err) => {
      console.error(err);
      setError("Erro ao carregar plantões.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addShift = async (newShift: Omit<Shift, 'id' | 'userId'>) => {
    if (!user) throw new Error("Login necessário.");
    
    // VALIDAÇÃO RIGOROSA PARA EVITAR ERRO 'getTime'
    if (!newShift.startTime || isNaN(newShift.startTime.getTime())) {
        throw new Error("Data de início inválida.");
    }
    if (!newShift.endTime || isNaN(newShift.endTime.getTime())) {
        throw new Error("Data de fim inválida.");
    }

    await addDoc(collection(db, 'users', user.uid, 'shifts'), {
      ...newShift,
      userId: user.uid,
      startTime: Timestamp.fromDate(newShift.startTime),
      endTime: Timestamp.fromDate(newShift.endTime)
    });
  };

  const updateShift = async (id: string, updatedData: Partial<Omit<Shift, 'id' | 'userId'>>) => {
    if (!user) throw new Error("Login necessário.");
    
    const dataToUpdate: any = { ...updatedData };
    // Converte datas se existirem
    if (updatedData.startTime && !isNaN(updatedData.startTime.getTime())) {
        dataToUpdate.startTime = Timestamp.fromDate(updatedData.startTime);
    }
    if (updatedData.endTime && !isNaN(updatedData.endTime.getTime())) {
        dataToUpdate.endTime = Timestamp.fromDate(updatedData.endTime);
    }

    await updateDoc(doc(db, 'users', user.uid, 'shifts', id), dataToUpdate);
  };

  const deleteShift = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'shifts', id));
  };

  return { shifts, loading, error, addShift, updateShift, deleteShift };
}