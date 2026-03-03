// ============================================
// TEST SCRIPT - Schedule Migration Verification
// ============================================

// INSTRUÇÃO: Copie este código em um arquivo TypeScript/JavaScript
// e execute no contexto do seu aplicativo para testar a migração

import { db } from './src/services/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

/**
 * Testa se a coleção meta_contents existe e tem dados
 */
export async function testMetaContents() {
  console.log('🧪 Testando coleção meta_contents...');
  
  try {
    const metaContentsRef = collection(db, 'meta_contents');
    const snapshot = await getDocs(metaContentsRef);
    
    if (snapshot.empty) {
      console.error('❌ meta_contents está vazio ou não existe');
      return false;
    }
    
    console.log(`✅ meta_contents encontrado com ${snapshot.size} documentos`);
    
    // Mostrar primeiros 3 documentos
    snapshot.docs.slice(0, 3).forEach(doc => {
      console.log('  📋', doc.data());
    });
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar meta_contents:', error);
    return false;
  }
}

/**
 * Testa se uma função generatePersonalizedSchedule está acessível
 */
export async function testScheduleGeneration(userId: string) {
  console.log(`🧪 Testando generatePersonalizedSchedule para usuário: ${userId}...`);
  
  try {
    const { scheduleService } = await import('./src/services/firebase');
    
    // Verificar se função existe
    if (!scheduleService.generatePersonalizedSchedule) {
      console.error('❌ generatePersonalizedSchedule não foi encontrada');
      return false;
    }
    
    console.log('✅ Função generatePersonalizedSchedule existe');
    
    // Tentar gerar cronograma
    // CUIDADO: Isso criará um novo cronograma no Firestore
    // const schedule = await scheduleService.generatePersonalizedSchedule(userId);
    // console.log('✅ Cronograma gerado:', schedule);
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao testar geração de cronograma:', error);
    return false;
  }
}

/**
 * Verifica se um usuário já tem cronograma
 */
export async function testUserSchedule(userId: string) {
  console.log(`🧪 Verificando cronograma do usuário: ${userId}...`);
  
  try {
    const scheduleRef = doc(db, 'schedules', userId);
    const scheduleDoc = await getDoc(scheduleRef);
    
    if (!scheduleDoc.exists()) {
      console.log('⚠️  Usuário não tem cronograma (vai ser criado no próximo login)');
      return null;
    }
    
    const schedule = scheduleDoc.data();
    console.log('✅ Cronograma encontrado');
    console.log('   - Nome:', schedule.name);
    console.log('   - Período:', schedule.startDate, 'até', schedule.endDate);
    console.log('   - Dias:', schedule.days?.length || 0);
    
    // Verificar hoje
    const today = new Date().toISOString().split('T')[0];
    const todaySchedule = schedule.days?.find((d: any) => d.date === today);
    
    if (todaySchedule) {
      console.log('✅ Tema para hoje:', todaySchedule.title);
      console.log('   - Vídeo ID:', todaySchedule.driveVideoId || '(não informado)');
      console.log('   - Doc ID:', todaySchedule.driveDocId || '(não informado)');
    } else {
      console.log('⚠️  Nenhum tema para hoje');
    }
    
    return schedule;
  } catch (error) {
    console.error('❌ Erro ao verificar cronograma do usuário:', error);
    return null;
  }
}

/**
 * Teste completo
 */
export async function runAllTests(userId?: string) {
  console.log('🚀 Iniciando testes de migração de cronograma...\n');
  
  const results = {
    metaContents: false,
    scheduleGeneration: false,
    userSchedule: false,
  };
  
  // Teste 1: Meta Contents
  results.metaContents = await testMetaContents();
  console.log('');
  
  // Teste 2: Schedule Generation
  results.scheduleGeneration = await testScheduleGeneration(userId || 'test-user');
  console.log('');
  
  // Teste 3: User Schedule
  if (userId) {
    results.userSchedule = (await testUserSchedule(userId)) !== null;
    console.log('');
  }
  
  // Resumo
  console.log('📊 RESUMO DOS TESTES:');
  console.log('-------------------');
  console.log(`✅ Meta Contents: ${results.metaContents ? 'PASSOU' : 'FALHOU'}`);
  console.log(`✅ Schedule Generation: ${results.scheduleGeneration ? 'PASSOU' : 'FALHOU'}`);
  if (userId) {
    console.log(`✅ User Schedule: ${results.userSchedule ? 'PASSOU' : 'FALHOU'}`);
  }
  console.log('-------------------');
  
  const allPassed = Object.values(results).every(v => v);
  console.log(allPassed ? '🎉 TODOS OS TESTES PASSARAM!' : '⚠️  Alguns testes falharam. Verifique as mensagens acima.');
  
  return results;
}

// ============================================
// USO:
// ============================================

// No Console do navegador (F12) ou em um teste:
// import { runAllTests } from './testSchedule';
// 
// await runAllTests('seu-user-id'); // substitua com ID real

// Ou teste individual:
// import { testMetaContents } from './testSchedule';
// await testMetaContents();
