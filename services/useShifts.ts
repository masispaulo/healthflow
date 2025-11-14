// src/services/useShifts.ts

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp, // Importar Timestamp
  CollectionReference,
} from 'firebase/firestore';
import { useAuth } from './useAuth'; // O mesmo hook de autenticação
import { db } from './firebaseConfig';

// 1. Definir o tipo para um Shift (Plantão)
export interface Shift {
  id: string;
  title: string;
  locationId: string; // ID do local (da coleção 'locations')
  start: Timestamp; // Usar Timestamp do Firebase
  end: Timestamp;
  userId: string;
  // 'notes' pode ser adicionado depois
}

// 2. Definir o hook
export const useShifts = () => {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setShifts([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // 3. Consulta: /users/{userID}/shifts
    const shiftsColRef = collection(
      db,
      'users',
      user.uid,
      'shifts'
    ) as CollectionReference<Omit<Shift, 'id'>>;

    const q = query(shiftsColRef);

    // 4. Listener real-time
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const userShifts: Shift[] = [];
        querySnapshot.forEach((doc) => {
          userShifts.push({ id: doc.id, ...doc.data() });
        });
        setShifts(userShifts);
        setLoading(false);
      },
      (error) => {
        console.error('Erro ao buscar shifts: ', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- Funções de CRUD ---

  // Note que start e end devem ser objetos Date do JavaScript
  // Vamos convertê-los para Timestamp do Firebase
  const addShift = async (
    title: string,
    locationId: string,
    start: Date,
    end: Date
  ) => {
    if (!user) return;

    const shiftsColRef = collection(db, 'users', user.uid, 'shifts');
    await addDoc(shiftsColRef, {
      title,
      locationId,
      start: Timestamp.fromDate(start),
      end: Timestamp.fromDate(end),
      userId: user.uid,
    });
  };

  const updateShift = async (
    id: string,
    newTitle: string,
    newLocationId: string,
    newStart: Date,
    newEnd: Date
  ) => {
    if (!user) return;

    const shiftDocRef = doc(db, 'users', user.uid, 'shifts', id);
    await updateDoc(shiftDocRef, {
      title: newTitle,
      locationId: newLocationId,
      start: Timestamp.fromDate(newStart),
      end: Timestamp.fromDate(newEnd),
    });
  };

  const deleteShift = async (id: string) => {
    if (!user) return;

    const shiftDocRef = doc(db, 'users', user.uid, 'shifts', id);
    await deleteDoc(shiftDocRef);
  };

  return { shifts, loading, addShift, updateShift, deleteShift };
};