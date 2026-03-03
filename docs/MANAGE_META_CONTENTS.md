# 📚 GUIA: GERENCIAR ITENS DO CRONOGRAMA

**Objetivo:** Adicionar itens (temas) ao meta_contents e mantê-los atualizado depois

---

## 🎯 SITUAÇÕES

### 1️⃣ VOCÊ JÁ TEM DADOS (schedule-example.json)
```json
{
  "date": "2025-02-05",
  "subject": "clinica_medica",
  "title": "Insuficiência Cardíaca Congestiva",
  "videoId": "1a2b3c4d5e6f7g8h9i0j",
  "pdfId": "abc123def456ghi789"
}
```

**Converter para meta_contents:**
```json
{
  "title": "Insuficiência Cardíaca Congestiva",
  "subject": "clinica_medica",
  "order": 1,
  "driveVideoId": "1a2b3c4d5e6f7g8h9i0j",
  "driveDocId": "abc123def456ghi789"
}
```

### 2️⃣ VOCÊ QUER ADICIONAR NOVOS DEPOIS
✅ Sim! Você pode adicionar quando quiser.

---

## 📥 OPÇÃO A: IMPORTAR VIA FIREBASE CONSOLE (Mais Fácil)

### Passo 1: Preparar dados
Crie um arquivo JSON com seus itens:

```json
[
  {
    "title": "Insuficiência Cardíaca Congestiva",
    "subject": "clinica_medica",
    "order": 1,
    "driveVideoId": "1a2b3c4d5e6f7g8h9i0j",
    "driveDocId": "abc123def456ghi789"
  },
  {
    "title": "Abdome Agudo Inflamatório",
    "subject": "cirurgia",
    "order": 2,
    "driveVideoId": "2b3c4d5e6f7g8h9i0ja",
    "driveDocId": "def456ghi789jkl012"
  }
]
```

