// ============================================
// SIMULADO PAGE - SUPER SIMULADO WEEKLY
// ============================================

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Trophy, TrendingUp, Target, Medal } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { simuladoService } from '../../services/firebase';
import { Card, StatCard } from '../common';
import { SimuladoResult } from '../../types';
import { clsx } from 'clsx';

// ============================================
// COUNTDOWN TIMER
// ============================================

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function getNextSaturdayTenAM(): Date {
  const now = new Date();
  // Ajusta para Brasília (UTC-3)
  const brasiliaNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000) + (-3 * 3600000));
  
  const day = brasiliaNow.getDay();
  const daysUntilSaturday = (6 - day + 7) % 7;
  const nextSaturday = new Date(brasiliaNow);
  
  if (daysUntilSaturday === 0 && brasiliaNow.getHours() < 10) {
    // É sábado mas não chegou às 10h
    nextSaturday.setDate(nextSaturday.getDate());
  } else {
    nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
  }
  
  nextSaturday.setHours(10, 0, 0, 0);
  return nextSaturday;
}

function useCountdown(): CountdownState {
  const [countdown, setCountdown] = useState<CountdownState>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    const updateCountdown = () => {
      const target = getNextSaturdayTenAM();
      const now = new Date();
      const brasiliaNow = new Date(now.getTime() - (now.getTimezoneOffset() * 60000) + (-3 * 3600000));
      
      const diff = target.getTime() - brasiliaNow.getTime();

      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        setCountdown({ days, hours, minutes, seconds, expired: false });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
}

// ============================================
// COUNTDOWN DISPLAY
// ============================================

function CountdownDisplay({ countdown }: { countdown: CountdownState }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { value: countdown.days, label: 'Dias' },
          { value: countdown.hours, label: 'Horas' },
          { value: countdown.minutes, label: 'Minutos' },
          { value: countdown.seconds, label: 'Segundos' },
        ].map((item, idx) => (
          <div key={idx} className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-4">
            <div className="text-3xl font-bold text-white mb-1">
              {String(item.value).padStart(2, '0')}
            </div>
            <div className="text-xs text-primary-200">{item.label}</div>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-secondary-200 mb-2">
        {countdown.expired ? 'Super Simulado Disponível' : 'Aguarde o próximo Super Simulado'}
      </h2>
      <p className="text-secondary-400">
        {countdown.expired
          ? 'O simulado já começou! Você tem até meia-noite para completar.'
          : 'Próximo Super Simulado: Sábado às 10h (Horário de Brasília)'}
      </p>
    </motion.div>
  );
}

// ============================================
// LEADERBOARD CARD
// ============================================

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  score: number;
  isCurrentUser?: boolean;
}

