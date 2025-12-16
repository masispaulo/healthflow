import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Patient {
  id: string;
  name: string;
  recordNumber: string; // Prontuário
  birthDate?: string;
  notes?: string;
}

// Hook para usar no React
export const usePatients = (user: any) => {
  const [patients, setPatients] = React.useState<Patient[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) {
      setPatients([]);
      return;
    }

    // Busca pacientes ordenados por nome
    const q = query(
      collection(db, 'users', user.uid, 'patients'),
      orderBy('name', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      setPatients(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addPatient = async (name: string, recordNumber: string) => {
    if (!user) return;
    await addDoc(collection(db, 'users', user.uid, 'patients'), {
      name,
      recordNumber,
      createdAt: new Date()
    });
  };

  const deletePatient = async (id: string) => {
    if (!user) return;
    if (window.confirm('Tem certeza que deseja excluir este paciente?')) {
        await deleteDoc(doc(db, 'users', user.uid, 'patients', id));
    }
  };

  return { patients, addPatient, deletePatient, loading };
};

import React from 'react'; // Necessário para o hook funcionar