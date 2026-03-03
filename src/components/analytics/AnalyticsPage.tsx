// ============================================
// ANALYTICS / PERFORMANCE PAGE
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Clock,
  Award,
  Calendar,
  BarChart3,
  PieChart
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { sessionService } from '../../services/firebase';
import { Card, StatCard, } from '../common';
import { 
  MedicalSubject, 
  SUBJECT_LABELS, 
  SUBJECT_COLORS,
  SubjectPerformance 
} from '../../types';
import { clsx } from 'clsx';

// ============================================
// CUSTOM TOOLTIP
// ============================================

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    value: number;
    name: string;
    color: string;
  }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-secondary-800 border border-secondary-700 rounded-lg p-3 shadow-xl">
      <p className="text-secondary-400 text-sm mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-secondary-200 text-sm">
            {entry.name}: <strong>{entry.value}</strong>
          </span>
        </div>
      ))}
    </div>
  );
}

// ============================================
// TIME PERIOD SELECTOR
// ============================================

type TimePeriod = '7d' | '30d' | '90d';

interface PeriodSelectorProps {
  value: TimePeriod;
  onChange: (period: TimePeriod) => void;
}

function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const options: { value: TimePeriod; label: string }[] = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '90d', label: '90 dias' },
  ];

  return (
    <div className="flex bg-secondary-800 rounded-lg p-1">
      {options.map(option => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'px-4 py-2 rounded-md text-sm font-medium transition-all',
            value === option.value
              ? 'bg-primary-500 text-white'
              : 'text-secondary-400 hover:text-secondary-200'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

// ============================================
// SUBJECT PERFORMANCE CARD
// ============================================

interface SubjectCardProps {
  subject: MedicalSubject;
  data: SubjectPerformance;
}

function SubjectCard({ subject, data }: SubjectCardProps) {
  const color = SUBJECT_COLORS[subject];
  const label = SUBJECT_LABELS[subject];

  return (
    <Card className="p-4 hover:border-primary-500/30 transition-colors" hover>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="font-medium text-secondary-200">{label.split(' ')[0]}</span>
        </div>
        {data.trend === 'up' && <TrendingUp className="w-4 h-4 text-accent-emerald" />}
        {data.trend === 'down' && <TrendingDown className="w-4 h-4 text-accent-rose" />}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-secondary-400">Acertos</span>
          <span className="text-secondary-200 font-medium">
            {data.correctAnswers}/{data.totalQuestions}
          </span>
        </div>
        
        <div className="h-2 bg-secondary-700 rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              width: `${data.accuracy}%`,
              backgroundColor: color
            }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-secondary-500">{Math.round(data.accuracy)}% de acerto</span>
          <span className="text-secondary-500">~{Math.round(data.averageTime)}s/questão</span>
        </div>
      </div>
    </Card>
  );
}

// ============================================
// MAIN ANALYTICS PAGE
// ============================================

export function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<Array<{
    id: string;
    date: Date;
    type: string;
    subject?: string;
    itemsStudied: number;
    correctAnswers: number;
    duration: number;
    score: number;
  }>>([]);

  // Fetch sessions data
  useEffect(() => {
    console.log('[ANALYTICS] useEffect triggered. user:', user?.uid, 'authLoading:', authLoading);
    
    const fetchData = async () => {
      console.log('[ANALYTICS] fetchData called. Checking: !user:', !user, 'authLoading:', authLoading);
      
      if (!user || authLoading) {
        console.log(`[ANALYTICS] Waiting... user exists: ${!!user}, authLoading: ${authLoading}`);
        return;
      }
      
      setLoading(true);
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
      console.log(`[ANALYTICS] Fetching sessions for user ${user.uid}, period: ${days} days`);
      const data = await sessionService.getUserSessions(user.uid, days);
      console.log(`[ANALYTICS] Received ${data.length} sessions:`, data);
      setSessions(data as typeof sessions);
      setLoading(false);
    };

    fetchData();
  }, [user, authLoading, period]);

  // Calculate daily performance data
  const dailyData = useMemo(() => {
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const dateRange = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date()
    });

    return dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySessions = sessions.filter(s => {
        try {
          return format(s.date, 'yyyy-MM-dd') === dateStr;
        } catch {
          return false;
        }
      });

      const totalQuestions = daySessions.reduce((sum, s) => sum + s.itemsStudied, 0);
      const correctAnswers = daySessions.reduce((sum, s) => sum + s.correctAnswers, 0);
      const totalTime = daySessions.reduce((sum, s) => sum + s.duration, 0);

      return {
        date: format(date, 'dd/MM', { locale: ptBR }),
        fullDate: format(date, "d 'de' MMMM", { locale: ptBR }),
        questions: totalQuestions,
        correct: correctAnswers,
        accuracy: totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0,
        studyTime: Math.round(totalTime / 60), // minutes
      };
    });
  }, [sessions, period]);

  // Calculate subject performance
  const subjectPerformance = useMemo(() => {
    const subjects: MedicalSubject[] = ['ginecologia', 'cirurgia', 'clinica_medica', 'pediatria', 'preventiva'];
    
    return subjects.map(subject => {
      const subjectSessions = sessions.filter(s => s.subject === subject);
      const totalQuestions = subjectSessions.reduce((sum, s) => sum + s.itemsStudied, 0);
      const correctAnswers = subjectSessions.reduce((sum, s) => sum + s.correctAnswers, 0);
      const totalTime = subjectSessions.reduce((sum, s) => sum + s.duration, 0);

      // Simple trend calculation (comparing first half vs second half)
      const halfIndex = Math.floor(subjectSessions.length / 2);
      const firstHalf = subjectSessions.slice(0, halfIndex);
      const secondHalf = subjectSessions.slice(halfIndex);
      
      const firstHalfAccuracy = firstHalf.length > 0
        ? firstHalf.reduce((sum, s) => sum + s.score, 0) / firstHalf.length
        : 0;
      const secondHalfAccuracy = secondHalf.length > 0
        ? secondHalf.reduce((sum, s) => sum + s.score, 0) / secondHalf.length
        : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (secondHalfAccuracy > firstHalfAccuracy + 5) trend = 'up';
      else if (secondHalfAccuracy < firstHalfAccuracy - 5) trend = 'down';

      return {
        subject,
        totalQuestions,
        correctAnswers,
        accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
        averageTime: totalQuestions > 0 ? totalTime / totalQuestions : 0,
        trend,
      } as SubjectPerformance;
    });
  }, [sessions]);

  // Pie chart data for subject distribution
  const pieData = useMemo(() => {
    return subjectPerformance
      .filter(s => s.totalQuestions > 0)
      .map(s => ({
        name: SUBJECT_LABELS[s.subject].split(' ')[0],
        value: s.totalQuestions,
        color: SUBJECT_COLORS[s.subject],
      }));
  }, [subjectPerformance]);

  // Summary stats
  const stats = useMemo(() => {
    const totalQuestions = sessions.reduce((sum, s) => sum + s.itemsStudied, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
    const averageAccuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

    return {
      totalQuestions,
      totalCorrect,
      averageAccuracy: Math.round(averageAccuracy),
      totalStudyHours: Math.round(totalTime / 3600 * 10) / 10, // 1 decimal
      totalSessions: sessions.length,
    };
  }, [sessions]);

  if (loading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary-400">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-white mb-4">Erro de Autenticação</h1>
        <p className="text-secondary-400">Faça login para acessar a página de desempenho.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-2">
            Meu Desempenho
          </h1>
          <p className="text-secondary-400">
            Acompanhe sua evolução nos estudos
          </p>
        </div>

        <PeriodSelector value={period} onChange={setPeriod} />
      </motion.div>

      {/* Summary Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-5 gap-4"
      >
        <StatCard
          label="Questões Respondidas"
          value={stats.totalQuestions}
          icon={<BarChart3 className="w-5 h-5" />}
          color="text-primary-500"
        />
        <StatCard
          label="Taxa de Acerto"
          value={`${stats.averageAccuracy}%`}
          icon={<Target className="w-5 h-5" />}
          color="text-accent-emerald"
        />
        <StatCard
          label="Acertos Totais"
          value={stats.totalCorrect}
          icon={<Award className="w-5 h-5" />}
          color="text-accent-amber"
        />
        <StatCard
          label="Horas de Estudo"
          value={`${stats.totalStudyHours}h`}
          icon={<Clock className="w-5 h-5" />}
          color="text-accent-cyan"
        />
        <StatCard
          label="Sessões de Estudo"
          value={stats.totalSessions}
          icon={<Calendar className="w-5 h-5" />}
          color="text-accent-violet"
        />
      </motion.div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Accuracy Over Time */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-secondary-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Evolução da Taxa de Acerto
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="accuracy"
                    name="Acerto"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    fill="url(#accuracyGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>

        {/* Questions Per Day */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-secondary-200 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent-cyan" />
              Questões por Dia
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis 
                    dataKey="date" 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={12}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="questions" 
                    name="Questões"
                    fill="#06b6d4" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Subject Performance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-secondary-200 mb-4">
          Desempenho por Especialidade
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {subjectPerformance.map(perf => (
            <SubjectCard 
              key={perf.subject} 
              subject={perf.subject} 
              data={perf} 
            />
          ))}
        </div>
      </motion.div>

      {/* Recent Sessions Performance by Subject */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-secondary-200 mb-4">
          Desempenho nos Últimos Blocos
        </h3>
        <div className="space-y-3">
          {sessions.slice(0, 10).reverse().map((session, idx) => {
            const sessionDate = format(session.date, "d 'de' MMMM 'às' HH:mm", { locale: ptBR });
            const accuracy = session.itemsStudied > 0 
              ? Math.round((session.correctAnswers / session.itemsStudied) * 100)
              : 0;
            
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * idx }}
              >
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-500">#{10 - idx}</span>
                      </div>
                      <div>
                        <p className="text-secondary-200 font-medium">
                          {session.subject ? SUBJECT_LABELS[session.subject as MedicalSubject] : 'Bloco Geral'}
                        </p>
                        <p className="text-xs text-secondary-500">{sessionDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-secondary-200">{accuracy}%</div>
                      <p className="text-xs text-secondary-500">
                        {session.correctAnswers}/{session.itemsStudied} questões
                      </p>
                    </div>
                  </div>
                  
                  <div className="h-2 bg-secondary-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-300"
                      style={{ 
                        width: `${accuracy}%`,
                        backgroundColor: accuracy >= 70 
                          ? '#10b981' 
                          : accuracy >= 50 
                          ? '#f59e0b' 
                          : '#ef4444'
                      }}
                    />
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Subject Distribution Pie Chart */}
      {pieData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-secondary-200 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-accent-violet" />
              Distribuição de Estudos
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend 
                    formatter={(value) => <span className="text-secondary-300">{value}</span>}
                  />
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default AnalyticsPage;