function Leaderboard({ entries, currentUserRank }: { entries: LeaderboardEntry[]; currentUserRank: number }) {
  const getMedalIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return null;
  };

  const topThree = entries.slice(0, 3);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-secondary-200 mb-6 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-accent-amber" />
        Classificação Super Simulado
      </h3>

      <div className="mb-6">
        <p className="text-sm text-secondary-400 mb-4">Sua Posição: <span className="text-primary-500 font-bold text-lg">#{currentUserRank}</span></p>
      </div>

      <div className="space-y-3">
        {topThree.map((entry, idx) => (
          <motion.div
            key={entry.userId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * idx }}
            className={clsx(
              'p-4 rounded-lg border-2 transition-all',
              entry.isCurrentUser
                ? 'bg-primary-500/10 border-primary-500'
                : 'bg-secondary-800 border-secondary-700'
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-secondary-300 w-8">
                  {getMedalIcon(entry.rank) || `#${entry.rank}`}
                </span>
                <span className={clsx('font-medium', entry.isCurrentUser ? 'text-primary-400' : 'text-secondary-200')}>
                  {entry.userName}
                </span>
              </div>
              <div className="text-2xl font-bold text-accent-amber">{entry.score}%</div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}

// ============================================
// RECENT RESULTS
// ============================================

function RecentResults({ results }: { results: SimuladoResult[] }) {
  if (results.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-secondary-200 mb-4">Histórico de Super Simulados</h3>
        <p className="text-secondary-500 text-center py-8">
          Você ainda não completou nenhum Super Simulado.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-secondary-200 mb-4">Histórico de Super Simulados</h3>
      <div className="space-y-3">
        {results.slice(0, 5).map((result, idx) => {
          const score = Math.round((result.totalCorrect / result.totalQuestions) * 100);
          const finishedDate = result.finishedAt as Date;

          return (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx }}
              className="flex items-center justify-between p-4 bg-secondary-800 rounded-lg border border-secondary-700"
            >
              <div>
                <p className="text-secondary-200 font-medium">
                  {finishedDate.toLocaleDateString('pt-BR')}
                </p>
                <p className="text-xs text-secondary-500">
                  {result.totalCorrect}/{result.totalQuestions} questões corretas
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-accent-amber">{score}%</div>
                {result.percentile && (
                  <p className="text-xs text-secondary-500">Percentil: {result.percentile}%</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

// ============================================
// MAIN SIMULADO PAGE
// ============================================

export function SimuladoPage() {
  const { user } = useAuth();
  const countdown = useCountdown();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<SimuladoResult[]>([]);
  const [userStats, setUserStats] = useState({ userAverage: 0, globalAverage: 0 });
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentRank, setCurrentRank] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      setLoading(true);
      try {
        // Buscar últimos resultados do usuário
        const userResults = await simuladoService.getUserSimuladoResults(user.uid);
        setResults(userResults);

        // Buscar estatísticas
        const stats = await simuladoService.getSimuladoStats(user.uid);
        setUserStats(stats);

        // Buscar ranking
        const ranking = await simuladoService.getSimuladoRanking();
        setLeaderboard(ranking);

        // Encontrar posição do usuário
        const userRank = ranking.findIndex(entry => entry.userId === user.uid) + 1;
        setCurrentRank(userRank || ranking.length + 1);
      } catch (error) {
        console.error('Erro ao carregar dados do simulado:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary-400">Carregando simulado...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl font-display font-bold text-white mb-2">
          Super Simulado
        </h1>
        <p className="text-secondary-400">
          Teste seus conhecimentos com uma prova completa
        </p>
      </motion.div>

      {/* Countdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="p-8">
          <CountdownDisplay countdown={countdown} />
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <StatCard
          label="Sua Média"
          value={`${Math.round(userStats.userAverage)}%`}
          icon={<Target className="w-5 h-5" />}
          color="text-primary-500"
        />
        <StatCard
          label="Média Geral"
          value={`${Math.round(userStats.globalAverage)}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          color="text-accent-cyan"
        />
        <StatCard
          label="Diferença"
          value={`${Math.round(userStats.userAverage - userStats.globalAverage)}%`}
          icon={<Medal className="w-5 h-5" />}
          color={
            userStats.userAverage >= userStats.globalAverage
              ? 'text-accent-emerald'
              : 'text-accent-rose'
          }
        />
      </motion.div>

      {/* Leaderboard and Recent Results */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Leaderboard entries={leaderboard} currentUserRank={currentRank} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <RecentResults results={results} />
        </motion.div>
      </div>

      {/* Info Box */}
      <Card className="p-6 bg-primary-500/10 border-primary-500/30">
        <div className="flex gap-4">
          <Clock className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-secondary-200 mb-2">Como funciona?</h4>
            <ul className="text-sm text-secondary-400 space-y-1">
              <li>• O Super Simulado está disponível toda semana, de sábado às 10h até domingo à meia-noite</li>
              <li>• Prova com 100 questões divididas igualmente entre as 5 especialidades</li>
              <li>• Seu desempenho é comparado com todos os participantes</li>
              <li>• Resultados em tempo real com ranking e percentil</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default SimuladoPage;
