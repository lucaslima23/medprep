// ============================================
// SM-2 SPACED REPETITION ALGORITHM
// ============================================
// Implementação do algoritmo SuperMemo SM-2 para repetição espaçada
// Baseado no artigo original de Piotr Wozniak

import { SRSData, SRSQuality } from '../types';

/**
 * Parâmetros padrão do algoritmo SM-2
 */
const SM2_DEFAULTS = {
  MIN_EASE_FACTOR: 1.3,      // Fator de facilidade mínimo
  INITIAL_EASE_FACTOR: 2.5,  // Fator de facilidade inicial
  FIRST_INTERVAL: 1,         // Primeiro intervalo (1 dia)
  SECOND_INTERVAL: 6,        // Segundo intervalo (6 dias)
};

/**
 * Interface para o resultado do cálculo SM-2
 */
export interface SM2Result {
  interval: number;          // Novo intervalo em dias
  repetitions: number;       // Número de repetições
  easeFactor: number;        // Novo fator de facilidade
  nextReviewDate: Date;      // Data da próxima revisão
}

/**
 * Calcula o novo fator de facilidade baseado na qualidade da resposta
 * Fórmula: EF' = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
 * 
 * @param currentEF - Fator de facilidade atual
 * @param quality - Qualidade da resposta (0-5)
 * @returns Novo fator de facilidade
 */
export function calculateEaseFactor(currentEF: number, quality: SRSQuality): number {
  const newEF = currentEF + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  return Math.max(SM2_DEFAULTS.MIN_EASE_FACTOR, newEF);
}

/**
 * Calcula o novo intervalo de revisão
 * 
 * Regras SM-2:
 * - Se q < 3 (resposta incorreta): repetições = 0, intervalo = 1
 * - Se q >= 3 (resposta correta):
 *   - Se repetições = 0: intervalo = 1
 *   - Se repetições = 1: intervalo = 6
 *   - Se repetições > 1: intervalo = intervalo_anterior * EF
 * 
 * @param repetitions - Número de repetições consecutivas corretas
 * @param currentInterval - Intervalo atual em dias
 * @param easeFactor - Fator de facilidade
 * @returns Novo intervalo em dias
 */
export function calculateInterval(
  repetitions: number,
  currentInterval: number,
  easeFactor: number
): number {
  if (repetitions === 0) {
    return SM2_DEFAULTS.FIRST_INTERVAL;
  } else if (repetitions === 1) {
    return SM2_DEFAULTS.SECOND_INTERVAL;
  } else {
    return Math.round(currentInterval * easeFactor);
  }
}

/**
 * Função principal do algoritmo SM-2
 * Calcula os novos parâmetros de revisão baseado na qualidade da resposta
 * 
 * @param srsData - Dados SRS atuais do item (ou null para novo item)
 * @param quality - Qualidade da resposta (0-5)
 *   0: Erro total - nenhuma lembrança
 *   1: Erro - lembrou algo errado
 *   2: Erro - mas reconheceu a resposta correta
 *   3: Correto - com dificuldade significativa
 *   4: Correto - com alguma hesitação
 *   5: Correto - resposta perfeita
 * @returns Novos parâmetros SM-2
 */
export function calculateSM2(
  srsData: Partial<SRSData> | null,
  quality: SRSQuality
): SM2Result {
  // Valores iniciais ou atuais
  let repetitions = srsData?.repetitions ?? 0;
  let easeFactor = srsData?.easeFactor ?? SM2_DEFAULTS.INITIAL_EASE_FACTOR;
  let interval = srsData?.interval ?? 0;

  // Se a qualidade é menor que 3 (resposta incorreta)
  if (quality < 3) {
    // Reset das repetições - item precisa ser reaprendido
    repetitions = 0;
    interval = SM2_DEFAULTS.FIRST_INTERVAL;
  } else {
    // Resposta correta - incrementar repetições e calcular novo intervalo
    interval = calculateInterval(repetitions, interval, easeFactor);
    repetitions += 1;
  }

  // Sempre recalcular o fator de facilidade
  easeFactor = calculateEaseFactor(easeFactor, quality);

  // Calcular a data da próxima revisão
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  nextReviewDate.setHours(0, 0, 0, 0); // Início do dia

  return {
    interval,
    repetitions,
    easeFactor,
    nextReviewDate,
  };
}

/**
 * Cria dados SRS completos para um novo item ou atualiza existente
 * 
 * @param itemId - ID do item (questão ou flashcard)
 * @param itemType - Tipo do item
 * @param userId - ID do usuário
 * @param quality - Qualidade da resposta
 * @param currentData - Dados atuais (opcional)
 * @returns Dados SRS completos para salvar
 */
