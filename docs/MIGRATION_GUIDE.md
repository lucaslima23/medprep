# Migração do Cronograma para Firestore - Guia de Implementação

## 📋 Resumo das Mudanças

Este guia documenta a migração da lógica do cronograma para Firestore com estrutura dinâmica baseada em uma coleção mestre de temas (meta_contents).

---

## 1️⃣ Estrutura do Banco de Dados (Firestore)

### Coleção: `meta_contents`

Cada documento representa um tema e deve ter estes campos:

| Campo | Tipo | Descrição | Obrigatório |
|-------|------|-----------|-------------|
| `title` | string | Nome do tema | ✅ Sim |
| `subject` | enum | Especialidade (ginecologia, pediatria, cirurgia, clinica_medica, preventiva) | ✅ Sim |
| `order` | number | Ordem de sequência (1, 2, 3, ...) | ✅ Sim |
| `driveVideoId` | string | ID do vídeo no Google Drive | ❌ Opcional |
| `driveDocId` | string | ID da apostila/documento no Google Drive | ❌ Opcional |

### Exemplo de Documento:
```json
{
  "title": "Ciclo Menstrual e Fisiologia",
  "subject": "ginecologia",
  "order": 2,
  "driveVideoId": "1a2b3c4d5e6f7g8h9i0j",
  "driveDocId": "9i0j8h7g6f5e4d3c2b1a"
}
```

### Coleção: `schedules`

Cada documento é identificado pelo `userId` e contém:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `userId` | string | ID do usuário (Firebase Auth) |
| `name` | string | Nome do cronograma |
| `startDate` | string | Data de início (YYYY-MM-DD) |
| `endDate` | string | Data de término (YYYY-MM-DD) |
| `days` | array | Array de StudyDay |
| `createdAt` | timestamp | Data de criação |
| `updatedAt` | timestamp | Data da última atualização |

---

## 2️⃣ Como Importar os Dados no Firestore

### Opção A: Usando Console Firebase

