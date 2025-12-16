import { useState, useEffect } from 'react';
import { auth, provider } from './firebaseConfig';
import { 
  onAuthStateChanged, 
  signInWithRedirect, // <--- Mudamos de Popup para Redirect
  signOut, 
  User 
} from 'firebase/auth';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuta a mudança de estado (Logado/Deslogado)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Função de Login (Agora redireciona a página inteira)
  const loginWithGoogle = async () => {
    try {
      // Isso vai carregar a página do Google na mesma aba
      // Funciona 100% em Mobile e Aba Anônima
      await signInWithRedirect(auth, provider);
    } catch (error) {
      console.error("Erro no login:", error);
      alert("Erro ao tentar conectar com Google.");
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