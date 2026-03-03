// ============================================
// QUESTION CARD COMPONENT
// ============================================

import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Flag,
  ChevronRight,
} from 'lucide-react';
import { Button, Card, Badge, ProgressBar } from '../common';
import { Question } from '../../types';
import { clsx } from 'clsx';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

interface QuestionCardProps {
  question: Question;
  selectedAnswer: number | null;
  onSelectAnswer: (index: number) => void;
  showResult: boolean;
  onConfirm: () => void;
  onNext: () => void;
  questionNumber: number;
  totalQuestions: number;
}

export function QuestionCard({
  question,
  selectedAnswer,
  onSelectAnswer,
  showResult,
  onConfirm,
  onNext,
  questionNumber,
  totalQuestions,
}: QuestionCardProps) {
  const { user } = useAuth();
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportForm, setShowReportForm] = useState(false);

  const isCorrect = selectedAnswer === question.correctAnswer;
  const progress = ((questionNumber - 1) / totalQuestions) * 100;

  const handleReportQuestion = async () => {
    if (!user || !reportReason.trim()) return;

    setIsReporting(true);
    try {
      await addDoc(collection(db, 'questionReports'), {
        questionId: question.id,
        userId: user.uid,
        reason: reportReason,
        timestamp: new Date(),
        questionText: question.statement,
      });
      alert('Questão reportada com sucesso. Obrigado pela contribuição!');
      setShowReportForm(false);
      setReportReason('');
    } catch (error) {
      console.error('Erro ao reportar questão:', error);
      alert('Erro ao reportar questão. Tente novamente.');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4"
    >
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-secondary-300">
            Questão {questionNumber} de {totalQuestions}
          </span>
          <span className="text-sm text-secondary-400">
            {Math.round(progress)}%
          </span>
        </div>
        <ProgressBar value={questionNumber - 1} max={totalQuestions} color="bg-primary-500" />
      </div>

      {/* Main Question Card */}
      <Card className="p-6">
        {/* Subject Badge */}
        <div className="mb-4 flex items-center gap-2">
          <Badge variant="info" size="md">
            {question.subject}
          </Badge>
          {question.subSubject && (
            <Badge variant="default" size="sm">
              {question.subSubject}
            </Badge>
          )}
        </div>

        {/* Question Text */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          <h3 className="text-xl font-semibold text-white mb-6 leading-relaxed">
            {question.statement}
          </h3>
        </motion.div>

        {/* Answer Options */}
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isAnswerCorrect = index === question.correctAnswer;
            const showCorrect = showResult && isAnswerCorrect;
            const showWrong = showResult && isSelected && !isAnswerCorrect;

            return (
              <motion.button
                key={index}
                onClick={() => !showResult && onSelectAnswer(index)}
                disabled={showResult}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className={clsx(
                  'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
                  'hover:border-primary-500/50 disabled:cursor-default',
                  isSelected && !showResult && 'border-primary-500 bg-primary-500/10',
                  !isSelected && !showResult && 'border-secondary-600 bg-secondary-800/50 hover:bg-secondary-800',
                  showCorrect && 'border-accent-emerald bg-accent-emerald/10',
                  showWrong && 'border-accent-rose bg-accent-rose/10'
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      'mt-1 w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center',
                      isSelected && !showResult && 'border-primary-500 bg-primary-500',
                      !isSelected && !showResult && 'border-secondary-500',
                      showCorrect && 'border-accent-emerald bg-accent-emerald',
                      showWrong && 'border-accent-rose bg-accent-rose'
                    )}
                  >
                    {showCorrect && <CheckCircle className="w-4 h-4 text-white" />}
                    {showWrong && <XCircle className="w-4 h-4 text-white" />}
                    {isSelected && !showResult && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <div>
                    <p
                      className={clsx(
                        'font-medium',
                        isSelected && !showResult && 'text-primary-300',
                        !isSelected && !showResult && 'text-secondary-200',
                        showCorrect && 'text-accent-emerald',
                        showWrong && 'text-accent-rose'
                      )}
                    >
                      {option.letter}) {option.text}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </motion.div>

        {/* Result Feedback */}
        <AnimatePresence>
          {showResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={clsx(
                'mt-6 p-4 rounded-lg border-l-4',
                isCorrect
                  ? 'bg-accent-emerald/10 border-accent-emerald'
                  : 'bg-accent-rose/10 border-accent-rose'
              )}
            >
              <div className="flex gap-2 mb-2">
                {isCorrect ? (
                  <CheckCircle className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-accent-rose flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className={clsx('font-semibold mb-1', isCorrect ? 'text-accent-emerald' : 'text-accent-rose')}>
                    {isCorrect ? 'Resposta Correta!' : 'Resposta Incorreta'}
                  </p>
                  {question.explanation && (
                    <p className="text-secondary-300 text-sm leading-relaxed">
                      <span className="font-medium">Explicação:</span> {question.explanation}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3"
      >
        {!showResult ? (
          <>
            <Button
              onClick={onConfirm}
              disabled={selectedAnswer === null}
              size="lg"
              className="flex-1"
            >
              Confirmar
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              onClick={() => setShowReportForm(!showReportForm)}
              variant="ghost"
              size="lg"
              className="flex-shrink-0"
              title="Reportar questão problemática"
            >
              <Flag className="w-5 h-5" />
            </Button>
          </>
        ) : (
          <Button onClick={onNext} size="lg" className="flex-1">
            {questionNumber < totalQuestions ? 'Próxima Questão' : 'Ver Resultados'}
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        )}
      </motion.div>

      {/* Report Form */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-4 border-primary-500/50 bg-primary-500/5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary-400">
                  <AlertTriangle className="w-4 h-4" />
                  <p className="font-medium text-sm">Reportar Questão</p>
                </div>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Descreva o problema com esta questão..."
                  className="w-full bg-secondary-800 border border-secondary-600 rounded-lg p-3 text-secondary-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleReportQuestion}
                    loading={isReporting}
                    disabled={!reportReason.trim() || isReporting}
                    size="sm"
                    className="flex-1"
                  >
                    Enviar Report
                  </Button>
                  <Button
                    onClick={() => {
                      setShowReportForm(false);
                      setReportReason('');
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QuestionCard;
