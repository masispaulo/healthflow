import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Interface TypeScript para garantir que o Modal entenda os dados
export interface Drug {
  id: string;
  name: string;
  type: string;
  indications: string;
  diluicao: string;
  cuidados: string;
  math?: {
    concentration: number;
    doseKg: number;
    unit: 'ml' | 'gotas';
    maxDose?: number;
    obs?: string;
  };
}

// --- DADOS PARA POPULAR O BANCO (LISTA DE EMERGÊNCIA) ---
// Coloquei aqui dentro para não depender de arquivo externo e funcionar agora
const emergencyDrugsData: Omit<Drug, 'id'>[] = [
  {
    name: "Midazolam 5mg/5ml",
    type: "sedativo",
    math: { doseKg: 0.1, concentration: 1, unit: "ml" },
    indications: "Sedação consciente, crises convulsivas.",
    diluicao: "Pode ser feito puro ou diluído em SF0,9%.",
    cuidados: "Risco de depressão respiratória. Monitorar oximetria."
  },
  {
    name: "Dipirona Injetável 500mg/ml",
    type: "analgesico",
    math: { doseKg: 20, concentration: 500, unit: "ml", maxDose: 1000 },
    indications: "Dor aguda, febre alta.",
    diluicao: "Administração lenta (1ml/min).",
    cuidados: "Risco de hipotensão se feito rápido."
  },
  {
    name: "Fentanil 50mcg/ml",
    type: "opioide",
    math: { doseKg: 2, concentration: 50, unit: "ml" }, 
    indications: "Analgesia severa.",
    diluicao: "Diluir em SF0,9% para titulação.",
    cuidados: "Rigidez torácica em bolus rápido."
  },
  {
    name: "Cetamina 50mg/ml",
    type: "sedativo",
    math: { doseKg: 1.5, concentration: 50, unit: "ml" },
    indications: "Sedação dissociativa, asma grave.",
    diluicao: "Geralmente não diluído para IM.",
    cuidados: "Pode causar alucinações e aumento da PA."
  },
  {
    name: "Ceftriaxona 1g (Pó)",
    type: "antibiotico",
    math: { doseKg: 50, concentration: 100, unit: "ml" }, // Reconstituído p/ 10ml
    indications: "Meningite, sepse.",
    diluicao: "Reconstituir 1g em 10ml de água destilada.",
    cuidados: "Não misturar com soluções contendo Cálcio."
  }
];

export const useDrugs = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);

  // BUSCAR REMÉDIOS DO BANCO
  const fetchDrugs = async () => {
    setLoading(true);
    try {
      // Atenção: Usei 'medicaments' conforme seu código. 
      // Se no Firebase você criou como 'medicamentos', troque aqui.
      const q = query(collection(db, 'medicaments'), orderBy('name'));
      const snapshot = await getDocs(q);
      
      const loadedDrugs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Drug[];

      setDrugs(loadedDrugs);
    } catch (error) {
      console.error("Erro ao buscar remédios:", error);
    } finally {
      setLoading(false);
    }
  };

  // ⚠️ FUNÇÃO DE MIGRAÇÃO (BOTÃO DA NUVEM)
  const seedDatabase = async () => {
    const confirm = window.confirm("Isso vai enviar a lista padrão de emergência para o Firebase. Continuar?");
    if (!confirm) return;

    setLoading(true);
    try {
      let count = 0;
      // Usando sua lógica de loop (simples e funcional)
      for (const drug of emergencyDrugsData) {
        await addDoc(collection(db, 'medicaments'), drug);
        count++;
      }
      alert(`${count} remédios enviados com sucesso!`);
      fetchDrugs(); // Atualiza a lista na tela
    } catch (error) {
      console.error("Erro ao enviar:", error);
      alert("Erro ao enviar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  return { drugs, loading, seedDatabase };
};