# HealthFlow — Checklist: O que temos vs o que falta

Referência: plano ChatGPT (rede social médica, módulos 1–7) + análise do código atual.

---

## ✅ O QUE JÁ TEMOS

### 1. Rede Médica
- [x] **Cadastro de rede** — `networkService`, `NetworkModal`
- [x] **Colegas** — adicionar/remover por e-mail
- [x] **Diretório** — busca em `directory/{email}` (CFM/fake)
- [x] **Perfil básico** — `ProfileModal`: nome, CRM, especialidade, telefone

### 2. Agenda e Plantões
- [x] **Agenda de plantões** — `ScheduleCalendar`, `useShifts`
- [x] **Troca de plantões entre médicos** — `useShiftExchange`, `shift_requests`
- [x] **Transferir plantão + pacientes** — `TransferModal`, `transferService`
- [x] **ClinicManager** — hospital cria plantões e envia para médicos

### 3. Analisador de Fadiga
- [x] **SAFTE-FAST** — `fatigueService`
- [x] **Gráfico de fadiga** — `FatigueChart`
- [x] **Zerar fadiga** por plantão
- [x] **Barra de carga** no painel médico

### 4. Pacientes e Procedimentos
- [x] **Cadastro de pacientes** — `PatientsModal`, `usePatients`
- [x] **Procedimentos no plantão** — `ProcedureInput`, `useProcedures`
- [x] **Pacientes vindos do hospital** — 1 clique para cadastrar no banco do médico

### 5. Ferramentas Clínicas (Tools)
- [x] **Calculadoras** — CHA2DS2-VASc, HAS-BLED, Clearance creatinina
- [x] **Bulário + pesagem** — `bulario.json` + dose/kg
- [x] **Receita inteligente** — medicamentos por peso
- [x] **Dose pediátrica**
- [x] **Guia de drogas IV** — Firebase `medicaments`
- [x] **Links APIs** — ANVISA, PubMed, UpToDate

### 6. Barra Lateral (Rede Social)
- [x] **MedicalSidebar** — Feed, Rede, Conversas, Discussões, Parcerias, Marketplace, APIs, Hospitais
- [x] **Integração** — Rede abre NetworkModal

### 7. Oportunidades (Vagas)
- [x] **Tela Opportunities** — layout e UI
- [x] **Dados reais** — `useOpportunities`, Firebase `vacancies`, `applications`
- [x] **Publicar vaga** — modal para instituições (gratuito)

### 8. Outros
- [x] **Recepção** — planejador de escalas (gauss + capacitivo)
- [x] **Locais** — `LocationsManager`
- [x] **Calendário** — `RosterSideCalendar`
- [x] **Curva gaussiana** — `BellCurveChart`, `gaussianService`
- [x] **Notificações** — `NotificationsMenu`

---

## ❌ O QUE FALTA (plano completo)

### Módulo 1 — Biblioteca & Ferramentas Clínicas
- [x] Calculadoras (CHA2DS2-VASc, HAS-BLED, Clearance)
- [x] Bulário com pesagem
- [ ] Protocolos por especialidade
- [ ] Interações medicamentosas
- [ ] IA para resumo de artigos

### Módulo 2 — Vagas de Plantões e Empregos
- [x] Tela de oportunidades (UI)
- [x] Firebase: coleção `vacancies`
- [x] Instituições publicando vagas (modal)
- [x] Candidatura com 1 clique → `applications`
- [ ] Filtros: especialidade, região, valor, turno
- [ ] Banner “Publique suas vagas” funcional

### Módulo 3 — Parcerias Profissionais
- [ ] Busca por especialidade / interesse / região
- [ ] Propostas (clínica, pesquisa, telemedicina)
- [ ] Tela/aba Parcerias

### Módulo 4 — Marketplace de Serviços Médicos
- [ ] Laudos, segunda opinião, teleconsultoria
- [ ] Perfil do prestador
- [ ] Pagamento integrado
- [ ] Contrato digital

### Módulo 5 — Planos de Monetização
- [ ] Plano Free / Premium Clínico / Premium Pro / Institucional
- [ ] Gate de funcionalidades por plano
- [ ] Assinatura R$ 200/ano (proposta inicial)

### Módulo 6 — Integração com Prontuário + API
- [ ] API REST/FHIR para hospitais e universidades
- [ ] Integração com sistemas hospitalares
- [ ] Importação/exportação anonimizada
- [ ] LGPD / auditoria

### Módulo 7 — Estatísticas de Impacto Clínico
- [ ] Métricas: eventos adversos, tempo diagnóstico, aderência
- [ ] Dashboards institucionais
- [ ] Relatórios premium

### Monetização por Anúncios (institucional)
- [ ] Anúncios de clínicas/hospitais
- [ ] Destaque de vagas
- [ ] Relatórios agregados (anonimizados)
- [ ] Modelo: instituições pagam, médicos gratuitos

---

## 🚀 PRÓXIMOS PASSOS (prioridade)

1. **Vagas reais** — criar `useOpportunities`, coleção `vacancies` no Firebase, formulário para instituições.
2. **Perfil completo** — cidade, UF, isPublic, instituição (já parcial no Header).
3. **Parcerias** — seção na MedicalSidebar + coleção `partnership_requests`.
4. **Marketplace** — tela/aba placeholder + modelo de dados.
5. **Planos** — campo `plan` no perfil (free/premium) + gates simples.

---

## Coleções Firebase atuais

| Coleção | Uso |
|---------|-----|
| `users/{uid}` | Perfil, cidade, uf, isPublic |
| `users/{uid}/shifts` | Plantões do médico |
| `users/{uid}/shifts/{sid}/procedures` | Procedimentos do plantão |
| `users/{uid}/patients` | Pacientes do médico |
| `users/{uid}/network` | Colegas (rede) |
| `users/{uid}/locations` | Locais de trabalho |
| `users/{uid}/medicaments` | (não usado; medicaments é coleção global) |
| `directory/{email}` | Índice para busca de médicos |
| `shift_requests` | Solicitações de troca de plantão |
| `roster` | Plantões públicos (roster) |
| `medicaments` | Drogas IV (Tools) |
| `appointments` | (useAppointments) |
| `procedures` | (useReceptionService) |

## Coleções criadas / a criar

| Coleção | Uso | Status |
|---------|-----|--------|
| `vacancies` | Vagas de plantão/emprego (instituições) | ✅ Criada |
| `applications` | Candidaturas a vagas | ✅ Criada |
| `partnership_requests` | Propostas de parceria |
| `feed_posts` | Feed da rede (opcional) |
| `conversations` | Chat médico–médico (opcional) |

---

## ⚠️ Firestore: índice necessário

Para a query de vagas (`vacancies` orderBy `createdAt` desc), crie o índice no Firebase Console ou use o link que aparece no erro ao rodar a primeira vez.
