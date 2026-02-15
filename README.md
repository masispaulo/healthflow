# README.md — HealthFlow Platform

HealthFlow é uma plataforma para gestão hospitalar e painel médico que separa responsabilidades por camadas (4 ORDENS) e por domínios (DDD).  
Objetivo: permitir que o **ClinicManager** (painel do hospital / funcionários) crie plantões, vagas e pacientes, enquanto o **Painel Médico** (médico) opera de forma autônoma, recebendo plantões/vagas quando o hospital envia.

---

## Como rodar localmente
**Pré‑requisitos:** Node.js

1. Instalar dependências  
   `npm install`

2. Variáveis de ambiente (desenvolvimento)  
   - Para usar mocks locais: `REACT_APP_USE_MOCK=true`  
   - Quando for usar APIs reais, configure `REACT_APP_API_BASE` e credenciais do backend.  
   - Se usar recursos de IA opcionais: `GEMINI_API_KEY` em `.env.local`.

3. Rodar a aplicação  
   `npm run dev`

> Observação: o projeto foi pensado para permitir desenvolvimento com um backend mock e, quando houver acesso ao Firestore, trocar o adapter sem refatorar a UI.

---

## Conceitos centrais
**4 ORDENS**  
1. 1ª ORDEM — Operação / ClinicManager: criação de plantões, pacientes, vagas, contas de staff e anúncios.  
2. 2ª ORDEM — Núcleo / Painel Médico (AnalysisDashboard): curva gaussiana, cálculo de fadiga, fila, procedimentos e análise.  
3. 3ª ORDEM — Documentação / Rastreabilidade: logs, threads, histórico de candidaturas e aceites.  
4. 4ª ORDEM — Planejamento / Estratégico: relatórios, anúncios premium e distribuição de vagas.

**Papéis e fluxos**  
- ClinicManager (staff do hospital): login separado do médico; cria vagas, plantões e pacientes; envia plantões/pacientes para médicos por ID ou por visibilidade (cidade + perfil público).  
- Painel Médico (médico): autônomo — cria pacientes e procedimentos localmente; gera curva e fadiga; recebe plantões e vagas enviados pelo ClinicManager.  
- Vagas: grátis, pagas (envio inteligente para médicos com janelas livres) e premium (envio direcionado).  
- Comunicação: notificações in‑app (sininho) e messenger entre hospital ↔ médico.

---

## Modelo de dados sugerido (Firestore)
- hospitals: `{ id, name, city, ownerId, settings }`  
- users: `{ id, email, role, profilePublic, city, calendarMeta }`  
- shifts: `{ id, hospitalId, title, start, end, patients[], status, targetDoctorId?, assignedTo? }`  
- vacancies: `{ id, hospitalId, type, dates[], city, requirements, budget, targetDoctorIds[], sentTo[], premium, createdAt }`  
- applications, notifications, threads, clinic_staff para candidaturas, sininho, messenger e permissões.

**Privacidade:** usar `calendarMeta` (resumo de disponibilidade) para seleção sem expor agendas detalhadas.

---

## Estratégia incremental
1. Criar um adapter de API (`src/api/vacancies.ts`) com duas implementações: mock (in‑memory) e prod (Cloud Functions / Firestore).  
2. Desenvolver UI consumindo o adapter; trocar a implementação apenas no adapter quando o Firestore estiver disponível.  
3. Usar Cloud Functions para seleção assíncrona de vagas e envio de notificações.

---

## UI e fluxo do header de vagas
- Badge com contagem de vagas pagas/premium recebidas.  
- Menu com lista de vagas (título, hospital, datas).  
- Ações rápidas: Ver, Candidatar, Ignorar.  
- Separar seções: Convites Premium | Vagas Pagas.  
- Não remover o header de vagas do Clinic; adicionar o menu do médico ao header global.

---

## Checklist mínimo
- Header do médico mostra badge com contagem de vagas recebidas.  
- Menu lista vagas pagas/premium enviadas ao doctorId.  
- Candidatar remove vaga da lista e cria `application` (mock).  
- ClinicManager cria vaga paga → função de seleção envia notificações apenas para médicos com janelas livres.  
- ClinicManager cria plantão com pacientes e envia para doctorId → médico recebe notificação e aceita → shift aparece no painel do médico com pacientes.  
- Médico cria paciente/procedimento localmente → curva e análise funcionam sem ClinicManager.  
- Messenger entre hospital.staff e doctor funciona (thread criado ao candidatar/aceitar).

---

## Boas práticas
- Commits pequenos e frequentes com mensagens claras.  
- README como fonte de verdade: atualize sempre que mudar modelo de dados ou endpoints.  
- Issues curtas por tarefa (ex.: VAC-1, VAC-2, CLINIC-1).  
- Branch por feature para isolar mudanças.

---

## Próximos passos
Escolha qual arquivo quer primeiro e eu gero o conteúdo pronto para colar:  
- `src/api/mockServer.ts` (mock in‑memory)  
- `src/api/vacancies.ts` (adapter mock/real)  
- `src/components/Header/VacanciesMenu.tsx` (componente do header)  
- `functions/onVacancyCreate.ts` (esboço Cloud Function TypeScript)

---

# Arquivos prontos para colar

--- `src/api/mockServer.ts` ---
```ts
// mockServer.ts — in-memory mock para desenvolvimento local
type Vacancy = {
  id: string;
  hospitalId: string;
  title: string;
  type: 'free' | 'paid' | 'premium';
  dates: string[];
  city: string;
  sentTo: string[];
  premium?: boolean;
};

let vacancies: Vacancy[] = [
  { id: 'v1', hospitalId: 'h1', title: 'Plantão UTI', type: 'paid', dates: ['2026-01-25'], city: 'Campo Grande', sentTo: ['doc1'] },
  { id: 'v2', hospitalId: 'h1', title: 'Plantão Cirurgia', type: 'premium', dates: ['2026-01-26'], city: 'Campo Grande', sentTo: ['doc1'], premium: true }
];

export async function fetchVacanciesForDoctor(doctorId: string) {
  await new Promise(r => setTimeout(r, 150));
  return vacancies.filter(v => v.sentTo.includes(doctorId));
}

export async function applyToVacancy(vacancyId: string, doctorId: string) {
  await new Promise(r => setTimeout(r, 120));
  // cria application mock (retorno simples)
  return { ok: true, applicationId: `app-${Date.now()}`, vacancyId, doctorId };
}

export async function addVacancy(v: Vacancy) {
  vacancies.push(v);
  return v;
}
