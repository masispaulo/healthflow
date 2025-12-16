import React, { useState, useEffect } from 'react';
import { useAuth } from '../services/useAuth';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/userService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    displayName: '',
    crm: '',
    specialty: '',
    phone: ''
  });

  // Carrega dados ao abrir
  useEffect(() => {
    if (user && isOpen) {
      const loadData = async () => {
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setFormData({
            displayName: profile.displayName || user.displayName || '',
            crm: profile.crm || '',
            specialty: profile.specialty || '',
            phone: profile.phone || ''
          });
        } else {
            setFormData({ displayName: user.displayName || '' });
        }
      };
      loadData();
    }
  }, [user, isOpen]);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await updateUserProfile(user.uid, formData);
      onClose();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
      alert("Erro ao salvar perfil");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-800 p-6 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                🩺 Meu Perfil Profissional
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                ✕
            </button>
        </div>

        {/* Form */}
        <div className="p-6 space-y-4">
            
            {/* Foto e Nome */}
            <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-2xl font-bold text-white border-2 border-slate-600">
                    {user?.photoURL ? <img src={user.photoURL} alt="User" className="w-full h-full rounded-full" /> : formData.displayName?.[0] || 'D'}
                </div>
                <div className="flex-1">
                    <label className="text-xs text-slate-400 font-bold uppercase">Nome de Exibição</label>
                    <input 
                        type="text" 
                        value={formData.displayName}
                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                        className="w-full bg-transparent border-b border-slate-600 focus:border-indigo-500 text-white py-1 outline-none transition-colors"
                        placeholder="Dr. Seu Nome"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase">CRM / Registro</label>
                    <input 
                        type="text" 
                        value={formData.crm}
                        onChange={e => setFormData({...formData, crm: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                        placeholder="12345/UF"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-bold uppercase">Especialidade</label>
                    <select 
                        value={formData.specialty}
                        onChange={e => setFormData({...formData, specialty: e.target.value})}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none appearance-none"
                    >
                        <option value="">Selecione...</option>
                        <option value="Anestesiologia">Anestesiologia</option>
                        <option value="Cirurgia Geral">Cirurgia Geral</option>
                        <option value="Ortopedia">Ortopedia</option>
                        <option value="Clinica Médica">Clínica Médica</option>
                        <option value="Pediatria">Pediatria</option>
                        <option value="Outro">Outro</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-xs text-slate-400 font-bold uppercase">Telefone / WhatsApp</label>
                <input 
                    type="tel" 
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                    placeholder="(99) 99999-9999"
                />
                <p className="text-[10px] text-slate-500">Usado para troca de plantões (Networking).</p>
            </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 text-slate-300 hover:bg-slate-700 rounded-lg transition-colors text-sm font-bold">Cancelar</button>
            <button 
                onClick={handleSave} 
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors text-sm font-bold flex items-center gap-2"
            >
                {loading ? 'Salvando...' : 'Salvar Perfil'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;