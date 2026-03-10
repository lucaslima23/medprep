import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Play, ChevronRight, Tag, Target, BrainCircuit, RefreshCw } from 'lucide-react';
import { useStudy } from '../../contexts/StudyContext';
import { questionService, auth, db } from '../../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, Button, Badge } from '../common';
import { MedicalSubject, SUBJECT_LABELS, SUBJECT_COLORS, Flashcard, SRSQuality } from '../../types';
import { clsx } from 'clsx';
// Import the pre-built SessionResults component used by Questions
import SessionResults from '../questions/SessionResults';

const subjects: MedicalSubject[] = ['ginecologia', 'cirurgia', 'clinica_medica', 'pediatria', 'preventiva'];

function FlashcardFilterPanel({ filters, onFiltersChange, onStartSession, isOpen, onToggle }: any) {
    const [availableSubSubjects, setAvailableSubSubjects] = useState<string[]>([]);
    const [loadingSubs, setLoadingSubs] = useState(false);

    const expandSubjects = (subs: string[]) => {
        const map: Record<string, string[]> = {
            'clinica_medica': ['clinica_medica', 'clinica medica', 'clínica médica'],
            'ginecologia': ['ginecologia', 'ginecologia e obstetrícia', 'go'],
            'cirurgia': ['cirurgia', 'cirurgia geral'],
            'preventiva': ['preventiva', 'medicina preventiva'],
            'obstetricia': ['obstetricia', 'obstetrícia']
        };
        return subs.flatMap(s => map[s] || [s]);
    };

    useEffect(() => {
        const fetchSubSubjects = async () => {
            if (!filters.subjects || filters.subjects.length === 0) {
                setAvailableSubSubjects([]);
                return;
            }

            setLoadingSubs(true);
            try {
                const expandedSubjects = expandSubjects(filters.subjects).slice(0, 30);
                const q = query(
                    collection(db, 'flashcards'),
                    where('subject', 'in', expandedSubjects)
                );
                const snapshot = await getDocs(q);
                const subs = new Set<string>();

                snapshot.forEach(doc => {
                    const s = doc.data().subSubject;
                    if (s) subs.add(s);
                });

                setAvailableSubSubjects(Array.from(subs).sort());
            } catch (e) {
                console.warn("Aguardando índice composto para sub-assuntos ou erro na busca.");
            } finally {
                setLoadingSubs(false);
            }
        };
        fetchSubSubjects();
    }, [filters.subjects]);

    const toggleSubject = (subject: MedicalSubject) => {
        const newSubjects = filters.subjects.includes(subject)
            ? filters.subjects.filter((s: string) => s !== subject)
            : [...filters.subjects, subject];

        onFiltersChange({ ...filters, subjects: newSubjects, subSubjects: [] });
    };

    const toggleSubSubject = (sub: string) => {
        const newSubs = filters.subSubjects.includes(sub)
            ? filters.subSubjects.filter((x: any) => x !== sub)
            : [...filters.subSubjects, sub];
        onFiltersChange({ ...filters, subSubjects: newSubs });
    };

    return (
        <Card className="p-4">
            <button onClick={onToggle} className="flex items-center justify-between w-full text-left">
                <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-primary-500" />
                    <span className="font-semibold text-secondary-200">Filtros Avançados</span>
                    {(filters.subjects.length > 0 || filters.subSubjects.length > 0) && (
                        <Badge variant="info" size="sm">Ativo</Badge>
                    )}
                </div>
                <ChevronRight className={clsx('w-5 h-5 transition-transform', isOpen && 'rotate-90')} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pt-4 space-y-6"
                    >
                        <div>
                            <label className="text-sm font-medium text-secondary-400 mb-2 block">Grandes Áreas</label>
                            <div className="flex flex-wrap gap-2">
                                {subjects.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => toggleSubject(s)}
                                        className={clsx(
                                            'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                                            filters.subjects.includes(s) ? 'text-white shadow-lg' : 'bg-secondary-700 text-secondary-300'
                                        )}
                                        style={{
                                            backgroundColor: filters.subjects.includes(s) ? SUBJECT_COLORS[s] : undefined,
                                            transform: filters.subjects.includes(s) ? 'scale(1.05)' : 'scale(1)'
                                        }}
                                    >
                                        {SUBJECT_LABELS[s]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {(availableSubSubjects.length > 0 || loadingSubs) && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <label className="text-sm font-medium text-secondary-400 mb-2 block flex items-center gap-2">
                                    <Tag className="w-3.5 h-3.5" />
                                    Especialidades / Matérias Internas
                                </label>
                                {loadingSubs ? (
                                    <div className="text-xs text-secondary-500 italic">Carregando especialidades...</div>
                                ) : (
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 border border-secondary-800 rounded-lg bg-secondary-900/50">
                                        {availableSubSubjects.map(sub => (
                                            <button
                                                key={sub}
                                                onClick={() => toggleSubSubject(sub)}
                                                className={clsx(
                                                    'px-2 py-1 rounded text-[10px] border transition-all',
                                                    filters.subSubjects.includes(sub)
                                                        ? 'border-primary-500 bg-primary-500/20 text-primary-300'
                                                        : 'border-secondary-600 text-secondary-400 hover:border-secondary-400'
                                                )}
                                            >
                                                {sub}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-secondary-700">
                            <div>
                                <label className="text-sm font-medium text-secondary-400 mb-2 block">Qtd. Flashcards</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={filters.quantity}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        onFiltersChange({ ...filters, quantity: val === '' ? '' : parseInt(val) });
                                    }}
                                    className="w-full px-3 py-2 bg-secondary-800 text-white rounded-lg text-sm border border-secondary-700 focus:border-primary-500 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button onClick={() => onStartSession()} className="w-full" size="lg">
                                    <Play className="w-4 h-4 mr-2" /> Iniciar
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

// Reuse the exact same logic as questions, just adapted wording.
// Idealmente seria refatorar pra um hook único de "lowestSubs", mas reúsos curtos resolvem.
function FlashcardReviewSuggestionBox({ lowestSubs, onStartReview }: { lowestSubs: any[], onStartReview: (subs: string[]) => void }) {
    if (lowestSubs.length === 0) return null;

    return (
        <Card className="p-4 bg-primary-900/10 border-primary-500/20">
            <div className="flex items-center gap-2 mb-2">
                <Target className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-white">Sugestão de Revisão Ativa</h3>
            </div>
            <p className="text-sm text-secondary-400 mb-4">
                Estes são os assuntos mapeados pelo seu algoritmo SRS com maior índice de erros ou esquecimento. Priorize-os.
            </p>

            <div className="space-y-2 mb-4">
                {lowestSubs.map((sub, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-secondary-800/50 p-2 rounded border border-secondary-700/50">
                        <span className="text-secondary-200 text-sm font-medium">{sub.name}</span>
                        <Badge variant="danger" size="sm">{sub.accuracy.toFixed(1)}% retenção</Badge>
                    </div>
                ))}
            </div>

            <Button onClick={() => onStartReview(lowestSubs.map(s => s.name))} className="w-full" variant="primary">
                <RefreshCw className="w-4 h-4 mr-2" /> Revisar Assuntos Mais Críticos (20 cartas)
            </Button>
        </Card>
    );
}

export default function FlashcardsPage() {
    const { srsStats, saveSRSReview, refreshSRSData } = useStudy();
    const [searchParams] = useSearchParams();
    const initSubject = searchParams.get('subject') as MedicalSubject | null;
    const initSubSubject = searchParams.get('topic');
    const autoStartAttempted = useRef(false);

    const [filterOpen, setFilterOpen] = useState(!initSubject && !initSubSubject);
    const [lowestAccuracySubs, setLowestAccuracySubs] = useState<{ name: string; accuracy: number }[]>([]);
    const [loadingLowest, setLoadingLowest] = useState(false);

    // Reusing question lowest accuracy stats since subjects/subSubjects align cross-platform,
    // making cross-pollinated suggestions richer.
    useEffect(() => {
        const fetchLowest = async () => {
            if (!auth.currentUser) return;
            setLoadingLowest(true);
            try {
                const subs = await questionService.getLowestAccuracySubSubjects(auth.currentUser.uid);
                setLowestAccuracySubs(subs);
            } catch (e) {
                console.error("Erro ao buscar sub-assuntos de menor acerto:", e);
            } finally {
                setLoadingLowest(false);
            }
        };

        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) fetchLowest();
        });

        return () => unsubscribe();
    }, []);

    const [filters, setFilters] = useState<any>({
        subjects: initSubject && subjects.includes(initSubject) ? [initSubject] : [],
        subSubjects: initSubSubject ? [initSubSubject] : [],
        quantity: 20,
    });

    const [sessionActive, setSessionActive] = useState(false);
    const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionResults, setSessionResults] = useState({ correct: 0, total: 0 }); // "correct" here means Easy/Good
    const [sessionComplete, setSessionComplete] = useState(false);
    const [startTime, setStartTime] = useState(0);

    const fetchFlashcards = async (activeFilters: any) => {
        if (!auth.currentUser) return;

        // Very simplified fetch mapping. Real app would complex-filter.
        let qBase = collection(db, 'flashcards');
        let queryConstraints: any[] = [];

        if (activeFilters.subjects && activeFilters.subjects.length > 0) {
            queryConstraints.push(where('subject', 'in', activeFilters.subjects));
        }

        // Limits applied loosely here then processed client side due to NoSQL limits on multiple WHERE IN
        const q = query(qBase, ...queryConstraints);
        const snap = await getDocs(q);

        let allCards = snap.docs.map(d => ({ id: d.id, ...d.data() } as Flashcard));

        // Client-side subSubject filter
        if (activeFilters.subSubjects && activeFilters.subSubjects.length > 0) {
            allCards = allCards.filter(c => activeFilters.subSubjects.includes(c.subSubject));
        }

        // Sort Randomly, Slice to quantity
        const quantityCount = typeof activeFilters.quantity === 'number' ? activeFilters.quantity : 10;
        allCards.sort(() => 0.5 - Math.random());
        return allCards.slice(0, quantityCount);
    };

    const startSession = async (overrideFilters?: any) => {
        if (!auth.currentUser) return;
        const activeFilters = overrideFilters || filters;

        if (activeFilters.quantity === '' || activeFilters.quantity <= 0) {
            alert("Por favor, informe uma quantidade válida de flashcards antes de iniciar.");
            return;
        }

        try {
            const fetched = await fetchFlashcards(activeFilters);

            if (!fetched || fetched.length === 0) {
                alert("Nenhum flashcard encontrado com esses filtros específicos.");
                return;
            }

            setFlashcards(fetched);
            setSessionResults({ correct: 0, total: fetched.length });
            setSessionActive(true);
            setFilterOpen(false);
            setStartTime(Date.now());
            setCurrentIndex(0);
            setIsFlipped(false);
            setSessionComplete(false);
        } catch (e) {
            console.error("Erro ao iniciar sessão:", e);
        }
    };

    useEffect(() => {
        const hasInitialFilters = (initSubject && subjects.includes(initSubject)) || initSubSubject;
        if (hasInitialFilters && !autoStartAttempted.current) {
            autoStartAttempted.current = true;
            const autoFilters = {
                ...filters,
                subjects: initSubject && subjects.includes(initSubject) ? [initSubject] : [],
                subSubjects: initSubSubject ? [initSubSubject] : []
            };
            setFilters(autoFilters);
            startSession(autoFilters);
        }
    }, [initSubject, initSubSubject]);

    const handleDifficulty = async (quality: SRSQuality) => {
        if (!auth.currentUser) return;
        const card = flashcards[currentIndex];

        try {
            // 3, 4, 5 are positive outcomes in SM-2
            if (quality >= 3) {
                setSessionResults(p => ({ ...p, correct: p.correct + 1 }));
            }

            await saveSRSReview(card.id, 'flashcard', quality);

            if (currentIndex < flashcards.length - 1) {
                setCurrentIndex(prev => prev + 1);
                setIsFlipped(false);
            } else {
                setSessionComplete(true);
                refreshSRSData();
            }
        } catch (e) {
            console.error("Erro ao salvar revisão SRS:", e);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-primary-500" /> Algoritmo Flashcards
                    </h1>
                    <p className="text-secondary-400">Revisão Espaçada Inteligente (SRS) para maximizar sua retenção.</p>
                </div>

                {/* Quick stat showing total due today for all SRS */}
                <div className="bg-secondary-800 text-secondary-200 text-sm font-medium px-4 py-2 rounded-xl border border-secondary-700 flex flex-col items-center">
                    <span className="text-xs text-secondary-500">Para revisar hoje</span>
                    <span className="text-primary-400 font-bold text-lg">{srsStats.dueToday}</span>
                </div>
            </motion.div>

            {!sessionActive ? (
                <div className="space-y-4">
                    <FlashcardFilterPanel
                        filters={filters}
                        onFiltersChange={setFilters}
                        onStartSession={() => startSession()}
                        isOpen={filterOpen}
                        onToggle={() => setFilterOpen(!filterOpen)}
                    />

                    {!loadingLowest && lowestAccuracySubs.length > 0 && (
                        <FlashcardReviewSuggestionBox
                            lowestSubs={lowestAccuracySubs}
                            onStartReview={(subs) => {
                                const reviewFilters = {
                                    ...filters,
                                    subSubjects: subs,
                                    quantity: 20,
                                    subjects: []
                                };
                                startSession(reviewFilters);
                            }}
                        />
                    )}
                </div>
            ) : sessionComplete ? (
                <SessionResults
                    correct={sessionResults.correct}
                    total={sessionResults.total}
                    timeSpent={Math.round((Date.now() - startTime) / 1000)}
                    onRestart={() => setSessionActive(false)}
                />
            ) : (
                <div className="relative pt-4">
                    {/* Progress */}
                    <div className="flex justify-between items-center mb-6 px-2">
                        <span className="text-sm font-bold text-secondary-400">
                            Card {currentIndex + 1} de {flashcards.length}
                        </span>
                        <div className="flex-1 max-w-xs mx-4 bg-secondary-800 rounded-full h-2">
                            <div
                                className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
                            />
                        </div>
                        <span className="text-xs font-semibold px-2 py-1 rounded bg-secondary-800 text-secondary-300 border border-secondary-700 truncate max-w-[120px]">
                            {flashcards[currentIndex].subject}
                        </span>
                    </div>

                    <motion.div
                        key={flashcards[currentIndex].id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full"
                    >
                        <div className="perspective-1000 h-[450px] w-full group">
                            <div
                                className={clsx(
                                    "relative w-full h-full duration-500 preserve-3d cursor-pointer shadow-xl rounded-2xl",
                                    isFlipped ? "rotate-y-180" : ""
                                )}
                                onClick={() => !isFlipped && setIsFlipped(true)}
                            >
                                {/* Front */}
                                <div className="absolute w-full h-full backface-hidden bg-secondary-900 border border-secondary-700/50 rounded-2xl p-8 flex flex-col justify-center items-center text-center">
                                    <div
                                        className="prose prose-invert prose-lg max-w-none break-words flashcard-content"
                                        dangerouslySetInnerHTML={{ __html: flashcards[currentIndex].front }}
                                    />
                                    {!isFlipped && (
                                        <div className="absolute bottom-6 text-secondary-500 text-sm animate-pulse flex items-center gap-2">
                                            <RefreshCw className="w-4 h-4" /> Toque no cartão para virar
                                        </div>
                                    )}
                                </div>

                                {/* Back */}
                                <div className="absolute w-full h-full backface-hidden bg-secondary-800 border border-primary-500/30 rounded-2xl p-8 rotate-y-180 flex flex-col">
                                    <div className="flex-1 overflow-y-auto mb-6 scrollbar-hide flex items-center justify-center">
                                        <div
                                            className="prose prose-invert prose-lg max-w-none text-center break-words flashcard-content w-full"
                                            dangerouslySetInnerHTML={{ __html: flashcards[currentIndex].back }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Difficulty Controls appear immediately below the card once flipped */}
                        <AnimatePresence>
                            {isFlipped && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-6 grid grid-cols-4 gap-3 max-w-lg mx-auto"
                                >
                                    <button onClick={() => handleDifficulty(1)} className="flex flex-col items-center justify-center p-3 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-colors">
                                        <span className="font-bold">Errei</span>
                                        <span className="text-[10px] opacity-70 mt-1">(&lt; 1 min)</span>
                                    </button>
                                    <button onClick={() => handleDifficulty(3)} className="flex flex-col items-center justify-center p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 text-orange-400 transition-colors">
                                        <span className="font-bold">Difícil</span>
                                        <span className="text-[10px] opacity-70 mt-1">(Dias)</span>
                                    </button>
                                    <button onClick={() => handleDifficulty(4)} className="flex flex-col items-center justify-center p-3 rounded-lg bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-green-400 transition-colors">
                                        <span className="font-bold">Bom</span>
                                        <span className="text-[10px] opacity-70 mt-1">(Semanas)</span>
                                    </button>
                                    <button onClick={() => handleDifficulty(5)} className="flex flex-col items-center justify-center p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-400 transition-colors">
                                        <span className="font-bold">Fácil</span>
                                        <span className="text-[10px] opacity-70 mt-1">(Meses)</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </div>
    );
}
