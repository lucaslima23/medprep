# 🔗 INTEGRAÇÃO DO SCHEDULE EDITOR NO APP.TSX

Como adicionar a rota do ScheduleEditor ao seu aplicativo principal.

---

## 📍 Localizar App.tsx

**Arquivo:** `src/App.tsx`

---

## 🔻 Adicionar Importação

Abra seu `App.tsx` e adicione esta linha no topo com os outros imports:

```typescript
import { ScheduleEditorPage } from './components/admin/ScheduleEditor';
import './styles/schedule-editor.css'; // CSS do editor
```

**Exemplo completo de imports:**
```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ScheduleEditorPage } from './components/admin/ScheduleEditor'; // ← Nova linha
import { AdminImport } from './components/admin/AdminImport';
import { Dashboard } from './components/dashboard/Dashboard';
// ... outros imports
import './styles/schedule-editor.css'; // ← Nova linha
```

---

## 🛣️ Adicionar Rota

Dentro de seu `<Routes>`, adicione esta nova rota:

```typescript
{/* Admin - Schedule Editor */}
<Route path="/admin/schedule-editor" element={<ScheduleEditorPage />} />
```

**Exemplo de Routes completo:**
```typescript
<Routes>
  {/* Public */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/" element={<Dashboard />} />
  
  {/* Admin */}
  <Route path="/admin/import" element={<AdminImport />} />
  <Route path="/admin/schedule-editor" element={<ScheduleEditorPage />} /> {/* ← Add isto */}
  
  {/* Página não encontrada */}
  <Route path="*" element={<Navigate to="/" />} />
</Routes>
```

---

## 📝 Arquivo App.tsx Completo (Exemplo)

Se você não tem rotas configuradas ainda, aqui está um exemplo básico:

```typescript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { StudyProvider } from './contexts/StudyContext';

// Componentes
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './components/auth/LoginPage';
import { Dashboard } from './components/dashboard/Dashboard';
import { QuestionsPage } from './components/questions/QuestionsPage';
import { AdminImport } from './components/admin/AdminImport';
import { ScheduleEditorPage } from './components/admin/ScheduleEditor'; // ← Add
import { AnalyticsPage } from './components/analytics/AnalyticsPage';

// Estilos
import './styles/index.css';
import './styles/schedule-editor.css'; // ← Add

export function App() {
  return (
    <Router>
      <AuthProvider>
        <StudyProvider>
          <MainLayout>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/questions" element={<QuestionsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              
              {/* Admin */}
              <Route path="/admin/import" element={<AdminImport />} />
              <Route path="/admin/schedule-editor" element={<ScheduleEditorPage />} /> {/* ← Add */}
              
              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </MainLayout>
        </StudyProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
```

---

## 🧭 Acessar a Página

Depois de adicionar a rota e salvar:

1. Abra seu navegador
2. Vá para: **http://localhost:5173/admin/schedule-editor**
3. Você verá a tela de edição do cronograma

---

## 💻 Adicionar Link no Menu (Opcional)

Se você tem um menu de admin, adicione um link:

```typescript
// No seu menu ou sidebar:
<Link to="/admin/schedule-editor">
  📅 Editor de Cronograma
</Link>
```

---

## 🔐 Proteger a Rota (Recomendado)

Se quiser que apenas admins acessem, crie um ProtectedRoute:

```typescript
// components/common/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  element: React.ReactElement;
  requiredRole?: 'admin';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  element, 
  requiredRole 
}) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Se requer admin, verificar role
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return element;
};
```

Depois use:

```typescript
<Route 
  path="/admin/schedule-editor" 
  element={
    <ProtectedRoute 
      element={<ScheduleEditorPage />} 
      requiredRole="admin" 
    />
  } 
/>
```

---

## ✅ Checklist

- [ ] Adicionei import de `ScheduleEditorPage`
- [ ] Adicionei import de `schedule-editor.css`
- [ ] Adicionei a rota `/admin/schedule-editor`
- [ ] Salvei `App.tsx`
- [ ] Recarreguei a página (hot reload)
- [ ] Consegui acessar `http://localhost:5173/admin/schedule-editor`
- [ ] A tela apareceu e estou vendo os itens carregados

---

## 🐛 Troubleshooting

### "Página não encontrada"
- Verifique se digitou a rota corretamente: `/admin/schedule-editor`
- Verifique se salvou `App.tsx`
- Tente hard refresh: `Ctrl+Shift+R`

### "Erro ao carregar componente"
- Verifique se o caminho do import está correto
- Verifique console (F12) para ver erros específicos

### "Nenhum item aparece"
- Você executou `importBlankSchedule.ts`?
- Verifique se os itens estão no Firestore
- Verifique console para erros de Firebase

---

**Pronto!** Agora você tem a rota integrada e pode acessar o editor. 🚀
