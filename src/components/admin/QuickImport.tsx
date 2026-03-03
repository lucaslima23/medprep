import React, { useState } from 'react';
// Adjust the import to match your firebase service export
import { db } from '../../services/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import metaContentsFull from '../../data/meta_contents_full_schedule.json';
import '../admin/AdminImport';

export const QuickImportPage: React.FC = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'importing' | 'done' | 'error'>('idle');
  const [errors, setErrors] = useState<string[]>([]);

  const handleImport = async () => {
    try {
      setIsImporting(true);
      setStatus('importing');
      setProgress(0);
      setSuccessCount(0);
      setErrorCount(0);
      setErrors([]);

      const items = metaContentsFull.metaContentsFull;
      let success = 0;
      let error = 0;
      const errorsList: string[] = [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          // Gerar ID
          const normalizedTitle = item.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 25);
          
          const docId = `${String(item.order).padStart(3, '0')}_${normalizedTitle}`;

          // Preparar dados
          const dataToImport = {
            ...item,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // Salvar no Firestore
          await setDoc(doc(collection(db, 'metaContents'), docId), dataToImport);

          success++;
        } catch (err) {
          error++;
          errorsList.push(`[${item.order}] ${item.title}: ${err}`);
        }

        // Atualizar progresso
        const progressPercent = Math.round(((i + 1) / items.length) * 100);
        setProgress(progressPercent);
        setSuccessCount(success);
        setErrorCount(error);
      }

      setErrors(errorsList);
      setStatus('done');
      setIsImporting(false);
    } catch (err) {
      console.error('Erro geral:', err);
      setStatus('error');
      setErrors([`Erro geral: ${err}`]);
      setIsImporting(false);
    }
  };

  return (
    <div className="admin-import-container">
      <div className="admin-header">
        <h1>⚡ Importação Rápida - 92 Itens</h1>
        <p>Importar todos os itens do cronograma para o Firestore</p>
      </div>

      {status === 'idle' && (
        <div className="import-intro">
          <div className="info-box">
            <h2>📊 O que será importado?</h2>
            <p>
              <strong>{metaContentsFull.metaContentsFull.length}</strong> itens do seu cronograma:
            </p>
            <ul>
              <li>Temas médicos completos</li>
              <li>Estrutura: Título, Assunto, Nível</li>
              <li>Espaço em branco para vídeos/documentos</li>
              <li>Pré-preparado para o Editor</li>
            </ul>

            <h3>Próximo passo:</h3>
            <ol>
              <li>Clique em "Começar Importação"</li>
              <li>Aguarde a conclusão (2-3 minutos)</li>
              <li>Acesse o Editor para adicionar IDs</li>
            </ol>
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting}
            className="btn-primary btn-large"
          >
            🚀 Começar Importação
          </button>
        </div>
      )}

      {status === 'importing' && (
        <div className="import-progress">
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${progress}%` }}
            >
              <span className="progress-text">{progress}%</span>
            </div>
          </div>

          <div className="progress-stats">
            <div className="stat">
              <span className="label">✅ Sucesso:</span>
              <span className="value">{successCount}</span>
            </div>
            <div className="stat">
              <span className="label">❌ Erros:</span>
              <span className="value">{errorCount}</span>
            </div>
            <div className="stat">
              <span className="label">📊 Total:</span>
              <span className="value">{metaContentsFull.metaContentsFull.length}</span>
            </div>
          </div>

          <div className="loading-message">
            <div className="spinner"></div>
            <p>Importando itens {successCount} de {metaContentsFull.metaContentsFull.length}...</p>
          </div>
        </div>
      )}

      {status === 'done' && (
        <div className="import-result">
          <div className="result-box success">
            <h2>🎉 Importação Concluída!</h2>
            
            <div className="result-stats">
              <div className="stat">
                <span className="label">✅ Importados com sucesso:</span>
                <span className="value large">{successCount}</span>
              </div>
              {errorCount > 0 && (
                <div className="stat">
                  <span className="label">⚠️ Com erro:</span>
                  <span className="value">{errorCount}</span>
                </div>
              )}
            </div>

            <div className="next-steps">
              <h3>✨ Próximos passos:</h3>
              <ol>
                <li>
                  <strong>Verificar no Firebase:</strong>
                  <p>Firestore Console → meta_contents → {successCount} documentos</p>
                </li>
                <li>
                  <strong>Abrir o Editor:</strong>
                  <p>
                    <a href="/admin/schedule-editor" className="link-button">
                      📅 Ir para Schedule Editor →
                    </a>
                  </p>
                </li>
                <li>
                  <strong>Adicionar IDs:</strong>
                  <p>Preencha com IDs de vídeos e documentos do Google Drive</p>
                </li>
              </ol>
            </div>

            {errorCount > 0 && errors.length > 0 && (
              <details className="error-details">
                <summary>Ver detalhes dos erros ({errors.length})</summary>
                <div className="error-list">
                  {errors.slice(0, 10).map((err, idx) => (
                    <div key={idx} className="error-item">
                      {err}
                    </div>
                  ))}
                  {errors.length > 10 && (
                    <div className="error-item">
                      ... e mais {errors.length - 10} erros
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>

          <button
            onClick={() => window.location.href = '/admin/schedule-editor'}
            className="btn-primary btn-large"
          >
            → Ir para Schedule Editor
          </button>
        </div>
      )}

      {status === 'error' && (
        <div className="import-result">
          <div className="result-box error">
            <h2>❌ Erro na Importação</h2>
            <p>Houve um problema ao importar os itens.</p>

            <details className="error-details">
              <summary>Detalhes do erro</summary>
              <div className="error-list">
                {errors.map((err, idx) => (
                  <div key={idx} className="error-item">
                    {err}
                  </div>
                ))}
              </div>
            </details>

            <button
              onClick={() => setStatus('idle')}
              className="btn-primary"
            >
              ↻ Tentar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuickImportPage;