### Passo 2: Acessar Firebase
1. Vá para: [Firebase Console](https://console.firebase.google.com)
2. Selecione seu projeto **MedPrep**
3. Acesse **Firestore Database**
4. Clique em **meta_contents** (coleção)

### Passo 3: Adicionar documentos manualmente
Para cada item:
1. Clique **"Adicionar documento"**
2. Use ID: `{subject}_{order}` (ex: `clinica_medica_1`)
3. Preencha 5 campos:
   - `title`: string
   - `subject`: string
   - `order`: number
   - `driveVideoId`: string (deixe vazio se não tem)
   - `driveDocId`: string (deixe vazio se não tem)
4. Clique **Salvar**

---

## 💻 OPÇÃO B: USAR SCRIPT TYPESCRIPT (Mais Rápido)

### Passo 1: Importar função
No seu componente ou página:

```typescript
import { addSingleMetaContent, addMultipleMetaContents } from '../scripts/addMetaContent';
```

### Passo 2: Adicionar um item
```typescript
await addSingleMetaContent({
  title: "Insuficiência Cardíaca Congestiva",
  subject: "clinica_medica",
  order: 1,
  driveVideoId: "1a2b3c4d5e6f7g8h9i0j",
  driveDocId: "abc123def456ghi789",
});
```

### Passo 3: Adicionar múltiplos itens (em batch)
```typescript
await addMultipleMetaContents([
  {
    title: "Abdome Agudo Inflamatório",
    subject: "cirurgia",
    order: 2,
    driveVideoId: "2b3c4d5e6f7g8h9i0ja",
    driveDocId: "def456ghi789jkl012",
  },
  {
    title: "Reanimação Neonatal",
    subject: "pediatria",
    order: 3,
    driveVideoId: "3c4d5e6f7g8h9i0jab1",
    driveDocId: "ghi789jkl012mno345",
  },
  // ... mais itens
]);
```

---

## 🖥️ OPÇÃO C: USAR CONSOLE DO NAVEGADOR (Mais Rápido de Tudo)

### Passo 1: Abra a aplicação
1. Inicie o servidor: `npm run dev`
2. Faça login
3. Abra DevTools: F12 > Console

### Passo 2: Importe a função
```javascript
import { addSingleMetaContent } from './src/scripts/addMetaContent';
```

### Passo 3: Adicione itens direto no console
```javascript
// Um item
await addSingleMetaContent({
  title: "Insuficiência Cardíaca Congestiva",
  subject: "clinica_medica",
  order: 1,
  driveVideoId: "1a2b3c4d5e6f7g8h9i0j",
  driveDocId: "abc123def456ghi789",
});

// Múltiplos itens
await addMultipleMetaContents([
  { title: "...", subject: "...", order: 2, ... },
  { title: "...", subject: "...", order: 3, ... },
]);
```

---

## ✏️ ATUALIZAR ITENS DEPOIS

### Opção 1: Firebase Console
1. **Firestore Database** > **meta_contents**
2. Clique no documento
3. Edite os campos
4. Clique **Atualizar**

### Opção 2: Script TypeScript
```typescript
import { updateMetaContent } from '../scripts/addMetaContent';

// Atualizar um campo
await updateMetaContent('clinica_medica_1', {
  driveVideoId: 'novo-link-video',
  // outros campos...
});
```

### Opção 3: Console do Navegador
```javascript
import { updateMetaContent } from './src/scripts/addMetaContent';

await updateMetaContent('clinica_medica_1', {
  driveVideoId: 'novo-id',
});
```

---

## 📋 LISTAR ITENS (Para Validação)

### No Console do Navegador
```javascript
import { listAllMetaContents } from './src/scripts/addMetaContent';

await listAllMetaContents();
// Mostra table com todos os itens no console
```

---

## 📊 ESTRUTURA DE DADOS

### O que é o `subject`?
```
Valores válidos (conforme tipos):
- "ginecologia"       → Ginecologia e Obstetrícia
- "pediatria"         → Pediatria
- "cirurgia"          → Cirurgia
- "clinica_medica"    → Clínica Médica
- "preventiva"        → Medicina Preventiva
```

### O que é o `order`?
```
Número inteiro que define a sequência no cronograma
Exemplo:
  order: 1  → Primeiro tema
  order: 2  → Segundo tema
  order: 35 → 35º tema
```

### O que são driveVideoId e driveDocId?
```
Seu link do Google Drive em formato de ID:
https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view
                                    ↑ Este é o ID

driveVideoId: "1a2b3c4d5e6f7g8h9i0j"  // ID do vídeo
driveDocId:   "abc123def456ghi789"    // ID do documento/apostila
```

---

## 🔄 COMO CONVERTER SEU schedule-example.json

Se você tem um array em JSON assim:

```json
[
  {
    "date": "2025-02-05",
    "subject": "clinica_medica",
    "title": "Insuficiência Cardíaca Congestiva",
    "summary": "...",
    "videoId": "1a2b3c4d5e6f7g8h9i0j",
    "pdfId": "abc123def456ghi789",
    "flashcardSetId": "fc_icc_001",
    "questionSetId": "qs_cardio_icc",
    "estimatedTime": 120
  },
  ...
]
```

**Transforme em:**

```json
[
  {
    "title": "Insuficiência Cardíaca Congestiva",
    "subject": "clinica_medica",
    "order": 1,
    "driveVideoId": "1a2b3c4d5e6f7g8h9i0j",
    "driveDocId": "abc123def456ghi789"
  },
  ...
]
```

**Remova:** `date`, `summary`, `flashcardSetId`, `questionSetId`, `estimatedTime`  
**Renomeie:** `videoId` → `driveVideoId`, `pdfId` → `driveDocId`  
**Adicione:** `order` (sequência: 1, 2, 3...)

---

## 🚀 WORKFLOW RECOMENDADO

### Dia 1: Importar dados iniciais
```
1. Pegue todos os itens de schedule-example.json
2. Converta para formato meta_contents (JSON)
3. Importe via Firebase Console (copia/cola manualmente)
4. OU Use script TypeScript para importar em batch
```

### Dia 2+: Adicionar novos itens
```
1. Sempre que precisar adicionar tema novo:
   → Use Firebase Console (simples)
      OU
   → Use script TypeScript (rápido)
      OU
   → Use console do navegador (teste rápido)

2. Itens novos recebem `order` maior que os últimos
   Exemplo: Se tem até order 35, novo é 36, 37, etc.
```

### Qualquer Dia: Atualizar existentes
```
1. Encontre o item em firebase console
2. Edite os campos desejados
3. Salve as mudanças
4. Cronogramas são recalculados na próxima geração
```

---

## ⚠️ ATENÇÃO IMPORTANTE

### ✅ SEGURO
- Adicionar novos itens
- Atualizar campos
- Deletar itens (sem cronogramas gerados)

### ⚠️ Cuidado
- Mudar `order` de um item já usado →cronogramas anteriores podem ficar desalinhados
- **Solução:** Trate como novo item (novo order) e deixe o antigo inativo

### ❌ NÃO FAÇA
- Editar cronograma do usuário diretamente em `schedules/{userId}`
  - Deixe que `generatePersonalizedSchedule()` faça isso
- Usar caracteres especiais no `title` ou `subject`

---

## 🎯 FLUXO COMPLETO DE EXEMPLO

### Semana 1: Importar dados iniciais

```
1. Você manda os dados:
   {
     "title": "Insuficiência Cardíaca",
     "subject": "clinica_medica",
     "order": 1,
     "driveVideoId": "...",
     "driveDocId": "..."
   }

2. Eu ou você adiciona ao Firebase:
   → Firebase Console (manual)
   → OU Script TypeScript (automático)

3. Novo usuário faz login:
   → generatePersonalizedSchedule() executa
   → Lê todos os itens (agora com seus dados)
   → Distribui no cronograma
   → ✅ Usuário recebe cronograma!
```

### Semana 2: Adicionar novos itens

```
1. Você quer adicionar novo tema (order: 35):
   {
     "title": "Novo Tema",
     "subject": "pediatria",
     "order": 35,
     "driveVideoId": "...",
     "driveDocId": "..."
   }

2. Adiciona via Firebase Console:
   → Click "Adicionar documento"
   → Preenche campos
   → Click Salvar
   → ✅ Feito!

3. Novo usuário que faz login depois:
   → Receberá o novo tema também
   → Automaticamente distribuído no cronograma
```

### Semana 3+: Manutenção contínua

```
- Adicionar tema? → Firebase Console
- Atualizar link Drive? → Firebase Console
- Listar tudo? → Console do navegador
- Verificar? → Novo login teste
```

---

## 💡 DICAS

### Tip 1: Compare com `meta_contents_example.json`
Você tem um exemplo de 34 itens. Use como referência!

### Tip 2: Use IDs descritivos
Boa: `clinica_medica_1`, `ginecologia_15`  
Ruim: `item1`, `tema2`

### Tip 3: Manter order sequencial
Não pule números. Se tem até 34, próximo é 35.

### Tip 4: Backup dos dados
Antes de grandes mudanças, exporte de Firebase > Firestore.

### Tip 5: Testar novo usuário
Depois de adicionar itens, faça login com nova conta para ver resultado.

---

## ✅ CHECKLIST: ADICIONAR ITENS

- [ ] Identifiquei os itens que vou adicionar
- [ ] Converti para formato meta_contents
- [ ] Escolhi método (Console / Script / Batch)
- [ ] Adicionei os itens
- [ ] Verifiquei no Firebase Console
- [ ] Testei com novo login de usuário
- [ ] ✅ Cronograma foi gerado?
- [ ] ✅ Links do Drive aparecem?
- [ ] ✅ Temas estão na ordem correta?

---

**Pronto para começar? Mande seus dados! 📧**

Ou use [`src/scripts/addMetaContent.ts`](../scripts/addMetaContent.ts) para adicionar automaticamente.
