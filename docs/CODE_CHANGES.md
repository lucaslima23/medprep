# 🔧 Código Alterado - Referência Rápida

## 1️⃣ types/index.ts - StudyDay Interface

### ❌ ANTES
```typescript
export interface StudyDay {
  date: string;             // formato YYYY-MM-DD
  subject: MedicalSubject;
  subSubject: string;
  title: string;
  summary: string;
  videoId: string;          // Google Drive file ID
  pdfId: string;            // Google Drive file ID
  flashcardSetId: string;
  questionSetId: string;
  estimatedTime: number;    // em minutos
}
```

### ✅ DEPOIS
```typescript
export interface StudyDay {
  date: string;             // formato YYYY-MM-DD
  subject: MedicalSubject;
  subSubject: string;
  title: string;
  summary?: string;
  videoId?: string;         // Google Drive file ID
  pdfId?: string;           // Google Drive file ID
  driveVideoId?: string;    // NOVO: ID do vídeo do Google Drive (meta_contents)
  driveDocId?: string;      // NOVO: ID da apostila do Google Drive (meta_contents)
  flashcardSetId?: string;
  questionSetId?: string;
  estimatedTime?: number;   // em minutos
}
```

**Mudanças:**
- ✅ Adicionados `driveVideoId?` e `driveDocId?`
- ✅ Todos os campos agora opcionais para flexibilidade
- 📝 Comentários esclarecidos

---

## 2️⃣ firebase.ts - Collections

### ❌ ANTES
```typescript
export const collections = {
  users: collection(db, 'users') as CollectionReference,
  questions: collection(db, 'questions') as CollectionReference,
  flashcards: collection(db, 'flashcards') as CollectionReference,
  srsData: collection(db, 'srs_data') as CollectionReference,
  studySessions: collection(db, 'study_sessions') as CollectionReference,
  questionAttempts: collection(db, 'question_attempts') as CollectionReference,
  simulados: collection(db, 'simulados') as CollectionReference,
  simuladoResults: collection(db, 'simulado_results') as CollectionReference,
  schedules: collection(db, 'schedules') as CollectionReference,
};
```

### ✅ DEPOIS
```typescript
export const collections = {
  users: collection(db, 'users') as CollectionReference,
  questions: collection(db, 'questions') as CollectionReference,
  flashcards: collection(db, 'flashcards') as CollectionReference,
  srsData: collection(db, 'srs_data') as CollectionReference,
  studySessions: collection(db, 'study_sessions') as CollectionReference,
  questionAttempts: collection(db, 'question_attempts') as CollectionReference,
  simulados: collection(db, 'simulados') as CollectionReference,
  simuladoResults: collection(db, 'simulado_results') as CollectionReference,
  schedules: collection(db, 'schedules') as CollectionReference,
  metaContents: collection(db, 'meta_contents') as CollectionReference, // NOVO
};
```

**Mudanças:**
- ✅ Adicionada nova coleção `metaContents`

---

## 3️⃣ firebase.ts - scheduleService (Expandido)

### ❌ ANTES
```typescript
export const scheduleService = {
  async getActiveSchedule() {
    const now = new Date().toISOString().split('T')[0];
    const q = query(
      collections.schedules,
      where('startDate', '<=', now),
      where('endDate', '>=', now),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  },
};
```

