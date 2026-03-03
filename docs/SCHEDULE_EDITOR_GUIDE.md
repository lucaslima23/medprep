# 🎯 EDITOR DE CRONOGRAMA - GUIA COMPLETO

Sistema para **importar todos os itens do cronograma com IDs em branco**, depois editá-los visualmente adicionando vídeos e documentos.

---

## 📋 O que foi criado

### 1. **Componente ScheduleEditor** (Nova Tela)
Arquivo: [src/components/admin/ScheduleEditor.tsx](./src/components/admin/ScheduleEditor.tsx)

**Funcionalidades:**
- ✅ Lista todos os itens do cronograma
- ✅ Filtrar por título ou assunto
- ✅ Expandir/recolher editor para cada item
- ✅ Adicionar múltiplos vídeos por item
- ✅ Adicionar múltiplos documentos por item
- ✅ Editar título/ordem de vídeos e docs
- ✅ Remover vídeos/docs individuais
- ✅ Salvar item por item OU salvar todos de uma vez
- ✅ Indicador visual de mudanças não salvas

### 2. **Script de Importação** (Dados em Branco)
Arquivo: [src/scripts/importBlankSchedule.ts](./src/scripts/importBlankSchedule.ts)

**O que faz:**
- Lê os 10 itens do seu cronograma
- Importa TODOS para o Firestore com vídeos/docs vazios
- Cria documento com ID automático
- Adiciona timestamps de criação/atualização

### 3. **Template de Dados**
Arquivo: [src/data/meta_contents_blank_template.json](./src/data/meta_contents_blank_template.json)

**Contém:**
- 10 temas do seu cronograma original
- Todos os campos: title, subject, summary, etc
- Arrays de vídeos/docs VAZIOS

---

## 🚀 COMO USAR (Passo a Passo)

### Passo 1: Importar dados em branco

```bash
# Terminal 1: Importar os 10 itens para Firestore
npx ts-node src/scripts/importBlankSchedule.ts
```

**Resultado esperado:**
```
🚀 Iniciando importação de cronograma...
📊 Total de itens: 10

✅ Insuficiência Cardíaca Congestiva (ID: insuficiencia_cardiaca_congestiva)
✅ Abdome Agudo Inflamatório (ID: abdome_agudo_inflamatorio)
... (8 mais)

🎉 Importação concluída!
✅ Sucesso: 10
❌ Erros: 0

👉 Próximo passo: Acesse /admin/schedule-editor para adicionar IDs
```

### Passo 2: Integrar componente no App

Abra [src/components/admin/AdminImport.tsx](./src/components/admin/AdminImport.tsx) ou crie rota para o editor:

```typescript
// src/App.tsx

import { ScheduleEditorPage } from './components/admin/ScheduleEditor';

// Adicione rota:
<Route path="/admin/schedule-editor" element={<ScheduleEditorPage />} />
```

### Passo 3: Acessar e começar a editar

1. Vá para: `http://localhost:5173/admin/schedule-editor`
2. Você verá todos os 10 itens com:
   - Título e assunto
   - Contador de vídeos/documentos (inicialmente 0)
   - Botão para expandir ▶️

### Passo 4: Adicionar IDs

#### Para cada item:

1. **Clique no item** para expandir (▼)

2. **Vídeos:**
   - Cole o ID do Google Drive
   - (Opcional) Digite um título/descrição
   - Clique **➕ Adicionar Vídeo**
   - Repita para múltiplos vídeos

3. **Documentos:**
   - Cole o ID do Google Drive
   - (Opcional) Digite um título/descrição
   - Clique **➕ Adicionar Doc**
   - Repita para múltiplos documentos

4. **Salvar:**
   - Salve item por item: **💾 Salvar Item**
   - OU salve todos de uma vez: **💾 Salvar Tudo** (topo)

---

## 🎬 EXEMPLO PRÁTICO

### Antes (com o editor aberto):
```
# Insuficiência Cardíaca Congestiva
📹 0 | 📄 0

[Expandir ▶️]
```

### Depois (item expandido e editado):
```
# Insuficiência Cardíaca Congestiva  ⚠️ Não salvo
📹 2 | 📄 1

▼ Aberto para edição

Resumo: [texto do resumo...]

📹 Vídeos (2)
  ├─ ID: 1a2b3c4d5e6f7g8h
     Título: Fisiopatologia da ICC
     [🗑️ remover]
  
  └─ ID: 9i0j1k2l3m4n5o6p
     Título: Tratamento Medicamentoso
     [🗑️ remover]

  [Campo ID] [Campo Título] [➕ Adicionar Vídeo]

📄 Documentos (1)
  ├─ ID: abc123def456ghi789
     Título: Protocolo de Manejo
     [🗑️ remover]

  [Campo ID] [Campo Título] [➕ Adicionar Doc]

[💾 Salvar Item] [✕ Desfazer]
```

