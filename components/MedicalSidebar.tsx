import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, MessageCircle, Users, Rss, MessageSquare, GraduationCap,
  Building2, Shield, ExternalLink, Handshake, ShoppingBag
} from 'lucide-react';
import { useNetwork } from '../services/networkService';

interface MedicalSidebarProps {
  user: any;
  onOpenRede?: () => void;
  onOpenTools?: () => void;
}

type SidebarSection = 'feed' | 'rede' | 'conversas' | 'discussoes' | 'parcerias' | 'marketplace' | 'apis' | 'hospitais' | null;

const MedicalSidebar: React.FC<MedicalSidebarProps> = ({ user, onOpenRede, onOpenTools }) => {
  const [expanded, setExpanded] = useState(true);
  const [activeSection, setActiveSection] = useState<SidebarSection>(null);
  const { colleagues } = useNetwork(user);

  const menuItems = [
    { id: 'feed' as const, label: 'Feed', icon: Rss, desc: 'Informações, casos, protocolos', color: 'text-blue-400' },
    { id: 'rede' as const, label: 'Minha Rede', icon: Users, desc: `${colleagues.length} colegas`, color: 'text-emerald-400', badge: colleagues.length },
    { id: 'conversas' as const, label: 'Conversas', icon: MessageCircle, desc: 'Chat com médicos', color: 'text-violet-400' },
    { id: 'discussoes' as const, label: 'Discussões', icon: MessageSquare, desc: 'Protocolos e eficiência', color: 'text-amber-400' },
    { id: 'parcerias' as const, label: 'Parcerias', icon: Handshake, desc: 'Clínicas, pesquisa, telemedicina', color: 'text-emerald-400' },
    { id: 'marketplace' as const, label: 'Marketplace', icon: ShoppingBag, desc: 'Laudos, segunda opinião', color: 'text-rose-400' },
    { id: 'apis' as const, label: 'APIs Universitárias', icon: GraduationCap, desc: 'Recursos acadêmicos', color: 'text-cyan-400' },
    { id: 'hospitais' as const, label: 'Hospitais HealthFlow', icon: Building2, desc: 'Unidades integradas', color: 'text-indigo-400' },
  ];

  const handleMenuClick = (id: SidebarSection) => {
    if (id === 'rede' && onOpenRede) {
      onOpenRede();
      return;
    }
    setActiveSection(activeSection === id ? null : id);
  };

  // Placeholder: feed items (pode vir do Firebase depois)
  const feedItems = [
    { id: '1', author: 'Dr. Ana Costa', role: 'Infectologista', text: 'Atualização protocolo influenza 2025: cobertura vacinal em grupos de risco.', time: '2h', tag: 'Protocolo' },
    { id: '2', author: 'Hospital Albert Einstein', role: 'Institucional', text: 'Novo fluxo de triagem para suspeita de sepse. Consulte o protocolo interno.', time: '5h', tag: 'Pandemia' },
    { id: '3', author: 'Dr. Carlos Mendes', role: 'Clínico Geral', text: 'Discussão: eficácia de antibióticos de amplo espectro em ITU não complicada.', time: '1d', tag: 'Discussão' },
  ];

  const discussionTopics = [
    { id: 'pandemia', title: 'Pandemia & Vigilância', count: 12 },
    { id: 'protocolos', title: 'Protocolos Clínicos', count: 28 },
    { id: 'eficiencia', title: 'Eficiência & Métodos', count: 15 },
  ];

  const apiLinks = [
    { name: 'PubMed', url: 'https://pubmed.ncbi.nlm.nih.gov', desc: 'Base de evidências' },
    { name: 'UpToDate', url: 'https://www.uptodate.com', desc: 'Referência clínica' },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-full bg-slate-900/95 border-r border-slate-700/80 transition-all duration-300 ease-out shrink-0 overflow-hidden ${
        expanded ? 'w-80' : 'w-16'
      }`}
    >
      {/* Toggle */}
      <div className="p-2 border-b border-slate-700/80 flex justify-end">
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
        >
          {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {menuItems.map(({ id, label, icon: Icon, desc, color, badge }) => (
          <button
            key={id}
            onClick={() => handleMenuClick(id)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
              activeSection === id ? 'bg-indigo-500/20 border border-indigo-500/40' : 'hover:bg-slate-800/60 border border-transparent'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activeSection === id ? 'bg-indigo-500/30' : 'bg-slate-800'}`}>
              <Icon size={20} className={color} />
            </div>
            {expanded && (
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-200 text-sm truncate">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/30 text-emerald-400">{badge}</span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 truncate">{desc}</p>
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Expandido: Conteúdo da seção */}
      {expanded && activeSection && (
        <div className="border-t border-slate-700/80 p-4 bg-slate-900/80 max-h-[50vh] overflow-y-auto">
          {activeSection === 'feed' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Rss size={16} /> Feed Informativo
              </h3>
              <div className="space-y-3">
                {feedItems.map((item) => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-slate-600 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-400">{item.tag}</span>
                      <span className="text-[10px] text-slate-500">{item.time}</span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">{item.author}</p>
                    <p className="text-[11px] text-slate-400">{item.role}</p>
                    <p className="text-sm text-slate-200 mt-2 line-clamp-2">{item.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 text-center">Em breve: posts em tempo real da rede</p>
            </div>
          )}

          {activeSection === 'conversas' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <MessageCircle size={16} /> Conversas Privadas
              </h3>
              {colleagues.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Adicione colegas na sua <button onClick={onOpenRede} className="text-indigo-400 underline">Rede</button> para iniciar conversas.
                </p>
              ) : (
                <div className="space-y-2">
                  {colleagues.slice(0, 5).map((c) => (
                    <button
                      key={c.id}
                      className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 transition-colors text-left"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 text-sm font-bold shrink-0">
                        {c.photoURL ? <img src={c.photoURL} alt="" className="w-full h-full rounded-full object-cover" /> : c.displayName?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate">{c.displayName}</p>
                        <p className="text-[10px] text-slate-500 truncate">{c.specialty || 'Médico'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-500">Chat em tempo real em desenvolvimento</p>
            </div>
          )}

          {activeSection === 'discussoes' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <MessageSquare size={16} /> Grupos de Discussão
              </h3>
              <p className="text-[11px] text-slate-400">Debata protocolos, métodos e eficiência com sua rede.</p>
              <div className="space-y-2">
                {discussionTopics.map((t) => (
                  <button
                    key={t.id}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50 hover:border-amber-500/40 transition-colors text-left"
                  >
                    <span className="text-sm font-bold text-slate-200">{t.title}</span>
                    <span className="text-[10px] text-slate-500">{t.count} posts</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'apis' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <GraduationCap size={16} /> Recursos Acadêmicos
              </h3>
              <div className="space-y-2">
                {apiLinks.map((l) => (
                  <a
                    key={l.name}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/60 border border-transparent hover:border-cyan-500/30 transition-colors"
                  >
                    <ExternalLink size={14} className="text-cyan-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200">{l.name}</p>
                      <p className="text-[10px] text-slate-500">{l.desc}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {activeSection === 'parcerias' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Users size={16} /> Parcerias Profissionais
              </h3>
              <p className="text-[11px] text-slate-400">Pesquisa, clínicas, telemedicina — em breve.</p>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
                <p className="text-xs text-slate-500">Busca por especialidade, região e propostas formais.</p>
              </div>
            </div>
          )}

          {activeSection === 'marketplace' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Building2 size={16} /> Marketplace de Serviços
              </h3>
              <p className="text-[11px] text-slate-400">Laudos, segunda opinião, teleconsultoria — em desenvolvimento.</p>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">🧾 Laudos (ECG, RX)</div>
                <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">📊 Segunda opinião</div>
                <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">🎓 Educação médica</div>
              </div>
            </div>
          )}

          {activeSection === 'hospitais' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <Building2 size={16} /> Hospitais na Plataforma
              </h3>
              <p className="text-[11px] text-slate-400">Unidades com HealthFlow integrado.</p>
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 text-center">
                <Building2 size={32} className="mx-auto mb-2 text-slate-500" />
                <p className="text-xs text-slate-500">Em breve: lista de hospitais parceiros</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer compacto */}
      {expanded && (
        <div className="p-3 border-t border-slate-700/80">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/50">
            <div className="w-8 h-8 rounded-full bg-indigo-500/30 flex items-center justify-center">
              <Shield size={14} className="text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-slate-300 truncate">Rede Médica Segura</p>
              <p className="text-[9px] text-slate-500">HIPAA compliant</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default MedicalSidebar;
