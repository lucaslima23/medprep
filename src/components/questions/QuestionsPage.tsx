// ============================================
// QUESTIONS PAGE - HIERARCHICAL FILTERS
// ============================================

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Play, ChevronRight, Tag } from 'lucide-react';
import { useStudy } from '../../contexts/StudyContext';
import { questionService, auth, db } from '../../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Card, Button, Badge } from '../common';
import SessionResults from './SessionResults';
import QuestionCard from './QuestionCard';
import { Question, QuestionFilters, MedicalSubject, SUBJECT_LABELS, SUBJECT_COLORS } from '../../types';
import { clsx } from 'clsx';

const subjects: MedicalSubject[] = ['ginecologia', 'cirurgia', 'clinica_medica', 'pediatria', 'preventiva'];

function FilterPanel({ filters, onFiltersChange, onStartSession, isOpen, onToggle }: any) {
  const [availableSubSubjects, setAvailableSubSubjects] = useState<string[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Helper to account for trailing spaces, accents or variations in imported DB data
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

  // Busca especialidades (subSubject) quando as grandes áreas (subject) mudam
  useEffect(() => {
    const fetchSubSubjects = async () => {
      if (!filters.subjects || filters.subjects.length === 0) {
        setAvailableSubSubjects([]);
        return;
      }

      setLoadingSubs(true);
      try {
        const expandedSubjects = expandSubjects(filters.subjects).slice(0, 30); // Firebase limit is 30
        const q = query(
          collection(db, 'questions'),
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

    // Reseta sub-assuntos ao mudar a grande área para evitar filtros inconsistentes
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
            {/* Grandes Áreas */}
            <div>
              <label className="text-sm font-medium text-secondary-400 mb-2 block">Grandes Áreas (Simulado Geral)</label>
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

            {/* Especialidades (Sub-assuntos) */}
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
                <p className="text-[10px] text-secondary-500 mt-2">
                  * Deixe vazio para incluir todas as especialidades das áreas selecionadas.
                </p>
              </motion.div>
            )}

            {/* Configurações de Sessão */}
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-secondary-700">
              <div>
                <label className="text-sm font-medium text-secondary-400 mb-2 block">Qtd. Questões</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={filters.quantity}
                  onChange={(e) => onFiltersChange({ ...filters, quantity: parseInt(e.target.value) || 1 })}
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

export function QuestionsPage() {
  const { recentlyAnswered, refreshSRSData } = useStudy();
  const [searchParams] = useSearchParams();
  const initSubject = searchParams.get('subject') as MedicalSubject | null;
  const autoStartAttempted = useRef(false);

  const [filterOpen, setFilterOpen] = useState(!initSubject);
  const [filters, setFilters] = useState<QuestionFilters>({
    subjects: initSubject && subjects.includes(initSubject) ? [initSubject] : [],
    subSubjects: [],
    excludeRecent: true,
    quantity: 10,
    onlyWrong: false,
    onlyNew: false,
  });

  const [sessionActive, setSessionActive] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [sessionResults, setSessionResults] = useState({ correct: 0, total: 0 });
  const [sessionComplete, setSessionComplete] = useState(false);
  const [startTime, setStartTime] = useState(0);

  const startSession = async (overrideFilters?: QuestionFilters) => {
    if (!auth.currentUser) return;

    const activeFilters = overrideFilters || filters;

    try {
      // O questionService deve estar preparado para receber subSubjects no filtro
      let fetched = await questionService.getQuestions({
        subjects: activeFilters.subjects.length > 0 ? activeFilters.subjects : undefined,
        subSubjects: activeFilters.subSubjects.length > 0 ? activeFilters.subSubjects : undefined,
        limit: activeFilters.quantity * 3 // Busca mais para permitir o filtro de exclusão posterior
      }) as Question[];

      // Filtro manual para excluir questões respondidas recentemente (se ativado)
      if (activeFilters.excludeRecent) {
        fetched = fetched.filter(q => !recentlyAnswered.includes(q.id));
      }

      // Embaralha e corta para a quantidade desejada
      fetched = fetched.sort(() => Math.random() - 0.5).slice(0, filters.quantity);

      if (fetched.length === 0) {
        alert("Nenhuma questão encontrada com esses filtros específicos.");
        return;
      }

      setQuestions(fetched);
      setSessionResults({ correct: 0, total: fetched.length });
      setSessionActive(true);
      setFilterOpen(false);
      setStartTime(Date.now());
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setSessionComplete(false);
    } catch (e) {
      console.error("Erro ao iniciar sessão:", e);
    }
  };

  useEffect(() => {
    if (initSubject && subjects.includes(initSubject) && !autoStartAttempted.current) {
      autoStartAttempted.current = true;
      const autoFilters = { ...filters, subjects: [initSubject] };
      setFilters(autoFilters);
      startSession(autoFilters);
    }
  }, [initSubject]);

  const handleNext = async () => {
    if (!auth.currentUser) return;
    const q = questions[currentIndex];
    const isCorrect = selectedAnswer === q.correctAnswer;

    try {
      await questionService.saveAttempt({
        userId: auth.currentUser.uid,
        questionId: q.id,
        selectedAnswer: selectedAnswer!,
        isCorrect,
        timeSpent: 0,
        subject: q.subject
      });

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
      } else {
        setSessionComplete(true);
        refreshSRSData();
      }
    } catch (e) {
      console.error("Erro ao salvar progresso:", e);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-display font-bold text-white mb-2">Banco de Questões</h1>
        <p className="text-secondary-400">Pratique com questões do ENARE divididas por áreas e especialidades.</p>
      </motion.div>

      {!sessionActive ? (
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          onStartSession={() => startSession()}
          isOpen={filterOpen}
          onToggle={() => setFilterOpen(!filterOpen)}
        />
      ) : sessionComplete ? (
        <SessionResults
          correct={sessionResults.correct}
          total={sessionResults.total}
          timeSpent={Math.round((Date.now() - startTime) / 1000)}
          onRestart={() => setSessionActive(false)}
        />
      ) : (
        <QuestionCard
          question={questions[currentIndex]}
          selectedAnswer={selectedAnswer}
          onSelectAnswer={setSelectedAnswer}
          showResult={showResult}
          onConfirm={() => {
            if (selectedAnswer === questions[currentIndex].correctAnswer) {
              setSessionResults(p => ({ ...p, correct: p.correct + 1 }));
            }
            setShowResult(true);
          }}
          onNext={handleNext}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
        />
      )}
    </div>
  );
}

export default QuestionsPage;