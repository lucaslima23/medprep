// ============================================
// FIREBASE SERVICE CONFIGURATION - FIXED
// ============================================

import { initializeApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import type { User } from '../types';
import {
  getFirestore,
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  CollectionReference
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app: FirebaseApp = initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Secondary app specifically for creating users without logging out the current admin
const secondaryApp: FirebaseApp = initializeApp(firebaseConfig, "AdminCreateUserApp");
const secondaryAuth: Auth = getAuth(secondaryApp);

export const authService = {
  async login(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },
  async logout(): Promise<void> {
    await signOut(auth);
  },
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  },
  getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  },
  onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  },
};

export const collections = {
  users: collection(db, 'users') as CollectionReference,
  questions: collection(db, 'questions') as CollectionReference,
  flashcards: collection(db, 'flashcards') as CollectionReference,
  srsData: collection(db, 'srs_data') as CollectionReference,
  studySessions: collection(db, 'study_sessions') as CollectionReference,
  questionAttempts: collection(db, 'question_attempts') as CollectionReference,
  simulados: collection(db, 'simulados') as CollectionReference,
  simuladoResults: collection(db, 'simulado_results') as CollectionReference,
  schedules: collection(db, 'schedules') as CollectionReference,
  metaContents: collection(db, 'meta_contents') as CollectionReference,
};

export const userService = {
  async getUser(uid: string) {
    console.log('[FIREBASE] getUser called with uid:', uid);
    if (!uid) {
      console.log('[FIREBASE] getUser: uid is empty');
      return null;
    }

    try {
      console.log('[FIREBASE] Querying Firestore for user document...');
      const userDoc = await getDoc(doc(db, 'users', uid));

      if (userDoc.exists()) {
        const data = userDoc.data();
        console.log('[FIREBASE] User found in Firestore:', data);

        // Normalizar os dados para a interface User
        const normalizedUser = {
          uid: userDoc.id,
          email: data.email || '',
          displayName: data.displayName || data.name || 'Usuário',
          photoURL: data.photoURL || '',
          role: data.role || 'student',
          expirationDate: data.expirationDate,
          createdAt: data.createdAt,
          lastLoginAt: data.lastLoginAt,
          settings: data.settings || {
            dailyGoal: 10,
            notifications: true,
            darkMode: true,
            soundEffects: true,
          }
        };

        console.log('[FIREBASE] Normalized user:', normalizedUser);
        return normalizedUser;
      }

      // Se não existe, criar um documento padrão
      console.log('[FIREBASE] User not found in Firestore, creating default user:', uid);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error('[FIREBASE] No current user in auth');
        return null;
      }

      const defaultUser = {
        uid,
        email: currentUser.email || 'unknown@example.com',
        displayName: currentUser.displayName || 'Usuário',
        photoURL: currentUser.photoURL || '',
        role: 'student' as const,
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        settings: {
          dailyGoal: 10,
          notifications: true,
          darkMode: true,
          soundEffects: true,
        }
      };

      console.log('[FIREBASE] Creating user document with data:', defaultUser);
      await setDoc(doc(db, 'users', uid), defaultUser);
      console.log('[FIREBASE] User document created successfully');

      return defaultUser;
    } catch (error) {
      console.error('[FIREBASE] Error in getUser:', error);
      return null;
    }
  },
  async updateLastLogin(uid: string) {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid), {
      lastLoginAt: Timestamp.now(),
    });
  },
  async updateSettings(uid: string, settings: Record<string, unknown>) {
    if (!uid) return;
    await updateDoc(doc(db, 'users', uid), {
      settings,
    });
  },
  async getAllUsers() {
    try {
      const usersQuery = query(collection(db, 'users'));
      const snapshot = await getDocs(usersQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('[FIREBASE] Error fetching all users:', error);
      return [];
    }
  },
  async updateUserAdmin(uid: string, data: Partial<User>) {
    if (!uid) return;
    try {
      await updateDoc(doc(db, 'users', uid), data);
    } catch (error) {
      console.error('[FIREBASE] Error updating user (Admin):', error);
      throw error;
    }
  },
  async adminCreateUser(data: Partial<User>, password?: string) {
    if (!password || !data.email) throw new Error("Email and password required for new user");

    try {
      // 1. Create the user in Firebase Auth using the secondary app
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, data.email, password);
      const newUid = userCredential.user.uid;

      // 2. Immediately sign out the secondary app to clean up
      await signOut(secondaryAuth);

      // 3. Create the user document in the main Firestore database
      const defaultUser = {
        uid: newUid,
        email: data.email,
        displayName: data.displayName || 'Usuário',
        photoURL: '',
        role: data.role || 'student',
        expirationDate: data.expirationDate || '',
        createdAt: Timestamp.now(),
        lastLoginAt: Timestamp.now(),
        settings: {
          dailyGoal: 10,
          notifications: true,
          darkMode: true,
          soundEffects: true,
        }
      };

      await setDoc(doc(db, 'users', newUid), defaultUser);
      return newUid;

    } catch (error) {
      console.error('[FIREBASE] Error creating user (Admin):', error);
      throw error;
    }
  }
};

