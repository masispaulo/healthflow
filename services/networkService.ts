import { collection, query, where, getDocs, addDoc, deleteDoc, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';
import React from 'react';

export interface Colleague {
  id: string;
  friendUid: string;
  displayName: string;
  email: string;
  specialty?: string;
  photoURL?: string;
}

export const useNetwork = (user: any) => {
  const [colleagues, setColleagues] = React.useState<Colleague[]>([]);
  const [loading, setLoading] = React.useState(true);

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

  // ✅ BUSCA AGORA FUNCIONA — busca no directory/{email}
  const searchDoctorByEmail = async (email: string) => {
    try {
      const ref = doc(db, "directory", email);
      const snap = await getDoc(ref);

      if (!snap.exists()) return null;

      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error("Erro na busca:", error);
      return null;
    }
  };

  const addColleague = async (doctor: any) => {
    if (!user) return;

    const exists = colleagues.find(c => c.friendUid === doctor.uid);
    if (exists) return alert("Médico já está na sua rede!");

    await addDoc(collection(db, 'users', user.uid, 'network'), {
      friendUid: doctor.uid,
      displayName: doctor.displayName || "Médico",
      email: doctor.email,
      specialty: doctor.specialty || "Geral",
      photoURL: doctor.photoURL || "",
      addedAt: new Date()
    });
  };

  const removeColleague = async (id: string) => {
    if (!user) return;

    if (window.confirm("Remover este médico da sua rede?")) {
      await deleteDoc(doc(db, 'users', user.uid, 'network', id));
    }
  };

  return { colleagues, searchDoctorByEmail, addColleague, removeColleague, loading };
};