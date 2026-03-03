// ============================================
// GOOGLE DRIVE SERVICE
// Para embed de vídeo-aulas e PDFs
// ============================================

const GOOGLE_DRIVE_API_KEY = import.meta.env.VITE_GOOGLE_DRIVE_API_KEY;

/**
 * Gera URL de embed para vídeo do Google Drive
 * @param fileId - ID do arquivo no Google Drive
 * @returns URL de embed do vídeo
 */
export function getVideoEmbedUrl(fileIdOrUrl: string): string {
  const extracted = extractFileId(fileIdOrUrl);
  const finalId = extracted || fileIdOrUrl;
  return `https://drive.google.com/file/d/${finalId}/preview`;
}

/**
 * Gera URL de embed para PDF do Google Drive
 * @param fileId - ID do arquivo no Google Drive
 * @returns URL de embed do PDF
 */
export function getPdfEmbedUrl(fileIdOrUrl: string): string {
  const extracted = extractFileId(fileIdOrUrl);
  const finalId = extracted || fileIdOrUrl;
  return `https://drive.google.com/file/d/${finalId}/preview`;
}

/**
 * Gera URL de download direto para arquivos do Google Drive
 * @param fileId - ID do arquivo no Google Drive
 * @returns URL de download
 */
export function getDownloadUrl(fileId: string): string {
  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

/**
 * Gera URL para abrir arquivo no Google Drive
 * @param fileId - ID do arquivo no Google Drive
 * @returns URL para abrir no Drive
 */
export function getOpenInDriveUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Extrai o ID do arquivo de uma URL do Google Drive
 * @param url - URL completa do Google Drive
 * @returns ID do arquivo ou null se inválido
 */
export function extractFileId(url: string): string | null {
  // Padrões comuns de URL do Google Drive
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,           // /file/d/FILE_ID
    /id=([a-zA-Z0-9_-]+)/,                    // id=FILE_ID
    /\/folders\/([a-zA-Z0-9_-]+)/,            // /folders/FOLDER_ID
    /^([a-zA-Z0-9_-]{25,})/,                  // Apenas o ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Verifica se um arquivo está acessível publicamente
 * @param fileId - ID do arquivo no Google Drive
 * @returns Promise<boolean>
 */
export async function checkFileAccess(fileId: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?key=${GOOGLE_DRIVE_API_KEY}&fields=id,name,mimeType`,
      { method: 'GET' }
    );
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Obtém metadados de um arquivo do Google Drive
 * @param fileId - ID do arquivo no Google Drive
 * @returns Metadados do arquivo ou null
 */
export async function getFileMetadata(fileId: string): Promise<{
  id: string;
  name: string;
  mimeType: string;
  size?: string;
} | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?key=${GOOGLE_DRIVE_API_KEY}&fields=id,name,mimeType,size`
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Componente de embed para vídeo
 */
export interface VideoEmbedProps {
  fileId: string;
  title?: string;
  className?: string;
}

/**
 * Componente de embed para PDF
 */
export interface PdfEmbedProps {
  fileId: string;
  title?: string;
  className?: string;
}

export default {
  getVideoEmbedUrl,
  getPdfEmbedUrl,
  getDownloadUrl,
  getOpenInDriveUrl,
  extractFileId,
  checkFileAccess,
  getFileMetadata,
};
