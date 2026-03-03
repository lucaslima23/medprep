# 🎬 MÚLTIPLOS VÍDEOS/DOCUMENTOS - GUIA PRÁTICO

---

## ✅ SIM! Você pode ter múltiplos vídeos/documentos por tema!

A estrutura foi atualizada para suportar:
- ✅ Múltiplos vídeos por tema
- ✅ Múltiplos documentos por tema  
- ✅ Título e ordem para cada item
- ✅ Compatibilidade com dados antigos (um único vídeo/doc)

---

## 📋 ESTRUTURA NOVA

### Um Único Vídeo (Legado - Ainda Funciona)
```json
{
  "title": "Cirurgia Geral",
  "subject": "cirurgia",
  "order": 1,
  "driveVideoId": "single_video_id"
}
```

### Múltiplos Vídeos (NOVO! ✨)
```json
{
  "title": "Cirurgia Geral",
  "subject": "cirurgia",
  "order": 1,
  "driveVideos": [
    {
      "id": "video1_id",
      "title": "Parte 1: Anatomia",
      "order": 1
    },
    {
      "id": "video2_id",
      "title": "Parte 2: Técnicas",
      "order": 2
    },
    {
      "id": "video3_id",
      "title": "Parte 3: Casos",
      "order": 3
    }
  ]
}
```

### Múltiplos de Cada (MELHOR!)
```json
{
  "title": "Cirurgia Geral",
  "subject": "cirurgia",
  "order": 1,
  "driveVideos": [
    { "id": "vid1", "title": "Parte 1", "order": 1 },
    { "id": "vid2", "title": "Parte 2", "order": 2 }
  ],
  "driveDocs": [
    { "id": "doc1", "title": "Apostila Completa", "order": 1 },
    { "id": "doc2", "title": "Resumo", "order": 2 }
  ]
}
```

---

## 💻 COMO ADICIONAR

### Via Script TypeScript

#### Um único vídeo (jeito antigo)
```typescript
import { addSingleMetaContent } from '../scripts/addMetaContent';

await addSingleMetaContent({
  title: "Cirurgia Geral",
  subject: "cirurgia",
  order: 1,
  driveVideoId: "video_único_id",
  driveDocId: "doc_único_id"
});
```

#### Múltiplos vídeos (novo!)
```typescript
await addSingleMetaContent({
  title: "Cirurgia Geral",
  subject: "cirurgia",
  order: 1,
  driveVideos: [
    { id: "video1_abc", title: "Anatomia", order: 1 },
    { id: "video2_def", title: "Técnicas", order: 2 },
    { id: "video3_ghi", title: "Casos Clínicos", order: 3 }
  ],
  driveDocs: [
    { id: "apostila_xyz", title: "Apostila Completa", order: 1 }
  ]
});
```

#### Lote com múltiplos itens
```typescript
import { addMultipleMetaContents } from '../scripts/addMetaContent';

await addMultipleMetaContents([
  {
    title: "Ginecologia",
    subject: "ginecologia",
    order: 1,
    driveVideos: [
      { id: "gin_vid1", title: "Ciclo Menstrual", order: 1 },
      { id: "gin_vid2", title: "Contraceptivos", order: 2 }
    ]
  },
  {
    title: "Pediatria",
    subject: "pediatria",
    order: 2,
    driveVideos: [
      { id: "ped_vid1", title: "Crescimento", order: 1 }
    ]
  }
]);
```

---

## 🖥️ VIA FIREBASE CONSOLE

### Passo 1: Abrir Firebase Console
```
Firebase Console > Firestore > meta_contents > Add Document
```

### Passo 2: Criar estrutura
```
Document ID: ginecologia_1

Field: title       (string)    → "Ciclo Menstrual"
Field: subject     (string)    → "ginecologia"
Field: order       (number)    → 1
Field: driveVideos (array)     → (clique para adicionar)
```

### Passo 3: Adicionar items no array
Clique em **"Add element"** e preencha:
```
{
  id: "video1_abc"
  title: "Parte 1"
  order: 1
}
{
  id: "video2_def"
  title: "Parte 2"
  order: 2
}
```

---

## 🎯 COMO USAR NOS COMPONENTES

### Acessar múltiplos vídeos
```typescript
import { useStudy } from '../contexts/StudyContext';

function Dashboard() {
  const { todayStudyDay } = useStudy();

  // Múltiplos vídeos
  if (todayStudyDay?.driveVideos) {
    return (
      <div>
        <h2>{todayStudyDay.title}</h2>
        {todayStudyDay.driveVideos.map(video => (
          <a 
            key={video.id}
            href={`https://drive.google.com/file/d/${video.id}/view`}
          >
            📹 {video.title || 'Assista'}
          </a>
        ))}
      </div>
    );
  }

  // Ou formato antigo (um único)
  if (todayStudyDay?.driveVideoId) {
    return (
      <a href={`https://drive.google.com/file/d/${todayStudyDay.driveVideoId}/view`}>
        📹 Assista
      </a>
    );
  }
}
```

### Componente lista de vídeos
```typescript
function VideoList({ studyDay }) {
  const videos = studyDay?.driveVideos || [];

  if (!videos.length) return null;

  return (
    <div className="video-list">
      <h3>📹 Vídeos para hoje:</h3>
      <ul>
        {videos
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((video, idx) => (
            <li key={video.id}>
              <a href={`https://drive.google.com/file/d/${video.id}/view`}>
                {video.title || `Vídeo ${idx + 1}`}
              </a>
            </li>
          ))}
      </ul>
    </div>
  );
}
```

### Componente documentos
```typescript
function Documents({ studyDay }) {
  const docs = studyDay?.driveDocs || [];

  if (!docs.length) return null;

  return (
    <div className="docs-list">
      <h3>📄 Documentos:</h3>
      <ul>
        {docs
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((doc, idx) => (
            <li key={doc.id}>
              <a href={`https://drive.google.com/file/d/${doc.id}/view`}>
                {doc.title || `Documento ${idx + 1}`}
              </a>
            </li>
          ))}
      </ul>
    </div>
  );
}
```

---

## 🔄 ATUALIZAR ITENS DEPOIS

### Adicionar mais vídeos
```typescript
import { updateMetaContent } from '../scripts/addMetaContent';