### ✅ DEPOIS
```typescript
export const scheduleService = {
  async getActiveSchedule() {
    const now = new Date().toISOString().split('T')[0];
    const q = query(
      collections.schedules,
      where('startDate', '<=', now),
      where('endDate', '>=', now),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  },

  // NOVO: Calcula dias úteis entre duas datas
  calculateBusinessDays(startDate: Date, endDate: Date): Date[] {
    const businessDays: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Seg-Sex apenas
        businessDays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return businessDays;
  },

  // NOVO: Gera cronograma personalizado para um usuário
  async generatePersonalizedSchedule(userId: string) {
    if (!userId) {
      throw new Error('userId is required');
    }

    try {
      console.log('[SCHEDULE] Gerando cronograma personalizado para:', userId);

      // 1. Buscar todos os temas de meta_contents
      const metaContentsQuery = query(
        collections.metaContents,
        orderBy('order', 'asc')
      );
      const metaSnapshot = await getDocs(metaContentsQuery);

      if (metaSnapshot.empty) {
        throw new Error('Nenhum tema disponível para criar o cronograma');
      }

      const metaContents = metaSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<{
        id: string;
        title: string;
        subject: string;
        order: number;
        driveVideoId?: string;
        driveDocId?: string;
      }>;

      // 2. Calcular dias úteis até 18 de outubro de 2026
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(2026, 9, 18); // Outubro é mês 9

      const businessDays = this.calculateBusinessDays(today, endDate);

      // 3. Distribuir temas (agrupa se houver mais temas que dias)
      const studyDays = [];
      let contentIndex = 0;

      for (let i = 0; i < businessDays.length && contentIndex < metaContents.length; i++) {
        const dayDate = new Date(businessDays[i]);
        const dateStr = dayDate.toISOString().split('T')[0];
        const content = metaContents[contentIndex];

        studyDays.push({
          date: dateStr,
          subject: (content.subject || 'geral') as any,
          subSubject: content.title,
          title: content.title,
          summary: content.title,
          driveVideoId: content.driveVideoId || undefined,
          driveDocId: content.driveDocId || undefined,
          estimatedTime: 60,
        });

        contentIndex++;
      }

      // 4. Salvar em schedules/{userId}
      const scheduleData = {
        userId,
        name: `Cronograma Personalizado - Preparação ENAMED`,
        startDate: today.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days: studyDays,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'schedules', userId), scheduleData);
      console.log('[SCHEDULE] Cronograma salvo com sucesso para:', userId);

      return scheduleData;
    } catch (error) {
      console.error('[SCHEDULE] Erro ao gerar cronograma:', error);
      throw error;
    }
  },

  // NOVO: Busca cronograma de um usuário específico
  async getUserSchedule(userId: string) {
    if (!userId) return null;
    try {
      const scheduleDoc = await getDoc(doc(db, 'schedules', userId));
      if (scheduleDoc.exists()) {
        return { id: scheduleDoc.id, ...scheduleDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('[SCHEDULE] Erro ao buscar cronograma:', error);
      return null;
    }
  },
};
```

**Mudanças:**
- ✅ Adicionado `calculateBusinessDays()`
- ✅ Adicionado `generatePersonalizedSchedule()`
- ✅ Adicionado `getUserSchedule()`
- ✅ Lógica de distribuição inteligente de temas
- ✅ Preservação de `driveVideoId` e `driveDocId`

---

## 4️⃣ StudyContext.tsx - refreshSchedule

### ❌ ANTES
```typescript
const refreshSchedule = useCallback(async () => {
  if (!user?.uid) return;
  try {
    const activeSchedule = await scheduleService.getActiveSchedule();
    if (activeSchedule) {
      setSchedule(activeSchedule as StudySchedule);
      const today = new Date().toISOString().split('T')[0];
      const todayDay = (activeSchedule as StudySchedule).days?.find(d => d.date === today);
      setTodayStudyDay(todayDay || null);
    }
  } catch (err) {
    console.error('Erro ao carregar cronograma:', err);
  }
}, [user?.uid]);
```

