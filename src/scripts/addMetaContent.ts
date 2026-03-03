// ============================================
// SCRIPT PARA ADICIONAR ITENS AO meta_contents
// ============================================

/**
 * INSTRUÇÕES:
 * 
 * 1. Copie este arquivo para src/scripts/addMetaContent.ts
 * 2. Execute no navegador console OU em Node.js
 * 3. Dados serão salvos em Firestore > meta_contents
 * 
 * USO NO CONSOLE DO NAVEGADOR:
 * await addSingleMetaContent({
 *   title: "Seu Tema",
 *   subject: "ginecologia",
 *   order: 35,
 *   driveVideoId: "link-video",
 *   driveDocId: "link-doc"
 * })
 * 
 * USO EM BATCH:
 * await addMultipleMetaContents([...array de items])
 */

import { db } from '../services/firebase';
import { collection, setDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';

interface DriveMedia {
  id: string;               // Google Drive file ID
  title?: string;           // Título (ex: "Parte 1", "Apostila A")
  order?: number;           // Sequência de exibição
}

interface MetaContentItem {
  title: string;
  subject: 'ginecologia' | 'pediatria' | 'cirurgia' | 'clinica_medica' | 'preventiva';
  order: number;
  driveVideoId?: string;    // LEGADO: Um único vídeo
  driveDocId?: string;      // LEGADO: Um único documento
  driveVideos?: DriveMedia[];    // NOVO: Múltiplos vídeos
  driveDocs?: DriveMedia[];      // NOVO: Múltiplos documentos
}

/**
 * Adiciona um ÚNICO item ao meta_contents
 */
export async function addSingleMetaContent(item: MetaContentItem) {
  try {
    console.log('[META_CONTENT] Adicionando:', item.title);
    
    // Gera ID baseado em subject + order
    const docId = `${item.subject}_${item.order}`;
    
    await setDoc(doc(db, 'meta_contents', docId), {
      title: item.title,
      subject: item.subject,
      order: item.order,
      driveVideoId: item.driveVideoId || null,
      driveDocId: item.driveDocId || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log('✅ Item adicionado com sucesso:', docId);
    return docId;
  } catch (error) {
    console.error('❌ Erro ao adicionar item:', error);
    throw error;
  }
}

/**
 * Adiciona MÚLTIPLOS itens ao meta_contents
 */
export async function addMultipleMetaContents(items: MetaContentItem[]) {
  try {
    console.log(`[META_CONTENT] Adicionando ${items.length} itens...`);
    
    const results = [];
    for (const item of items) {
      const docId = await addSingleMetaContent(item);
      results.push(docId);
    }
    
    console.log(`✅ ${results.length} itens adicionados com sucesso!`);
    return results;
  } catch (error) {
    console.error('❌ Erro ao adicionar múltiplos itens:', error);
    throw error;
  }
}

/**
 * Lista todos os itens de meta_contents (para referência)
 */
export async function listAllMetaContents() {
  try {
    console.log('[META_CONTENT] Listando todos os itens...');
    
    const q = query(
      collection(db, 'meta_contents'),
      orderBy('order', 'asc')
    );
    
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((doc, idx) => ({
      id: doc.id,
      ...doc.data(),
      index: idx + 1,
    }));
    
    console.log(`✅ Total: ${items.length} itens`);
    console.table(items);
    
    return items;
  } catch (error) {
    console.error('❌ Erro ao listar itens:', error);
    throw error;
  }
}

/**
 * Atualiza um item existente
 */
export async function updateMetaContent(
  docId: string,
  updates: Partial<MetaContentItem>
) {
  try {
    console.log('[META_CONTENT] Atualizando:', docId);
    
    await setDoc(
      doc(db, 'meta_contents', docId),
      {
        ...updates,
        updatedAt: new Date(),
      },
      { merge: true } // Merge permite atualizar parcialmente
    );
    
    console.log('✅ Item atualizado com sucesso:', docId);
    return docId;
  } catch (error) {
    console.error('❌ Erro ao atualizar item:', error);
    throw error;
  }
}

/**
 * Deleta um item (CUIDADO!)
 */
export async function deleteMetaContent(docId: string) {
  try {
    console.log('[META_CONTENT] Deletando:', docId);
    
    // Nota: Para deletar, você precisa importar deleteDoc
    // Para agora, apenas marca como comentário
    
    console.warn('⚠️  Não implementado ainda. Use Firebase Console para deletar.');
  } catch (error) {
    console.error('❌ Erro ao deletar item:', error);
    throw error;
  }
}

// ============================================
// EXEMPLO DE USO
// ============================================

/*
// 1. ADICIONAR UM ITEM (formato antigo, ainda funciona)
await addSingleMetaContent({
  title: "Insuficiência Cardíaca Congestiva",
  subject: "clinica_medica",
  order: 1,
  driveVideoId: "1a2b3c4d5e6f7g8h9i0j",
  driveDocId: "abc123def456ghi789",
});

// 2. ADICIONAR UM ITEM COM MÚLTIPLOS VÍDEOS E DOCUMENTOS ✨ NOVO!
await addSingleMetaContent({
  title: "Cirurgia do Abdome",
  subject: "cirurgia",
  order: 2,
  driveVideos: [
    { id: "video1_abc", title: "Parte 1: Anatomia", order: 1 },
    { id: "video2_def", title: "Parte 2: Patologia", order: 2 },
    { id: "video3_ghi", title: "Parte 3: Técnicas", order: 3 },
  ],
  driveDocs: [
    { id: "doc1_xyz", title: "Apostila Completa", order: 1 },
    { id: "doc2_uvw", title: "Resumo Clínico", order: 2 },
  ],
});

// 3. ADICIONAR VÁRIOS ITENS (mix antigo + novo)
await addMultipleMetaContents([
  {
    title: "Abdome Agudo Inflamatório",
    subject: "cirurgia",
    order: 3,
    driveVideoId: "2b3c4d5e6f7g8h9i0ja",  // Um único vídeo (legado)
    driveDocId: "def456ghi789jkl012",     // Um único documento (legado)
  },
  {
    title: "Reanimação Neonatal",
    subject: "pediatria",
    order: 4,
    driveVideos: [                         // Múltiplos vídeos (novo!)
      { id: "vid_neo1", title: "Teoria", order: 1 },
      { id: "vid_neo2", title: "Prática", order: 2 },
    ],
  },
]);

// 4. LISTAR TODOS
await listAllMetaContents();

// 5. ATUALIZAR UM ITEM (adicionar mais vídeos)
await updateMetaContent('cirurgia_2', {
  driveVideos: [
    { id: "video1_abc", title: "Parte 1: Anatomia", order: 1 },
    { id: "video2_def", title: "Parte 2: Patologia", order: 2 },
    { id: "video4_jkl", title: "Parte 4: Nova", order: 4 }, // Novo vídeo adicionado!
  ],
});

// 6. USAR NO COMPONENTE (acesso aos dados)
// Múltiplos vídeos:
const videos = studyDay.driveVideos;  // Array de vídeos
videos.forEach(video => {
  console.log(video.id, video.title);  // "video1_abc" "Parte 1"
});

// Ou legado (um único):
const videoId = studyDay.driveVideoId;  // String única
*/

