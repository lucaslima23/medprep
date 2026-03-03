# 🎯 QUICK START - ADICIONAR ITENS AO CRONOGRAMA

---

## ✅ SIM, VOCÊ PODE ADICIONAR AGORA E DEPOIS!

**Resposta rápida:**
- ✅ Mande seus itens agora → Eu adiciono
- ✅ Quer adicionar depois? → Você pode fazer sozinho (fácil!)
- ✅ Quer atualizar? → Pode mudar quando quiser

---

## 📋 FORMATO DOS DADOS QUE VOCÊ MANDA

Quando você enviar seus itens, siga este formato:

```json
{
  "title": "Nome do Tema",
  "subject": "ginecologia",  // ou: pediatria, cirurgia, clinica_medica, preventiva
  "order": 1,                 // número sequencial (1, 2, 3...)
  "driveVideoId": "abc123...",  // (opcional) ID do vídeo
  "driveDocId": "def456..."     // (opcional) ID do documento
}
```

### Exemplo Real:
```json
{
  "title": "Insuficiência Cardíaca Congestiva",
  "subject": "clinica_medica",
  "order": 1,
  "driveVideoId": "1a2b3c4d5e6f7g8h9i0j",
  "driveDocId": "abc123def456ghi789"
}
```

---

## 🚀 3 FORMAS DE ADICIONAR

### OPÇÃO 1: Você manda dados, eu adiciono (Mais Fácil para Você)
```
Você:  "Eis meus itens em JSON..."
  ↓
Eu:    Adiciona ao Firestore
  ↓
Pronto! ✅
```

### OPÇÃO 2: Você mesmo adiciona via Firebase Console (Mais Visual)
```
1. Firebase Console > Firestore > meta_contents
2. Click "Add Document"
3. Preenche 5 campos (copy/paste fácil)
4. Save ✅
```

### OPÇÃO 3: Você usa script TypeScript (Mais Rápido)
```typescript
import { addMultipleMetaContents } from '../scripts/addMetaContent';

await addMultipleMetaContents([
  {
    title: "Seu Tema",
    subject: "ginecologia",
    order: 1,
    driveVideoId: "...",
    driveDocId: "...",
  },
  // ... mais itens
]);
```

---

## 🆘 A PARTIR DE schedule-example.json

Se você quer converter seus dados de `schedule-example.json`:

**Arquivo tem (schedule):**
```json
{
  "date": "2025-02-05",
  "subject": "clinica_medica",
  "title": "ICC",
  "videoId": "1a2b3c...",
  "pdfId": "abc123..."
}
```

**Vira (meta_contents):**
```json
{
  "title": "ICC",
  "subject": "clinica_medica",
  "order": 1,
  "driveVideoId": "1a2b3c...",
  "driveDocId": "abc123..."
}
```

**Removido:** date, summary, flashcardSetId, questionSetId  
**Renomeado:** videoId → driveVideoId, pdfId → driveDocId  
**Adicionado:** order (1, 2, 3...)

---

## ➕ ADICIONAR NOVOS ITENS DEPOIS

### Via Firebase Console (1 min)
```
1. Firestore > meta_contents
2. "Add Document"
3. Preenche campos
4. Save
✅ Feito!
```

### Via Script (30 seg)
```typescript
await addSingleMetaContent({
  title: "Novo Tema",
  subject: "pediatria",
  order: 36,  // próximo depois dos existentes
  driveVideoId: "...",
  driveDocId: "...",
});
```

### Via Console do Navegador (DevTools)
```javascript
import { addSingleMetaContent } from './src/scripts/addMetaContent';

await addSingleMetaContent({
  title: "Novo Tema",
  subject: "pediatria",
  order: 36,
  driveVideoId: "...",
  driveDocId: "...",
});
```

---

## ✏️ ATUALIZAR ITENS EXISTENTES

### Via Firebase Console
1. Firestore > meta_contents > documento
2. Clique no campo
3. Edite valor
4. Pronto! ✅

### Via Script
```typescript
import { updateMetaContent } from '../scripts/addMetaContent';

await updateMetaContent('clinica_medica_1', {
  driveVideoId: 'novo-id-aqui',
  // Atualize qualquer campo
});
```

---

## 🗂️ ARQUIVOS QUE VOCÊ PODE USAR

| Arquivo | Para Quê | Como Usar |
|---------|----------|-----------|
| **addMetaContent.ts** | Adicionar/atualizar itens | Script TypeScript |
| **convertToMetaContent.ts** | Converter schedule → meta_contents | Script automático |
| **MANAGE_META_CONTENTS.md** | Guia completo | Consulte quando dúvida |

Todos em: `src/scripts/`

---

## 📊 FLUXO VISUAL

