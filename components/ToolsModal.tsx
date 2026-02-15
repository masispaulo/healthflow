import React, { useState } from 'react';
import {
  X, Search, Syringe, CloudUpload, Trash2, Calculator, Heart, Scale, FileText,
  ExternalLink, Pill, Baby, Stethoscope, Activity
} from 'lucide-react';
import { useDrugs } from '../services/useDrugs';
import bularioData from '../bulario.json';

interface BularioItem {
  id: string;
  nomeComercial: string;
  principioAtivo: string;
  laboratorio: string;
  apresentacao: string;
  categoria: string;
  indicacoes: string;
  contraIndicacoes: string;
  uso: string;
}

// Dados de dose por peso (mg/kg) para bulário - complementa o JSON
const dosePorPeso: Record<string, { doseMgKg: number; intervalo: string; maxDose?: number; tipo?: string }> = {
  'Dipirona': { doseMgKg: 15, intervalo: '6/6h', maxDose: 1000, tipo: 'gotas' },
  'Paracetamol': { doseMgKg: 15, intervalo: '6/6h', maxDose: 750, tipo: 'gotas' },
  'Amoxicilina': { doseMgKg: 50, intervalo: '12/12h ou 8/8h', maxDose: 3000, tipo: 'oral' },
  'Ibuprofeno': { doseMgKg: 10, intervalo: '6/6h', maxDose: 400, tipo: 'oral' },
  'Clonazepam': { doseMgKg: 0.025, intervalo: '12/12h', tipo: 'gotas' },
  'Omeprazol': { doseMgKg: 1, intervalo: 'em jejum', maxDose: 20, tipo: 'oral' },
};

const bulario = bularioData as BularioItem[];

// Medicamentos para receita com dose por peso
const smartDrugs = [
  { id: 'dipirona_gts', name: 'Dipirona Gotas', concentration: 500, defaultDose: 15, type: 'gotas', frequency: '6/6h', maxDose: 1000 },
  { id: 'paracetamol_gts', name: 'Paracetamol Gotas', concentration: 200, defaultDose: 15, type: 'gotas', frequency: '6/6h', maxDose: 750 },
  { id: 'amoxicilina_250', name: 'Amoxicilina 250mg/5ml', concentration: 50, defaultDose: 50, type: 'ml', frequency: '8/8h', maxDose: 500 },
  { id: 'amoxicilina_500', name: 'Amoxicilina 500mg', concentration: 500, defaultDose: 50, type: 'capsula', frequency: '8/8h', maxDose: 3000 },
  { id: 'ibuprofeno_100', name: 'Ibuprofeno 100mg/ml', concentration: 100, defaultDose: 10, type: 'gotas', frequency: '8/8h', maxDose: 400 },
  { id: 'omeprazol', name: 'Omeprazol 20mg', concentration: 20, defaultDose: 1, type: 'capsula', frequency: 'em jejum', maxDose: 40 },
  { id: 'loratadina', name: 'Loratadina 10mg', concentration: 10, defaultDose: 0.2, type: 'comprimido', frequency: '12/12h', maxDose: 10 },
  { id: 'prednisolona', name: 'Prednisolona 3mg/ml', concentration: 3, defaultDose: 1, type: 'ml', frequency: '12/12h', maxDose: 60 },
  { id: 'azitromicina', name: 'Azitromicina 200mg/5ml', concentration: 40, defaultDose: 10, type: 'ml', frequency: '1x/dia', maxDose: 500 },
  { id: 'dexclorfeniramina', name: 'Dexclorfeniramina 0.4mg/ml', concentration: 0.4, defaultDose: 0.1, type: 'ml', frequency: '8/8h', maxDose: 4 },
];

interface ToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ToolsModal: React.FC<ToolsModalProps> = ({ isOpen, onClose }) => {
  const [activeTool, setActiveTool] = useState<string | null>(null);

  if (!isOpen) return null;

