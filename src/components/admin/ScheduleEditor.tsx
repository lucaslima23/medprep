import React, { useState, useEffect, useMemo } from 'react';
import { scheduleService } from '../../services/firebase';
import '../admin/AdminImport';

interface DriveMedia {
  id: string;
  title?: string;
  order?: number;
}

interface MetaContentItem {
  id?: string;
  title: string;
  subject: string;
  subSubject?: string;
  order: number;
  summary?: string;
  driveVideos: DriveMedia[];
  driveDocs: DriveMedia[];
  [key: string]: any;
}

interface EditableItem extends MetaContentItem {
  docId: string;
  isEditing: boolean;
  hasChanges: boolean;
}

export const ScheduleEditorPage: React.FC = () => {
  const [items, setItems] = useState<EditableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newVideoInput, setNewVideoInput] = useState('');
  const [newDocInput, setNewDocInput] = useState('');

  // Carregar items
  useEffect(() => {
    const loadItems = async () => {
      try {
        setLoading(true);
        const allItems = await scheduleService.getMetaContents();
        const itemsWithDocId: EditableItem[] = allItems.map((doc: any) => ({
          docId: doc.id,
          ...(doc.data as MetaContentItem),
          isEditing: false,
          hasChanges: false,
        }));

        // Ordenar por order
        itemsWithDocId.sort((a, b) => a.order - b.order);
        setItems(itemsWithDocId);
        setError(null);
      } catch (err) {
        setError(`Erro ao carregar itens: ${err}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, []);

  // Filtrar items
  const filteredItems = useMemo(() => {
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(filter.toLowerCase()) ||
        item.subject.toLowerCase().includes(filter.toLowerCase())
    );
  }, [items, filter]);

  // Atualizar campo
  const updateField = (index: number, field: keyof MetaContentItem, value: any) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      [field]: value,
      hasChanges: true,
    };
    setItems(newItems);
  };

  // Adicionar vídeo
  const addVideo = (index: number, videoId: string, title?: string) => {
    if (!videoId.trim()) return;

    const newItems = [...items];
    const newVideo: DriveMedia = {
      id: videoId.trim(),
      title: title?.trim() || undefined,
      order: (newItems[index].driveVideos?.length || 0) + 1,
    };

    newItems[index] = {
      ...newItems[index],
      driveVideos: [...(newItems[index].driveVideos || []), newVideo],
      hasChanges: true,
    };

    setItems(newItems);
    setNewVideoInput('');
  };

  // Adicionar documento
  const addDoc = (index: number, docId: string, title?: string) => {
    if (!docId.trim()) return;

    const newItems = [...items];
    const newDoc: DriveMedia = {
      id: docId.trim(),
      title: title?.trim() || undefined,
      order: (newItems[index].driveDocs?.length || 0) + 1,
    };

    newItems[index] = {
      ...newItems[index],
      driveDocs: [...(newItems[index].driveDocs || []), newDoc],
      hasChanges: true,
    };

    setItems(newItems);
    setNewDocInput('');
  };

  // Remover vídeo
  const removeVideo = (itemIndex: number, videoIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      driveVideos: newItems[itemIndex].driveVideos.filter((_, i) => i !== videoIndex),
      hasChanges: true,
    };
    setItems(newItems);
  };

  // Remover documento
  const removeDoc = (itemIndex: number, docIndex: number) => {
    const newItems = [...items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      driveDocs: newItems[itemIndex].driveDocs.filter((_, i) => i !== docIndex),
      hasChanges: true,
    };
    setItems(newItems);
  };

  // Salvar mudanças
  const saveItem = async (index: number) => {
    try {
      setSaving(true);
      const item = items[index];

      const dataToSave = { ...item };
      delete (dataToSave as any).docId;
      delete (dataToSave as any).isEditing;
      delete (dataToSave as any).hasChanges;

      await scheduleService.updateMetaContent(item.docId, dataToSave);

      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        isEditing: false,
        hasChanges: false,
      };
      setItems(newItems);

      setSuccess(`✅ ${item.title} salvo com sucesso!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Erro ao salvar: ${err}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Salvar todos
  const saveAll = async () => {
    try {
      setSaving(true);
      const itemsToSave = items.filter((item) => item.hasChanges);

      for (const item of itemsToSave) {
        const dataToSave = { ...item };
        delete (dataToSave as any).docId;
        delete (dataToSave as any).isEditing;
        delete (dataToSave as any).hasChanges;
        await scheduleService.updateMetaContent(item.docId, dataToSave);
      }

      const newItems = items.map((item) => ({
        ...item,
        isEditing: false,
        hasChanges: false,
      }));
      setItems(newItems);

      setSuccess(`✅ ${itemsToSave.length} itens salvos com sucesso!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Erro ao salvar: ${err}`);
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-import-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-import-container">
      <div className="admin-header">
        <h1>📅 Editor de Cronograma</h1>
        <p>Adicione IDs de vídeo e documentos aos seus temas</p>
      </div>

      {error && (
        <div className="alert alert-error">
          ❌ {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)}>×</button>
        </div>
      )}

      {/* Filtro e Ações */}
      <div className="editor-controls">
        <input
          type="text"
          placeholder="🔍 Filtrar por titulo ou assunto..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-input"
        />
        <button
          onClick={saveAll}
          disabled={!items.some((i) => i.hasChanges) || saving}
          className="btn-primary"
        >
          💾 Salvar Tudo ({items.filter((i) => i.hasChanges).length})
        </button>
      </div>

      {/* Lista de Items */}
      <div className="items-list">
        {filteredItems.map((item) => {
          const actualIndex = items.indexOf(item);

          return (
            <div
              key={item.docId}
              className={`item-card ${item.hasChanges ? 'has-changes' : ''}`}
            >
              {/* Header */}
              <div className="item-header">
                <div className="item-title-section">
                  <span className="item-order">#{item.order}</span>
                  <h3>{item.title}</h3>
                  {item.hasChanges && <span className="badge badge-unsaved">⚠️ Não salvo</span>}
                </div>
                <button
                  onClick={() =>
                    setEditingIndex(editingIndex === actualIndex ? null : actualIndex)
                  }
                  className="btn-expand"
                >
                  {editingIndex === actualIndex ? '▼' : '►'}
                </button>
              </div>

              {/* Metadata */}
              <div className="item-metadata">
                <span className="badge">{item.subject}</span>
                {item.subSubject && <span className="badge badge-sub">{item.subSubject}</span>}
                <span className="media-count">
                  📹 {item.driveVideos?.length || 0} | 📄 {item.driveDocs?.length || 0}
                </span>
              </div>

              {/* Conteúdo Expandido */}
              {editingIndex === actualIndex && (
                <div className="item-content">
                  {/* Resumo */}
                  <div className="form-group">
                    <label>Resumo</label>
                    <textarea
                      value={item.summary || ''}
                      onChange={(e) =>
                        updateField(actualIndex, 'summary', e.target.value)
                      }
                      className="form-textarea"
                      rows={3}
                    />
                  </div>

                  {/* Vídeos */}
                  <div className="media-section">
                    <h4>📹 Vídeos ({item.driveVideos?.length || 0})</h4>

                    {item.driveVideos && item.driveVideos.length > 0 && (
                      <div className="media-list">
                        {item.driveVideos.map((video, vidIndex) => (
                          <div key={vidIndex} className="media-item">
                            <div className="media-info">
                              <input
                                type="text"
                                value={video.id}
                                onChange={(e) => {
                                  const newItems = [...items];
                                  const newVideos = [...newItems[actualIndex].driveVideos];
                                  newVideos[vidIndex] = {
                                    ...newVideos[vidIndex],
                                    id: e.target.value,
                                  };
                                  newItems[actualIndex] = {
                                    ...newItems[actualIndex],
                                    driveVideos: newVideos,
                                    hasChanges: true,
                                  };
                                  setItems(newItems);
                                }}
                                placeholder="ID do Google Drive"
                                className="form-input small"
                              />
                              <input
                                type="text"
                                value={video.title || ''}
                                onChange={(e) => {
                                  const newItems = [...items];
                                  const newVideos = [...newItems[actualIndex].driveVideos];
                                  newVideos[vidIndex] = {
                                    ...newVideos[vidIndex],
                                    title: e.target.value,
                                  };
                                  newItems[actualIndex] = {
                                    ...newItems[actualIndex],
                                    driveVideos: newVideos,
                                    hasChanges: true,
                                  };
                                  setItems(newItems);
                                }}
                                placeholder="Título (opcional)"
                                className="form-input small"
                              />
                            </div>
                            <button
                              onClick={() => removeVideo(actualIndex, vidIndex)}
                              className="btn-remove"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar vídeo */}
                    <div className="add-media">
                      <input
                        type="text"
                        placeholder="ID do Google Drive"
                        value={newVideoInput}
                        onChange={(e) => setNewVideoInput(e.target.value)}
                        className="form-input small"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addVideo(actualIndex, newVideoInput);
                          }
                        }}
                      />
                      <button
                        onClick={() => addVideo(actualIndex, newVideoInput)}
                        disabled={!newVideoInput.trim()}
                        className="btn-small"
                      >
                        ➕ Adicionar Vídeo
                      </button>
                    </div>
                  </div>

                  {/* Documentos */}
                  <div className="media-section">
                    <h4>📄 Documentos ({item.driveDocs?.length || 0})</h4>

                    {item.driveDocs && item.driveDocs.length > 0 && (
                      <div className="media-list">
                        {item.driveDocs.map((doc, docIndex) => (
                          <div key={docIndex} className="media-item">
                            <div className="media-info">
                              <input
                                type="text"
                                value={doc.id}
                                onChange={(e) => {
                                  const newItems = [...items];
                                  const newDocs = [...newItems[actualIndex].driveDocs];
                                  newDocs[docIndex] = {
                                    ...newDocs[docIndex],
                                    id: e.target.value,
                                  };
                                  newItems[actualIndex] = {
                                    ...newItems[actualIndex],
                                    driveDocs: newDocs,
                                    hasChanges: true,
                                  };
                                  setItems(newItems);
                                }}
                                placeholder="ID do Google Drive"
                                className="form-input small"
                              />
                              <input
                                type="text"
                                value={doc.title || ''}
                                onChange={(e) => {
                                  const newItems = [...items];
                                  const newDocs = [...newItems[actualIndex].driveDocs];
                                  newDocs[docIndex] = {
                                    ...newDocs[docIndex],
                                    title: e.target.value,
                                  };
                                  newItems[actualIndex] = {
                                    ...newItems[actualIndex],
                                    driveDocs: newDocs,
                                    hasChanges: true,
                                  };
                                  setItems(newItems);
                                }}
                                placeholder="Título (opcional)"
                                className="form-input small"
                              />
                            </div>
                            <button
                              onClick={() => removeDoc(actualIndex, docIndex)}
                              className="btn-remove"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Adicionar documento */}
                    <div className="add-media">
                      <input
                        type="text"
                        placeholder="ID do Google Drive"
                        value={newDocInput}
                        onChange={(e) => setNewDocInput(e.target.value)}
                        className="form-input small"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addDoc(actualIndex, newDocInput);
                          }
                        }}
                      />
                      <button
                        onClick={() => addDoc(actualIndex, newDocInput)}
                        disabled={!newDocInput.trim()}
                        className="btn-small"
                      >
                        ➕ Adicionar Doc
                      </button>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="item-actions">
                    <button
                      onClick={() => saveItem(actualIndex)}
                      disabled={!item.hasChanges || saving}
                      className="btn-save"
                    >
                      💾 Salvar Item
                    </button>
                    <button
                      onClick={() => {
                        setItems(
                          items.map((i, idx) =>
                            idx === actualIndex ? { ...i, hasChanges: false } : i
                          )
                        );
                      }}
                      className="btn-cancel"
                    >
                      ✕ Desfazer
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="no-items">
          <p>Nenhum item encontrado</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleEditorPage;
