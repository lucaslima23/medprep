# ⚡ SCHEDULE EDITOR - QUICK START (5 minutos)

---

## 🎯 O que você tem PRONTO:

✅ **ScheduleEditor.tsx** - Tela para editar todos os itens
✅ **importBlankSchedule.ts** - Script para importar itens em branco
✅ **meta_contents_blank_template.json** - Dados com 10 itens do seu cronograma
✅ **schedule-editor.css** - Estilos
✅ **Documentação completa** - Caso precise de detalhes

---

## 🚀 INÍCIO RÁPIDO (Escolha A ou B)

### OPÇÃO A: Você quer usar AGORA com seu cronograma atual

**Passo 1:** Execute importação (1 minuto)
```bash
npx ts-node src/scripts/importBlankSchedule.ts
```

**Passo 2:** Integre no App.tsx (2 minutos)
```typescript
// No topo:
import { ScheduleEditorPage } from './components/admin/ScheduleEditor';
import './styles/schedule-editor.css';

// Na rota:
<Route path="/admin/schedule-editor" element={<ScheduleEditorPage />} />
```

**Passo 3:** Acesse e comece a editar (2 minutos)
```
http://localhost:5173/admin/schedule-editor
```

---

### OPÇÃO B: Você quer enviar uma lista diferente de assuntos

**Passo 1:** Envie para mim
```
Título 1, Assunto 1
Título 2, Assunto 2
...
```

**Passo 2:** Eu gero novo JSON com seus dados
**Passo 3:** Você segue Opção A

---

## 📋 Os 10 itens que já estão prontos:

1. Insuficiência Cardíaca Congestiva (clinica_medica)
2. Abdome Agudo Inflamatório (cirurgia)
3. Reanimação Neonatal (pediatria)
4. Pré-Eclâmpsia e Eclâmpsia (ginecologia)
5. Estudos Epidemiológicos (preventiva)
6. DPOC (clinica_medica)
7. ATLS (cirurgia)
8. Doenças Exantemáticas (pediatria)
9. Sangramento Uterino Anormal (ginecologia)
10. Sistema Único de Saúde (preventiva)

**Quer mudanças?** É fácil! Basta enviar a lista.

---

## 🎬 USO PRÁTICO

Depois de integrado:

1. **Abrir editor**
   - http://localhost:5173/admin/schedule-editor

2. **Procurar item**
   - Digite no filtro (topo)

3. **Expandir item**
   - Clique no ▶️

4. **Adicionar vídeo**
   - Cole ID do Google Drive
   - (Opcional) Digite título
   - Clique ➕

5. **Adicionar documento**
   - Cole ID
   - (Opcional) Digite título
   - Clique ➕

6. **Salvar**
   - Item: 💾 Salvar Item
   - Todos: 💾 Salvar Tudo (topo)

---

## 📁 Arquivos Criados:

- ✅ `src/components/admin/ScheduleEditor.tsx` - Componente principal
- ✅ `src/scripts/importBlankSchedule.ts` - Script de importação
- ✅ `src/data/meta_contents_blank_template.json` - Dados
- ✅ `src/styles/schedule-editor.css` - Estilos
- 📖 `SCHEDULE_EDITOR_GUIDE.md` - Guia completo
- 📖 `SCHEDULE_EDITOR_SETUP.md` - Como integrar no App.tsx

---

## 💻 Próximos Passos:

### Hoje:
1. [ ] Execute `importBlankSchedule.ts`
2. [ ] Integre no `App.tsx`
3. [ ] Acesse `/admin/schedule-editor`

### Esta semana:
4. [ ] Adicione IDs de vídeos/documentos
5. [ ] Teste com novo usuário login
6. [ ] Verifique se cronograma distribui corretamente

---

## ❓ Dúvidas Frequentes:

**P: "Como faço para ter outros assuntos?"**  
R: Envie a lista, eu gero um novo JSON.

**P: "Posso adicionar múltiplos vídeos por item?"**  
R: ✅ SIM! Clique ➕ Adicionar Vídeo várias vezes.

**P: "Quanto tempo leva para adicionar tudo?"**  
R: ~5-10 min para 10 itens (depende de quantos vídeos/docs cada um tem).

**P: "Posso editar depois?"**  
R: ✅ SIM! Sempre. Abra editor e faça mudanças a qualquer hora.

**P: "Preciso fazer algo mais?"**  
R: Não! Sistema automaticamente distribui isso para novos usuários.

---

## 🎯 Prosseguir?

```bash
# Opção A: Usar os 10 itens atuais
npm ts-node src/scripts/importBlankSchedule.ts

# Opção B: Enviar lista diferente
# (mande para mim)
```

**Qual você prefere?** A ou B? 🚀
