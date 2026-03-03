import { scheduleService } from '../services/firebase';
import metaContentsBlank from '../data/meta_contents_blank_template.json';

/**
 * Script para importar todos os itens do cronograma com IDs de vídeo/documento em branco
 * Uso:
 *   npx ts-node src/scripts/importBlankSchedule.ts
 */

async function importBlankSchedule() {
  try {
    console.log('🚀 Iniciando importação de cronograma...');
    console.log(`📊 Total de itens: ${metaContentsBlank.metaContentsBlank.length}`);

    let successCount = 0;
    let errorCount = 0;

    for (const item of metaContentsBlank.metaContentsBlank) {
      try {
        // Gerar ID baseado no título
        const docId = item.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .substring(0, 30);

        // Adicionar timestamp de criação
        const dataToImport = {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await scheduleService.updateMetaContent(docId, dataToImport);

        console.log(`✅ ${item.title} (ID: ${docId})`);
        successCount++;
      } catch (err) {
        console.error(`❌ Erro ao importar ${item.title}:`, err);
        errorCount++;
      }
    }

    console.log(`\n🎉 Importação concluída!`);
    console.log(`✅ Sucesso: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`\n👉 Próximo passo: Acesse /admin/schedule-editor para adicionar IDs`);
  } catch (err) {
    console.error('❌ Erro geral:', err);
    process.exit(1);
  }
}

importBlankSchedule();