1. Acesse [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto
3. Vá para **Firestore Database**
4. Crie a coleção **meta_contents** (se não existir)
5. Adicione cada documento manualmente ou use a importação em bulk

### Opção B: Script de Importação (Recomendado)

Crie um arquivo `importMetaContents.ts` na raiz do projeto:

```typescript
// importMetaContents.ts
import { db } from './src/services/firebase';
import { collection, setDoc, doc } from 'firebase/firestore';
import metaContentsData from './meta_contents_example.json';

async function importMetaContents() {
  const metaContentsCollection = collection(db, 'meta_contents');
  
  for (const item of metaContentsData) {
    const docId = `${item.subject}_${item.order}`;
    await setDoc(doc(metaContentsCollection, docId), item);
    console.log(`✅ Importado: ${item.title}`);
  }
  
  console.log('🎉 Importação concluída!');
}

importMetaContents().catch(console.error);
```

Execute com:
```bash
npx ts-node importMetaContents.ts
```

### Opção C: Usar Bulk Importer do Firebase

1. Baixe o arquivo `meta_contents_example.json`
2. Use uma ferramenta como [Firestore Bulk Importer](https://github.com/jblam/firebase-import-json-file) para importar em massa

---

## 3️⃣ Mudanças no Código

### ✅ Arquivo: `src/types/index.ts`

**StudyDay atualizado com novos campos:**

```typescript
export interface StudyDay {
  date: string;             // YYYY-MM-DD
  subject: MedicalSubject;
  subSubject: string;
  title: string;
  summary?: string;
  videoId?: string;         // Legado
  pdfId?: string;           // Legado
  driveVideoId?: string;    // NOVO: ID do vídeo do Google Drive (meta_contents)
  driveDocId?: string;      // NOVO: ID da apostila do Google Drive (meta_contents)
  flashcardSetId?: string;
  questionSetId?: string;
  estimatedTime?: number;
}
```

### ✅ Arquivo: `src/services/firebase.ts`

**Novos métodos adicionados ao `scheduleService`:**

#### `calculateBusinessDays(startDate: Date, endDate: Date): Date[]`
- Calcula todos os dias úteis (seg-sex) entre duas datas
- Ignora domingos e sábados

#### `generatePersonalizedSchedule(userId: string)`
- Lê todos os temas de `meta_contents` ordenados por `order`
- Calcula dias úteis entre hoje e 18 de outubro de 2026
- Distribui temas nos dias disponíveis
- Se há mais temas que dias, agrupa temas da mesma `subject`
- Preserva `driveVideoId` e `driveDocId` de cada tema
- Salva em `schedules/{userId}`

#### `getUserSchedule(userId: string)`
- Busca e retorna o cronograma específico do usuário
- Retorna `null` se não existir

### ✅ Arquivo: `src/contexts/StudyContext.tsx`

**`refreshSchedule` atualizado:**

```typescript
const refreshSchedule = useCallback(async () => {
  if (!user?.uid) return;
  try {
    // 1. Tenta buscar cronograma existente do usuário
    let activeSchedule = await scheduleService.getUserSchedule(user.uid);
    
    // 2. Se não existir, gera um novo
    if (!activeSchedule) {
      const generatedSchedule = await scheduleService.generatePersonalizedSchedule(user.uid);
      activeSchedule = generatedSchedule;
    }

    // 3. Carrega o dia de estudo de hoje
    if (activeSchedule) {
      setSchedule(activeSchedule as StudySchedule);
      const today = new Date().toISOString().split('T')[0];
      const todayDay = activeSchedule.days?.find(d => d.date === today);
      setTodayStudyDay(todayDay || null);
    }
  } catch (err) {
    console.error('[STUDY] Erro ao carregar cronograma:', err);
  }
}, [user?.uid]);
```

---

## 4️⃣ Fluxo de Funcionamento

### Primeira Login do Usuário:

```
1. Usuário faz login
   ↓
2. AuthContext notifica que user foi carregado
   ↓
3. StudyProvider chama refreshSchedule()
   ↓
4. Verifica se existe cronograma em schedules/{userId}
   ↓
5. NÃO EXISTE → Chama generatePersonalizedSchedule()
   ├─ Lê todos os temas de meta_contents
   ├─ Calcula dias úteis (seg-sex) até 18 de outubro de 2026
   ├─ Distribui temas nos dias
   └─ Salva em schedules/{userId}
   ↓
6. Carrega todayStudyDay com driveVideoId e driveDocId
   ↓
7. Dados disponíveis no estado StudyContext
```

### Logins Subsequentes:

```
1. Usuário faz login (novamente)
   ↓
2. StudyProvider chama refreshSchedule()
   ↓
3. Verifica se existe cronograma em schedules/{userId}
   ↓
4. EXISTE → Usa o cronograma existente
   ↓
5. Carrega todayStudyDay com todos os campos incluindo driveIds
   ↓
6. Dados disponíveis no estado StudyContext
```

---

## 5️⃣ Como Acessar os IDs do Drive nos Componentes

### No Dashboard ou qualquer componente:

```typescript
import { useStudy } from '../contexts/StudyContext';

export function MyComponent() {
  const { todayStudyDay } = useStudy();

  if (!todayStudyDay) {
    return <div>Nenhum tema para hoje</div>;
  }

  return (
    <div>
      <h2>{todayStudyDay.title}</h2>
      
      {todayStudyDay.driveVideoId && (
        <a href={`https://drive.google.com/file/d/${todayStudyDay.driveVideoId}/view`}>
          📹 Assista o vídeo
        </a>
      )}
      
      {todayStudyDay.driveDocId && (
        <a href={`https://drive.google.com/file/d/${todayStudyDay.driveDocId}/view`}>
          📄 Abra a apostila
        </a>
      )}
    </div>
  );
}
```

---

## 6️⃣ Verificação e Testes

### ✅ Checklist de Implementação:

- [ ] Arquivo `meta_contents_example.json` criado com tema mestre
- [ ] Dados importados na coleção Firestore `meta_contents`
- [ ] `src/types/index.ts` atualizado com `driveVideoId` e `driveDocId`
- [ ] `src/services/firebase.ts` contém `generatePersonalizedSchedule`
- [ ] `src/contexts/StudyContext.tsx` chama `generatePersonalizedSchedule` quando necessário
- [ ] Verificar console para logs de `[SCHEDULE]` e `[STUDY]`

### Testes Recomendados:

1. **Primeiro login de novo usuário:**
   - Verificar se cronograma é gerado automaticamente
   - Conferir se todos os temas aparecem no cronograma
   - Validar se `driveVideoId` e `driveDocId` estão preservados

2. **Logins subsequentes:**
   - Verificar se cronograma existente é carregado
   - Conferir que não há duplicação de cronogramas

3. **Dados de Today:**
   - Verificar se `todayStudyDay` está acessível
   - Confirmar se `driveVideoId` e `driveDocId` estão presentes

---

## 7️⃣ Troubleshooting

### Problema: "Nenhum tema disponível para criar o cronograma"

**Solução:**
- Verifique se a coleção `meta_contents` foi criada
- Confirme se há documentos na coleção
- Verifique o console do Firebase para erros de permissão

### Problema: cronograma não é gerado ao fazer login

**Solução:**
- Revise os logs do console para erros de `[SCHEDULE]`
- Verifique se `getUserSchedule` está retornando corretamente
- Confirme as permissões do Firestore (Rules)

### Problema: `driveVideoId` ou `driveDocId` aparecem undefined

**Solução:**
- Verifique se os campos foram adicionados aos documentos `meta_contents`
- Confirme se a geração do cronograma está preservando esses campos
- Revise a função `generatePersonalizedSchedule`

---

## 📝 Notas Importantes

1. **Data de Término:** O cronograma termina em **18 de outubro de 2026** (conforme solicitado)

2. **Dias Úteis:** Apenas segunda a sexta são consideradas (domingos e sábados são ignorados)

3. **Agrupamento de Temas:** Se houver mais temas que dias úteis, temas da mesma especialidade serão colocados no mesmo dia

4. **IDs do Drive:** São opcionais no `meta_contents`, mas recomenda-se preenchê-los para máxima funcionalidade

5. **Timestamp Firestore:** Usar `Timestamp.fromDate()` e `Timestamp.now()` para datas

---

## 🎯 Próximos Passos

1. ✅ Importar `meta_contents_example.json` no Firestore
2. ✅ Testar com um novo usuário
3. ✅ Verificar se os links do Drive são acessíveis
4. ✅ Personalizaro `meta_contents` com seus dados reais
5. ✅ Ajustar a data de término se necessário (18 de outubro de 2026)

---

**Implementação concluída! 🎉**