### Depois de salvar:
```
✅ Insuficiência Cardíaca Congestiva salvo com sucesso!
📹 2 | 📄 1

[Item colapsado, salvo]
```

---

## 💡 DICAS

### Onde pegar IDs do Google Drive?

**Para vídeos/documentos no Google Drive:**

1. Abra o arquivo no Google Drive
2. URL será: `https://drive.google.com/file/d/AQUI_ESTA_O_ID/view`
3. Copie tudo entre `/d/` e `/view`

**Exemplo:**
```
URL: https://drive.google.com/file/d/1a2b3c4d5e6f7g8h9i0j/view
ID:  1a2b3c4d5e6f7g8h9i0j ← Copie isto
```

### Ordem de vídeos/documentos

A ordem é automática baseada na sequência que você adiciona.

Para reordenar, remova todos e adicione novamente na ordem desejada.

### Desfazer alterações

- **Desfazer um item:** Clique **✕ Desfazer** (recarrega do Firestore)
- **Desfazer tudo:** Recarregue a página (F5)

---

## 📐 ESTRUTURA DE DADOS

Cada item no Firestore terá:

```typescript
{
  title: "Insuficiência Cardíaca Congestiva",
  subject: "clinica_medica",
  subSubject: "Cardiologia",
  order: 1,
  summary: "...descrição...",
  
  // NOVO - Com IDs:
  driveVideos: [
    { id: "1a2b3c...", title: "Fisiopatologia", order: 1 },
    { id: "9i0j1k...", title: "Tratamento", order: 2 }
  ],
  driveDocs: [
    { id: "abc123...", title: "Protocolo", order: 1 }
  ],
  
  // Metadados automáticos:
  createdAt: "2026-02-07T10:30:00.000Z",
  updatedAt: "2026-02-07T10:30:00.000Z"
}
```

---

## 🔒 Segurança

Se você ativou as Firestore Security Rules, cerre-se que o usuário logado tem permissão para atualizar `meta_contents`:

```javascript
// firebase.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /meta_contents/{document=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.email == 'seu@email.com'; // Admin
    }
  }
}
```

---

## ✅ CHECKLIST

- [ ] Executei `importBlankSchedule.ts` com sucesso
- [ ] Os 10 itens aparecem no Firestore (meta_contents)
- [ ] Criei rota `/admin/schedule-editor` no App.tsx
- [ ] Consigo acessar a página de edição
- [ ] Consigo expandir/recolher itens
- [ ] Consigo adicionar vídeos/documentos
- [ ] Consigo salvar mudanças
- [ ] As mudanças aparecem no Firestore

---

## 🐛 TROUBLESHOOTING

### "Erro ao carregar cronograma"
- Verifique se Firebase está configurado
- Verifique se tem permissão para ler `meta_contents`
- Verifique console (F12) para mais detalhes

### "Não consigo salvar"
- Verifique permissões no Firestore Rules
- Verifique se IDs estão preenchidos corretamente
- Tente salvar um item por vez

### "IDs vazios estão sendo salvos"
- O editor NÃO salva vídeos/docs vazios
- Sempre preencha o ID antes de clicar ➕

---

## 📞 PRÓXIMAS FUNCIONALIDADES

Ideias para o futuro:
- [ ] Importar de CSV/Excel
- [ ] Preview de vídeos Google Drive
- [ ] Validação de IDs (testar se existe)
- [ ] Reordenar via drag-and-drop
- [ ] Duplicar itens
- [ ] Exportar para JSON

---

## 🎯 FLUXO COMPLETO

```
1. Você tem cronograma em JSON
   ↓
2. Converter para meta_contents com IDs vazios ✅
   ↓
3. Importar para Firestore ✅ (importBlankSchedule.ts)
   ↓
4. Abrir ScheduleEditor
   ↓
5. Para cada item:
   - Expandir
   - Adicionar vídeos (1+)
   - Adicionar documentos (1+)
   - Salvar
   ↓
6. Cronograma completo com todos os IDs! 🎉
   ↓
7. Quando novo usuário faz login:
   - generatePersonalizedSchedule() executa
   - Lee todos itens com vídeos/docs
   - Distribui nos dias
   - Usuário vê tudo pronto
```

---

**Pronto para começar?** Execute o script de importação! 🚀
