import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import { db } from '../services/firebaseConfig'; 
import ProfileModal from './ProfileModal';
import PatientsModal from './PatientsModal';
import NetworkModal from './NetworkModal';
import NotificationsMenu from './NotificationsMenu';
import ToolsModal from './ToolsModal';

interface HeaderProps {
  user: any;
  onLogout: () => void;
  onOpenNetwork?: () => void;
  onOpenTools?: () => void;
  isNetworkOpen?: boolean;
  setIsNetworkOpen?: (v: boolean) => void;
  isToolsOpen?: boolean;
  setIsToolsOpen?: (v: boolean) => void;
}

interface UF { id: number; sigla: string; nome: string; }
interface City { id: number; nome: string; }

const Header: React.FC<HeaderProps> = ({ user, onLogout, isNetworkOpen: extNetworkOpen, setIsNetworkOpen: setExtNetworkOpen, isToolsOpen: extToolsOpen, setIsToolsOpen: setExtToolsOpen }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPatientsOpen, setIsPatientsOpen] = useState(false);
  const [isNetworkOpen, setIsNetworkOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const networkOpen = extNetworkOpen ?? isNetworkOpen;
  const setNetworkOpen = setExtNetworkOpen ?? setIsNetworkOpen;
  const toolsOpen = extToolsOpen ?? isToolsOpen;
  const setToolsOpen = setExtToolsOpen ?? setIsToolsOpen;

  // Localização
  const [isLocationMenuOpen, setIsLocationMenuOpen] = useState(false);
  const [ufs, setUfs] = useState<UF[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  
  const [myUf, setMyUf] = useState('MS');
  const [myCity, setMyCity] = useState('Campo Grande');
  const [isPublic, setIsPublic] = useState(true); 
  const [isSaving, setIsSaving] = useState(false);

  // 1. CARREGAR DADOS EXISTENTES
  useEffect(() => {
    const initProfile = async () => {
        if (!user?.uid) return;
        try {
            const docRef = doc(db, 'users', user.uid);
            const snap = await getDoc(docRef);
            
            if (snap.exists()) {
                const data = snap.data();
                if (data.city) setMyCity(data.city);
                if (data.uf) setMyUf(data.uf);
                if (data.isPublic !== undefined) setIsPublic(data.isPublic);
                
                // CORREÇÃO AUTOMÁTICA: Se não tiver email salvo, salva agora!
                if (!data.email) {
                    await forceSaveProfile(data.city || 'Campo Grande', data.uf || 'MS', data.isPublic ?? true);
                }
            } else {
                // Se não existe, cria do zero
                await forceSaveProfile('Campo Grande', 'MS', true);
            }
        } catch (error) { console.error("Erro perfil:", error); }
    };
    initProfile();
  }, [user]);

  // === A FUNÇÃO QUE CONSERTA TUDO ===
  const forceSaveProfile = async (city: string, uf: string, publicStatus: boolean) => {
      try {
        const userRef = doc(db, 'users', user.uid);
        
        // Objeto completo para garantir que a busca funcione
        const profileData = { 
            uid: user.uid, // Salva o UID também pra facilitar
            name: user.displayName || 'Doutor(a)',
            email: user.email, // <--- ISSO É O QUE FALTAVA PRA BUSCA FUNCIONAR
            photoURL: user.photoURL || '',
            city: city, 
            uf: uf,
            isPublic: publicStatus,
            lastUpdate: new Date().toISOString()
        };

        await setDoc(userRef, profileData, { merge: true });
        console.log("✅ PERFIL SINCRONIZADO:", profileData);
      } catch (e) { 
          console.error("Erro ao salvar:", e); 
          alert("Erro ao salvar perfil no banco.");
      }
  };

  // Carregar IBGE
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(r => r.json()).then(setUfs);
  }, []);
  useEffect(() => {
    if (myUf) {
      fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${myUf}/municipios`).then(r => r.json()).then(setCities);
    }
  }, [myUf]);

  // Botão Manual (Obrigatório clicar agora pra testar)
  const handleManualUpdate = async () => {
    setIsSaving(true);
    await forceSaveProfile(myCity, myUf, isPublic);
    setIsSaving(false);
    setIsLocationMenuOpen(false);
    alert(`✅ DADOS ATUALIZADOS!\n\nNome: ${user.displayName}\nEmail: ${user.email}\nCidade: ${myCity}\nStatus: ${isPublic ? 'Público' : 'Fantasma'}`);
  };

  return (
    <>
      <header className="bg-slate-800 border-b border-slate-700 shadow-md sticky top-0 z-40 safe-top">
        <div className="container mx-auto px-2 md:px-4 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
             </div>
             <h1 className="text-lg md:text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400 hidden xs:block">HealthFlow</h1>
          </div>

          {/* LOCALIZAÇÃO */}
          <div className="relative mx-2 hidden md:block">
             <button onClick={() => setIsLocationMenuOpen(!isLocationMenuOpen)} className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all group border ${isPublic ? 'bg-slate-900/80 border-emerald-500/50 hover:border-emerald-400' : 'bg-slate-800 border-slate-600 opacity-75'}`}>
                <span className={`text-xs ${isPublic ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}>●</span>
                <span className="text-white text-sm font-bold truncate max-w-[150px]">{myCity} - {myUf}</span>
                <svg className={`w-4 h-4 text-slate-400 transition-transform ${isLocationMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
             </button>

             {isLocationMenuOpen && (
                <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 bg-slate-900 border border-slate-600 rounded-xl shadow-2xl p-5 animate-scale-in z-50">
                    <h3 className="text-white text-sm font-bold mb-4 text-center border-b border-slate-700 pb-2">Configurar Presença</h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-slate-800 p-3 rounded-lg border border-slate-700">
                            <span className="text-xs font-bold text-slate-300">{isPublic ? '🟢 Perfil Público' : '👻 Perfil Inviolável'}</span>
                            <div onClick={() => setIsPublic(!isPublic)} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${isPublic ? 'bg-emerald-500' : 'bg-slate-600'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Estado</label>
                            <select value={myUf} onChange={e => setMyUf(e.target.value)} className="w-full bg-slate-800 text-white text-sm p-2 rounded border border-slate-700 outline-none focus:border-emerald-500">
                                {ufs.map(u => <option key={u.id} value={u.sigla}>{u.nome}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 uppercase font-bold">Cidade</label>
                            <select value={myCity} onChange={e => setMyCity(e.target.value)} className="w-full bg-slate-800 text-white text-sm p-2 rounded border border-slate-700 outline-none focus:border-emerald-500">
                                {cities.map(c => <option key={c.id} value={c.nome}>{c.nome}</option>)}
                            </select>
                        </div>
                        <button onClick={handleManualUpdate} disabled={isSaving} className={`w-full text-white text-sm font-bold py-2 rounded-lg transition-colors mt-2 shadow-lg ${isPublic ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20' : 'bg-slate-600 hover:bg-slate-500'}`}>
                            {isSaving ? 'Atualizar Dados' : 'Confirmar'}
                        </button>
                    </div>
                </div>
             )}
          </div>

          <div className="flex items-center gap-1 md:gap-3">
             <button onClick={() => setIsPatientsOpen(true)} className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700/50 px-2 md:px-3 py-2 rounded-lg transition-all text-sm font-bold border border-transparent hover:border-slate-600"><span className="hidden md:inline">Pacientes</span></button>
             <button onClick={() => setNetworkOpen(true)} className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700/50 px-2 md:px-3 py-2 rounded-lg transition-all text-sm font-bold border border-transparent hover:border-slate-600"><span className="hidden md:inline">Rede</span></button>
             <button onClick={() => setToolsOpen(true)} className="flex items-center gap-2 text-slate-400 hover:text-white hover:bg-slate-700/50 px-2 md:px-3 py-2 rounded-lg transition-all text-sm font-bold border border-transparent hover:border-slate-600"><span className="hidden md:inline">Tools</span></button>
             <div className="mx-1"><NotificationsMenu user={user} /></div>
             <div className="w-[1px] h-6 bg-slate-700 hidden md:block mx-1"></div>
             <button onClick={() => setIsProfileOpen(true)} className="flex items-center gap-3 hover:bg-slate-700/50 py-1 px-1 md:px-2 rounded-lg transition-colors group">
                <div className="text-right hidden md:block"><p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">{user?.displayName?.split(' ')[0] || 'Doutor'}</p></div>
                {user.photoURL ? <img src={user.photoURL} alt="User" className="w-8 h-8 md:w-9 md:h-9 rounded-full border border-slate-600 group-hover:border-indigo-500 transition-colors object-cover" /> : <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold border border-slate-600 group-hover:border-indigo-500">{user.displayName?.[0] || 'U'}</div>}
             </button>
             <button onClick={onLogout} className="text-slate-400 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors ml-1"><svg className="w-6 h-6 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg></button>
          </div>
        </div>
      </header>
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      <PatientsModal isOpen={isPatientsOpen} onClose={() => setIsPatientsOpen(false)} user={user} />
      <NetworkModal isOpen={networkOpen} onClose={() => setNetworkOpen(false)} />
      <ToolsModal isOpen={toolsOpen} onClose={() => setToolsOpen(false)} />
    </>
  );
};

export default Header;