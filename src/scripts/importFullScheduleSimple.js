#!/usr/bin/env node

/**
 * Script para importar 92 itens do cronograma para Firestore
 * Execução: node src/scripts/importFullScheduleSimple.js
 */

const fs = require('fs');
const path = require('path');

// Importar dados
const metaContentsFull = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../data/meta_contents_full_schedule.json'), 'utf8')
);

// Firebase Admin SDK
const admin = require('firebase-admin');

// Inicializar Firebase (usa arquivo de credenciais)
const serviceAccountPath = process.env.FIREBASE_CREDENTIALS_PATH || 
  'firebase-credentials.json';

if (!fs.existsSync(serviceAccountPath)) {
  console.error(`❌ Arquivo de credenciais não encontrado: ${serviceAccountPath}`);
  console.error(`\n📋 Para executar este script, você precisa:`);
  console.error(`   1. Baixar arquivo JSON de credenciais do Firebase Console`);
  console.error(`      Projeto > Configurações > Contas de serviço > Gerar nova chave`);
  console.error(`   2. Salvar como: firebase-credentials.json`);
  console.error(`   3. Adicionar à .gitignore`);
  process.exit(1);
}

try {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, 'utf8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  const db = admin.firestore();

  async function importFullSchedule() {
    try {
      console.log('🚀 Iniciando importação do cronograma completo...');
      console.log(`📊 Total de itens: ${metaContentsFull.metaContentsFull.length}`);
      console.log('');

      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      const batch = db.batch();

      for (const item of metaContentsFull.metaContentsFull) {
        try {
          // Gerar ID baseado no título + order
          const normalizedTitle = item.title
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 25);
          
          const docId = `${String(item.order).padStart(3, '0')}_${normalizedTitle}`;

          // Dados a importar
          const dataToImport = {
            ...item,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          };

          // Adicionar à batch
          batch.set(db.collection('meta_contents').doc(docId), dataToImport);

          console.log(`✅ [${item.order}] ${item.title.substring(0, 50)}... (${item.subject})`);
          successCount++;
        } catch (err) {
          const errorMsg = `Erro ao preparar ${item.title}: ${err}`;
          console.error(`❌ [${item.order}] ${item.title.substring(0, 50)}...`);
          errors.push(errorMsg);
          errorCount++;
        }
      }

      // Executar batch
      console.log('\n💾 Salvando no Firestore...');
      await batch.commit();

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
      console.log(`   2. Integre no App.tsx o ScheduleEditor`);
      console.log(`   3. Abra: http://localhost:5173/admin/schedule-editor`);
      console.log(`   4. Adicione IDs de vídeo/documentos conforme disponíveis`);
      console.log(`\n📚 Cronograma com ${successCount} itens importados com sucesso!\n`);

      process.exit(0);
    } catch (err) {
      console.error('❌ Erro geral:', err);
      process.exit(1);
    }
  }

  importFullSchedule();

} catch (err) {
  console.error('❌ Erro ao inicializar Firebase:', err.message);
  process.exit(1);
}
