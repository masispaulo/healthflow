import React, { useState } from 'react';
import ProfileModal from './ProfileModal';
import PatientsModal from './PatientsModal';
import NetworkModal from './NetworkModal';

interface HeaderProps {
  user: any;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPatientsOpen, setIsPatientsOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);

  return (
    <>
      <header className="bg-slate-800 border-b border-slate-700 shadow-md sticky top-0 z-40 safe-top">
        <div className="container mx-auto px-2 md:px-4 h-16 flex items-center justify-between">
          
          {/* 1. Logo (Esquerda) */}
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             </div>
             {/* Texto some em telas muito pequenas para dar espaço aos botões */}
             <h1 className="text-lg md:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden xs:block">
                HealthFlow
             </h1>
          </div>

          {/* 2. Barra de Ferramentas (Direita) */}
          <div className="flex items-center gap-1 md:gap-4">
            
            {/* Botão: PACIENTES (Ícone no mobile, Texto no PC) */}
            <button 
                onClick={() => setIsPatientsOpen(true)}
                className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700/50 px-2 md:px-3 py-2 rounded-lg transition-all text-sm font-bold border border-transparent hover:border-slate-600"
                title="Pacientes"
            >
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                <span className="hidden md:inline">Pacientes</span>
            </button>

            {/* Botão: NETWORKING (Ícone no mobile, Texto no PC) */}
            <button 
                onClick={() => setIsNetworkOpen(true)}
                className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700/50 px-2 md:px-3 py-2 rounded-lg transition-all text-sm font-bold border border-transparent hover:border-slate-600"
                title="Networking"
            >
                <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                <span className="hidden md:inline">Rede</span>
            </button>
            
            <div className="w-[1px] h-6 bg-slate-700 hidden md:block mx-1"></div>

            {/* Botão: PERFIL (Avatar sempre visível) */}
            <button 
                onClick={() => setIsProfileOpen(true)}
                className="flex items-center gap-3 hover:bg-slate-700/50 py-1 px-1 md:px-2 rounded-lg transition-colors group"
            >
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {user?.displayName?.split(' ')[0] || 'Doutor'}
                    </p>
                </div>
                {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-slate-600 group-hover:border-indigo-500 transition-colors object-cover" />
                ) : (
                    <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border border-slate-600 group-hover:border-indigo-500">
                        {user.displayName?.[0] || 'U'}
                    </div>
                )}
            </button>
            
            {/* Botão: SAIR */}
            <button 
              onClick={onLogout}
              className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors ml-1"
              title="Sair"
            >
              <svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </div>
      </header>

      {/* Modais */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <PatientsModal isOpen={isPatientsOpen} onClose={() => setIsPatientsOpen(false)} />
      <NetworkModal isOpen={isNetworkOpen} onClose={() => setIsNetworkOpen(false)} />
    </>
  );
};

export default Header;