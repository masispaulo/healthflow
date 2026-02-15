import { useState, useEffect } from 'react';
import { collection, addDoc, query, orderBy, getDocs, where, Timestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { User } from 'firebase/auth';

export interface Vacancy {
  id: string;
  hospitalName: string;
  hospitalId?: string;
  type: string;
  specialty?: string;
  value: number;
  date: string;
  durationHours?: number;
  city?: string;
  uf?: string;
  requirements?: string;
  isHighlighted?: boolean;
  createdAt?: any;
  createdBy?: string;
}

export const useOpportunities = (user: User | null) => {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVacancies = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'vacancies'),
          orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const list = snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          date: d.data().date || d.data().dates?.[0] || '',
          value: Number(d.data().value) || 0,
          hospitalName: d.data().hospitalName || d.data().hospital || 'Instituição',
        })) as Vacancy[];
        setVacancies(list);
      } catch (error) {
        console.error('Erro ao carregar vagas:', error);
        setVacancies([]);
      } finally {
        setLoading(false);
      }
    };
    fetchVacancies();
  }, []);

  const applyToVacancy = async (vacancyId: string) => {
    if (!user?.uid || !user?.email) return;
    try {
      await addDoc(collection(db, 'applications'), {
        vacancyId,
        doctorId: user.uid,
        doctorEmail: user.email,
        status: 'pending',
        createdAt: Timestamp.now(),
      });
      return true;
    } catch (error) {
      console.error('Erro ao candidatar:', error);
      return false;
    }
  };

  const createVacancy = async (data: Omit<Vacancy, 'id' | 'createdAt'>) => {
    try {
      const docRef = await addDoc(collection(db, 'vacancies'), {
        hospitalName: data.hospitalName,
        hospitalId: data.hospitalId || '',
        type: data.type,
        specialty: data.specialty || '',
        value: data.value,
        date: data.date,
        durationHours: data.durationHours || 12,
        city: data.city || '',
        uf: data.uf || '',
        requirements: data.requirements || '',
        isHighlighted: data.isHighlighted || false,
        createdBy: user?.uid || '',
        createdAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao publicar vaga:', error);
      throw error;
    }
  };

  return { vacancies, loading, applyToVacancy, createVacancy };
};
