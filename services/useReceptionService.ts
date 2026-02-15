import { useState } from 'react';
import { db } from './firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const useReceptionService = () => {
  const [loading, setLoading] = useState(false);

  // OPÇÃO 1: ORDEM DE CHEGADA (Fila)
  const addToQueue = async (patient: any, procedureType: string, doctorId?: string) => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'procedures'), {
        patientId: patient.id,
        patientName: patient.name,
        type: procedureType, 
        status: 'waiting', // Status: Aguardando na recepção
        arrivalTime: serverTimestamp(), 
        doctorId: doctorId || null, 
        priority: 'normal',
        createdAt: new Date()
      });
      alert(`✅ ${patient.name} adicionado à fila de espera!`);
    } catch (error) {
      console.error("Erro fila:", error);
      alert("Erro ao adicionar na fila.");
    } finally {
      setLoading(false);
    }
  };

  // OPÇÃO 2: AGENDAMENTO (Agenda Futura)
  const scheduleAppointment = async (patient: any, date: string, time: string, doctorId: string, procedureType: string) => {
    setLoading(true);
    try {
      const scheduledDateTime = new Date(`${date}T${time}`);
      await addDoc(collection(db, 'procedures'), {
        patientId: patient.id,
        patientName: patient.name,
        type: procedureType,
        status: 'scheduled', // Status: Agendado
        scheduledTime: scheduledDateTime,
        doctorId: doctorId || null,
        comments: `Agendado para ${date} às ${time}`,
        createdAt: new Date()
      });
      alert(`📅 Agendamento confirmado para ${patient.name}!`);
    } catch (error) {
      console.error("Erro agendamento:", error);
      alert("Erro ao agendar.");
    } finally {
      setLoading(false);
    }
  };

  return { addToQueue, scheduleAppointment, loading };
};
