import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Como está tudo na raiz, os imports são diretos com ./
import Login from './Login';
import MainApp from './MainApp';
import RouteGuard from './components/RouteGuard'; // <--- Se der erro, veja onde você criou esse arquivo!

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* Rota Pública (Login) */}
        <Route path="/" element={<Login />} />

        {/* Rotas Protegidas pela Caipora */}
        <Route element={<RouteGuard />}>
          <Route path="/app" element={<MainApp />} />
        </Route>

        {/* Captura de erro (joga pro login) */}
        <Route path="*" element={<Login />} />

      </Routes>
    </BrowserRouter>
  );
};

export default App;