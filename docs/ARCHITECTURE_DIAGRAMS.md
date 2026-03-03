# 📈 Diagramas e Visualizações - Arquitetura do Cronograma

## 1. Fluxo Completo de Login e Geração de Cronograma

```
┌──────────────────────────────────────────────────────────────────┐
│                         USUÁRIO                                  │
│                    Abre Aplicação                                │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    AuthContext                                   │
│              Detecta auth.currentUser()                          │
│                 setUser(firebaseUser)                           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                  StudyProvider Component                          │
│            Detecta mudança em user.uid                           │
│                 useEffect triggered                              │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    ▼                 ▼
         ┌──────────────────┐  ┌─────────────────┐
         │ refreshSchedule()│  │ refreshSRSData()│
         └────────┬─────────┘  └─────────────────┘
                  │
                  ▼
    ┌─────────────────────────────────────┐
    │ scheduleService.getUserSchedule()   │
    │ Buscar em: schedules/{userId}       │
    └────────┬─────────────────────────────┘
             │
             │
      ┌──────▼──────┐
      │ Encontrado? │
      └──┬────────┬─┘
        SIM     NÃO
         │       │
         │       ▼
         │   ┌─────────────────────────────────────────────┐
         │   │ generatePersonalizedSchedule(userId)        │
         │   └────────┬────────────────────────────────────┘
         │            │
         │            ▼
         │   ┌─────────────────────────────────────────────┐
         │   │ 1. Buscar meta_contents da Firestore        │
         │   │    orderBy('order', 'asc')                  │
         │   └────────┬────────────────────────────────────┘
         │            │
         │            ▼
         │   ┌─────────────────────────────────────────────┐
         │   │ 2. Calcular dias úteis                      │
         │   │    - Data inicio: Hoje                      │
         │   │    - Data fim: 18 out 2026                  │
         │   │    - Ignorar: domingos + sábados            │
         │   │    - Resultado: Array<Date>                 │
         │   └────────┬────────────────────────────────────┘
         │            │
         │            ▼
         │   ┌─────────────────────────────────────────────┐
         │   │ 3. Distribuir temas nos dias                │
         │   │    - 1 tema por dia útil                    │
         │   │    - Se temas > dias:                       │
         │   │      Agrupar mesmos assuntos na linha       │
         │   │    - Criar array StudyDay[]                 │
         │   └────────┬────────────────────────────────────┘
         │            │
         │            ▼
         │   ┌─────────────────────────────────────────────┐
         │   │ 4. Preservar dados do Drive                 │
         │   │    - driveVideoId: from meta_contents       │
         │   │    - driveDocId: from meta_contents         │
         │   └────────┬────────────────────────────────────┘
         │            │
         │            ▼
         │   ┌─────────────────────────────────────────────┐
         │   │ 5. Salvar em Firestore                      │
         │   │    schedules/{userId} = {                   │
         │   │      userId, name, startDate,               │
         │   │      endDate, days[], createdAt             │
         │   │    }                                        │
         │   └────────┬────────────────────────────────────┘
         │            │
         └────────┬───┘
                  │
                  ▼
    ┌──────────────────────────────────────┐
    │ setSchedule(activeSchedule)          │
    │ setState com cronograma completo     │
    └─────────┬──────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────────┐
    │ Encontrar dia de hoje em schedule    │
    │ today = YYYY-MM-DD                   │
    │ todayDay = days?.find(d=>d.date===t) │
    └─────────┬──────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────────┐
    │ setTodayStudyDay(todayDay)           │
    │ Include: driveVideoId & driveDocId   │
    └─────────┬──────────────────────────────┘
              │
              ▼
    ┌──────────────────────────────────────┐
    │ Componentes recebem dados            │
    │ via useStudy() hook                  │
    │                                      │
    │ Acesso a:                            │
    │ - schedule (cronograma completo)     │
    │ - todayStudyDay (dia de hoje)        │
    │ - driveVideoId (link vídeo)          │
    │ - driveDocId (link documento)        │
    └──────────────────────────────────────┘
```

---

## 2. Estrutura de Dados - Firebase