  const menuItems = [
    { id: 'smart', label: 'Guia Drogas IV', icon: Syringe },
    { id: 'bulario', label: 'Bulário + Pesagem', icon: Scale },
    { id: 'rx', label: 'Receita Inteligente', icon: FileText },
    { id: 'calculators', label: 'Calculadoras Clínicas', icon: Calculator },
    { id: 'pediatric', label: 'Dose Pediátrica', icon: Baby },
    { id: 'apis', label: 'APIs & Links Médicos', icon: ExternalLink },
  ];

  // ========== BULÁRIO COM PESAGEM ==========
  const BularioPesagem = () => {
    const [search, setSearch] = useState('');
    const [weight, setWeight] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const filtered = bulario.filter(b =>
      b.nomeComercial.toLowerCase().includes(search.toLowerCase()) ||
      b.principioAtivo.toLowerCase().includes(search.toLowerCase()) ||
      b.categoria.toLowerCase().includes(search.toLowerCase())
    );

    const getDoseInfo = (principio: string) => {
      const info = dosePorPeso[principio];
      if (!info || !weight) return null;
      const w = parseFloat(weight.replace(',', '.'));
      if (!w || w <= 0) return null;
      let doseMg = w * info.doseMgKg;
      if (info.maxDose && doseMg > info.maxDose) doseMg = info.maxDose;
      return { doseMg, ...info };
    };

    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="Buscar por nome, princípio ativo ou categoria..."
              className="w-full bg-slate-800/80 border border-slate-600 rounded-xl pl-10 py-2.5 text-white text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="w-24">
            <label className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Peso (kg)</label>
            <input
              type="text"
              placeholder="kg"
              className="w-full bg-slate-800/80 border border-emerald-500/40 rounded-xl p-2 text-center text-white font-bold focus:border-emerald-500"
              value={weight}
              onChange={e => setWeight(e.target.value.replace(/[^0-9,.]/g, ''))}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {filtered.map(item => {
            const doseInfo = getDoseInfo(item.principioAtivo);
            const isSel = selectedId === item.id;
            return (
              <div
                key={item.id}
                className={`rounded-xl border transition-all ${
                  isSel ? 'bg-slate-800/90 border-indigo-500/50 shadow-lg' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}
              >
                <button
                  onClick={() => setSelectedId(isSel ? null : item.id)}
                  className="w-full p-4 flex justify-between items-center text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Pill size={18} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">{item.nomeComercial}</p>
                      <p className="text-xs text-slate-500">{item.principioAtivo} • {item.apresentacao}</p>
                    </div>
                  </div>
                  {doseInfo && (
                    <span className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                      {doseInfo.doseMg.toFixed(1)} mg {doseInfo.intervalo}
                    </span>
                  )}
                </button>
                {isSel && (
                  <div className="p-4 border-t border-slate-700 bg-slate-900/50 rounded-b-xl">
                    <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                      <div><span className="text-slate-500">Categoria:</span> <span className="text-slate-300">{item.categoria}</span></div>
                      <div><span className="text-slate-500">Laboratório:</span> <span className="text-slate-300">{item.laboratorio}</span></div>
                    </div>
                    <p className="text-slate-400 text-xs mb-2"><strong className="text-slate-300">Indicações:</strong> {item.indicacoes}</p>
                    <p className="text-red-400/90 text-xs"><strong>Contraindicações:</strong> {item.contraIndicacoes}</p>
                    {doseInfo && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <p className="text-emerald-400 font-bold">Dose por peso ({weight} kg): {doseInfo.doseMg.toFixed(1)} mg {doseInfo.intervalo}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ========== CALCULADORAS CLÍNICAS ==========
  const ClinicalCalculators = () => {
    const [calcType, setCalcType] = useState<'cha2ds2' | 'hasbled' | 'creatinine' | 'score'>('cha2ds2');

    const CHA2DS2VASc = () => {
      const [age, setAge] = useState('');
      const [female, setFemale] = useState(false);
      const [chf, setChf] = useState(false);
      const [ht, setHt] = useState(false);
      const [dm, setDm] = useState(false);
      const [stroke, setStroke] = useState(false);
      const [vascular, setVascular] = useState(false);

      const a = parseInt(age) || 0;
      let score = 0;
      if (a >= 75) score += 2;
      else if (a >= 65) score += 1;
      if (female) score += 1;
      if (chf) score += 1;
      if (ht) score += 1;
      if (dm) score += 1;
      if (stroke) score += 2;
      if (vascular) score += 1;

      const risk = score === 0 ? 'Baixo (sem anticoagulação)' : score === 1 ? 'Moderado (considerar)' : 'Alto (anticoagular)';

      return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Heart size={20} /> CHA₂DS₂-VASc (Risco de AVC em FA)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Idade</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)} placeholder="anos"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white" />
            </div>
            {[
              { state: female, set: setFemale, label: 'Sexo feminino' },
              { state: chf, set: setChf, label: 'IC/Disfunção ventricular' },
              { state: ht, set: setHt, label: 'Hipertensão' },
              { state: dm, set: setDm, label: 'Diabetes' },
              { state: stroke, set: setStroke, label: 'AVC/TIA prévio' },
              { state: vascular, set: setVascular, label: 'Doença vascular' },
            ].map(({ state, set, label }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={state} onChange={e => set(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-indigo-500" />
                <span className="text-sm text-slate-300">{label}</span>
              </label>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <p className="text-3xl font-black text-white">{score} <span className="text-lg text-slate-500 font-normal">pontos</span></p>
            <p className={`text-sm font-bold mt-1 ${score >= 2 ? 'text-red-400' : score === 1 ? 'text-amber-400' : 'text-emerald-400'}`}>{risk}</p>
          </div>
        </div>
      );
    };

    const HASBLED = () => {
      const [h, setH] = useState(false);
      const [renal, setRenal] = useState(false);
      const [hepatic, setHepatic] = useState(false);
      const [stroke, setStroke] = useState(false);
      const [bleeding, setBleeding] = useState(false);
      const [inr, setInr] = useState(false);
      const [age65, setAge65] = useState(false);
      const [drugs, setDrugs] = useState(false);
      const [alcohol, setAlcohol] = useState(false);

      const score = [h, renal, hepatic, stroke, bleeding, inr, age65, drugs, alcohol].filter(Boolean).length;
      const risk = score >= 3 ? 'Alto risco de sangramento' : score >= 1 ? 'Moderado' : 'Baixo';

      return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Activity size={20} /> HAS-BLED (Risco de Sangramento)
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { state: h, set: setH, label: 'H - Hipertensão' },
              { state: renal, set: setRenal, label: 'A - Renal' },
              { state: hepatic, set: setHepatic, label: 'A - Hepático' },
              { state: stroke, set: setStroke, label: 'S - AVC prévio' },
              { state: bleeding, set: setBleeding, label: 'B - Sangramento' },
              { state: inr, set: setInr, label: 'L - INR lábil' },
              { state: age65, set: setAge65, label: 'E - Idade >65' },
              { state: drugs, set: setDrugs, label: 'D - Drogas/AINEs' },
              { state: alcohol, set: setAlcohol, label: 'D - Álcool' },
            ].map(({ state, set, label }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={state} onChange={e => set(e.target.checked)}
                  className="rounded border-slate-600 bg-slate-800 text-indigo-500" />
                <span className="text-xs text-slate-300">{label}</span>
              </label>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <p className="text-3xl font-black text-white">{score} <span className="text-lg text-slate-500">pontos</span></p>
            <p className={`text-sm font-bold mt-1 ${score >= 3 ? 'text-red-400' : score >= 1 ? 'text-amber-400' : 'text-emerald-400'}`}>{risk}</p>
          </div>
        </div>
      );
    };

    const CreatinineClearance = () => {
      const [weight, setWeight] = useState('');
      const [age, setAge] = useState('');
      const [creat, setCreat] = useState('');
      const [female, setFemale] = useState(false);

      const w = parseFloat(weight) || 0;
      const a = parseFloat(age) || 0;
      const c = parseFloat(creat) || 0;
      let clcr = 0;
      if (w > 0 && a > 0 && c > 0) {
        clcr = ((140 - a) * w) / (72 * c);
        if (female) clcr *= 0.85;
      }

      return (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
            <Calculator size={20} /> Clearance de Creatinina (Cockcroft-Gault)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500">Peso (kg)</label>
              <input type="number" value={weight} onChange={e => setWeight(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Idade</label>
              <input type="number" value={age} onChange={e => setAge(e.target.value)}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-500">Creatinina (mg/dL)</label>
              <input type="text" value={creat} onChange={e => setCreat(e.target.value.replace(',', '.'))}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-white" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer col-span-2">
              <input type="checkbox" checked={female} onChange={e => setFemale(e.target.checked)}
                className="rounded border-slate-600 bg-slate-800 text-indigo-500" />
              <span className="text-sm text-slate-300">Sexo feminino</span>
            </label>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700">
            <p className="text-3xl font-black text-white">{clcr > 0 ? clcr.toFixed(0) : '--'} <span className="text-lg text-slate-500">mL/min</span></p>
            {clcr > 0 && (
              <p className="text-xs text-slate-400 mt-1">
                {clcr < 30 ? 'IR estágio 4-5' : clcr < 60 ? 'IR estágio 3' : clcr < 90 ? 'IR leve' : 'Normal'}
              </p>
            )}
          </div>
        </div>
      );
    };

    const calcTabs = [
      { id: 'cha2ds2' as const, label: 'CHA₂DS₂-VASc', icon: Heart },
      { id: 'hasbled' as const, label: 'HAS-BLED', icon: Activity },
      { id: 'creatinine' as const, label: 'Clearance', icon: Calculator },
    ];

    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="flex gap-2 mb-4 flex-wrap">
          {calcTabs.map(t => (
            <button
              key={t.id}
              onClick={() => setCalcType(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                calcType === t.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {calcType === 'cha2ds2' && <CHA2DS2VASc />}
          {calcType === 'hasbled' && <HASBLED />}
          {calcType === 'creatinine' && <CreatinineClearance />}
        </div>
      </div>
    );
  };

  // ========== DOSE PEDIÁTRICA ==========
  const PediatricDose = () => {
    const [weight, setWeight] = useState('');
    const [drugId, setDrugId] = useState('');
    const [result, setResult] = useState<string | null>(null);

    const handleCalc = () => {
      const drug = smartDrugs.find(d => d.id === drugId);
      const w = parseFloat(weight.replace(',', '.'));
      if (!drug || !w || w <= 0) return;
      let doseMg = w * drug.defaultDose;
      if (drug.maxDose && doseMg > drug.maxDose) doseMg = drug.maxDose;
      const volMl = doseMg / drug.concentration;
      const doseStr = drug.type === 'gotas'
        ? `${Math.round(volMl * 20)} gotas ${drug.frequency}`
        : drug.type === 'capsula' || drug.type === 'comprimido'
          ? `${Math.ceil(doseMg / drug.concentration)} cp/cáps ${drug.frequency}`
          : `${volMl.toFixed(1)} ml ${drug.frequency}`;
      setResult(doseStr);
    };

    return (
      <div className="space-y-4 animate-fade-in">
        <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
          <Baby size={20} /> Calculadora de Dose Pediátrica
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-500 block mb-1">Peso (kg)</label>
            <input
              type="text"
              value={weight}
              onChange={e => setWeight(e.target.value.replace(/[^0-9,.]/g, ''))}
              placeholder="Ex: 12.5"
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white font-mono text-lg"
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Medicamento</label>
            <select
              value={drugId}
              onChange={e => setDrugId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-white"
            >
              <option value="">Selecione...</option>
              {smartDrugs.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={handleCalc}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center gap-2"
        >
          <Calculator size={20} /> Calcular Dose
        </button>
        {result && (
          <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
            <p className="text-emerald-400 font-bold text-lg">{result}</p>
          </div>
        )}
      </div>
    );
  };

  // ========== APIS & LINKS ==========
  const ApisLinks = () => (
    <div className="space-y-4 animate-fade-in">
      <h3 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
        <ExternalLink size={20} /> APIs e Recursos Médicos
      </h3>
      <div className="grid gap-3">
        {[
          { name: 'Bulário Eletrônico ANVISA', url: 'https://consultas.anvisa.gov.br/#/bulario/', desc: 'Bulas oficiais de medicamentos' },
          { name: 'Consulta Medicamentos ANVISA', url: 'https://consultas.anvisa.gov.br/#/medicamentos/', desc: 'Registro e equivalência' },
          { name: 'Medicamentos Similares Intercambiáveis', url: 'https://consultas.anvisa.gov.br/#/medicamentos/similares', desc: 'ANVISA - Medicamentos genéricos' },
          { name: 'UpToDate (externo)', url: 'https://www.uptodate.com', desc: 'Evidências clínicas' },
          { name: 'MDCalc', url: 'https://www.mdcalc.com', desc: 'Calculadoras médicas' },
        ].map(({ name, url, desc }) => (
          <a
            key={name}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800 transition-all group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/30">
              <ExternalLink size={18} className="text-indigo-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-200 truncate">{name}</p>
              <p className="text-xs text-slate-500">{desc}</p>
            </div>
            <ExternalLink size={14} className="text-slate-500 flex-shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );

  // ========== SMART DRUG GUIDE (existente, melhorado) ==========
  const SmartDrugGuide = () => {
    const { drugs, loading, seedDatabase } = useDrugs();
    const [search, setSearch] = useState('');
    const [selectedDrug, setSelectedDrug] = useState<string | null>(null);
    const [calcWeight, setCalcWeight] = useState('');

    const filtered = drugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
    const calculateIV = (drug: any, wStr: string) => {
      const w = parseFloat(wStr);
      if (!w || !drug.math) return null;
      const doseMg = w * drug.math.doseKg;
      const volMl = doseMg / drug.math.concentration;
      return { doseMg: doseMg.toFixed(2), volMl: volMl.toFixed(2), unit: drug.math.unit };
    };

    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="mb-3 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input type="text" placeholder="Buscar drogas IV..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-600 rounded-xl pl-10 py-2.5 text-white text-sm" />
          </div>
          <button onClick={seedDatabase} className="bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-slate-400 hover:text-emerald-400"
            title="Popular banco de emergência">
            <CloudUpload size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
          {loading ? (
            <p className="text-center text-slate-500 py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Nenhum resultado. Use o botão nuvem para popular.</p>
          ) : (
            filtered.map(drug => {
              const result = calculateIV(drug, calcWeight);
              const isSel = selectedDrug === drug.id;
              return (
                <div key={drug.id} className={`rounded-xl border ${isSel ? 'bg-slate-800 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700'}`}>
                  <button onClick={() => setSelectedDrug(isSel ? null : drug.id)} className="w-full p-3 flex justify-between items-center text-left">
                    <div className="flex items-center gap-3">
                      <Syringe size={16} className={drug.type === 'vasoativo' ? 'text-red-400' : 'text-blue-400'} />
                      <span className="font-bold text-slate-200 text-sm">{drug.name}</span>
                    </div>
                  </button>
                  {isSel && drug.math && (
                    <div className="p-3 border-t border-slate-700 bg-emerald-900/10">
                      <div className="flex gap-2 items-center mb-2">
                        <input type="number" placeholder="Peso (kg)" value={calcWeight} onChange={e => setCalcWeight(e.target.value)}
                          className="w-20 bg-slate-900 border border-emerald-500/30 rounded-lg p-2 text-center text-white font-bold" />
                        <span className="text-emerald-400 font-bold text-lg">{result ? `${result.volMl} ${result.unit}` : '---'}</span>
                      </div>
                      <p className="text-xs text-slate-400">{drug.cuidados}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  // ========== RECEITA INTELIGENTE (melhorada) ==========
  const PrescriptionGenerator = () => {
    const [pName, setPName] = useState('');
    const [pWeight, setPWeight] = useState('');
    const [selectedDrugId, setSelectedDrugId] = useState('');
    const [calculatedDose, setCalculatedDose] = useState('');
    const [prescriptionItems, setPrescriptionItems] = useState<any[]>([]);

    const calculateLogic = (drugId: string, weightStr: string) => {
      const drug = smartDrugs.find(d => d.id === drugId);
      const weight = parseFloat(weightStr.replace(',', '.'));
      if (!drug || !weight) return;
      let targetDoseMg = weight * drug.defaultDose;
      if (drug.maxDose && targetDoseMg > drug.maxDose) targetDoseMg = drug.maxDose;
      const volumeMl = targetDoseMg / drug.concentration;
      setCalculatedDose(
        drug.type === 'gotas' ? `${Math.round(volumeMl * 20)} gotas` :
          drug.type === 'capsula' || drug.type === 'comprimido' ? `${Math.ceil(targetDoseMg / drug.concentration)} cp/cáps` :
            `${volumeMl.toFixed(1)} ml`
      );
    };

    const handlePrint = () => {
      const printContent = prescriptionItems.map(i => `${i.name}: ${i.dose} ${i.frequency}`).join('\n');
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(`<pre style="font-family:sans-serif;padding:20px">Receita Médica\nPaciente: ${pName} | Peso: ${pWeight} kg\n\n${printContent}</pre>`);
        w.print();
        w.close();
      }
    };

    return (
      <div className="flex flex-col h-full animate-fade-in">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="col-span-2">
            <label className="text-[10px] text-slate-500 uppercase font-bold">Paciente</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" value={pName} onChange={e => setPName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold">Peso (kg)</label>
            <input className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white" type="text" value={pWeight}
              onChange={e => { setPWeight(e.target.value); calculateLogic(selectedDrugId, e.target.value); }} />
          </div>
        </div>
        <div className="flex gap-2 mb-4">
          <select className="flex-1 bg-slate-800 border border-slate-600 rounded-xl p-2.5 text-white"
            value={selectedDrugId} onChange={e => { setSelectedDrugId(e.target.value); calculateLogic(e.target.value, pWeight); }}>
            <option value="">Selecione medicamento...</option>
            {smartDrugs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          {calculatedDose && (
            <span className="px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold self-center">{calculatedDose}</span>
          )}
        </div>
        <button onClick={() => {
          if (!pName || !selectedDrugId || !calculatedDose) return;
          const drug = smartDrugs.find(d => d.id === selectedDrugId);
          setPrescriptionItems([...prescriptionItems, { id: Math.random().toString(), name: drug?.name, dose: calculatedDose, frequency: drug?.frequency }]);
        }} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold mb-4">
          + Adicionar à Receita
        </button>
        <div className="flex-1 overflow-y-auto space-y-2">
          {prescriptionItems.map(item => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-200">{item.name}</p>
                <p className="text-slate-400 text-xs">{item.dose} • {item.frequency}</p>
              </div>
              <button onClick={() => setPrescriptionItems(prescriptionItems.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-300">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        {prescriptionItems.length > 0 && (
          <button onClick={handlePrint} className="mt-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold flex items-center justify-center gap-2">
            <FileText size={18} /> Imprimir / Copiar Receita
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700/80 flex justify-between items-center bg-slate-800/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Stethoscope size={22} className="text-indigo-400" />
            </div>
            Ferramentas Médicas
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="flex flex-1 min-h-0">
          <div className="w-52 bg-slate-800/50 border-r border-slate-700/80 p-3 space-y-1 overflow-y-auto">
            {menuItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTool(id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${
                  activeTool === id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            {!activeTool && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500">
                <Stethoscope size={64} className="mb-4 opacity-30" />
                <p className="text-lg font-bold">Selecione uma ferramenta</p>
                <p className="text-sm">Bulário, calculadoras, receita e mais</p>
              </div>
            )}
            {activeTool === 'smart' && <SmartDrugGuide />}
            {activeTool === 'bulario' && <BularioPesagem />}
            {activeTool === 'rx' && <PrescriptionGenerator />}
            {activeTool === 'calculators' && <ClinicalCalculators />}
            {activeTool === 'pediatric' && <PediatricDose />}
            {activeTool === 'apis' && <ApisLinks />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolsModal;