export function processSRSReview(
  itemId: string,
  itemType: 'question' | 'flashcard',
  userId: string,
  quality: SRSQuality,
  currentData?: Partial<SRSData> | null
): SRSData {
  const sm2Result = calculateSM2(currentData ?? null, quality);
  const isCorrect = quality >= 3;
  
  // Calcular streak
  let streak = currentData?.streak ?? 0;
  let bestStreak = currentData?.bestStreak ?? 0;
  
  if (isCorrect) {
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
  } else {
    streak = 0;
  }

  return {
    id: itemId,
    itemType,
    userId,
    interval: sm2Result.interval,
    repetitions: sm2Result.repetitions,
    easeFactor: sm2Result.easeFactor,
    nextReviewDate: sm2Result.nextReviewDate,
    lastReviewDate: new Date(),
    totalReviews: (currentData?.totalReviews ?? 0) + 1,
    correctReviews: (currentData?.correctReviews ?? 0) + (isCorrect ? 1 : 0),
    streak,
    bestStreak,
  };
}

/**
 * Converte uma resposta binária (certo/errado) para qualidade SM-2
 * Usado para questões de múltipla escolha
 * 
 * @param isCorrect - Se a resposta está correta
 * @param responseTime - Tempo de resposta em segundos (opcional)
 * @param averageTime - Tempo médio esperado em segundos (opcional)
 * @returns Qualidade SM-2 (0-5)
 */
export function binaryToQuality(
  isCorrect: boolean,
  responseTime?: number,
  averageTime: number = 60
): SRSQuality {
  if (!isCorrect) {
    // Errou - verificar se estava perto ou longe
    return 1; // Simplificado: erro padrão
  }

  // Acertou - calcular qualidade baseada no tempo
  if (!responseTime) {
    return 4; // Acerto padrão sem tempo
  }

  const timeRatio = responseTime / averageTime;

  if (timeRatio < 0.5) {
    return 5; // Muito rápido - resposta perfeita
  } else if (timeRatio < 1) {
    return 4; // Rápido - bom conhecimento
  } else if (timeRatio < 1.5) {
    return 3; // Normal - alguma dificuldade
  } else {
    return 3; // Lento - mas acertou
  }
}

/**
 * Estima o nível de retenção de um item baseado nos dados SRS
 * 
 * @param srsData - Dados SRS do item
 * @returns Estimativa de retenção (0-100%)
 */
export function estimateRetention(srsData: SRSData): number {
  const now = new Date();
  const daysSinceReview = Math.floor(
    (now.getTime() - srsData.lastReviewDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Modelo simplificado de decaimento exponencial
  // R = e^(-t/S) onde S é a estabilidade (baseada no intervalo)
  const stability = srsData.interval * srsData.easeFactor;
  const retention = Math.exp(-daysSinceReview / stability) * 100;

  return Math.max(0, Math.min(100, Math.round(retention)));
}

/**
 * Ordena itens por prioridade de revisão
 * Considera: data de revisão, fator de facilidade e histórico
 * 
 * @param items - Array de dados SRS
 * @returns Array ordenado por prioridade (maior prioridade primeiro)
 */
export function sortByReviewPriority(items: SRSData[]): SRSData[] {
  const now = new Date();

  return items.sort((a, b) => {
    // Primeiro: itens vencidos têm prioridade
    const aOverdue = a.nextReviewDate < now;
    const bOverdue = b.nextReviewDate < now;

    if (aOverdue !== bOverdue) {
      return aOverdue ? -1 : 1;
    }

    // Segundo: itens com menor fator de facilidade (mais difíceis)
    if (Math.abs(a.easeFactor - b.easeFactor) > 0.1) {
      return a.easeFactor - b.easeFactor;
    }

    // Terceiro: itens com menos repetições
    if (a.repetitions !== b.repetitions) {
      return a.repetitions - b.repetitions;
    }

    // Por fim: data de revisão mais antiga primeiro
    return a.nextReviewDate.getTime() - b.nextReviewDate.getTime();
  });
}

/**
 * Calcula estatísticas de um conjunto de itens SRS
 * 
 * @param items - Array de dados SRS
 * @returns Estatísticas agregadas
 */
export function calculateSRSStats(items: SRSData[]) {
  if (items.length === 0) {
    return {
      totalItems: 0,
      dueToday: 0,
      averageEaseFactor: 0,
      averageRetention: 0,
      masteredItems: 0, // repetitions >= 5
      learningItems: 0, // repetitions 1-4
      newItems: 0,      // repetitions = 0
    };
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueToday = items.filter(
    item => item.nextReviewDate >= today && item.nextReviewDate < tomorrow
  ).length;

  const totalEaseFactor = items.reduce((sum, item) => sum + item.easeFactor, 0);
  const totalRetention = items.reduce((sum, item) => sum + estimateRetention(item), 0);

  return {
    totalItems: items.length,
    dueToday,
    averageEaseFactor: totalEaseFactor / items.length,
    averageRetention: totalRetention / items.length,
    masteredItems: items.filter(i => i.repetitions >= 5).length,
    learningItems: items.filter(i => i.repetitions >= 1 && i.repetitions < 5).length,
    newItems: items.filter(i => i.repetitions === 0).length,
  };
}

export default {
  calculateSM2,
  processSRSReview,
  binaryToQuality,
  estimateRetention,
  sortByReviewPriority,
  calculateSRSStats,
};
