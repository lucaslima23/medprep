// ============================================
// STUDY CONTEXT - FIXED RACE CONDITIONS
// ============================================
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback
} from 'react';
import { useAuth } from './AuthContext';
import { scheduleService, srsService, questionService } from '../services/firebase';
import { StudySchedule, StudyDay, SRSData, SRSQuality } from '../types';
import { calculateSRSStats } from '../utils/srsAlgorithm';

interface StudyContextType {
  schedule: StudySchedule | null;
  todayStudyDay: StudyDay | null;
  loading: boolean;
  dueFlashcards: SRSData[];
  dueQuestions: SRSData[];
  srsStats: any;
  recentCorrect: string[];
  recentIncorrect: string[];
  refreshSchedule: () => Promise<void>;
  refreshSRSData: () => Promise<void>;
  getStudyDayForDate: (date: string) => StudyDay | null;
  saveSRSReview: (itemId: string, itemType: 'question' | 'flashcard', quality: SRSQuality) => Promise<void>;
}

const StudyContext = createContext<StudyContextType | undefined>(undefined);

export function StudyProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [schedule, setSchedule] = useState<StudySchedule | null>(null);
  const [todayStudyDay, setTodayStudyDay] = useState<StudyDay | null>(null);
  const [loading, setLoading] = useState(true);
  const [dueFlashcards, setDueFlashcards] = useState<SRSData[]>([]);
  const [dueQuestions, setDueQuestions] = useState<SRSData[]>([]);
  const [srsStats, setSrsStats] = useState(calculateSRSStats([]));
  const [recentCorrect, setRecentCorrect] = useState<string[]>([]);
  const [recentIncorrect, setRecentIncorrect] = useState<string[]>([]);

  const refreshSchedule = useCallback(async () => {
    if (!user?.uid) return;
    try {
      console.log('[STUDY] Refreshing schedule for user:', user.uid);

      // Primeiramente, tenta buscar o cronograma do usuário
      let activeSchedule = await scheduleService.getUserSchedule(user.uid);

      // Se não existir, gerar um novo cronograma personalizado
      if (!activeSchedule) {
        console.log('[STUDY] Nenhum cronograma encontrado para o usuário, gerando novo...');
        const generatedSchedule = await scheduleService.generatePersonalizedSchedule(user.uid);
        activeSchedule = { ...generatedSchedule, id: user.uid } as StudySchedule;
        console.log('[STUDY] Cronograma gerado com sucesso', generatedSchedule);
      } else {
        console.log('[STUDY] Cronograma encontrado para o usuário');
      }

      if (activeSchedule) {
        setSchedule(activeSchedule as StudySchedule);
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const today = `${y}-${m}-${day}`;

        const todayDay = (activeSchedule as StudySchedule).days?.find(d => d.date === today);
        setTodayStudyDay(todayDay || null);

        // Garantir que os dados do Drive estão acessíveis
        if (todayDay) {
          console.log('[STUDY] Today study day loaded:', {
            date: todayDay.date,
            title: todayDay.title,
            driveVideoId: todayDay.driveVideoId,
            driveDocId: todayDay.driveDocId,
          });
        }
      }
    } catch (err) {
      console.error('[STUDY] Erro ao carregar cronograma:', err);
    }
  }, [user?.uid]);

  const refreshSRSData = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const [flashcards, questions] = await Promise.all([
        srsService.getDueItems(user.uid, 'flashcard', 50),
        srsService.getDueItems(user.uid, 'question', 50),
      ]);
      setDueFlashcards(flashcards as SRSData[]);
      setDueQuestions(questions as SRSData[]);
      const allItems = [...flashcards, ...questions] as SRSData[];
      setSrsStats(calculateSRSStats(allItems));
      const stats = await questionService.getRecentAttemptStats(user.uid);
      setRecentCorrect(stats.recentCorrect);
      setRecentIncorrect(stats.recentIncorrect);
    } catch (err) {
      console.error('Erro ao carregar dados SRS:', err);
    }
  }, [user?.uid]);

  useEffect(() => {
    const init = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }
      setLoading(true);
      await Promise.all([refreshSchedule(), refreshSRSData()]);
      setLoading(false);
    };
    init();
  }, [user?.uid, refreshSchedule, refreshSRSData]);

  const getStudyDayForDate = useCallback((date: string) => {
    if (!schedule) return null;
    return schedule.days?.find(d => d.date === date) || null;
  }, [schedule]);

  const saveSRSReview = useCallback(async (itemId: string, itemType: 'question' | 'flashcard', quality: SRSQuality) => {
    if (!user?.uid) return;
    try {
      await srsService.processReview(user.uid, itemId, itemType, quality);
      // Opcional: recarregar as estatísticas em background
      refreshSRSData();
    } catch (err) {
      console.error('Erro ao salvar revisão SRS:', err);
      throw err;
    }
  }, [user?.uid, refreshSRSData]);

  return (
    <StudyContext.Provider value={{
      schedule,
      todayStudyDay,
      loading,
      dueFlashcards,
      dueQuestions,
      srsStats,
      recentCorrect,
      recentIncorrect,
      refreshSchedule,
      refreshSRSData,
      getStudyDayForDate,
      saveSRSReview
    }}>
      {children}
    </StudyContext.Provider>
  );
}

export const useStudy = () => {
  const context = useContext(StudyContext);
  if (!context) throw new Error('useStudy must be used within a StudyProvider');
  return context;
};