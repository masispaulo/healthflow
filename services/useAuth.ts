import { useState, useEffect } from 'react';
import { auth, provider } from './firebaseConfig';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User
} from 'firebase/auth';

import { saveUserToDirectory } from './saveUserToDirectory';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      // ✅ Se logou, salva no diretório de médicos
      if (currentUser) {
        await saveUserToDirectory(currentUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, provider);

      // ✅ Salva no diretório imediatamente após login
      await saveUserToDirectory(result.user);

    } catch (error: any) {
      console.error("Erro no login:", error);
      alert("Erro no login: " + error.message);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Erro ao sair:", error);
    }
  };

  return { user, loginWithGoogle, logout, loading };
};