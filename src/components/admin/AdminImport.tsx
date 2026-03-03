import { useState, useEffect } from 'react';
import { db } from '../../services/firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  writeBatch
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
      const rSnapshot = await getDocs(collection(db, 'question_reports'));
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

  // 4. Salvar Edição de Questão Reportada
  const salvarEdicao = async () => {
    if (!editingQuestion) return;
    try {
      const qRef = doc(db, 'questions', editingQuestion.questionId);
      await updateDoc(qRef, {
        statement: editingQuestion.questionStatement,
        explanation: editingQuestion.explanation
      });
      await deleteDoc(doc(db, 'question_reports', editingQuestion.id));
      setEditingQuestion(null);
      carregarDados();
      alert("Questão corrigida com sucesso!");
    } catch (e) { alert("Erro ao salvar edição."); }
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
              <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #334155', textAlign: 'left' }}>
                {Object.entries(data.subs).sort((a, b) => b[1] - a[1]).map(([sub, count]) => (
                  <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '4px 0', color: '#cbd5e1' }}>
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
                <p style={{ margin: 0, fontSize: '14px' }}><strong>Motivo:</strong> {r.errorDescription || 'Não especificado'}</p>
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>ID: {r.questionId}</p>
              </div>
              <button onClick={() => setEditingQuestion(r)} style={{ background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer' }}>Corrigir</button>
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
              style={{ width: '100%', height: '150px', margin: '10px 0', borderRadius: '8px', padding: '10px' }}
              value={editingQuestion.questionStatement}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, questionStatement: e.target.value })}
            />
            <label style={{ fontSize: '12px', color: '#94a3b8' }}>Explicação:</label>
            <textarea
              style={{ width: '100%', height: '100px', margin: '10px 0', borderRadius: '8px', padding: '10px' }}
              value={editingQuestion.explanation}
              onChange={(e) => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={salvarEdicao} style={{ background: '#10b981', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Salvar e Resolver</button>
              <button onClick={() => setEditingQuestion(null)} style={{ background: '#64748b', color: '#fff', padding: '10px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}