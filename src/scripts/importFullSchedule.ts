import { scheduleService } from '../services/firebase';
import metaContentsFull from '../data/meta_contents_full_schedule.json';

/**
 * Script para importar todos os 92 itens do cronograma completo
 * com IDs de vídeo/documento em branco
 * 
 * Uso:
 *   npx ts-node src/scripts/importFullSchedule.ts
 */

async function importFullSchedule() {
  try {
    console.log('🚀 Iniciando importação do cronograma completo...');
    console.log(`📊 Total de itens: ${metaContentsFull.metaContentsFull.length}`);

    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const item of metaContentsFull.metaContentsFull) {
      try {
        // Gerar ID baseado no título + order para garantir unicidade
        const normalizedTitle = item.title
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_+/g, '_')
          .substring(0, 25);
        
        const docId = `${String(item.order).padStart(3, '0')}_${normalizedTitle}`;

        // Adicionar timestamp de criação
        const dataToImport = {
          ...item,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await scheduleService.updateMetaContent(docId, dataToImport);

        console.log(`✅ [${item.order}] ${item.title.substring(0, 50)}... (${item.subject})`);
        successCount++;
      } catch (err) {
        const errorMsg = `Erro ao importar ${item.title}: ${err}`;
        console.error(`❌ [${item.order}] ${item.title.substring(0, 50)}...`);
        errors.push(errorMsg);
        errorCount++;
      }
    }

    console.log(`\n${'='.repeat(70)}`);
    console.log(`🎉 Importação concluída!`);
    console.log(`✅ Sucesso: ${successCount}/${metaContentsFull.metaContentsFull.length}`);
    console.log(`❌ Erros: ${errorCount}/${metaContentsFull.metaContentsFull.length}`);
    
    if (errors.length > 0) {
      console.log(`\n⚠️  Erros detalhados:`);
      errors.forEach((err) => console.error(`   - ${err}`));
    }

    console.log(`${'='.repeat(70)}`);
    console.log(`\n✨ Próximos passos:`);
    console.log(`   1. Verifique no Firebase Console: Firestore > meta_contents`);
    console.log(`   2. Abra: http://localhost:5173/admin/schedule-editor`);
    console.log(`   3. Adicione IDs de vídeo/documentos conforme disponíveis`);
    console.log(`\n📚 Cronograma com ${successCount} itens importados com sucesso!\n`);
  } catch (err) {
    console.error('❌ Erro geral:', err);
    process.exit(1);
  }
}

// Executar
importFullSchedule();
