import React, { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import { User } from 'firebase/auth';
import { Plus, ChevronLeft, ChevronRight, Clock, X, Calendar, Send, Trash2, User as UserIcon, AlertCircle } from 'lucide-react';

const HOSPITAL_DATA = {
  name: 'Santa Casa Central',
  cnpj: '12.345.678/0001-90',
  unitId: 'unit_santa_casa_01'
};

interface Doctor {
  id: string;
  name: string;
  email?: string;
  specialty: string;
  city: string;
  isPublic?: boolean;
}

interface Shift {
  id: string;
  startTime: Date;
  endTime: Date;
  locationName: string;
}

interface ProcedureItem {
  id: string;
  patientName: string;
  priority: 'BAIXA' | 'MEDIA' | 'ALTA';
  status: string;
  scheduledTime: string; // Hora específica do agendamento
  diagnosis?: string;
  age?: string;
  bed?: string;
}

interface ClinicManagerProps {
  currentUser: User | null;
  doctorId?: string | null;     // Recebe do pai
  doctorEmail?: string | null;  // Recebe do pai
  hospitalId?: string;
  onDataUpdate?: (data: any) => void;
}

export const ClinicManager: React.FC<ClinicManagerProps> = ({
  currentUser,
  doctorId,
  doctorEmail,
  onDataUpdate
}) => {
  // === ESTADOS DE SELEÇÃO ===
  const [selectedCity, setSelectedCity] = useState('Campo Grande');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [directSearchTerm, setDirectSearchTerm] = useState('');

  // === ESTADOS DA PROPOSTA (O PACOTE A SER ENVIADO) ===
  // 1. O Plantão Provisório
  const [draftShift, setDraftShift] = useState<{date: string, start: string, end: string} | null>(null);
  // 2. A Lista de Pacientes Provisória
  const [stagedPatients, setStagedPatients] = useState<ProcedureItem[]>([]);

  // === VISUALIZAÇÃO (CALENDÁRIO) ===
  const [allShifts, setAllShifts] = useState<Shift[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  // === MODAIS ===
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);

  // === FORMULÁRIOS ===
  // Form Plantão
  const [shiftDate, setShiftDate] = useState(new Date().toISOString().slice(0, 10));
  const [shiftStart, setShiftStart] = useState('07:00');
  const [shiftEnd, setShiftEnd] = useState('19:00');

  // Form Paciente
  const [patientName, setPatientName] = useState('');
  const [patientTime, setPatientTime] = useState('');
  const [priority, setPriority] = useState<'BAIXA' | 'MEDIA' | 'ALTA'>('MEDIA');
  const [patientAge, setPatientAge] = useState('');
  const [patientBed, setPatientBed] = useState('');
  const [patientDiagnosis, setPatientDiagnosis] = useState('');

  // 1. Sincroniza props (Se o pai mandou um médico selecionado, usa ele)
  useEffect(() => {
    if (doctorId && doctors.length > 0) {
        const found = doctors.find(d => d.id === doctorId);
        if (found) setSelectedDoctor(found);
    }
  }, [doctorId, doctors]);

  // 2. Carregar lista de médicos (Menu Lateral)
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const q = query(collection(db, 'users'), where('city', '==', selectedCity));
        const snap = await getDocs(q);
        const list: Doctor[] = [];
        snap.forEach(doc => {
          const d = doc.data();
          if (d.isPublic !== false && d.name) {
            list.push({
              id: doc.id,
              name: d.name,
              city: d.city,
              specialty: d.specialty || 'Médico',
              email: d.email 
            });
          }
        });
        setDoctors(list);
      } catch (e) { console.error(e); }
    };
    fetchDoctors();
  }, [selectedCity]);

  // 3. Monitorar Calendar (Visual apenas - Plantões JÁ CONFIRMADOS)
  useEffect(() => {
    if (!selectedDoctor) return;
    // Aqui buscamos 'roster' ou 'users/shifts' apenas para mostrar o que JÁ ESTÁ OCUPADO
    const unsubShifts = onSnapshot(
      query(collection(db, 'roster'), where('userId', '==', selectedDoctor.id)),
      snap => {
        setAllShifts(
          snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startTime: doc.data().startTime?.toDate(),
            endTime: doc.data().endTime?.toDate()
          })) as Shift[]
        );
      }
    );
    return () => { unsubShifts(); };
  }, [selectedDoctor]);

  // 4. Enviar dados visuais para o Pai (opcional)
  useEffect(() => {
    if (!selectedDoctor || !onDataUpdate) return;
    onDataUpdate({
      doctor: selectedDoctor,
      shifts: allShifts,
      patients: stagedPatients 
    });
  }, [selectedDoctor, allShifts, stagedPatients, onDataUpdate]);

  // === LÓGICA DE MONTAGEM DO PACOTE ===

  // A. Configurar o Plantão (Botão 1)
  const handleConfigureShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftDate || !shiftStart || !shiftEnd) return;
    
    // Salva na memória, não no banco
    setDraftShift({
        date: shiftDate,
        start: shiftStart,
        end: shiftEnd
    });
    setIsShiftModalOpen(false);
  };

  // B. Adicionar Paciente na Lista (Botão 2)
  const handleStagePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName || !patientTime) {
        alert("Nome e Horário são obrigatórios");
        return;
    }

    // Validação: Hora dentro do plantão?
    if (draftShift) {
        if (patientTime < draftShift.start || patientTime > draftShift.end) {
            alert(`O paciente deve ser agendado entre ${draftShift.start} e ${draftShift.end}`);
            return;
        }
    }

    const newItem: ProcedureItem = {
      id: Math.random().toString(36).substr(2, 9),
      patientName,
      scheduledTime: patientTime,
      priority,
      status: 'AGUARDANDO',
      age: patientAge,
      bed: patientBed,
      diagnosis: patientDiagnosis
    };

    setStagedPatients([...stagedPatients, newItem]);
    
    // Limpa form do paciente
    setIsPatientModalOpen(false);
    setPatientName('');
    setPatientTime('');
    setPatientAge('');
    setPatientBed('');
    setPatientDiagnosis('');
  };

  const handleRemoveStaged = (id: string) => {
    setStagedPatients(prev => prev.filter(p => p.id !== id));
  };

  // C. O TERCEIRO BOTÃO: ENVIAR TUDO (Shift + Patients)
  const handleSendCompleteProposal = async () => {
    // Validações
    if (!selectedDoctor || !selectedDoctor.email) {
        alert("Médico inválido ou sem e-mail.");
        return;
    }
    if (!draftShift) {
        alert("Configure o plantão antes de enviar.");
        return;
    }

    const confirmMsg = `Enviar plantão das ${draftShift.start} às ${draftShift.end} com ${stagedPatients.length} pacientes?`;
    if (!window.confirm(confirmMsg)) return;

    try {
        const startObj = new Date(`${draftShift.date}T${draftShift.start}`);
        const endObj = new Date(`${draftShift.date}T${draftShift.end}`);

        // O Payload que o Analysis vai receber
        const payload = {
            fromUserId: currentUser?.uid || 'GERENCIA',
            fromUserEmail: 'Gestão de Escala',
            toUserEmail: selectedDoctor.email,
            status: 'pending',
            createdAt: serverTimestamp(),
            shiftData: {
                title: 'Plantão + Pacientes (Gerência)',
                locationName: HOSPITAL_DATA.name,
                startTime: startObj.toISOString(),
                endTime: endObj.toISOString(),
                // AQUI ESTÁ A CORREÇÃO: ENVIAMOS OS PACIENTES JUNTOS
                patients: stagedPatients.map(p => ({
                    patientName: p.patientName,
                    priority: p.priority,
                    procedureType: 'Consulta/Exame',
                    status: 'AGUARDANDO',
                    // Importante: Calculamos a data/hora exata de cada paciente
                    scheduledAt: new Date(`${draftShift.date}T${p.scheduledTime}`).toISOString(),
                    // Campos extras
                    age: p.age,
                    bed: p.bed,
                    diagnosis: p.diagnosis
                }))
            }
        };

        // Grava no 'shift_requests' (O Sininho)
        await addDoc(collection(db, 'shift_requests'), payload);

        // Limpa a tela
        setDraftShift(null);
        setStagedPatients([]);
        alert("✅ Proposta enviada com sucesso! Aguarde o aceite do médico.");

    } catch (error) {
        console.error("Erro ao enviar:", error);
        alert("Erro ao enviar proposta.");
    }
  };

  // Helpers de Calendário
  const nextWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); };
  const prevWeek = () => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); };
  const getWeekDays = () => {
    const days: Date[] = [];
    const start = new Date(currentDate);
    start.setDate(currentDate.getDate() - currentDate.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  };
  const weekDays = getWeekDays();
  const hours = [7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23];
  const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth();

  return (
    <div className="flex h-full bg-slate-950 text-white overflow-hidden rounded-xl border border-slate-800">
      
      {/* 1. BARRA LATERAL (Médicos) */}
      <div className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="p-4 bg-slate-950 border-b border-slate-800">
          <h2 className="text-emerald-400 font-bold text-lg">{HOSPITAL_DATA.name}</h2>
          <p className="text-xs text-slate-500">Selecione o médico para montar a escala</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {doctors.map(doc => (
            <button
              key={doc.id}
              onClick={() => setSelectedDoctor(doc)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-center gap-3 ${
                selectedDoctor?.id === doc.id
                  ? 'bg-emerald-600/20 border-emerald-500/50 shadow-lg'
                  : 'bg-slate-800/30 border-slate-700 hover:bg-slate-800'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-white">
                {doc.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <div className="font-bold text-xs text-white truncate">{doc.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{doc.specialty}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. ÁREA PRINCIPAL (Montagem) */}
      <div className="flex-1 flex flex-col bg-slate-950 relative">
        {selectedDoctor ? (
          <>
            {/* HEADER DE AÇÕES */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shadow-lg z-10">
              <div>
                  <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    📅 Montar Escala: {selectedDoctor.name}
                  </h1>
                  {draftShift && (
                      <span className="text-xs text-emerald-400 font-bold bg-emerald-900/30 px-2 py-1 rounded mt-1 inline-block border border-emerald-500/30">
                          Plantão Configurado: {draftShift.date} ({draftShift.start} - {draftShift.end})
                      </span>
                  )}
              </div>

              <div className="flex gap-2">
                {/* BOTÃO 1: CONFIGURAR PLANTÃO */}
                <button
                  onClick={() => setIsShiftModalOpen(true)}
                  className={`font-bold px-3 py-2 rounded-lg flex items-center gap-2 text-xs uppercase border ${
                      draftShift ? 'bg-slate-800 text-slate-400 border-slate-600' : 'bg-slate-800 text-emerald-400 border-emerald-500'
                  }`}
                >
                  <Calendar size={14} /> {draftShift ? 'Editar Horário' : '1. Configurar Plantão'}
                </button>

                {/* BOTÃO 2: ADICIONAR PACIENTE */}
                <button
                  onClick={() => {
                      if(!draftShift) return alert("Configure o plantão primeiro!");
                      setIsPatientModalOpen(true);
                  }}
                  disabled={!draftShift}
                  className={`font-bold px-3 py-2 rounded-lg flex items-center gap-2 text-xs uppercase transition-all ${
                      !draftShift ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  <Plus size={14} /> 2. Adicionar Paciente
                </button>
              </div>
            </div>

            {/* CONTEÚDO */}
            <div className="flex-1 overflow-auto p-4 flex flex-col gap-6">
              
              {/* ÁREA DE PROPOSTA (Onde aparece o 3º Botão) */}
              {draftShift && (
                  <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700 p-6 rounded-xl shadow-2xl relative animate-fade-in">
                      <div className="flex justify-between items-start mb-4 border-b border-slate-700 pb-4">
                          <div>
                              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                  <AlertCircle className="text-yellow-400" size={20}/> Resumo da Proposta
                              </h3>
                              <p className="text-sm text-slate-400">
                                  Revise os dados antes de enviar para o médico.
                              </p>
                          </div>
                          
                          {/* BOTÃO 3: O GRANDE ENVIO */}
                          <button 
                             onClick={handleSendCompleteProposal}
                             className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-transform hover:scale-105"
                          >
                              <Send size={18}/> 3. ENVIAR ESCALA COMPLETA
                          </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Detalhes do Plantão</p>
                              <div className="bg-slate-950 p-3 rounded border border-slate-800 text-sm text-slate-300">
                                  <p>📅 Data: <span className="text-white font-bold">{new Date(draftShift.date).toLocaleDateString()}</span></p>
                                  <p>⏰ Horário: <span className="text-white font-bold">{draftShift.start} às {draftShift.end}</span></p>
                                  <p>🏥 Local: {HOSPITAL_DATA.name}</p>
                              </div>
                          </div>
                          <div>
                              <p className="text-xs font-bold text-slate-500 uppercase mb-2">Pacientes Agendados ({stagedPatients.length})</p>
                              <div className="bg-slate-950 p-2 rounded border border-slate-800 h-32 overflow-y-auto space-y-1">
                                  {stagedPatients.length === 0 && <p className="text-slate-600 text-xs italic p-2">Nenhum paciente adicionado ainda.</p>}
                                  {stagedPatients.map(p => (
                                      <div key={p.id} className="flex justify-between items-center bg-slate-900 p-2 rounded border border-slate-800">
                                          <div className="flex items-center gap-2">
                                              <span className="text-emerald-400 font-mono text-xs font-bold">{p.scheduledTime}</span>
                                              <span className="text-white text-xs">{p.patientName}</span>
                                          </div>
                                          <button onClick={() => handleRemoveStaged(p.id)} className="text-slate-600 hover:text-red-400"><Trash2 size={12}/></button>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {/* CALENDÁRIO (Visualização de referência) */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl shrink-0 opacity-70 hover:opacity-100 transition-opacity">
                 {/* ... (Lógica do Calendário mantida igual ao original para referência visual) ... */}
                 <div className="bg-slate-800/50 p-2 border-b border-slate-800 flex justify-between items-center px-4">
                    <div className="flex items-center gap-4">
                        <button onClick={prevWeek} className="text-slate-400 hover:text-white"><ChevronLeft/></button>
                        <span className="text-sm font-bold text-white">{weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}</span>
                        <button onClick={nextWeek} className="text-slate-400 hover:text-white"><ChevronRight/></button>
                    </div>
                 </div>
                 <div className="grid grid-cols-8 border-b border-slate-800 bg-slate-900">
                    <div className="p-2 text-[10px] text-slate-500 text-center">HORA</div>
                    {weekDays.map((d, i) => (
                        <div key={i} className={`p-1 text-center border-l border-slate-800 ${isSameDay(d, new Date()) ? 'text-emerald-400' : 'text-slate-500'}`}>
                            <div className="text-[10px] font-bold">{d.toLocaleDateString('pt-BR', {weekday: 'short'}).toUpperCase()}</div>
                            <div className="text-sm font-black">{d.getDate()}</div>
                        </div>
                    ))}
                 </div>
                 <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                    {hours.map(h => (
                        <div key={h} className="grid grid-cols-8 border-b border-slate-800/50 min-h-[40px]">
                            <div className="text-[10px] text-slate-500 text-center py-2">{h}:00</div>
                            {weekDays.map((d, i) => {
                                // Mostra visualmente onde o "draft" vai cair
                                const isDraftDay = draftShift && draftShift.date === d.toISOString().split('T')[0];
                                const isDraftHour = isDraftDay && parseInt(draftShift.start.split(':')[0]) <= h && parseInt(draftShift.end.split(':')[0]) > h;
                                
                                return (
                                    <div key={i} className={`border-l border-slate-800/50 relative ${isDraftHour ? 'bg-emerald-900/10' : ''}`}>
                                        {/* Renderiza pacientes staged visualmente no calendário */}
                                        {isDraftDay && stagedPatients.filter(p => parseInt(p.scheduledTime.split(':')[0]) === h).map(p => (
                                            <div key={p.id} className="absolute inset-x-1 top-1 bg-indigo-600 text-white text-[9px] rounded px-1 truncate">
                                                {p.patientName}
                                            </div>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                 </div>
              </div>

            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600">
            <div className="text-center">
                <UserIcon size={48} className="mx-auto mb-4 opacity-20"/>
                <p>Selecione um médico na barra lateral</p>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: CONFIGURAR PLANTÃO */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-80 shadow-2xl animate-scale-in">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Calendar className="text-emerald-400" /> Configurar Horário</h3>
            <form onSubmit={handleConfigureShift} className="space-y-3">
              <label className="text-xs text-slate-400 font-bold block">DATA</label>
              <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 outline-none" />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-slate-400 font-bold block">INÍCIO</label>
                  <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 outline-none" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-slate-400 font-bold block">FIM</label>
                  <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded border border-slate-600 outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={() => setIsShiftModalOpen(false)} className="flex-1 py-2 bg-slate-800 text-white rounded">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-emerald-600 text-white rounded font-bold">Definir</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADICIONAR PACIENTE */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-[500px] shadow-2xl animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Adicionar Paciente ao Plantão</h3>
              <button onClick={() => setIsPatientModalOpen(false)}><X className="text-slate-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleStagePatient} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">NOME COMPLETO</label>
                <input type="text" value={patientName} onChange={e => setPatientName(e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none focus:border-emerald-500" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 font-bold block mb-1">HORÁRIO ({draftShift?.start} - {draftShift?.end})</label>
                  <input type="time" value={patientTime} onChange={e => setPatientTime(e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none focus:border-emerald-500" />
                </div>
                <div>
                   <label className="text-xs text-slate-400 font-bold block mb-1">PRIORIDADE</label>
                   <select value={priority} onChange={e => setPriority(e.target.value as any)} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none">
                       <option value="BAIXA">Baixa</option>
                       <option value="MEDIA">Média</option>
                       <option value="ALTA">Alta</option>
                   </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="text-xs text-slate-400 font-bold block mb-1">IDADE</label><input type="text" value={patientAge} onChange={e => setPatientAge(e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none"/></div>
                 <div><label className="text-xs text-slate-400 font-bold block mb-1">LEITO</label><input type="text" value={patientBed} onChange={e => setPatientBed(e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none"/></div>
              </div>
              <div>
                <label className="text-xs text-slate-400 font-bold block mb-1">DIAGNÓSTICO</label>
                <textarea value={patientDiagnosis} onChange={e => setPatientDiagnosis(e.target.value)} className="w-full bg-slate-800 text-white p-2 rounded-lg border border-slate-600 outline-none focus:border-emerald-500 resize-none" rows={3} placeholder="Opcional..." />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsPatientModalOpen(false)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-bold text-sm">Cancelar</button>
                <button type="submit" className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg text-sm flex items-center justify-center gap-2">
                    <Plus size={16} /> ADICIONAR
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};