export const questionService = {
  async getQuestions(filters: {
    subjects?: string[];
    subSubjects?: string[];
    difficulty?: string;
    limit?: number;
  }) {
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

    let q = query(collections.questions);

    if (filters.subjects && filters.subjects.length > 0) {
      const expandedSubjects = expandSubjects(filters.subjects).slice(0, 30);
      q = query(q, where('subject', 'in', expandedSubjects));
    }

    if (filters.difficulty) {
      q = query(q, where('difficulty', '==', filters.difficulty));
    }

    if (filters.limit) {
      q = query(q, limit(filters.limit));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async getQuestion(id: string) {
    if (!id) return null;
    const docRef = await getDoc(doc(db, 'questions', id));
    if (docRef.exists()) {
      return { id: docRef.id, ...docRef.data() };
    }
    return null;
  },

  async getRecentlyAnswered(userId: string) {
    if (!userId) return []; // PREVINE ERRO UNDEFINED
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const q = query(
      collections.questionAttempts,
      where('userId', '==', userId),
      where('attemptedAt', '>=', Timestamp.fromDate(fifteenDaysAgo))
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data().questionId);
  },

  async saveAttempt(attempt: {
    userId: string;
    questionId: string;
    selectedAnswer: number;
    isCorrect: boolean;
    timeSpent: number;
    subject: string; // Adicionado subject para o Dashboard de Desempenho
  }) {
    const docRef = doc(collections.questionAttempts);
    await setDoc(docRef, {
      ...attempt,
      attemptedAt: Timestamp.now(),
    });
    return docRef.id;
  },
};

export const srsService = {
  async getSRSData(userId: string, itemId: string, itemType: 'question' | 'flashcard') {
    if (!userId || !itemId) return null;
    const q = query(
      collections.srsData,
      where('userId', '==', userId),
      where('id', '==', itemId),
      where('itemType', '==', itemType)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  },

  async updateSRSData(data: any) {
    if (!data.userId || !data.id) return;
    const docId = `${data.userId}_${data.itemType}_${data.id}`;
    await setDoc(doc(db, 'srs_data', docId), {
      ...data,
      nextReviewDate: Timestamp.fromDate(data.nextReviewDate),
      lastReviewDate: Timestamp.fromDate(data.lastReviewDate),
    });
  },

  async getDueItems(userId: string, itemType: 'question' | 'flashcard', maxItems: number = 20) {
    if (!userId) return []; // PREVINE ERRO UNDEFINED
    const now = new Date();
    const q = query(
      collections.srsData,
      where('userId', '==', userId),
      where('itemType', '==', itemType),
      where('nextReviewDate', '<=', Timestamp.fromDate(now)),
      orderBy('nextReviewDate'),
      limit(maxItems)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },
};

export const simuladoService = {
  async getAvailableSimulados() {
    const now = new Date();
    const q = query(
      collections.simulados,
      where('availableTo', '>=', Timestamp.fromDate(now)),
      orderBy('availableTo')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  isWeekend(): boolean {
    const day = new Date().getDay();
    return day === 0 || day === 6;
  },

  async getWeekendSimulados() {
    if (!this.isWeekend()) return [];
    const simulados = await this.getAvailableSimulados();
    return (simulados as any[]).filter((s) => s.isWeekendOnly);
  },

  async calculatePercentile(simuladoId: string, userScore: number) {
    if (!simuladoId) return 0;
    const ranking = await this.getRanking(simuladoId);
    if (ranking.length === 0) return 100;
    const belowUser = (ranking as any[]).filter((r) => (r.score ?? 0) < userScore).length;
    return Math.round((belowUser / ranking.length) * 100);
  },

  async getRanking(simuladoId: string) {
    const q = query(
      collections.simuladoResults,
      where('simuladoId', '==', simuladoId),
      orderBy('score', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc, index) => ({
      rank: index + 1,
      ...doc.data(),
    }));
  },

  async getUserSimuladoResults(userId: string) {
    if (!userId) return [];
    const q = query(
      collections.simuladoResults,
      where('userId', '==', userId),
      orderBy('finishedAt', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as any)) || [];
  },

  async getSimuladoStats(userId: string) {
    if (!userId) return { userAverage: 0, globalAverage: 0 };

    // Média do usuário
    const userResults = await this.getUserSimuladoResults(userId);
    const userAverage = userResults.length > 0
      ? userResults.reduce((sum, r) => sum + ((r.totalCorrect / r.totalQuestions) * 100), 0) / userResults.length
      : 0;

    // Média global
    const allResults = await getDocs(collections.simuladoResults);
    const allScores = allResults.docs.map(doc => {
      const data = doc.data();
      return (data.totalCorrect / data.totalQuestions) * 100;
    });
    const globalAverage = allScores.length > 0
      ? allScores.reduce((a, b) => a + b, 0) / allScores.length
      : 0;

    return { userAverage, globalAverage };
  },

  async getSimuladoRanking() {
    // Busca todos os resultados e agrupa por usuário
    const allResults = await getDocs(
      query(collections.simuladoResults, orderBy('finishedAt', 'desc'))
    );

    const userScores = new Map<string, { scores: number[]; userName: string }>();

    allResults.docs.forEach(doc => {
      const data = doc.data();
      const userId = data.userId;
      const score = (data.totalCorrect / data.totalQuestions) * 100;
      const userName = data.userName || 'Usuário Anônimo';

      if (!userScores.has(userId)) {
        userScores.set(userId, { scores: [], userName });
      }
      userScores.get(userId)!.scores.push(score);
    });

    // Calcula média por usuário e cria ranking
    const ranking = Array.from(userScores.entries())
      .map(([userId, data]) => ({
        userId,
        userName: data.userName,
        score: Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length),
        rank: 0
      }))
      .sort((a, b) => b.score - a.score)
      .map((entry, idx) => ({
        ...entry,
        rank: idx + 1
      }));

    return ranking;
  }
};

export const scheduleService = {
  async getActiveSchedule() {
    const now = new Date().toISOString().split('T')[0];
    const q = query(
      collections.schedules,
      where('startDate', '<=', now),
      where('endDate', '>=', now),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    }
    return null;
  },

  /**
   * Calcula dias úteis (segunda a sexta) entre duas datas
   */
  calculateBusinessDays(startDate: Date, endDate: Date): Date[] {
    const businessDays: Date[] = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Não é domingo (0) nem sábado (6)
        businessDays.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return businessDays;
  },

  /**
   * Gera um cronograma personalizado para um usuário
   * Lê todos os temas de meta_contents e distribui nos dias úteis até 18 de outubro de 2026
   */
  async generatePersonalizedSchedule(userId: string) {
    if (!userId) {
      throw new Error('userId is required');
    }

    try {
      console.log('[SCHEDULE] Iniciando geração de cronograma personalizado para:', userId);

      // 1. Buscar todos os temas de meta_contents ordenados por order
      const metaContentsQuery = query(
        collections.metaContents,
        orderBy('order', 'asc')
      );
      const metaSnapshot = await getDocs(metaContentsQuery);

      if (metaSnapshot.empty) {
        console.warn('[SCHEDULE] Nenhum tema encontrado em meta_contents');
        throw new Error('Nenhum tema disponível para criar o cronograma');
      }

      const metaContents = metaSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Array<{
        id: string;
        title: string;
        subject: string;
        order: number;
        week?: number;
        type?: string;
        driveVideoId?: string;
        driveDocId?: string;
        driveVideos?: any[];
        driveDocs?: any[];
      }>;

      console.log('[SCHEDULE] Temas carregados:', metaContents.length);

      const userDoc = await getDoc(doc(db, 'users', userId));
      let startDate = new Date();
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.createdAt) {
          const created = typeof userData.createdAt.toDate === 'function' ? userData.createdAt.toDate() : new Date(userData.createdAt);
          const now = new Date();
          // Para novos usuários: A data de criação da conta. Para usuários existentes: A data de hoje.
          if (now.getTime() - created.getTime() < 24 * 60 * 60 * 1000) {
            startDate = created;
          }
        }
      }
      startDate.setHours(0, 0, 0, 0);

      // Data Final: 18 de outubro de 2026 (Data do ENARE)
      const endDate = new Date(2026, 9, 18); // Outubro é mês 9
      endDate.setHours(0, 0, 0, 0);

      const businessDays = this.calculateBusinessDays(startDate, endDate);
      console.log('[SCHEDULE] Dias úteis calculados:', businessDays.length);

      if (businessDays.length === 0) {
        throw new Error('Não há dias úteis suficientes até a data final do cronograma.');
      }

      // 3. Distribuir temas pelos dias úteis. Agrupar se houver mais temas que dias.
      const studyDays = [];
      let contentIndex = 0;

      const itemsPerDay = Math.ceil(metaContents.length / businessDays.length);

      const formatLocal = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
      };

      for (let i = 0; i < businessDays.length && contentIndex < metaContents.length; i++) {
        const dayDate = new Date(businessDays[i]);
        const dateStr = formatLocal(dayDate);

        const dayContents = [];
        // Tenta pegar itemsPerDay temas
        for (let j = 0; j < itemsPerDay && contentIndex < metaContents.length; j++) {
          dayContents.push(metaContents[contentIndex]);
          contentIndex++;
        }

        // Agrupa mídias
        const combinedDriveVideos: any[] = [];
        const combinedDriveDocs: any[] = [];

        dayContents.forEach(c => {
          if (c.driveVideos && Array.isArray(c.driveVideos)) {
            combinedDriveVideos.push(...c.driveVideos);
          } else if (c.driveVideoId) {
            combinedDriveVideos.push({ id: c.driveVideoId, title: c.title });
          }

          if (c.driveDocs && Array.isArray(c.driveDocs)) {
            combinedDriveDocs.push(...c.driveDocs);
          } else if (c.driveDocId) {
            combinedDriveDocs.push({ id: c.driveDocId, title: `Apostila - ${c.title}` });
          }
        });

        // Tenta encontrar a semana do grupo (geralmente a mesma da primeira task)
        const weekTag = dayContents[0].week ? `Semana ${dayContents[0].week} - ` : '';
        const concatTitles = dayContents.map(c => {
          const suffix = c.type ? ` (${c.type})` : '';
          return `${c.title}${suffix}`;
        }).join(' + ');

        studyDays.push({
          date: dateStr,
          subject: (dayContents[0].subject || 'geral') as any,
          subSubject: concatTitles,
          title: `${weekTag}${concatTitles.substring(0, 50)}${concatTitles.length > 50 ? '...' : ''}`,
          summary: dayContents.map(c => c.title).join(', '),
          driveVideos: combinedDriveVideos,
          driveDocs: combinedDriveDocs,
          driveVideoId: dayContents[0].driveVideoId || undefined,
          driveDocId: dayContents[0].driveDocId || undefined,
          estimatedTime: dayContents.length * 60,
        });
      }

      // 4. Salvar o cronograma em schedules/{userId}
      const scheduleData = {
        userId,
        name: `Cronograma Personalizado - Preparação ENAMED`,
        startDate: formatLocal(startDate),
        endDate: formatLocal(endDate),
        days: studyDays,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await setDoc(doc(db, 'schedules', userId), scheduleData);
      console.log('[SCHEDULE] Cronograma salvo com sucesso para:', userId);

      return scheduleData;
    } catch (error) {
      console.error('[SCHEDULE] Erro ao gerar cronograma personalizado:', error);
      throw error;
    }
  },

  /**
   * Busca o cronograma de um usuário específico
   */
  async getUserSchedule(userId: string) {
    if (!userId) return null;
    try {
      const scheduleDoc = await getDoc(doc(db, 'schedules', userId));
      if (scheduleDoc.exists()) {
        return { id: scheduleDoc.id, ...scheduleDoc.data() };
      }
      return null;
    } catch (error) {
      console.error('[SCHEDULE] Erro ao buscar cronograma do usuário:', error);
      return null;
    }
  },
  async getMetaContents() {
    try {
      const q = query(collections.metaContents, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('[SCHEDULE] Erro ao buscar metaContents:', error);
      return [];
    }
  },
  async addMetaContent(data: any) {
    const db = getFirestore();
    return await addDoc(collection(db, 'meta_contents'), data);
  },
  async updateMetaContent(docId: string, data: any) {
    const db = getFirestore();
    const docRef = doc(db, 'meta_contents', docId);
    await updateDoc(docRef, data);
  },
  async deleteMetaContent(docId: string) {
    const db = getFirestore();
    const docRef = doc(db, 'meta_contents', docId);
    await deleteDoc(docRef);
  },

  /**
   * Pega o array de IDs concluídos pelo usuário
   */
  async getUserProgress(userId: string): Promise<string[]> {
    if (!userId) return [];
    try {
      const pDoc = await getDoc(doc(db, 'user_progress', userId));
      if (pDoc.exists()) {
        const data = pDoc.data();
        return data.completedItems || [];
      }
      return [];
    } catch (err) {
      console.error('[PROGRESS] Erro ao buscar progresso:', err);
      return [];
    }
  },

  /**
   * Adiciona um ID de conteúdo ao array de completados
   */
  async markContentAsCompleted(userId: string, contentId: string) {
    if (!userId || !contentId) return;
    try {
      const docRef = doc(db, 'user_progress', userId);
      const pDoc = await getDoc(docRef);
      if (pDoc.exists()) {
        const current = pDoc.data().completedItems || [];
        if (!current.includes(contentId)) {
          await updateDoc(docRef, { completedItems: [...current, contentId] });
        }
      } else {
        await setDoc(docRef, { completedItems: [contentId] });
      }
    } catch (err) {
      console.error('[PROGRESS] Erro ao salvar conclusão:', err);
    }
  },
};

// ============================================
// GLOBAL ANALYTICS & RANKINGS
// ============================================

export const analyticsService = {
  /**
   * Obtém os Rankings Globais (Assiduidade e Taxa de Acerto) dos últimos X dias.
   * Em produção com larga escala, isso deve migrar para Cloud Functions.
   */
  async getGlobalRankings(days: number = 15) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    try {
      // 1. Buscar todas as tentativas de questões dos últimos X dias
      const q = query(
        collections.questionAttempts,
        where('attemptedAt', '>=', Timestamp.fromDate(startDate))
      );

      const snapshot = await getDocs(q);

      // userId => Stats
      type UserStatsMap = {
        [userId: string]: {
          totalAnswers: number;
          correctAnswers: number;
          subjects: { [subject: string]: { total: number; correct: number } };
        }
      };
      const userStats: UserStatsMap = {};

      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const userId = data.userId;
        const isCorrect = data.isCorrect;
        const subject = data.subject || 'geral';

        if (!userStats[userId]) {
          userStats[userId] = { totalAnswers: 0, correctAnswers: 0, subjects: {} };
        }

        const uStats = userStats[userId];
        uStats.totalAnswers += 1;
        if (isCorrect) uStats.correctAnswers += 1;

        if (!uStats.subjects[subject]) {
          uStats.subjects[subject] = { total: 0, correct: 0 };
        }

        uStats.subjects[subject].total += 1;
        if (isCorrect) uStats.subjects[subject].correct += 1;
      });

      // 2. Buscar Nomes dos Usuários para enriquecimento
      const userLabels: { [uid: string]: string } = {};
      const userIds = Object.keys(userStats);

      // Batch getDocs would be better, but we can do a broad fetch or individual if small scale.
      // Doing individual gets for simplicity since user base is currently small.
      await Promise.all(
        userIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const data = userDoc.data() as any;
            userLabels[uid] = data.displayName || 'Associado';
          } else {
            userLabels[uid] = 'Aluno';
          }
        })
      );

      // 3. Montar as duas listas (Assiduidade x Precisão)

      // Média Global por Sujeito
      let globalScoreSum = 0;
      let globalQuestionTotal = 0;
      let globalSubjects: { [subject: string]: { total: number; correct: number } } = {};

      const rawMetrics = userIds.map(uid => {
        const s = userStats[uid];
        const dailyAverage = s.totalAnswers / days; // Questões por dia
        const accuracy = (s.correctAnswers / s.totalAnswers) * 100;

        globalScoreSum += s.correctAnswers;
        globalQuestionTotal += s.totalAnswers;

        Object.keys(s.subjects).forEach(sub => {
          if (!globalSubjects[sub]) globalSubjects[sub] = { total: 0, correct: 0 };
          globalSubjects[sub].total += s.subjects[sub].total;
          globalSubjects[sub].correct += s.subjects[sub].correct;
        });

        const subjectAccuracy: { [sub: string]: number } = {};
        Object.keys(s.subjects).forEach(sub => {
          subjectAccuracy[sub] = (s.subjects[sub].correct / s.subjects[sub].total) * 100;
        });

        return {
          userId: uid,
          userName: userLabels[uid],
          dailyAverage,
          accuracy,
          totalQuestions: s.totalAnswers,
          subjectAccuracy
        };
      });

      const globalSubjectAccuracy: { [sub: string]: number } = {};
      Object.keys(globalSubjects).forEach(sub => {
        globalSubjectAccuracy[sub] = (globalSubjects[sub].correct / globalSubjects[sub].total) * 100;
      });

      const globalAverageAccuracy = globalQuestionTotal > 0 ? (globalScoreSum / globalQuestionTotal) * 100 : 0;

      // Classificar Assiduidade (maior dailyAverage)
      const listAssiduidade = [...rawMetrics]
        .filter(m => m.totalQuestions > 5) // Mínimo de questões para entrar no ranking
        .sort((a, b) => b.dailyAverage - a.dailyAverage)
        .map((m, idx) => ({ ...m, rank: idx + 1 }));

      // Classificar Precisão (maior accuracy)
      const listAccuracy = [...rawMetrics]
        .filter(m => m.totalQuestions > 20) // Mínimo de suporte estatístico
        .sort((a, b) => b.accuracy - a.accuracy)
        .map((m, idx) => ({ ...m, rank: idx + 1 }));

      return {
        assiduidade: listAssiduidade,
        accuracy: listAccuracy,
        globalSubjectAccuracy,
        globalAverageAccuracy
      };

    } catch (error) {
      console.error('[ANALYTICS] Erro ao buscar rankings globais:', error);
      return null;
    }
  }
};

