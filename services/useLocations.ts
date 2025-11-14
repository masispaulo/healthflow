    // src/hooks/useLocations.ts

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  CollectionReference,
} from 'firebase/firestore';
import { useAuth } from './useAuth'; // <-- Você precisará de um hook de autenticação
import { db } from '../services/firebaseConfig'; // <-- Sua configuração do Firebase

// 1. Definir o tipo (Type) para um Local
export interface Location {
  id: string;
  name: string;
  color: string;
  userId: string;
}

// 2. Definir o hook
export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth(); // <-- Pega o usuário logado

  useEffect(() => {
    if (!user) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 3. Criar a consulta: /users/{userID}/locations
    // Isso garante que o médico só veja os locais DELE
    const locationsColRef = collection(
      db,
      'users',
      user.uid,
      'locations'
    ) as CollectionReference<Omit<Location, 'id'>>;

    const q = query(locationsColRef);

    // 4. Ligar o listener real-time (onSnapshot)
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const userLocations: Location[] = [];
        querySnapshot.forEach((doc) => {
          userLocations.push({ id: doc.id, ...doc.data() });
        });
        setLocations(userLocations);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar locais: ', error);
        setLoading(false);
      }
    );

    // 5. Limpar o listener ao desmontar
    return () => unsubscribe();
  }, [user]); // <-- Re-executa se o usuário mudar

  // --- Funções de CRUD ---

  const addLocation = async (name: string, color: string) => {
    if (!user) return;

    const locationsColRef = collection(db, 'users', user.uid, 'locations');
    await addDoc(locationsColRef, {
      name,
      color,
      userId: user.uid,
    });
  };

  const updateLocation = async (id: string, newName: string, newColor: string) => {
    if (!user) return;

    const locationDocRef = doc(db, 'users', user.uid, 'locations', id);
    await updateDoc(locationDocRef, {
      name: newName,
      color: newColor,
    });
  };

  const deleteLocation = async (id: string) => {
    if (!user) return;

    const locationDocRef = doc(db, 'users', user.uid, 'locations', id);
    await deleteDoc(locationDocRef);
  };

  return { locations, loading, addLocation, updateLocation, deleteLocation };
};

// --- NOTA ---
// Você precisará criar um hook useAuth() simples que exponha o usuário logado
// Ex: const auth = getAuth(); const [user, setUser] = useState(auth.currentUser);
// ... e um listener onAuthStateChanged para atualizar esse estado.