```
FIRESTORE DATABASE
│
├── 📁 meta_contents (Coleção Mestre)
│   ├── 🔴 ginecologia_1
│   │   ├── title: "Introdução à Ginecologia"
│   │   ├── subject: "ginecologia"
│   │   ├── order: 1
│   │   ├── driveVideoId: "abc123..."
│   │   └── driveDocId: "def456..."
│   ├── 🔴 ginecologia_2
│   │   └── [dados...]
│   ├── 🔵 pediatria_1
│   │   └── [dados...]
│   └── ... (34 documentos no exemplo)
│
├── 📁 schedules (Cronogramas Personalizados)
│   ├── 👤 user_id_1
│   │   ├── userId: "user_id_1"
│   │   ├── name: "Cronograma Personalizado..."
│   │   ├── startDate: "2026-02-07"
│   │   ├── endDate: "2026-10-18"
│   │   ├── createdAt: Timestamp(...)
│   │   └── days: [
│   │       {
│   │         date: "2026-02-09",
│   │         subject: "ginecologia",
│   │         title: "Introdução à Ginecologia",
│   │         driveVideoId: "abc123...",
│   │         driveDocId: "def456...",
│   │         estimatedTime: 60
│   │       },
│   │       {
│   │         date: "2026-02-10",
│   │         subject: "ginecologia",
│   │         title: "Ciclo Menstrual e Fisiologia",
│   │         driveVideoId: "xyz789...",
│   │         driveDocId: "uvw012...",
│   │         estimatedTime: 60
│   │       },
│   │       ... (até 18 out 2026)
│   │     ]
│   ├── 👤 user_id_2
│   │   └── [dados...]
│   └── 👤 user_id_3 (novo usuário - será criado ao fazer login)
│
├── 📁 users
├── 📁 questions
├── 📁 flashcards
├── 📁 srs_data
└── ... (outras coleções)
```

---

## 3. Fluxo de Dados - React Components

```
┌──────────────────────────────────────────────────────────────┐
│                    AuthContext                               │
│  user: { uid, email, displayName, ... } | null             │
└────────────────┬─────────────────────────────────────────────┘
                 │
                 │ notifica
                 ▼
┌──────────────────────────────────────────────────────────────┐
│                   StudyProvider                              │
│                (StudyContext.tsx)                            │
│                                                              │
│  const [schedule, setSchedule]                              │
│  const [todayStudyDay, setTodayStudyDay]                    │
│  const [loading, setLoading]                                │
│  const [dueFlashcards, ...]                                 │
│                                                              │
│  useEffect(() => {                                          │
│    refreshSchedule()               ◄─── Gerado!            │
│    refreshSRSData()                                         │
│  }, [user.uid])                                            │
│                                                              │
│  return <StudyContext.Provider value={{                     │
│    schedule,          ◄─── StudySchedule                    │
│    todayStudyDay,     ◄─── StudyDay com driveIds           │
│    loading,                                                 │
│    dueFlashcards,                                           │
│    ...                                                      │
│  }} />                                                      │
└────────────────┬─────────────────────────────────────────────┘
                 │
        ┌────────┴────────┬──────────────┐
        │                 │              │
        ▼                 ▼              ▼
   ┌────────────┐  ┌────────────┐ ┌────────────┐
   │ Dashboard  │  │ Calendar   │ │ Sidebar    │
   │            │  │            │ │            │
   │ useStudy() │  │ useStudy() │ │ useStudy() │
   │            │  │            │ │            │
   │ Acesso:    │  │ Acesso:    │ │ Acesso:    │
   │ - today... │  │ - schedule │ │ - todayD.. │
   │ - driveV.. │  │ - days[]   │ │ - priveD.. │
   │ - driveD.. │  │            │ │            │
   └────────────┘  └────────────┘ └────────────┘
```

---

## 4. Ciclo de Vida - Primeiro Login vs. Logins Subsequentes

### 🆕 PRIMEIRO LOGIN
```
         1. Login
            │
            ▼
    Criar Auth User
            │
            ▼
    AuthContext: setUser()
            │
            ▼
    StudyProvider useEffect
            │
            ▼
    refreshSchedule()
            │
            ▼
    getUserSchedule(uid)
    "Não encontrado" ← null
            │
            ▼
    generatePersonalizedSchedule(uid)
    └─ Lê meta_contents
    └─ Calcula dias úteis
    └─ Distribui temas
    └─ SALVA schedules/{uid}
            │
            ▼
    setSchedule() ✅
    setTodayStudyDay() ✅
            │
            ▼
    Dashboard renderiza com dados
    Links do Drive disponíveis 🎉
```

### 🔄 LOGIN SUBSEQUENTE
```
         1. Login
            │
            ▼
    Recuperar Auth User
            │
            ▼
    AuthContext: setUser()
            │
            ▼
    StudyProvider useEffect
            │
            ▼
    refreshSchedule()
            │
            ▼
    getUserSchedule(uid)
    "Encontrado" ← Firestore schedules/{uid}
            │
            ▼
    setSchedule() ✅
    setTodayStudyDay() ✅
            │
            ▼
    Dashboard renderiza com dados
    (Sem gerar novo cronograma)
```

---

## 5. Mapa de Funcionalidades

