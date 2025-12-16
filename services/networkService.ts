import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { UserProfile } from './userService';

export interface Colleague {
  id: string; // ID da conexão
  friendUid: string; // ID do médico amigo
  displayName: string;
  email: string;
  specialty?: string;
  photoURL?: string;
}

export const useNetwork = (user: any) => {
  const [colleagues, setColleagues] = React.useState<Colleague[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Carrega sua lista de amigos
  React.useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'users', user.uid, 'network'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Colleague[];
      setColleagues(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Busca um médico por E-mail (para adicionar)
  const searchDoctorByEmail = async (email: string): Promise<UserProfile | null> => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) return null;
        
        const docData = querySnapshot.docs[0].data();
        return { uid: querySnapshot.docs[0].id, ...docData } as UserProfile;
    } catch (error) {
        console.error("Erro na busca:", error);
        return null;
    }
  };

  const addColleague = async (doctor: UserProfile) => {
    if (!user) return;
    // Verifica se já não é amigo
    const exists = colleagues.find(c => c.friendUid === doctor.uid);
    if (exists) return alert("Médico já está na sua rede!");

    await addDoc(collection(db, 'users', user.uid, 'network'), {
      friendUid: doctor.uid,
      displayName: doctor.displayName || 'Médico Sem Nome',
      email: doctor.email,
      specialty: doctor.specialty || 'Geral',
      photoURL: doctor.photoURL || '',
      addedAt: new Date()
    });
  };

  const removeColleague = async (id: string) => {
    if (!user) return;
    if(window.confirm("Remover este médico da sua rede?")) {
        await deleteDoc(doc(db, 'users', user.uid, 'network', id));
    }
  };

  return { colleagues, searchDoctorByEmail, addColleague, removeColleague, loading };
};

import React from 'react';