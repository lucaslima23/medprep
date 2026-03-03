// ============================================
// SESSION RESULTS COMPONENT
// ============================================

import { motion } from 'framer-motion';
import { CheckCircle, RotateCcw, Clock, TrendingUp } from 'lucide-react';
import { Button, Card } from '../common';
import { clsx } from 'clsx';

interface SessionResultsProps {
  correct: number;
  total: number;
  timeSpent: number;
  onRestart: () => void;
}

export function SessionResults({ correct, total, timeSpent, onRestart }: SessionResultsProps) {
  const percentage = Math.round((correct / total) * 100);
  const minutes = Math.floor(timeSpent / 60);
  const seconds = timeSpent % 60;
  const averagePerQuestion = Math.round(timeSpent / total);

  const getPerformanceLevel = (percent: number) => {
    if (percent >= 90) return { label: 'Excelente', color: 'text-accent-emerald' };
    if (percent >= 70) return { label: 'Bom', color: 'text-primary-400' };
    if (percent >= 50) return { label: 'Adequado', color: 'text-accent-amber' };
    return { label: 'Precisa Melhorar', color: 'text-accent-rose' };
  };

  const performance = getPerformanceLevel(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Main Score Card */}
      <Card className="p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-accent-emerald" />
          <h2 className="text-3xl font-bold text-white mb-2">Sessão Concluída!</h2>
          <p className="text-secondary-400 mb-6">Aqui está sua performance</p>

          {/* Score Circle */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background circle */}
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-secondary-700"
              />
              {/* Progress circle */}
              <motion.circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(percentage / 100) * 440} 440`}
                strokeLinecap="round"
                className={clsx(
                  percentage >= 70 ? 'text-accent-emerald' : 'text-accent-amber'
                )}
                initial={{ strokeDasharray: '0 440' }}
                animate={{ strokeDasharray: `${(percentage / 100) * 440} 440` }}
                transition={{ duration: 1, delay: 0.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className={clsx('text-4xl font-bold', performance.color)}>
                {percentage}%
              </div>
              <div className={clsx('text-sm font-medium', performance.color)}>
                {performance.label}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-8 pt-8 border-t border-secondary-700">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-2xl font-bold text-accent-emerald">
                {correct}/{total}
              </div>
              <div className="text-xs text-secondary-400 mt-1">Corretas</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="text-2xl font-bold text-accent-rose">
                {total - correct}/{total}
              </div>
              <div className="text-xs text-secondary-400 mt-1">Incorretas</div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="text-2xl font-bold text-primary-400">
                {averagePerQuestion}s
              </div>
              <div className="text-xs text-secondary-400 mt-1">Por Questão</div>
            </motion.div>
          </div>
        </motion.div>
      </Card>

      {/* Time Summary */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-secondary-300 text-sm">Tempo Total</p>
            <p className="text-lg font-semibold text-white">
              {minutes}m {seconds}s
            </p>
          </div>
        </Card>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="flex gap-3"
      >
        <Button onClick={onRestart} variant="primary" size="lg" className="flex-1">
          <RotateCcw className="w-5 h-5 mr-2" />
          Nova Sessão
        </Button>
      </motion.div>

      {/* Stats Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center text-secondary-400 text-sm"
      >
        <div className="flex items-center justify-center gap-2">
          <TrendingUp className="w-4 h-4" />
          <p>Parabéns! Você completou mais uma sessão de estudos.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SessionResults;
