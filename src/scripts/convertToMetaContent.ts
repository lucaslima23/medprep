// ============================================
// CONVERSOR: schedule-example.json → meta_contents
// ============================================

/**
 * INSTRUÇÃO:
 * 
 * Este script converte automaticamente dados de schedule-example.json
 * para o formato de meta_contents
 * 
 * USO:
 * 1. Copie/cole o conteúdo em um arquivo TypeScript
 * 2. Execute no Node.js ou Console do navegador
 * 3. Resultado será um JSON pronto para importar
 */

import scheduleData from '../data/schedule-example.json';

interface ScheduleDay {
  date: string;
  subject: string;
  subSubject: string;
  title: string;
  summary?: string;
  videoId?: string;
  pdfId?: string;
  flashcardSetId?: string;
  questionSetId?: string;
  estimatedTime?: number;
}

interface MetaContentItem {
  title: string;
  subject: string;
  order: number;
  driveVideoId?: string;
  driveDocId?: string;
}

/**
 * Converte schedule data para meta_contents format
 * Remover duplicatas (mesmo title)
 */
function convertScheduleToMetaContents(days: ScheduleDay[]): MetaContentItem[] {
  const itemMap = new Map<string, MetaContentItem>();
  let order = 1;

  days.forEach((day) => {
    // Usar title como key para evitar duplicatas
    if (!itemMap.has(day.title)) {
      const item: MetaContentItem = {
        title: day.title,
        subject: day.subject,
        order: order++,
        driveVideoId: day.videoId || undefined,
        driveDocId: day.pdfId || undefined,
      };

      itemMap.set(day.title, item);
    }
  });

  return Array.from(itemMap.values());
}

/**
 * Executa conversão
 */
function convertAndDisplay() {
  console.log('🔄 Iniciando conversão...\n');

  const converted = convertScheduleToMetaContents(scheduleData.days);

  console.log(`✅ ${converted.length} itens únicos convertidos\n`);
  console.log('Resultado em JSON:');
  console.log(JSON.stringify(converted, null, 2));

  // Também exibe numa tabela
  console.log('\n📊 Visualização em tabela:');
  console.table(converted);

  return converted;
}


// ============================================
// EXPORTAR PARA ARQUIVO
// ============================================

/**
 * Gera um arquivo JSON pronto para importar
 */
function generateJsonFile(items: MetaContentItem[]): string {
  return JSON.stringify(items, null, 2);
}

// ============================================
// EXECUÇÃO
// ============================================

// Descomente a linha abaixo para executar:
// convertAndDisplay();

// ============================================
// EXPORTAR FUNÇÃO
// ============================================

export { convertScheduleToMetaContents, convertAndDisplay, generateJsonFile };