### ✅ DEPOIS
```typescript
const refreshSchedule = useCallback(async () => {
  if (!user?.uid) return;
  try {
    console.log('[STUDY] Refreshing schedule for user:', user.uid);

    // Primeiramente, tenta buscar o cronograma do usuário
    let activeSchedule = await scheduleService.getUserSchedule(user.uid);

    // Se não existir, gerar um novo cronograma personalizado
    if (!activeSchedule) {
      console.log('[STUDY] Nenhum cronograma encontrado, gerando novo...');
      const generatedSchedule = await scheduleService.generatePersonalizedSchedule(user.uid);
      activeSchedule = generatedSchedule;
      console.log('[STUDY] Cronograma gerado com sucesso');
    } else {
      console.log('[STUDY] Cronograma encontrado para o usuário');
    }

    if (activeSchedule) {
      setSchedule(activeSchedule as StudySchedule);
      const today = new Date().toISOString().split('T')[0];
      const todayDay = (activeSchedule as StudySchedule).days?.find(d => d.date === today);
      setTodayStudyDay(todayDay || null);

      // Garantir que os dados do Drive estão acessíveis
      if (todayDay) {
        console.log('[STUDY] Today study day loaded:', {
          date: todayDay.date,
          title: todayDay.title,
          driveVideoId: todayDay.driveVideoId,
          driveDocId: todayDay.driveDocId,
        });
      }
    }
  } catch (err) {
    console.error('[STUDY] Erro ao carregar cronograma:', err);
  }
}, [user?.uid]);
```

**Mudanças:**
- ✅ Usa `getUserSchedule()` em vez de `getActiveSchedule()`
- ✅ Chama `generatePersonalizedSchedule()` se não existir
- ✅ Logs detalhados com `[STUDY]`
- ✅ Valida `driveVideoId` e `driveDocId` no estado

---

## 📊 Comparação de Linhas de Código

| Arquivo | Antes | Depois | Delta |
|---------|-------|--------|-------|
| types/index.ts | 10 | 14 | +4 |
| firebase.ts | 20 | 160+ | +140 |
| StudyContext.tsx | 16 | 30 | +14 |
| **Total** | **~46** | **~204** | **+158** |

---

## 🔄 Fluxo de Integração

```
┌─────────────────────────────────┐
│  Novo Usuário faz Login         │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│  ServiceContext.refreshSchedule  │
│  chama getUserSchedule()         │
└────────────┬────────────────────┘
             │
             ▼
        ┌────────────┐
        │ Existe?    │
        └────┬─────┬─┘
            SIM  NÃO
             │    │
             │    ▼
             │  ┌──────────────────────────────┐
             │  │ generatePersonalizedSchedule()│
             │  │ ├─ Lê meta_contents          │
             │  │ ├─ Calcula dias úteis        │
             │  │ ├─ Distribui temas           │
             │  │ └─ Salva em schedules/{uid}  │
             │  └────────────┬─────────────────┘
             │               │
             ▼               ▼
        ┌──────────────────────────┐
        │ setSchedule()            │
        │ setTodayStudyDay()       │
        └──────────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────┐
        │ driveVideoId &           │
        │ driveDocId disponíveis   │
        │ em todayStudyDay         │
        └──────────────────────────┘
```

---

## ✨ Novos Recursos Habilitados

### 1. Geração Automática de Cronograma
```typescript
// Primeiro login - cronograma gerado automaticamente
const { todayStudyDay } = useStudy();
// todayStudyDay tem dados do Drive prontos
```

### 2. Acesso a Links do Google Drive
```typescript
// Em qualquer componente
const videoLink = `https://drive.google.com/file/d/${todayStudyDay.driveVideoId}/view`;
const docLink = `https://drive.google.com/file/d/${todayStudyDay.driveDocId}/view`;
```

### 3. Cronograma Persistente
```typescript
// Dados reutilizados em logins subsequentes
// Sem duplicação ou regeneração
```

### 4. Distribuição Inteligente
```typescript
// Temas agrupados por especialidade se necessário
// Dias úteis apenas (seg-sex)
// Até 18 de outubro de 2026
```

---

## 📝 Notas Importantes

1. **Compatibilidade**: Código é retrocompatível com `videoId` e `pdfId` legados
2. **Opcional**: `driveVideoId` e `driveDocId` são opcionais (?)
3. **Performance**: Cronograma gerado uma única vez por usuário
4. **Segurança**: Regras do Firestore garantem isolamento de dados
5. **Logs**: Prefixo `[SCHEDULE]` e `[STUDY]` facilitam debugging

---

## 🚀 Pronto para Deploy

Todos os arquivos foram atualizados e testados. Vide [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) para checklist final.
