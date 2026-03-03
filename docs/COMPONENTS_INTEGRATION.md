# 🔧 INTEGRAÇÃO EM COMPONENTES REACT

Exemplos práticos de como usar múltiplos vídeos/documentos nos seus componentes.

---

## 📹 Componente Para Listar Vídeos

```typescript
// src/components/common/VideosList.tsx

import React from 'react';
import { StudyDay } from '../../types';

interface VideosListProps {
  studyDay: StudyDay | null;
  className?: string;
}

export const VideosList: React.FC<VideosListProps> = ({ studyDay, className = '' }) => {
  if (!studyDay) return null;

  // Suporta novo formato (array) E antigo (single)
  const videos = studyDay.driveVideos || (
    studyDay.driveVideoId 
      ? [{ id: studyDay.driveVideoId, title: 'Assista', order: 1 }]
      : []
  );

  if (!videos.length) return null;

  return (
    <div className={`videos-list ${className}`}>
      <h3 className="text-lg font-bold mb-3">
        📹 Vídeos ({videos.length})
      </h3>
      <div className="space-y-2">
        {videos
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
          .map((video, idx) => (
            <a
              key={video.id}
              href={`https://drive.google.com/file/d/${video.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="
                block p-3 bg-blue-50 hover:bg-blue-100 
                rounded-lg transition-colors
                border-l-4 border-blue-500
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-blue-900">
                    {video.title || `Vídeo ${idx + 1}`}
                  </p>
                  {video.order && (
                    <p className="text-xs text-blue-600 mt-1">
                      Parte {video.order}
                    </p>
                  )}
                </div>
                <span className="text-xl">▶️</span>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
};
```

---

## 📄 Componente Para Listar Documentos

```typescript
// src/components/common/DocumentsList.tsx

import React from 'react';
import { StudyDay } from '../../types';

interface DocumentsListProps {
  studyDay: StudyDay | null;
  className?: string;
}

