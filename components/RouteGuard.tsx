import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../services/useAuth'; // ATENÇÃO: Se seu arquivo estiver na raiz, mude para './services/useAuth'

const RouteGuard = () => {
  const { user, loading } = useAuth();

  // 1. Enquanto a Caipora está checando a identidade, mostra "Carregando"
  // Isso evita que ela te chute antes de saber quem você é.
  if (loading) {
    return (
      <div className="h-screen bg-slate-950 flex items-center justify-center text-white">
        Verificando credenciais...
      </div>
    );
  }

  // 2. Se a verificação terminou e NÃO tem usuário: CHUTA PRA FORA (Login)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 3. Se tem usuário: PODE PASSAR
  return <Outlet />;
};

export default RouteGuard;