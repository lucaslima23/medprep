// ============================================
// DASHBOARD - LINEAR VELOCITY PROGRESSION
// ============================================

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  FileText,
  BrainCircuit,
  ClipboardList,
  Clock,
  Target,
  Flame,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Award
} from 'lucide-react';
import { format, differenceInWeeks } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStudy } from '../../contexts/StudyContext';
import { Card, Button, Badge, StatCard } from '../common';
import { getVideoEmbedUrl, getPdfEmbedUrl } from '../../services/googleDrive';
import { SUBJECT_LABELS, MedicalSubject } from '../../types';
import { scheduleService } from '../../services/firebase';
import { clsx } from 'clsx';

// ============================================
// VIDEO PLAYER COMPONENT
// ============================================

function VideoPlayer({ videoId, title }: { videoId: string; title: string }) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-video w-full bg-secondary-800">
        <iframe
          src={getVideoEmbedUrl(videoId)}
          title={title}
          className="w-full h-full"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
      <div className="p-4 border-t border-secondary-700">
        <div className="flex items-center gap-2 text-secondary-400">
          <Play className="w-4 h-4" />
          <span className="text-sm">Vídeo-aula</span>
        </div>
        <h4 className="font-medium text-secondary-200 mt-1">{title}</h4>
      </div>
    </Card>
  );
}

// ============================================
// PDF VIEWER COMPONENT
// ============================================

