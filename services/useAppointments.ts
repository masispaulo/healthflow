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
  where,
  orderBy
} from 'firebase/firestore';

export interface Appointment {
  id: string;
  doctorId: string;
  shiftId: string;
  patientId: string;
  patientName: string;
  priority: 'BAIXA' | 'MEDIA' | 'ALTA';
  scheduledTime: string; // ISO string
  status: 'AGENDADO' | 'EM_ATENDIMENTO' | 'CONCLUIDO' | 'FALTOU';
  createdAt?: any;
}

export const useAppointments = (doctorId: string | null, shiftId: string | null) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // ============================
  // 🔥 1. ESCUTAR A FILA DO PLANTÃO
  // ============================
  useEffect(() => {
    if (!doctorId || !shiftId) return;

    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      where('shiftId', '==', shiftId),
      orderBy('scheduledTime', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        id: d.id,
        ...d.data()
      })) as Appointment[];

      setAppointments(list);
      setLoading(false);
    });

    return () => unsub();
  }, [doctorId, shiftId]);

  // ============================
  // 🔥 2. CRIAR AGENDAMENTO (hospital)
  // ============================
  const addAppointment = async (data: Partial<Appointment>) => {
    if (!doctorId || !shiftId) throw new Error("doctorId ou shiftId ausente");

    await addDoc(collection(db, 'appointments'), {
      doctorId,
      shiftId,
      patientId: data.patientId || '',
      patientName: data.patientName || '',
      priority: data.priority || 'MEDIA',
      scheduledTime: data.scheduledTime || new Date().toISOString(),
      status: 'AGENDADO',
      createdAt: new Date()
    });
  };

  // ============================
  // 🔥 3. MARCAR COMO EM ATENDIMENTO
  // ============================
  const startAppointment = async (id: string) => {
    await updateDoc(doc(db, 'appointments', id), {
      status: 'EM_ATENDIMENTO'
    });
  };

  // ============================
  // 🔥 4. MARCAR COMO CONCLUÍDO
  // ============================
  const finishAppointment = async (id: string) => {
    await updateDoc(doc(db, 'appointments', id), {
      status: 'CONCLUIDO'
    });
  };

  // ============================
  // 🔥 5. MARCAR COMO FALTOU
  // ============================
  const markAsMissed = async (id: string) => {
    await updateDoc(doc(db, 'appointments', id), {
      status: 'FALTOU'
    });
  };

  // ============================
  // 🔥 6. REMOVER AGENDAMENTO
  // ============================
  const deleteAppointment = async (id: string) => {
    await deleteDoc(doc(db, 'appointments', id));
  };

  // ============================
  // 🔥 7. CALCULAR TEMPO DE ATRASO
  // ============================
  const getDelay = (scheduledTime: string) => {
    const now = new Date();
    const sched = new Date(scheduledTime);

    if (now <= sched) return 0;

    const diffMs = now.getTime() - sched.getTime();
    return Math.floor(diffMs / 60000); // minutos
  };

  return {
    appointments,
    loading,
    addAppointment,
    startAppointment,
    finishAppointment,
    markAsMissed,
    deleteAppointment,
    getDelay
  };
};