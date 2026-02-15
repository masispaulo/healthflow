import React, { useState } from 'react';
import { useAuth } from '../services/useAuth';
import { useOpportunities, Vacancy } from '../services/useOpportunities';
import { Plus, X, Building2, Calendar, DollarSign } from 'lucide-react';

const Opportunities: React.FC = () => {
  const { user } = useAuth();
  const { vacancies, loading, applyToVacancy, createVacancy } = useOpportunities(user);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [form, setForm] = useState({
    hospitalName: '',
    type: 'Plantão',
    specialty: '',
    value: '',
    date: '',
    durationHours: '12',
    city: '',
    uf: '',
    requirements: '',
  });

  const handleApply = async (v: Vacancy) => {
    const ok = await applyToVacancy(v.id);
    if (ok) alert('✅ Candidatura enviada! Aguarde retorno da instituição.');
    else alert('Erro ao enviar candidatura.');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(form.value.replace(',', '.'));
    if (!form.hospitalName || !form.type || !value || !form.date) {
      alert('Preencha nome da instituição, tipo, valor e data.');
      return;
    }
    try {
      await createVacancy({
        hospitalName: form.hospitalName,
        type: form.type,
        specialty: form.specialty || undefined,
        value,
        date: form.date,
        durationHours: parseInt(form.durationHours) || 12,
        city: form.city || undefined,
        uf: form.uf || undefined,
        requirements: form.requirements || undefined,
        isHighlighted: false,
      });
      alert('✅ Vaga publicada com sucesso!');
      setIsPublishOpen(false);
      setForm({ hospitalName: '', type: 'Plantão', specialty: '', value: '', date: '', durationHours: '12', city: '', uf: '', requirements: '' });
    } catch (err) {
      alert('Erro ao publicar vaga.');
    }
  };

  const formatDate = (d: string) => {
    if (!d) return '—';
    const n = new Date(d);
    return isNaN(n.getTime()) ? d : n.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="p-4 lg:p-6 bg-slate-900 min-h-screen text-white pb-24">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
          <Building2 size={28} /> Oportunidades
        </h2>
        <p className="text-slate-400 text-sm">Plantões e vagas disponíveis na rede</p>
      </header>

      {loading ? (
        <p className="text-slate-500 text-center py-12">Carregando vagas...</p>
      ) : vacancies.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
          <p className="text-slate-500 mb-4">Nenhuma vaga publicada no momento.</p>
          <p className="text-slate-400 text-sm">Instituições podem publicar vagas gratuitamente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {vacancies.map(vaga => (
            <div
              key={vaga.id}
              className={`p-5 rounded-xl border relative overflow-hidden transition-all hover:scale-[1.01] ${
                vaga.isHighlighted ? 'bg-slate-800 border-emerald-500 shadow-emerald-900/20 shadow-lg' : 'bg-slate-800/50 border-slate-700'
              }`}
            >
              {vaga.isHighlighted && (
                <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
                  Destaque
                </div>
              )}
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg">{vaga.hospitalName}</h3>
                  <span className="text-indigo-300 text-sm font-medium">
                    {vaga.type}{vaga.specialty ? ` • ${vaga.specialty}` : ''}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-bold text-xl">
                    R$ {typeof vaga.value === 'number' ? vaga.value.toLocaleString('pt-BR') : vaga.value}
                  </div>
                  <div className="text-slate-500 text-xs">Valor líquido</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm text-slate-400 my-3">
                <div className="flex items-center gap-1">
                  <Calendar size={14} /> {formatDate(vaga.date)}
                </div>
                <div className="flex items-center gap-1">⏰ {vaga.durationHours || 12}h</div>
                {(vaga.city || vaga.uf) && (
                  <div className="flex items-center gap-1">
                    📍 {[vaga.city, vaga.uf].filter(Boolean).join(' - ')}
                  </div>
                )}
              </div>
              {vaga.requirements && (
                <p className="text-xs text-slate-500 mb-3">{vaga.requirements}</p>
              )}
              <button
                onClick={() => handleApply(vaga)}
                className={`w-full py-3 rounded-lg font-bold text-sm transition-colors ${
                  vaga.isHighlighted ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                Candidatar ao Plantão
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Banner: Instituições publicam gratuitamente */}
      <div className="mt-8 p-5 bg-gradient-to-r from-indigo-900/60 to-slate-900 rounded-xl border border-indigo-700/50 text-center">
        <p className="text-indigo-200 text-sm mb-3">É gestor de clínica ou hospital?</p>
        <p className="text-slate-400 text-xs mb-4">Publique suas vagas gratuitamente e encontre médicos qualificados.</p>
        <button
          onClick={() => setIsPublishOpen(true)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors"
        >
          <Plus size={20} /> Publicar Vaga
        </button>
      </div>

      {/* Modal Publicar Vaga */}
      {isPublishOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Publicar Vaga</h3>
              <button onClick={() => setIsPublishOpen(false)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handlePublish} className="p-4 space-y-4">
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Instituição *</label>
                <input
                  type="text"
                  value={form.hospitalName}
                  onChange={e => setForm({ ...form, hospitalName: e.target.value })}
                  placeholder="Hospital ou Clínica"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Tipo</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                  >
                    <option>Plantão</option>
                    <option>Emergência</option>
                    <option>Ambulatório</option>
                    <option>UTI</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Especialidade</label>
                  <input
                    type="text"
                    value={form.specialty}
                    onChange={e => setForm({ ...form, specialty: e.target.value })}
                    placeholder="Ex: Clínico Geral"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Valor (R$) *</label>
                  <input
                    type="text"
                    value={form.value}
                    onChange={e => setForm({ ...form, value: e.target.value })}
                    placeholder="1500"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Data *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Duração (h)</label>
                  <input
                    type="number"
                    value={form.durationHours}
                    onChange={e => setForm({ ...form, durationHours: e.target.value })}
                    min={1}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 font-bold block mb-1">Cidade</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    placeholder="Campo Grande"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-bold block mb-1">Requisitos</label>
                <textarea
                  value={form.requirements}
                  onChange={e => setForm({ ...form, requirements: e.target.value })}
                  placeholder="CRM ativo, experiência em..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-white resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublishOpen(false)}
                  className="flex-1 py-2.5 rounded-lg bg-slate-700 text-slate-300 font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                >
                  Publicar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Opportunities;
