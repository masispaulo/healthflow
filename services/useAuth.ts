import { useState, useEffect } from 'react';
import { auth, provider } from './firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithPopup, // <--- Voltamos para o Popup (o Rei da Aba Anônima)
  signOut, 
  User 
} from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      // Agora que as chaves estão certas (Hardcoded), 
      // o Popup VAI abrir e ficar aberto até você logar.
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Erro no login:", error);
      // Se der erro, avisa na tela
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