import { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

export interface Patient {
  id: string;
  doctorId: string;
  name: string;
  age: string;
  bed: string;
  diagnosis: string;
  prescriptionDone?: boolean;
  status?: 'ATIVO' | 'ALTA' | 'OBITO';
  createdAt?: any;
}

export const usePatients = (doctorId: string | null) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Caminho correto no plano gratuito
  const patientsRef = doctorId
    ? collection(db, 'users', doctorId, 'patients')
    : null;

  useEffect(() => {
    if (!patientsRef) return;

    const q = query(patientsRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as Patient[];

      setPatients(list);
      setLoading(false);
    });

    return () => unsub();
  }, [doctorId]);

  const addPatient = async (data: Partial<Patient>) => {
    if (!patientsRef) throw new Error("doctorId ausente");

    await addDoc(patientsRef, {
      doctorId,
      name: data.name || '',
      age: data.age || '',
      bed: data.bed || '',
      diagnosis: data.diagnosis || '',
      prescriptionDone: false,
      status: 'ATIVO',
      createdAt: new Date()
    });
  };

  const togglePrescription = async (id: string, current: boolean | undefined) => {
    if (!doctorId) return;
    await updateDoc(doc(db, 'users', doctorId, 'patients', id), {
      prescriptionDone: !current
    });
  };

  const dischargePatient = async (id: string) => {
    if (!doctorId) return;
    await updateDoc(doc(db, 'users', doctorId, 'patients', id), {
      status: 'ALTA'
    });
  };

  const recordDeath = async (id: string) => {
    if (!doctorId) return;
    await updateDoc(doc(db, 'users', doctorId, 'patients', id), {
      status: 'OBITO'
    });
  };

  const deletePatient = async (id: string) => {
    if (!doctorId) return;
    await deleteDoc(doc(db, 'users', doctorId, 'patients', id));
  };

  return {
    patients,
    loading,
    addPatient,
    togglePrescription,
    dischargePatient,
    recordDeath,
    deletePatient
  };
};