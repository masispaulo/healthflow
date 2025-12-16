import { collection, getDocs, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export const transferShift = async (
  myUid: string, 
  colleagueUid: string, 
  shiftId: string
) => {
  try {
    // 1. Pega os dados do SEU plantão
    const myShiftRef = doc(db, 'users', myUid, 'shifts', shiftId);
    const shiftSnap = await getDoc(myShiftRef);
    
    if (!shiftSnap.exists()) throw new Error("Plantão não encontrado!");
    const shiftData = shiftSnap.data();

    // 2. Cria o plantão na agenda do COLEGA
    // Adiciona um campo "transferredFrom" para saber quem mandou
    const newShiftRef = await addDoc(collection(db, 'users', colleagueUid, 'shifts'), {
      ...shiftData,
      transferredFrom: myUid,
      receivedAt: new Date()
    });

    // 3. Move os PROCEDIMENTOS (Cirurgias, Descansos, etc)
    const myProceduresRef = collection(db, 'users', myUid, 'shifts', shiftId, 'procedures');
    const proceduresSnap = await getDocs(myProceduresRef);

    const copyPromises = proceduresSnap.docs.map(async (procDoc) => {
        const procData = procDoc.data();
        await addDoc(collection(db, 'users', colleagueUid, 'shifts', newShiftRef.id, 'procedures'), procData);
        // Deleta o procedimento antigo
        await deleteDoc(doc(db, 'users', myUid, 'shifts', shiftId, 'procedures', procDoc.id));
    });

    await Promise.all(copyPromises);

    // 4. Apaga o plantão da SUA agenda
    await deleteDoc(myShiftRef);

    return true;
  } catch (error) {
    console.error("Erro na transferência:", error);
    throw error;
  }
};