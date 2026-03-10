// ============================================
// MEDPREP LMS - TYPE DEFINITIONS
// ============================================

// User Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'student' | 'admin' | 'associado';
  expirationDate?: string;
  createdAt: Date;
  lastLoginAt: Date;
  settings: UserSettings;
}

export interface UserSettings {
  dailyGoal: number;        // questões por dia
  notifications: boolean;
  darkMode: boolean;
  soundEffects: boolean;
  rankingOptIn?: boolean;   // Opt-in for Global Rankings
  rankingOptInDate?: string; // Date when opt-in was last changed
}

// Drive Media Types
export interface DriveMedia {
  id: string;               // Google Drive file ID
  title?: string;           // Título opcional (ex: "Parte 1", "Apostila A")
  order?: number;           // Ordem de sequência
}

// Study Schedule Types
export interface StudyDay {
  date: string;             // formato YYYY-MM-DD
  subject: MedicalSubject;
  subSubject: string;
  title: string;
  summary?: string;
  videoId?: string;         // Google Drive file ID (legado)
  pdfId?: string;           // Google Drive file ID (legado)
  driveVideoId?: string;    // ID do vídeo ÚNICO (legado, compatibilidade)
  driveDocId?: string;      // ID da apostila ÚNICA (legado, compatibilidade)
  driveVideos?: DriveMedia[];    // NOVO: Múltiplos vídeos
  driveDocs?: DriveMedia[];      // NOVO: Múltiplos documentos
  flashcardSetId?: string;
  questionSetId?: string;
  estimatedTime?: number;   // em minutos
}

export interface StudySchedule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  days: StudyDay[];
}

// Medical Specialties
export type MedicalSubject =
  | 'ginecologia'
  | 'cirurgia'
  | 'clinica_medica'
  | 'pediatria'
  | 'preventiva'
  | 'obstetricia';

export const SUBJECT_LABELS: Record<MedicalSubject, string> = {
  ginecologia: 'Ginecologia e Obstetrícia',
  cirurgia: 'Cirurgia',
  clinica_medica: 'Clínica Médica',
  pediatria: 'Pediatria',
  preventiva: 'Medicina Preventiva',
  obstetricia: 'Obstetrícia',
};

export const SUBJECT_COLORS: Record<MedicalSubject, string> = {
  ginecologia: '#ec4899',
  cirurgia: '#ef4444',
  clinica_medica: '#3b82f6',
  pediatria: '#f97316',
  preventiva: '#22c55e',
  obstetricia: '#a855f7',
};

// Question Types
export interface Question {
  id: string;
  subject: MedicalSubject;
  subSubject: string;
  year?: number;
  source?: string;          // ENAMED, ENARE, USP, etc.
  statement: string;
  options: QuestionOption[];
  correctAnswer: number;    // índice da opção correta
  explanation: string;
  imageUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  createdAt: Date;
}

export interface QuestionOption {
  id: string;
  text: string;
  letter: 'A' | 'B' | 'C' | 'D' | 'E';
}

// Flashcard Types
export interface Flashcard {
  id: string;
  subject: MedicalSubject;
  subSubject: string;
  front: string;
  back: string;
  imageUrl?: string;
  tags: string[];
  createdAt: Date;
}

// SRS (Spaced Repetition System) Types - SM-2 Algorithm
export interface SRSData {
  id: string;                // ID do item (question ou flashcard)
  itemType: 'question' | 'flashcard';
  userId: string;

  // SM-2 Parameters
  interval: number;          // dias até próxima revisão
  repetitions: number;       // número de revisões consecutivas corretas
  easeFactor: number;        // fator de facilidade (mínimo 1.3)
  nextReviewDate: Date;      // data da próxima revisão
  lastReviewDate: Date;      // data da última revisão

  // Performance tracking
  totalReviews: number;
  correctReviews: number;
  streak: number;            // sequência atual de acertos
  bestStreak: number;        // melhor sequência
}

export type SRSQuality = 0 | 1 | 2 | 3 | 4 | 5;
// 0: Erro total - sem lembrança
// 1: Erro - lembrou algo errado
// 2: Erro - mas reconheceu resposta
// 3: Correto - com dificuldade significativa
// 4: Correto - com hesitação
// 5: Correto - resposta perfeita

// Study History Types
export interface StudySession {
  id: string;
  userId: string;
  date: Date;
  type: 'questions' | 'flashcards' | 'simulado' | 'review';
  subject?: MedicalSubject;
  duration: number;          // em segundos
  itemsStudied: number;
  correctAnswers: number;
  wrongAnswers: number;
  score: number;             // percentual 0-100
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;         // em segundos
  attemptedAt: Date;
  sessionId?: string;
}

// Simulado Types
export interface Simulado {
  id: string;
  name: string;
  description: string;
  questionIds: string[];
  duration: number;          // em minutos
  availableFrom: Date;
  availableTo: Date;
  isWeekendOnly: boolean;
  createdAt: Date;
}

export interface SimuladoResult {
  id: string;
  userId: string;
  simuladoId: string;
  startedAt: Date;
  finishedAt: Date;
  answers: SimuladoAnswer[];
  totalCorrect: number;
  totalQuestions: number;
  score: number;
  percentile?: number;       // calculado após todos responderem
  rank?: number;
}

export interface SimuladoAnswer {
  questionId: string;
  selectedAnswer: number;
  isCorrect: boolean;
  timeSpent: number;
}

// Analytics Types
export interface PerformanceData {
  date: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  studyTime: number;
}

export interface SubjectPerformance {
  subject: MedicalSubject;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  trend: 'up' | 'down' | 'stable';
}

// Filter Types for Questions
export interface QuestionFilters {
  subjects: MedicalSubject[];
  subSubjects: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  sources?: string[];
  years?: number[];
  excludeRecent: boolean;    // excluir respondidas nos últimos 15 dias
  onlyWrong: boolean;        // apenas erradas anteriormente
  onlyNew: boolean;          // apenas não respondidas
  quantity: number | '';
}

// Component Props Types
export interface DashboardProps {
  user: User;
  schedule: StudySchedule;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Calendar Types
export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  studyDay?: StudyDay;
  completed: boolean;
  progress: number;          // 0-100
}