```
┌─────────────────────────────────────────────────────────────┐
│          CRONOGRAMA PERSONALIZADO - MAPA                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Geração Automática                                     │
│     └─ No primeiro login                                   │
│     └─ Baseado em meta_contents                           │
│                                                             │
│  ✅ Distribuição Inteligente                               │
│     └─ Dias úteis apenas (seg-sex)                        │
│     └─ Até 18 de outubro de 2026                          │
│     └─ Agrupa temas se necessário                         │
│                                                             │
│  ✅ Google Drive Integration                               │
│     └─ Links de vídeo (driveVideoId)                      │
│     └─ Links de documentos (driveDocId)                   │
│     └─ Acessíveis em todayStudyDay                        │
│                                                             │
│  ✅ Persistência                                           │
│     └─ Salvo em Firestore                                 │
│     └─ Reutilizado em logins subsequentes                 │
│     └─ Sem duplicação                                     │
│                                                             │
│  ✅ Segurança                                              │
│     └─ Isolado por usuário (rules)                        │
│     └─ Leitura de meta_contents pública                   │
│     └─ Escrita apenas via serviço                         │
│                                                             │
│  ✅ Observabilidade                                        │
│     └─ Logs [SCHEDULE] e [STUDY]                          │
│     └─ Fácil debugging                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Exemplo de Uso em Componentes

### Dashboard
```
┌─────────────────────────────────────┐
│         DASHBOARD                   │
├─────────────────────────────────────┤
│                                     │
│  📅 Tema para Hoje:                │
│  "Ciclo Menstrual e Fisiologia"    │
│                                     │
│  📹 [Assistir Vídeo] ◄─ link       │
│  📄 [Abrir Apostila] ◄─ link       │
│                                     │
│  Tópico: Ginecologia                │
│  Tempo estimado: 60 min             │
│                                     │
└─────────────────────────────────────┘
       ^                    ^
       │                    │
   todayStudyDay.title      │
   todayStudyDay.subject    │
   todayStudyDay.driveVideoId (👈 novo)
   todayStudyDay.driveDocId (👈 novo)
   todayStudyDay.estimatedTime
```

### Calendário
```
┌──────────────────────────────────────┐
│    CALENDÁRIO DE ESTUDOS             │
├──────────────────────────────────────┤
│                                      │
│  FEV 2026                            │
│  ┌──┬──┬──┬──┬──┬──┬──┐            │
│  │07│08│09│10│11│12│13│            │
│  │  │  │📹│📹│📹│  │  │            │
│  │  │  │📄│📄│📄│  │  │            │
│  └──┴──┴──┴──┴──┴──┴──┘            │
│     Teste: 09/02 - Ginec. (video)   │
│     Teste: 10/02 - Ginec. (doc)     │
│                                      │
│  Legenda:                            │
│  📹 = Tem vídeo (driveVideoId)       │
│  📄 = Tem documento (driveDocId)     │
│                                      │
└──────────────────────────────────────┘
         ^
    schedule.days[]
    map(day => <DayCell day={day} />)
    Mostra driveVideoId & driveDocId
```

---

## 7. Integração com Google Drive

```
APLICAÇÃO
    │
    ├─► studyDay.driveVideoId = "1a2b3c4d5e6f..."
    │   └─► Link: https://drive.google.com/file/d/1a2b3c4d5e6f.../view
    │
    └─► studyDay.driveDocId = "9i0j8h7g6f5e..."
        └─► Link: https://drive.google.com/file/d/9i0j8h7g6f5e.../view
```

---

## 8. Métricas e Estatísticas (Pós-Implementação)

```
┌────────────────────────────────────────┐
│         ESPERADO APÓS DEPLOY           │
├────────────────────────────────────────┤
│                                        │
│  👥 Usuários Novos:                   │
│  └─ Cronograma gerado automaticamente │
│  └─ 100% sucesso                      │
│                                        │
│  📊 Cobertura de Temas:                │
│  └─ 34 temas distribuídos              │
│  └─ ~130 dias úteis de estudo          │
│  └─ 1 tema por dia (maioria)           │
│                                        │
│  🔗 Links do Drive:                    │
│  └─ Vídeos: 34/34 (100%)              │
│  └─ Documentos: 34/34 (100%)          │
│  └─ Ambos disponíveis em todayDay     │
│                                        │
│  ⚡ Performance:                       │
│  └─ Geração: ~500-1000ms              │
│  └─ Recuperação: ~100-200ms           │
│  └─ Leitura meta_contents: ~50ms      │
│                                        │
│  📈 Retenção:                          │
│  └─ Cronograma persiste                │
│  └─ Sem duplicação em logins           │
│  └─ Dados consistentes                 │
│                                        │
└────────────────────────────────────────┘
```

---

## 📋 Checklist Visual de Implementação

```
NODE: estudar/implementar em ordem

❌→✅  Estrutura tipos (StudyDay)
❌→✅  Collections no Firebase
❌→✅  calculateBusinessDays()
❌→✅  generatePersonalizedSchedule()
❌→✅  getUserSchedule()
❌→✅  refreshSchedule() atualizado
❌→✅  Documentação completa
❌→✅  Exemplos de dados
❌→✅  Regras de segurança
❌→✅  Script de testes

        === PRONTO PARA DEPLOY ===
```

---

**Fim dos Diagramas e Visualizações**
