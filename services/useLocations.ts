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
  CollectionReference,
} from 'firebase/firestore';
import { useAuth } from './useAuth';
import { db } from '../services/firebaseConfig';

export interface Location {
  id: string;
  name: string;
  color: string;
  userId: string;
}

export const useLocations = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setLocations([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const locationsColRef = collection(
      db,
      'users',
      user.uid,
      'locations'
    ) as CollectionReference<Omit<Location, 'id'>>;

    const q = query(locationsColRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: Location[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLocations(loaded);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar locais:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addLocation = async (name: string, color: string) => {
    if (!user) return;

    await addDoc(collection(db, 'users', user.uid, 'locations'), {
      name,
      color,
      userId: user.uid,
    });
  };

  const updateLocation = async (id: string, newName: string, newColor: string) => {
    if (!user) return;

    await updateDoc(doc(db, 'users', user.uid, 'locations', id), {
      name: newName,
      color: newColor,
    });
  };

  const deleteLocation = async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, 'users', user.uid, 'locations', id));
  };

  return { locations, loading, addLocation, updateLocation, deleteLocation };
};