export const sessionService = {
  async getUserSessions(userId: string, days: number = 30) {
    if (!userId) {
      console.log('[SESSION] No userId provided');
      return [];
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      // Primeiro, tenta verificar se há QUALQUER dado na coleção para este usuário
      const allUserAttemptsQuery = query(
        collections.questionAttempts,
        where('userId', '==', userId),
        limit(100)
      );

      const allSnapshot = await getDocs(allUserAttemptsQuery);

      if (allSnapshot.docs.length === 0) {
        console.log('[SESSION] No attempts found for user');
        return [];
      }

      // Agora tenta com o filtro de data
      const q = query(
        collections.questionAttempts,
        where('userId', '==', userId),
        where('attemptedAt', '>=', Timestamp.fromDate(startDate)),
        orderBy('attemptedAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(q);

      // Group attempts into sessions (by subject and date)
      const sessionMap = new Map<string, any>();

      snapshot.docs.forEach(doc => {
        const data = doc.data();

        // Garantir que attemptedAt é um Timestamp
        const attemptedAtTimestamp = data.attemptedAt || Timestamp.now();
        const date = typeof attemptedAtTimestamp.toDate === 'function'
          ? attemptedAtTimestamp.toDate()
          : new Date(attemptedAtTimestamp);

        const dateStr = date.toISOString().split('T')[0];
        const subject = data.subject || 'geral';
        const key = `${dateStr}_${subject}`;

        if (!sessionMap.has(key)) {
          sessionMap.set(key, {
            id: key,
            date: date,
            subject,
            itemsStudied: 0,
            correctAnswers: 0,
            duration: 0,
            score: 0,
            type: 'questions'
          });
        }

        const session = sessionMap.get(key)!;
        session.itemsStudied += 1;
        if (data.isCorrect) session.correctAnswers += 1;
        session.score = (session.correctAnswers / session.itemsStudied) * 100;
      });

      const result = Array.from(sessionMap.values()).sort((a, b) => {
        return b.date.getTime() - a.date.getTime();
      });

      return result;
    } catch (error) {
      console.error('[SESSION] Error in getUserSessions:', error);
      return [];
    }
  }
};

export { app, auth, db };