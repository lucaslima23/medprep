import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  where
} from 'firebase/firestore';

export function AdminImport() {
  const [jsonInput, setJsonInput] = useState('');
  const [enareInput, setEnareInput] = useState('');
  const [status, setStatus] = useState('');
  const [stats, setStats] = useState<{ [key: string]: { total: number, subs: { [sub: string]: number } } }>({});
  const [total, setTotal] = useState(0);
  const [reports, setReports] = useState<any[]>([]);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [expandedAreas, setExpandedAreas] = useState<{ [key: string]: boolean }>({});

  // States for sub-subject viewing and renaming
  const [viewingSubSubject, setViewingSubSubject] = useState<{ area: string, sub: string, questions: any[] } | null>(null);
  const [newSubSubjectName, setNewSubSubjectName] = useState('');
  const [isLoadingSub, setIsLoadingSub] = useState(false);

  // 1. Carregar Estatísticas e Reports
  const carregarDados = async () => {
    try {
      // Carregar Questões para estatísticas
      const qSnapshot = await getDocs(collection(db, 'questions'));
      const contagem: { [key: string]: { total: number, subs: { [sub: string]: number } } } = {};
      let totalCount = 0;

      qSnapshot.forEach((d) => {
        const data = d.data();
        const area = data.subject || 'indefinido';
        const sub = data.subSubject || 'Geral/Outros';

        if (!contagem[area]) {
          contagem[area] = { total: 0, subs: {} };
        }
        contagem[area].total++;
        contagem[area].subs[sub] = (contagem[area].subs[sub] || 0) + 1;

        totalCount++;
      });
      setStats(contagem);
      setTotal(totalCount);

      // Carregar Reports de erros
      const rSnapshot = await getDocs(collection(db, 'questionReports'));
      setReports(rSnapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setStatus("❌ Erro ao sincronizar com o Firebase.");
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  const toggleArea = (area: string) => {
    setExpandedAreas(prev => ({ ...prev, [area]: !prev[area] }));
  };

  const openSubSubject = async (area: string, sub: string) => {
    setIsLoadingSub(true);
    setViewingSubSubject({ area, sub, questions: [] });
    setNewSubSubjectName(sub);

    try {
      const q = query(collection(db, 'questions'), where('subject', '==', area));
      const snapshot = await getDocs(q);

      const subQuestions = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as any))
        .filter(q => (q.subSubject || 'Geral/Outros') === sub);

      setViewingSubSubject({ area, sub, questions: subQuestions });
    } catch (e) {
      alert("Erro ao carregar questões do assunto.");
      setViewingSubSubject(null);
    } finally {
      setIsLoadingSub(false);
    }
  };

  const renameSubSubject = async () => {
    if (!viewingSubSubject || !newSubSubjectName.trim() || newSubSubjectName === viewingSubSubject.sub) return;

    try {
      setIsLoadingSub(true);
      const batch = writeBatch(db);

      viewingSubSubject.questions.forEach(q => {
        const ref = doc(db, 'questions', q.id);
        batch.update(ref, { subSubject: newSubSubjectName });
      });

      await batch.commit();

      alert(`Assunto renomeado para "${newSubSubjectName}" com sucesso! (${viewingSubSubject.questions.length} questões atualizadas)`);
      setViewingSubSubject(null);
      carregarDados();
    } catch (e) {
      alert("Erro ao renomear assunto.");
    } finally {
      setIsLoadingSub(false);
    }
  };

  // 2. Importar Lote de Questões
  const importarLote = async () => {
    if (!jsonInput) return;
    try {
      const data = JSON.parse(jsonInput);
      setStatus(`⏳ Importando ${data.length} questões...`);

      for (const q of data) {
        await addDoc(collection(db, 'questions'), {
          statement: q.text,
          options: q.options.map((opt: string, index: number) => ({
            id: `opt-${index}-${Date.now()}`,
            letter: String.fromCharCode(65 + index),
            text: opt
          })),
          correctAnswer: q.answer,
          explanation: q.explanation,
          subject: q.subject.toLowerCase(),
          subSubject: q.subSubject || '',
          difficulty: q.difficulty || 'media',
          createdAt: new Date().toISOString()
        });
      }

      setStatus('✅ Importação finalizada!');
      setJsonInput('');
      carregarDados();
    } catch (error) {
      setStatus('❌ Erve: JSON inválido.');
    }
  };

  // 3. Importar Trilha ENARE 2025 (Meta Contents)
  const seedTrilhaEnare = async () => {
    if (!enareInput) return;
    try {
      const trilha = JSON.parse(enareInput);
      setStatus(`⏳ Limpando meta_contents antigos e importando ${trilha.length} novos temas...`);

      const batch = writeBatch(db);

      // Apagar todos antigos
      const oldSnap = await getDocs(collection(db, 'meta_contents'));
      oldSnap.docs.forEach((d) => {
        batch.delete(d.ref);
      });

      // Apagar todos cronogramas de usuários antigos
      // Isso forçará o StudyContext a recriar os cronogramas com base na nova Trilha ENARE
      const schedulesSnap = await getDocs(collection(db, 'schedules'));
      schedulesSnap.docs.forEach((d) => {
        batch.delete(d.ref);
      });

      // Inserir os novos
      let currentOrder = 1;

      for (const t of trilha) {
        // Gera ordem sequencial absoluta
        // order = 1, 2, 3 ... para facilitar divisões fracionárias depois
        const docRef = doc(collection(db, 'meta_contents'));
        batch.set(docRef, {
          title: t.title,
          subject: t.subject.toLowerCase(),
          week: t.week || 1,
          task: t.task || 1,
          type: t.type || 'teoria',
          order: currentOrder++,
          createdAt: new Date().toISOString()
        });
      }

      await batch.commit();

      setStatus('✅ Trilha ENARE importada e salva em meta_contents com sucesso!');
      setEnareInput('');
    } catch (error) {
      console.error(error);
      setStatus('❌ Erro: JSON da Trilha ENARE inválido ou permissão negada.');
    }
  };

  // 4. Remover Duplicatas
  const removerDuplicatas = async () => {
    try {
      setStatus("🧹 Limpando duplicatas...");
      const snapshot = await getDocs(collection(db, 'questions'));
      const vistos = new Set();
      let deletados = 0;

      for (const d of snapshot.docs) {
        const txt = d.data().statement?.trim().toLowerCase();
        if (vistos.has(txt)) {
          await deleteDoc(doc(db, 'questions', d.id));
          deletados++;
        } else {
          vistos.add(txt);
        }
      }
      setStatus(`✅ ${deletados} duplicatas removidas.`);
      carregarDados();
    } catch (e) { setStatus("❌ Erro na limpeza."); }
  };

  // Preparar Edição de Questão Reportada
  const handleEditReportedQuestion = async (r: any) => {
    try {
      const qRef = doc(db, 'questions', r.questionId);
      const qSnap = await getDoc(qRef);
      if (qSnap.exists()) {
        const questionData = qSnap.data();
        setEditingQuestion({
          ...r,
          isFromReport: true,
          questionStatement: questionData.statement,
          explanation: questionData.explanation || '',
          imageUrl: questionData.imageUrl || ''
        });
      } else {
        alert("A questão original não foi encontrada.");
      }
    } catch (e) {
      console.error(e);
      alert("Erro ao buscar a questão original.");
    }
  };

  // 4. Salvar Edição de Questão Reportada
  const salvarEdicao = async () => {
    if (!editingQuestion) return;
    try {
      const qRef = doc(db, 'questions', editingQuestion.questionId);
      const updateData: any = {
        statement: editingQuestion.questionStatement,
        explanation: editingQuestion.explanation
      };

      // Apenas adiciona imageUrl se houver valor, ou null/string vazia se quiser apagar.
      if (editingQuestion.imageUrl !== undefined) {
        updateData.imageUrl = editingQuestion.imageUrl;
      }

      await updateDoc(qRef, updateData);

      if (editingQuestion.isFromReport) {
        await deleteDoc(doc(db, 'questionReports', editingQuestion.id));
      }

      setEditingQuestion(null);
      carregarDados();
      alert("Questão corrigida com sucesso!");
    } catch (e) { alert("Erro ao salvar edição."); }
  };

  // 5. Excluir Questão (Reportada ou Não)
  const excluirQuestao = async () => {
    if (!editingQuestion) return;
    try {
      const qRef = doc(db, 'questions', editingQuestion.questionId);
      await deleteDoc(qRef);

      if (editingQuestion.isFromReport) {
        await deleteDoc(doc(db, 'questionReports', editingQuestion.id));
      }

      setEditingQuestion(null);
      carregarDados();
      alert("Questão excluída do sistema com sucesso!");
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir questão.");
    }
  };

  return (
    <div style={{ padding: '40px', color: 'white', maxWidth: '1000px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Painel Administrativo - MedPrep</h1>

      {/* DASHBOARD DE QUESTÕES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px', marginBottom: '40px', alignItems: 'start' }}>
        <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '2px solid #3b82f6', textAlign: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '12px' }}>TOTAL GERAL</span>
          <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{total}</div>
        </div>
        {Object.entries(stats).map(([area, data]) => (
          <div
            key={area}
            style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
            onClick={() => toggleArea(area)}
            onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
            onMouseOut={(e) => e.currentTarget.style.background = '#1e293b'}
          >
            <span style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>{area}</span>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{data.total}</div>
            <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '5px' }}>{expandedAreas[area] ? '▲ Ocultar Assuntos' : '▼ Ver Assuntos'}</div>

            {expandedAreas[area] && (
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #334155', textAlign: 'left', maxHeight: '200px', overflowY: 'auto' }}>
                {Object.entries(data.subs).sort((a, b) => b[1] - a[1]).map(([sub, count]) => (
                  <div
                    key={sub}
                    style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 8px', color: '#cbd5e1', cursor: 'pointer', borderRadius: '4px', transition: 'background 0.2s' }}
                    onClick={(e) => { e.stopPropagation(); openSubSubject(area, sub); }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#475569'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    title="Clique para organizar este assunto"
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{sub}</span>
                    <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* IMPORTADOR */}
      <div style={{ background: '#0f172a', padding: '25px', borderRadius: '15px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>🚀 Novo Lote de Questões</h2>
        <textarea
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          placeholder="Cole o JSON aqui..."
          style={{ width: '100%', height: '150px', borderRadius: '8px', padding: '12px', marginBottom: '15px', color: '#000' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={importarLote} style={{ background: '#10b981', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Importar</button>
          <button onClick={removerDuplicatas} style={{ background: '#ef4444', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Limpar Duplicatas</button>
          <button onClick={carregarDados} style={{ background: '#6366f1', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Atualizar</button>
        </div>
        {status && <p style={{ marginTop: '15px', color: '#10b981' }}>{status}</p>}
      </div>

      {/* IMPORTADOR ENARE */}
      <div style={{ background: '#0f172a', padding: '25px', borderRadius: '15px', marginBottom: '40px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>⚡ Seed: Trilha ENARE 2025 (Limpa cronograma antigo)</h2>
        <textarea
          value={enareInput}
          onChange={(e) => setEnareInput(e.target.value)}
          placeholder='Cole o JSON da trilha, ex: [{ "week": 1, "task": 1, "subject": "preventiva", "title": "Atenção Primária", "type": "teoria" }]'
          style={{ width: '100%', height: '150px', borderRadius: '8px', padding: '12px', marginBottom: '15px', color: '#000' }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={seedTrilhaEnare} style={{ background: '#f59e0b', color: '#000', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>♻️ Resetar & Importar Trilha Enare</button>
        </div>
      </div>

      {/* GESTÃO DE REPORTS */}
      <div style={{ background: '#0f172a', padding: '25px', borderRadius: '15px' }}>
        <h2 style={{ fontSize: '18px', color: '#fb7185', marginBottom: '20px' }}>⚠️ Questões com Erro ({reports.length})</h2>
        {reports.length === 0 ? <p style={{ color: '#64748b' }}>Nenhum erro reportado no momento.</p> : (
          reports.map(r => (
            <div key={r.id} style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px' }}><strong>Motivo:</strong> {r.reason || r.errorDescription || 'Não especificado'}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>ID: {r.questionId}</p>
              </div>
              <button onClick={() => handleEditReportedQuestion(r)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>Corrigir</button>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE EDIÇÃO */}
      {editingQuestion && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#1e293b', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '700px' }}>
            <h3 style={{ marginTop: 0 }}>Editando Questão</h3>
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Enunciado:</label>
            <textarea
              style={{ width: '100%', height: '150px', margin: '10px 0', borderRadius: '8px', padding: '10px', color: '#000' }}
              value={editingQuestion.questionStatement || editingQuestion.statement}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, questionStatement: e.target.value, statement: e.target.value })}
            />

            <label style={{ fontSize: '12px', color: '#94a3b8' }}>URL da Imagem (opcional):</label>
            <input
              type="text"
              placeholder="https://exemplo.com/imagem.png"
              style={{ width: '100%', margin: '10px 0', borderRadius: '8px', padding: '10px', color: '#000' }}
              value={editingQuestion.imageUrl || ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, imageUrl: e.target.value })}
            />

            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Explicação:</label>
            <textarea
              style={{ width: '100%', height: '100px', margin: '10px 0', borderRadius: '8px', padding: '10px', color: '#000' }}
              value={editingQuestion.explanation || ''}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={async () => {
                  await salvarEdicao();
                  // Refetch sub-subject if modal is open
                  if (viewingSubSubject) openSubSubject(viewingSubSubject.area, newSubSubjectName);
                }}
                style={{ background: '#10b981', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Salvar e Resolver
              </button>
              <button
                onClick={async () => {
                  if (confirm('Tem certeza que deseja EXCLUIR permanentemente esta questão?')) {
                    await excluirQuestao();
                    if (viewingSubSubject) openSubSubject(viewingSubSubject.area, newSubSubjectName);
                  }
                }}
                style={{ background: '#ef4444', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                Excluir Questão
              </button>
              <button onClick={() => setEditingQuestion(null)} style={{ background: '#64748b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SUB-ASSUNTO */}
      {viewingSubSubject && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9998 }}>
          <div style={{ background: '#0f172a', padding: '30px', borderRadius: '15px', width: '90%', maxWidth: '900px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #334155', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: '12px', color: '#3b82f6', textTransform: 'uppercase', fontWeight: 'bold' }}>{viewingSubSubject.area}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                  <input
                    type="text"
                    value={newSubSubjectName}
                    onChange={(e) => setNewSubSubjectName(e.target.value)}
                    style={{ background: '#1e293b', border: '1px solid #334155', color: '#fff', padding: '8px 12px', borderRadius: '6px', fontSize: '20px', fontWeight: 'bold', width: '300px' }}
                  />
                  <button
                    onClick={renameSubSubject}
                    disabled={isLoadingSub || newSubSubjectName === viewingSubSubject.sub}
                    style={{ background: newSubSubjectName !== viewingSubSubject.sub ? '#10b981' : '#475569', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: newSubSubjectName !== viewingSubSubject.sub ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
                  >
                    Renomear Assunto
                  </button>
                </div>
                <p style={{ margin: '10px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
                  Isso atualizará este nome em todas as {viewingSubSubject.questions.length} questões listadas abaixo simultaneamente.
                </p>
              </div>

              <button onClick={() => setViewingSubSubject(null)} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Fechar ✖
              </button>
            </div>

            {/* Modal Content - List of Questions */}
            <div style={{ overflowY: 'auto', flex: 1, paddingRight: '10px' }}>
              {isLoadingSub ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>⏳ Carregando questões...</div>
              ) : viewingSubSubject.questions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Nenhuma questão encontrada com estes estritos filtros.</div>
              ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                  {viewingSubSubject.questions.map((q, idx) => (
                    <div key={q.id} style={{ background: '#1e293b', padding: '20px', borderRadius: '10px', border: '1px solid #334155' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <span style={{ fontSize: '14px', color: '#94a3b8', fontWeight: 'bold' }}>Questão {idx + 1}</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <span style={{ fontSize: '12px', background: '#334155', padding: '4px 8px', borderRadius: '4px', textTransform: 'capitalize' }}>Diff: {q.difficulty}</span>
                          <button
                            onClick={() => setEditingQuestion({ ...q, questionId: q.id, questionStatement: q.statement, imageUrl: q.imageUrl || '', isFromReport: false })}
                            style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                          >
                            Editar ✎
                          </button>
                        </div>
                      </div>

                      <div style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: '1.5', marginBottom: '15px' }}>
                        {q.statement}
                      </div>

                      <div style={{ display: 'grid', gap: '8px', marginBottom: '15px' }}>
                        {q.options?.map((opt: any) => (
                          <div key={opt.id} style={{ padding: '8px 12px', borderRadius: '6px', background: opt.letter === q.correctAnswer ? '#10b98133' : '#0f172a', border: opt.letter === q.correctAnswer ? '1px solid #10b981' : '1px solid #334155', color: opt.letter === q.correctAnswer ? '#34d399' : '#94a3b8', fontSize: '14px' }}>
                            <strong>{opt.letter})</strong> {opt.text}
                          </div>
                        ))}
                      </div>

                      {q.explanation && (
                        <div style={{ background: '#3b82f61a', borderLeft: '3px solid #3b82f6', padding: '10px', borderRadius: '0 4px 4px 0', fontSize: '13px', color: '#cbd5e1' }}>
                          <strong>💡 Explicação:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}