function PdfViewer({ pdfId, title }: { pdfId: string; title: string }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className={clsx('w-full bg-secondary-800 transition-all duration-300', isExpanded ? 'h-[600px]' : 'h-64')}>
        <iframe
          src={getPdfEmbedUrl(pdfId)}
          title={title}
          className="w-full h-full"
        />
      </div>
      <div className="p-4 border-t border-secondary-700 flex items-center justify-between">
        <div className="flex items-center gap-2 text-secondary-400">
          <FileText className="w-4 h-4" />
          <span className="text-sm">Apostila PDF</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Recolher' : 'Expandir'}
        </Button>
      </div>
    </Card>
  );
}

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { srsStats } = useStudy(); // We keep SRS Stats for generic metrics

  // Linear Track State
  const [contents, setContents] = useState<any[]>([]);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Track & Progress
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const [meta, progress] = await Promise.all([
          scheduleService.getMetaContents(),
          scheduleService.getUserProgress(user.uid)
        ]);
        setContents(meta);
        setCompletedIds(progress);
      } catch (err) {
        console.error('Erro loadData track Linear:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  // View Computations
  const { nextItem, velocity, remainingWeeks, isFinished } = useMemo(() => {
    const uncompleted = contents.filter(c => !completedIds.includes(c.id));
    const next = uncompleted.length > 0 ? uncompleted[0] : null;

    // Velocity Math
    const enareDate = new Date('2026-10-18T00:00:00');
    let weeksLeft = differenceInWeeks(enareDate, new Date());
    if (weeksLeft < 1) weeksLeft = 1; // Prevent Infinity

    const requiredPerWeek = Math.ceil(uncompleted.length / weeksLeft);

    return {
      uncompletedItems: uncompleted,
      nextItem: next,
      velocity: requiredPerWeek,
      remainingWeeks: weeksLeft,
      isFinished: contents.length > 0 && uncompleted.length === 0
    };
  }, [contents, completedIds]);

  // Mark as Read Action
  const handleMarkAsDone = async () => {
    if (!user || !nextItem) return;
    try {
      await scheduleService.markContentAsCompleted(user.uid, nextItem.id);

      // Update local state to immediately show the next item
      setCompletedIds(prev => [...prev, nextItem.id]);
    } catch (err) {
      console.error('Falha ao concluir:', err);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-secondary-400">Calculando seu progresso...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 relative">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">
            {greeting}, {user?.displayName?.split(' ')[0]}! 👋
          </h1>
          <p className="text-secondary-400">
            {format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>

        {/* Velocity Badge */}
        {!isFinished && contents.length > 0 && (
          <Badge variant="info" className="self-start lg:self-auto py-2">
            <TrendingUp className="w-4 h-4 mr-2" />
            Meta: Estudar {velocity} {velocity === 1 ? 'tópico' : 'tópicos'} / semana
          </Badge>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          label="Progresso da Trilha"
          value={`${completedIds.length} / ${contents.length}`}
          icon={<Target className="w-5 h-5" />}
          color="text-accent-emerald"
        />
        <StatCard
          label="Semanas até ENARE"
          value={remainingWeeks > 0 ? remainingWeeks : 'Chegou o dia!'}
          icon={<Clock className="w-5 h-5" />}
          color="text-accent-amber"
        />
        <StatCard
          label="Revisões SRS"
          value={srsStats.dueToday}
          icon={<BookOpen className="w-5 h-5" />}
          color="text-primary-500"
        />
        <StatCard
          label="Retenção Média"
          value={`${Math.round(srsStats.averageRetention)}%`}
          icon={<Flame className="w-5 h-5" />}
          color="text-accent-cyan"
        />
      </motion.div>

      {/* Linear Track Content Area */}
      {isFinished ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="p-12 text-center flex flex-col items-center justify-center border-primary-500/30 bg-primary-500/5">
            <div className="w-24 h-24 bg-primary-500/20 text-primary-500 rounded-full flex items-center justify-center mb-6">
              <Award className="w-12 h-12" />
            </div>
            <h2 className="text-3xl font-display font-bold text-white mb-4">Parabéns! Você finalizou o Edital!</h2>
            <p className="text-secondary-400 max-w-lg mb-8">Você concluiu todos os {contents.length} tópicos da Trilha ENARE 2025. Agora é focar exclusivamente em Revisões Inteligentes, Flashcards e Simulados para dominar as provas.</p>
            <Button variant="primary" size="lg" onClick={() => window.location.href = '/questoes'}>
              Ir para o Banco de Questões
            </Button>
          </Card>
        </motion.div>
      ) : nextItem ? (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={nextItem.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50, scale: 0.95 }}
            transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Left Column: Player & Meta */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  {nextItem.week && (
                    <Badge variant="default" className="bg-secondary-800 text-secondary-200 border border-secondary-700">
                      Semana {nextItem.week}
                    </Badge>
                  )}
                  {nextItem.subject && (
                    <Badge className="bg-primary-500/20 text-primary-400">
                      {SUBJECT_LABELS[nextItem.subject as MedicalSubject] || 'Geral'}
                    </Badge>
                  )}
                  {nextItem.type && <span className="text-secondary-500 text-sm capitalize">• {nextItem.type}</span>}
                </div>

                <h2 className="text-3xl font-display font-bold text-white mb-2 leading-tight">
                  {nextItem.title}
                </h2>
              </div>

              {/* Videos */}
              <div className="space-y-4">
                {(nextItem.driveVideos && nextItem.driveVideos.length > 0) ? (
                  nextItem.driveVideos.map((v: any, idx: number) => (
                    <VideoPlayer key={idx} videoId={v.id} title={v.title || nextItem.title} />
                  ))
                ) : nextItem.driveVideoId ? (
                  <VideoPlayer videoId={nextItem.driveVideoId} title={nextItem.title} />
                ) : null}
              </div>

              {/* Docs */}
              <div className="space-y-4 mt-6">
                {(nextItem.driveDocs && nextItem.driveDocs.length > 0) ? (
                  nextItem.driveDocs.map((d: any, idx: number) => (
                    <PdfViewer key={idx} pdfId={d.id} title={d.title || `Apostila - ${nextItem.title}`} />
                  ))
                ) : nextItem.driveDocId ? (
                  <PdfViewer pdfId={nextItem.driveDocId} title={`Apostila - ${nextItem.title}`} />
                ) : null}
              </div>
            </div>

            {/* Right Column: Actions */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="p-6 sticky top-24 border-primary-500/20 shadow-glow">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  Sua Próxima Missão
                </h3>
                <p className="text-secondary-400 text-sm mb-6">Assista as aulas e leia os materiais referentes ao tópico <strong>{nextItem.title}</strong>. Ao finalizar, marque-o como concluído para atualizar sua meta e avançar na trilha.</p>

                <Button
                  variant="primary"
                  className="w-full h-14 text-lg font-bold flex items-center justify-center gap-2 mb-4 hover:scale-[1.02] transition-transform"
                  onClick={handleMarkAsDone}
                >
                  <CheckCircle2 className="w-6 h-6" />
                  Concluir e Avançar
                </Button>

                <div className="pt-4 border-t border-secondary-800">
                  <p className="text-xs text-secondary-500 text-center uppercase tracking-wider font-semibold mb-3">Estudo Ativo</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="secondary" className="flex items-center justify-center gap-2 text-xs" onClick={() => navigate(`/flashcards?subject=${nextItem.subject}`)}>
                      <BrainCircuit className="w-4 h-4" /> Flashcards
                    </Button>
                    <Button variant="secondary" className="flex items-center justify-center gap-2 text-xs" onClick={() => navigate(`/questoes?subject=${nextItem.subject}`)}>
                      <ClipboardList className="w-4 h-4" /> Questões
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>
        </AnimatePresence>
      ) : (
        <div className="p-12 text-center text-secondary-500">
          Nenhuma trilha encontrada. Vá até o painel Administrador e faça o Import do JSON da Trilha ENARE 2025.
        </div>
      )}
    </div>
  );
}

export default Dashboard;