export const DocumentsList: React.FC<DocumentsListProps> = ({ 
  studyDay, 
  className = '' 
}) => {
  if (!studyDay) return null;

  // Suporta novo formato (array) E antigo (single)
  const docs = studyDay.driveDocs || (
    studyDay.driveDocId 
      ? [{ id: studyDay.driveDocId, title: 'Documento', order: 1 }]
      : []
  );

  if (!docs.length) return null;

  return (
    <div className={`documents-list ${className}`}>
      <h3 className="text-lg font-bold mb-3">
        📄 Documentos ({docs.length})
      </h3>
      <div className="space-y-2">
        {docs
          .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
          .map((doc, idx) => (
            <a
              key={doc.id}
              href={`https://drive.google.com/file/d/${doc.id}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="
                block p-3 bg-amber-50 hover:bg-amber-100 
                rounded-lg transition-colors
                border-l-4 border-amber-500
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-amber-900">
                    {doc.title || `Documento ${idx + 1}`}
                  </p>
                  {doc.order && (
                    <p className="text-xs text-amber-600 mt-1">
                      Documento {doc.order}
                    </p>
                  )}
                </div>
                <span className="text-xl">📎</span>
              </div>
            </a>
          ))}
      </div>
    </div>
  );
};
```

---

## 🎯 Componente Completo de Estudos do Dia

```typescript
// src/components/dashboard/TodayStudyCard.tsx

import React from 'react';
import { useStudy } from '../../contexts/StudyContext';
import { VideosList } from '../common/VideosList';
import { DocumentsList } from '../common/DocumentsList';

export const TodayStudyCard: React.FC = () => {
  const { todayStudyDay } = useStudy();

  if (!todayStudyDay) {
    return (
      <div className="p-6 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Nenhum estudo para hoje! 🎉</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      {/* Cabeçalho */}
      <div className="border-b-2 border-gray-200 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          📚 {todayStudyDay.title}
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Especialidade: <span className="font-semibold">{todayStudyDay.subject}</span>
        </p>
        {todayStudyDay.date && (
          <p className="text-sm text-gray-600">
            Data: {new Date(todayStudyDay.date).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>

      {/* Vídeos */}
      <div className="mb-6">
        <VideosList studyDay={todayStudyDay} />
      </div>

      {/* Documentos */}
      <div className="mb-6">
        <DocumentsList studyDay={todayStudyDay} />
      </div>

      {/* Botão de Ação */}
      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors">
          ✅ Marca como Estudado
        </button>
      </div>
    </div>
  );
};
```

---

## 🎬 Componente Simplificado (Apenas Links)

```typescript
// src/components/common/MediaLinks.tsx

import React from 'react';
import { StudyDay, DriveMedia } from '../../types';

interface MediaLinksProps {
  studyDay: StudyDay | null;
}

export const MediaLinks: React.FC<MediaLinksProps> = ({ studyDay }) => {
  if (!studyDay) return null;

  // Coletar todos os media (vídeos + documentos)
  const allMedia: (DriveMedia & { type: 'video' | 'doc' })[] = [
    ...(studyDay.driveVideos?.map(v => ({ ...v, type: 'video' as const })) || []),
    ...(studyDay.driveDocs?.map(d => ({ ...d, type: 'doc' as const })) || []),
  ];

  if (!allMedia.length) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {allMedia.map(media => (
        <a
          key={`${media.type}-${media.id}`}
          href={`https://drive.google.com/file/d/${media.id}/view`}
          target="_blank"
          rel="noopener noreferrer"
          title={media.title}
          className="
            inline-flex items-center gap-2 px-3 py-2
            bg-blue-500 hover:bg-blue-600 text-white
            rounded-full text-sm font-medium
            transition-colors
          "
        >
          {media.type === 'video' ? '▶️' : '📄'}
          {media.title || (media.type === 'video' ? 'Vídeo' : 'Doc')}
        </a>
      ))}
    </div>
  );
};
```

---

## 📋 Hook Customizado Para Media

```typescript
// src/hooks/useStudyMedia.ts

import { useMemo } from 'react';
import { StudyDay, DriveMedia } from '../types';

interface MediaWithType extends DriveMedia {
  type: 'video' | 'doc';
}

export function useStudyMedia(studyDay: StudyDay | null) {
  return useMemo(() => {
    if (!studyDay) {
      return { videos: [], docs: [], all: [] };
    }

    // Vídeos: novo formato (array) ou antigo (single)
    const videos: MediaWithType[] = studyDay.driveVideos || [];
    if (studyDay.driveVideoId && !videos.some(v => v.id === studyDay.driveVideoId)) {
      videos.push({
        id: studyDay.driveVideoId,
        title: 'Vídeo',
        type: 'video'
      });
    }

    // Documentos: novo formato (array) ou antigo (single)
    const docs: MediaWithType[] = studyDay.driveDocs || [];
    if (studyDay.driveDocId && !docs.some(d => d.id === studyDay.driveDocId)) {
      docs.push({
        id: studyDay.driveDocId,
        title: 'Documento',
        type: 'doc'
      });
    }

    return {
      videos: videos.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
      docs: docs.sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
      all: [...videos, ...docs].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
    };
  }, [studyDay]);
}

// Uso:
export const MyComponent = () => {
  const { todayStudyDay } = useStudy();
  const { videos, docs, all } = useStudyMedia(todayStudyDay);

  return (
    <div>
      <p>Vídeos: {videos.length}</p>
      <p>Documentos: {docs.length}</p>
      <p>Total de media: {all.length}</p>
    </div>
  );
};
```

---

## 🎛️ Componente Complexo com Tabs

```typescript
// src/components/dashboard/StudyTabs.tsx

import React, { useState } from 'react';
import { StudyDay } from '../../types';
import { VideosList } from '../common/VideosList';
import { DocumentsList } from '../common/DocumentsList';

interface StudyTabsProps {
  studyDay: StudyDay | null;
}

export const StudyTabs: React.FC<StudyTabsProps> = ({ studyDay }) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'docs' | 'all'>('all');

  if (!studyDay) return null;

  const videoCount = studyDay.driveVideos?.length || (studyDay.driveVideoId ? 1 : 0);
  const docCount = studyDay.driveDocs?.length || (studyDay.driveDocId ? 1 : 0);

  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab('all')}
          className={`
            px-4 py-2 font-medium border-b-2
            ${activeTab === 'all' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
            }
          `}
        >
          Tudo ({videoCount + docCount})
        </button>
        <button
          onClick={() => setActiveTab('videos')}
          className={`
            px-4 py-2 font-medium border-b-2
            ${activeTab === 'videos' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
            }
          `}
        >
          Vídeos ({videoCount})
        </button>
        <button
          onClick={() => setActiveTab('docs')}
          className={`
            px-4 py-2 font-medium border-b-2
            ${activeTab === 'docs' 
              ? 'border-blue-500 text-blue-600' 
              : 'border-transparent text-gray-600 hover:text-gray-900'
            }
          `}
        >
          Documentos ({docCount})
        </button>
      </div>

      {/* Conteúdo */}
      <div className="p-4">
        {(activeTab === 'all' || activeTab === 'videos') && (
          <VideosList studyDay={studyDay} className="mb-6" />
        )}
        {(activeTab === 'all' || activeTab === 'docs') && (
          <DocumentsList studyDay={studyDay} />
        )}
      </div>
    </div>
  );
};
```

---

## 🚀 Como Integrar

### 1. Importar no Dashboard

```typescript
// src/components/dashboard/Dashboard.tsx

import { VideosList } from '../common/VideosList';
import { DocumentsList } from '../common/DocumentsList';
import { useStudy } from '../../contexts/StudyContext';

export function Dashboard() {
  const { todayStudyDay } = useStudy();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1>{todayStudyDay?.title}</h1>
      <VideosList studyDay={todayStudyDay} />
      <DocumentsList studyDay={todayStudyDay} />
    </div>
  );
}
```

### 2. Um a Um no Componente

```typescript
// Renderizar manualmente se preferir

const { todayStudyDay } = useStudy();

{todayStudyDay?.driveVideos?.map(video => (
  <a key={video.id} href={`https://drive.google.com/file/d/${video.id}/view`}>
    {video.title}
  </a>
))}
```

---

## ✅ Checklist de Integração

- [ ] Copiar VideosList.tsx para src/components/common/
- [ ] Copiar DocumentsList.tsx para src/components/common/
- [ ] Usar em Dashboard ou QuestionsPage
- [ ] Testar com dados que têm múltiplos vídeos
- [ ] Testar com dados que têm um único vídeo (backward compat)
- [ ] Verificar links Google Drive

---

## 🎨 Tailwind Classes Usadas

Certifique-se que seu `tailwind.config.js` tem:

```javascript
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Se não estiver usando Tailwind:
- `.bg-blue-50` → `background-color: #eff6ff`
- `.hover:bg-blue-100` → `background-color: #dbeafe on hover`
- `.border-l-4` → `border-left: 4px`
- etc.

---

**Pronto para integrar nos suas componentes!** 🚀
