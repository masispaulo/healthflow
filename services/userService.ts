import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  crm?: string;
  specialty?: string;
  phone?: string;
  photoURL?: string;
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  } else {
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  const docRef = doc(db, 'users', uid);
  // Usa setDoc com merge para criar se não existir ou atualizar se existir
  await setDoc(docRef, { ...data, uid }, { merge: true });
};