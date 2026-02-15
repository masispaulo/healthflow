import React from 'react';
import { useAuth } from './services/useAuth'; 
import { Navigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { user, loginWithGoogle, loading } = useAuth();

  // Se já tem usuário, a Caipora manda pro app principal
  if (user) {
    return <Navigate to="/app" replace />;
  }

  if (loading) return <div className="h-screen bg-slate-950 flex items-center justify-center text-white">Carregando...</div>;

  return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
       <h1 className="text-3xl font-bold text-emerald-400">HealthFlow</h1>
       <button 
         onClick={loginWithGoogle} 
         className="bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-xl font-bold text-lg shadow-xl transition-transform transform hover:scale-105 text-white">
         Entrar com Google
       </button>
    </div>
  );
};

export default Login;