await updateMetaContent('ginecologia_1', {
  driveVideos: [
    { id: "video1_abc", title: "Parte 1", order: 1 },
    { id: "video2_def", title: "Parte 2", order: 2 },
    { id: "video3_NEW", title: "Parte 3 Nova", order: 3 } // Novo!
  ]
});
```

### Via Firebase Console
1. Firestore > meta_contents > documento
2. Campo `driveVideos` > **Edit**
3. Click **Add element**
4. Preencha novo vídeo
5. **Save**

---

## 📊 EXEMPLOS PRÁTICOS

### Exemplo 1: Tema com 3 partes de vídeo
```json
{
  "title": "Pré-Eclâmpsia",
  "subject": "ginecologia",
  "order": 5,
  "driveVideos": [
    {
      "id": "1a2b3c4d5e6f",
      "title": "Fisiopatologia",
      "order": 1
    },
    {
      "id": "7g8h9i0jab1c",
      "title": "Diagnóstico",
      "order": 2
    },
    {
      "id": "2d3e4f5g6h7i",
      "title": "Tratamento",
      "order": 3
    }
  ],
  "driveDocs": [
    {
      "id": "9j0k1l2m3n4o",
      "title": "Guia Completo",
      "order": 1
    }
  ]
}
```

### Exemplo 2: Tema com apostila em partes
```json
{
  "title": "ATLS - Trauma",
  "subject": "cirurgia",
  "order": 12,
  "driveVideos": [
    {
      "id": "vid_atls_completo",
      "title": "Aula Teórica",
      "order": 1
    }
  ],
  "driveDocs": [
    {
      "id": "apostila_atls_parte1",
      "title": "Módulo 1: ABC",
      "order": 1
    },
    {
      "id": "apostila_atls_parte2",
      "title": "Módulo 2: Avaliação Secundária",
      "order": 2
    },
    {
      "id": "apostila_atls_parte3",
      "title": "Módulo 3: Manejo",
      "order": 3
    }
  ]
}
```

---

## 🎬 USAR NO CRONOGRAMA

Quando um novo usuário faz login:

```
1. generatePersonalizedSchedule() executa
   ↓
2. Lê todos os itens de meta_contents (agora com driveVideos/driveDocs)
   ↓
3. Distribui nos dias do cronograma
   ↓
4. Usuário acessa driveVideos e driveDocs em StudyDay
   ↓
5. Componentes renderizam todos os links
   ↓
✅ Múltiplos vídeos/docs aparecendo!
```

---

## ✨ COMPATIBILIDADE

### Items antigos continuam funcionando
```json
{
  "title": "Antigo",
  "driveVideoId": "single_id",  // Ainda funciona!
  "driveDocId": "single_id"     // Ainda funciona!
}
```

### Items novos com múltiplos
```json
{
  "title": "Novo",
  "driveVideos": [...],  // Array
  "driveDocs": [...]     // Array
}
```

**Ambos funcionam ao mesmo tempo!** 🎉

---

## 🚀 WORKFLOWS

### Workflow 1: Começar com um vídeo, depois adicionar mais
```typescript
// Dia 1: Um vídeo
await addSingleMetaContent({
  title: "Cirurgia",
  subject: "cirurgia",
  order: 1,
  driveVideoId: "video_principal"
});

// Dia 5: Adicionar mais vídeos
await updateMetaContent('cirurgia_1', {
  driveVideos: [
    { id: "video_principal", title: "Principal", order: 1 },
    { id: "video2_novo", title: "Complementar", order: 2 }
  ]
});
```

### Workflow 2: Adicionar tudo de uma vez
```typescript
await addMultipleMetaContents([
  {
    title: "Tema 1",
    subject: "ginecologia",
    order: 1,
    driveVideos: [
      { id: "v1", title: "P1", order: 1 },
      { id: "v2", title: "P2", order: 2 }
    ],
    driveDocs: [
      { id: "d1", title: "Apostila", order: 1 }
    ]
  },
  // ... mais temas
]);
```

---

## ✅ CHECKLIST

- [ ] Entendi que posso ter múltiplos vídeos/documentos
- [ ] Entendi a estrutura com `driveVideos[]` e `driveDocs[]`
- [ ] Sei como adicionar via script TypeScript
- [ ] Sei como adicionar via Firebase Console
- [ ] Sei como usar em componentes (`.map()`)
- [ ] Pronto para usar!

---

## 📝 SUAS PERGUNTAS

**P: "Posso colocar dois IDs um após o outro?"**  
R: ✅ SIM! Estrutura: `driveVideos: [{ id: "1" }, { id: "2" }]`

**P: "Quantos vídeos posso adicionar?"**  
R: ✅ Quantos quiser! (limite oferecido pelo Firestore: ~1MB por documento)

**P: "Meus dados antigos (um único vídeo) deixam de funcionar?"**  
R: ❌ NÃO! Ainda funcionam perfeitamente (compatível para trás)

**P: "Preciso mudar todos os dados?"**  
R: ❌ NÃO! Migre gradualmente. Novos items em array, antigos em single.

---

**Pronto para usar múltiplos vídeos/documentos?** 🚀

Mande seus dados com a estrutura acima ou use os scripts!