```
Você manda:          Você usa depois:
┌─────────────┐      ┌──────────────┐
│ Seus Dados  │      │ Firebase Con │  (Fácil)
│ em JSON     │ →    │ Clica + Edita│
└─────────────┘      └──────────────┘
                     
                     OU
                     
                     ┌──────────────┐
                     │ Script TS    │  (Rápido)
                     │ await add... │
                     └──────────────┘
                     
                     OU
                     
                     ┌──────────────┐
                     │ Console Nav. │  (Teste)
                     │ F12 Console  │
                     └──────────────┘
```

---

## 🎯 PRÓXIMAS AÇÕES

### ✅ Passo 1 (Agora)
```
Você manda seus dados (qual quer formato OK):
- CSV
- JSON
- Copy/paste direto
- De schedule-example.json

Ou deixa que eu leio schedule-example.json
```

### ✅ Passo 2 (5 min)
```
Eu converto para meta_contents
Você valida (tá certo?)
```

### ✅ Passo 3 (2 min)
```
Eu adiciono ao Firestore
Pronto! ✅
```

### ✅ Passo 4 (Depois)
```
Novo usuário faz login
Recebe cronograma personalizado automaticamente
Com seus itens e links Google Drive
```

### ✅ Passo 5+ (Qualquer hora)
```
Quer adicionar novo tema?
→ Use Firebase Console (visual, fácil)
  OU
→ Use script TypeScript (rápido)

Quer atualizar link?
→ Firebase Console ou script (30 seg)

Tudo funciona na hora!
```

---

## 💡 EXEMPLO PRÁTICO COMPLETO

### Você manda (no chat):
```
Tema 1: Cirurgia Geral
- Título: "Abdome Agudo"
- Vídeo: ABC123
- Doc: DEF456

Tema 2: Pediatria
- Título: "Reanimação"
- Vídeo: GHI789
- Doc: JKL012
```

### Eu converto para:
```json
[
  {
    "title": "Abdome Agudo",
    "subject": "cirurgia",
    "order": 1,
    "driveVideoId": "ABC123",
    "driveDocId": "DEF456"
  },
  {
    "title": "Reanimação",
    "subject": "pediatria",
    "order": 2,
    "driveVideoId": "GHI789",
    "driveDocId": "JKL012"
  }
]
```

### Você adiciona:
- **Opção 1:** Manda de volta, eu insiro no Firestore
- **Opção 2:** Você usa Firebase Console (copia/cola)
- **Opção 3:** Você usa script add.ts automaticamente

### Resultado:
```
Novo usuário faz login
  ↓
Sistema gera cronograma automático
  ↓
Recebe seus 2 temas no cronograma
  ↓
Com links Google Drive funcionales
  ↓
Pronto para estudar! ✅
```

---

## ❓ PERGUNTAS FREQUENTES

**P: Posso mandar os dados agora?**  
R: ✅ SIM! Quando quiser.

**P: Depois não consigo adicionar novos?**  
R: ❌ NÃO! Você consegue sim, é fácil (Firebase Console ou script).

**P: Preciso programar para adicionar depois?**  
R: ❌ NÃO! Pode fazer manualmente no Firebase Console (super simples).

**P: Se eu errar o dado, consigo corrigir?**  
R: ✅ SIM! Firebase Console permite editar tudo (1 clique).

**P: Meus cronogramas antigos ficar quebrados se adicionar novo tema?**  
R: ❌ NÃO! Só novos usuários recebem o novo tema. Antigos geram de novo se quiser.

**P: Consigo deletar um tema depois?**  
R: ✅ SIM! Firebase Console > click documento > delete.

---

## 🚀 MANDE SEUS ITENS!

Quando quiser começar, envie seus dados desta forma:

### Formato 1: Direto em JSON
```json
[
  {
    "title": "...",
    "subject": "...",
    "order": ...,
    "driveVideoId": "...",
    "driveDocId": "..."
  }
]
```

### Formato 2: Tabela (texto)
```
Título | Especialidade | Ordem | Vídeo | Doc
...    | ...           | ...   | ...   | ...
```

### Formato 3: Qualquer coisa
```
Schedule-example.json deve ter tudo?
→ Mande ele que eu converto!
```

---

## ✅ CHECKLIST

- [ ] Entendi que posso adicionar dados agora
- [ ] Entendi que posso adicionar novos depois
- [ ] Entendi que posso editar/atualizar tudo
- [ ] Entendi o formato JSON dos dados
- [ ] Pronto para mandar dados!

---

## 📞 PRÓXIMO PASSO

**Estou pronto!** Aqui está o que você precisa fazer:

1. ⬇️ Mande seus itens (em qualquer formato)
2. ⬇️ Ou me deixe ler `schedule-example.json` e converter
3. ⬇️ Eu adiciono ao Firestore
4. ⬇️ Você testa com novo login
5. ⬇️ ✅ Pronto!

---

**Quando mandar dados, use:** [MANAGE_META_CONTENTS.md](./MANAGE_META_CONTENTS.md) como referência!

Mais dúvidas? Consulte a documentação completa na pasta raiz. 📚
