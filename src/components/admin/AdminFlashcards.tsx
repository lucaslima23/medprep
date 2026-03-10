import { useState } from 'react';
import { db } from '../../services/firebase';
import { MedicalSubject, SUBJECT_LABELS } from '../../types';
import { collection, getDocs, doc, writeBatch, query } from 'firebase/firestore';

export function AdminFlashcards() {
    const [ankiDeckName, setAnkiDeckName] = useState('');
    const [ankiSubject, setAnkiSubject] = useState<MedicalSubject>('clinica_medica');
    const [ankiSubSubject, setAnkiSubSubject] = useState('');
    const [ankiStatus, setAnkiStatus] = useState('');
    const subjects: MedicalSubject[] = Object.keys(SUBJECT_LABELS) as MedicalSubject[];

    const invokeAnkiConnect = async (action: string, params: any = {}) => {
        try {
            const response = await fetch('http://localhost:8765', {
                method: 'POST',
                body: JSON.stringify({ action, version: 6, params }),
            });
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data.result;
        } catch (e: any) {
            throw new Error(`Falha no AnkiConnect (${action}): ` + e.message);
        }
    };

    const syncAnkiToFirebase = async () => {
        if (!ankiDeckName.trim()) {
            setAnkiStatus("❌ Digite o nome do baralho.");
            return;
        }

        try {
            setAnkiStatus("⏳ Conectando ao Anki (localhost:8765)...");
            const deckNames = await invokeAnkiConnect('deckNames');
            if (!deckNames.includes(ankiDeckName)) {
                setAnkiStatus(`❌ Baralho "${ankiDeckName}" não encontrado no Anki aberto.`);
                return;
            }

            setAnkiStatus(`⏳ Buscando notas do baralho "${ankiDeckName}"...`);
            const noteIds = await invokeAnkiConnect('findNotes', { query: `deck:"${ankiDeckName}"` });
            if (!noteIds || noteIds.length === 0) {
                setAnkiStatus("❌ Nenhuma nota encontrada neste baralho.");
                return;
            }

            setAnkiStatus(`⏳ Baixando informações de ${noteIds.length} notas...`);
            const notes = await invokeAnkiConnect('notesInfo', { notes: noteIds });

            let newCount = 0;
            let dupCount = 0;
            setAnkiStatus(`⏳ Sincronizando com o Firebase...`);

            const flashcardsSnap = await getDocs(query(collection(db, 'flashcards')));
            const existingAnkiIds = new Set(flashcardsSnap.docs.map(d => d.data().ankiNoteId).filter(Boolean));

            let batch = writeBatch(db);
            let operationsInBatch = 0;

            for (let i = 0; i < notes.length; i++) {
                const note = notes[i];
                const noteIdStr = String(note.noteId);

                if (existingAnkiIds.has(noteIdStr)) {
                    dupCount++;
                    continue;
                }

                let front = note.fields.Front?.value || note.fields.Text?.value || '';
                let back = note.fields.Back?.value || note.fields.Extra?.value || '';

                const replaceMedia = async (htmlContent: string) => {
                    let updatedHtml = htmlContent;
                    const matches = [...htmlContent.matchAll(/<img.*?src=["']([^"']+)["'].*?>/gi)];

                    for (const match of matches) {
                        const filename = match[1];
                        if (!filename.startsWith('data:')) {
                            try {
                                const base64Str = await invokeAnkiConnect('retrieveMediaFile', { filename });
                                if (base64Str) {
                                    const ext = filename.split('.').pop()?.toLowerCase() || 'png';
                                    const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`;
                                    const dataUrl = `data:${mime};base64,${base64Str}`;
                                    updatedHtml = updatedHtml.replace(match[0], `<img src="${dataUrl}">`);
                                }
                            } catch (err) {
                                console.warn("Failed to get media for", filename, err);
                            }
                        }
                    }
                    return updatedHtml;
                };

                front = await replaceMedia(front);
                back = await replaceMedia(back);

                const cardRef = doc(collection(db, 'flashcards'));
                batch.set(cardRef, {
                    subject: ankiSubject,
                    subSubject: ankiSubSubject || '',
                    front,
                    back,
                    tags: note.tags || [],
                    ankiNoteId: noteIdStr,
                    createdAt: new Date().toISOString()
                });

                newCount++;
                operationsInBatch++;

                if (operationsInBatch >= 400 || i === notes.length - 1) {
                    if (operationsInBatch > 0) {
                        setAnkiStatus(`⏳ Salvando lote... (${i + 1}/${notes.length})`);
                        await batch.commit();
                        batch = writeBatch(db);
                        operationsInBatch = 0;
                    }
                }
            }

            setAnkiStatus(`✅ Sincronização concluída! ${newCount} flashcards importados, ${dupCount} ignorados (já existiam).`);
        } catch (e: any) {
            console.error(e);
            setAnkiStatus(`❌ Erro: ${e.message}. Certifique-se de que o plugin AnkiConnect está instalado no Anki aberto, e os domínios locais estão autorizados nas permissões.`);
        }
    };

    return (
        <div className="p-4 lg:p-8 text-white max-w-5xl mx-auto font-sans">
            <h1 className="text-2xl font-bold mb-8 text-center">Flashcards Editor - MedPrep</h1>

            <div className="bg-secondary-900 border border-primary-500 rounded-xl p-6 shadow-glow">
                <h2 className="text-lg font-semibold mb-4 text-primary-400 flex items-center gap-2">
                    <span className="text-2xl">🔄</span> Sincronizar AnkiConnect (Flashcards)
                </h2>
                <p className="text-sm text-secondary-400 mb-6 leading-relaxed">
                    O Anki deve estar aberto no seu computador e com o plugin AnkiConnect instalado (porta 8765), aceitando conexões de localhost. O sistema baixará todas as cartas do baralho informado e integrará as imagens Base64 diretamente ao banco. Pule duplicados automaticamente na segunda execução.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-xs text-secondary-400 mb-1">Nome do Baralho (exato):</label>
                        <input
                            type="text"
                            value={ankiDeckName}
                            onChange={(e) => setAnkiDeckName(e.target.value)}
                            placeholder="Ex: Ginecologia - Bloco 1"
                            className="w-full bg-secondary-800 border border-secondary-700 rounded-lg p-2.5 text-sm text-white focus:border-primary-500 focus:outline-none transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-secondary-400 mb-1">Assunto (Disciplina):</label>
                        <select
                            value={ankiSubject}
                            onChange={(e) => setAnkiSubject(e.target.value as MedicalSubject)}
                            className="w-full bg-secondary-800 border border-secondary-700 rounded-lg p-2.5 text-sm text-white focus:border-primary-500 focus:outline-none transition-colors"
                        >
                            {subjects.map(s => <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-secondary-400 mb-1">Sub-assunto (Opcional):</label>
                        <input
                            type="text"
                            value={ankiSubSubject}
                            onChange={(e) => setAnkiSubSubject(e.target.value)}
                            placeholder="Ex: Ciclo Menstrual"
                            className="w-full bg-secondary-800 border border-secondary-700 rounded-lg p-2.5 text-sm text-white focus:border-primary-500 focus:outline-none transition-colors"
                        />
                    </div>
                </div>

                <button
                    onClick={syncAnkiToFirebase}
                    className="bg-primary-600 hover:bg-primary-500 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors shadow-lg"
                >
                    Iniciar Sincronização de Flashcards
                </button>
                {ankiStatus && (
                    <p className="mt-4 text-primary-400 font-medium bg-primary-900/20 p-3 rounded-lg border border-primary-500/20">
                        {ankiStatus}
                    </p>
                )}
            </div>
        </div>
    );
}
