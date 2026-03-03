// ============================================
// REVIEW PAGE - FULL TRACK LIST
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, FileText, Search, Library, BrainCircuit, ClipboardList } from 'lucide-react';
import { Card, LoadingScreen, Button } from '../common';
import { scheduleService } from '../../services/firebase';
import { SUBJECT_COLORS, SUBJECT_LABELS, MedicalSubject } from '../../types';
import { getVideoEmbedUrl, getPdfEmbedUrl } from '../../services/googleDrive';

// Reusing from Dashboard
function VideoPlayer({ videoId, title }: { videoId: string; title: string }) {
    return (
        <Card className="overflow-hidden">
            <div className="aspect-video w-full bg-secondary-800">
                <iframe
                    src={getVideoEmbedUrl(videoId)}
                    title={title}
                    className="w-full h-full"
                    allow="autoplay; encrypted-media"
                    allowFullScreen
                />
            </div>
            <div className="p-4 border-t border-secondary-700">
                <div className="flex items-center gap-2 text-secondary-400">
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Vídeo-aula</span>
                </div>
                <h4 className="font-medium text-secondary-200 mt-1">{title}</h4>
            </div>
        </Card>
    );
}

function PdfViewer({ pdfId, title }: { pdfId: string; title: string }) {
    const [isExpanded, setIsExpanded] = useState(false);
    return (
        <Card className="overflow-hidden">
            <div className={`w-full bg-secondary-800 transition-all duration-300 ${isExpanded ? 'h-[600px]' : 'h-64'}`}>
                <iframe
                    src={getPdfEmbedUrl(pdfId)}
                    title={title}
                    className="w-full h-full"
                />
            </div>
            <div className="p-4 border-t border-secondary-700 flex items-center justify-between">
                <div className="flex items-center gap-2 text-secondary-400">
                    <FileText className="w-4 h-4" />
                    <span className="text-sm">Apostila PDF</span>
                </div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="px-3 py-1 bg-secondary-700 text-sm rounded hover:bg-secondary-600 transition"
                >
                    {isExpanded ? 'Recolher' : 'Expandir'}
                </button>
            </div>
        </Card>
    );
}

export default function ReviewPage() {
    const navigate = useNavigate();
    const [contents, setContents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeItem, setActiveItem] = useState<any | null>(null);

    useEffect(() => {
        const fetchContents = async () => {
            try {
                const data = await scheduleService.getMetaContents();
                setContents(data);
            } catch (err) {
                console.error('Erro ao carregar trilha', err);
            } finally {
                setLoading(false);
            }
        };
        fetchContents();
    }, []);

    const filteredContents = contents.filter(c =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <LoadingScreen />;

    return (
        <div className="min-h-screen bg-secondary-900 pb-20">
            <div className="p-6 max-w-7xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-secondary-100 flex items-center gap-2">
                            <Library className="w-6 h-6 text-primary-500" />
                            Acervo Completo (Trilha ENARE)
                        </h1>
                        <p className="text-secondary-400 mt-1">Estude qualquer conteúdo extra independentemente do seu cronograma.</p>
                    </div>
                </div>

                {/* Mídia em exibição */}
                {activeItem && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Visualizando: {activeItem.title}</h2>
                            <button
                                onClick={() => setActiveItem(null)}
                                className="text-secondary-400 hover:text-white"
                            >
                                Fechar Painel
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {(activeItem.driveVideos && activeItem.driveVideos.length > 0) ? (
                                <div className="space-y-4">
                                    {activeItem.driveVideos.map((v: any, idx: number) => (
                                        <VideoPlayer key={idx} videoId={v.id} title={v.title || activeItem.title} />
                                    ))}
                                </div>
                            ) : (activeItem.driveVideoId) ? (
                                <VideoPlayer videoId={activeItem.driveVideoId} title={activeItem.title} />
                            ) : (
                                <Card className="flex items-center justify-center h-40 text-secondary-500">Nenhum vídeo cadastrado.</Card>
                            )}

                            {(activeItem.driveDocs && activeItem.driveDocs.length > 0) ? (
                                <div className="space-y-4">
                                    {activeItem.driveDocs.map((d: any, idx: number) => (
                                        <PdfViewer key={idx} pdfId={d.id} title={d.title || activeItem.title} />
                                    ))}
                                </div>
                            ) : (activeItem.driveDocId) ? (
                                <PdfViewer pdfId={activeItem.driveDocId} title={activeItem.title} />
                            ) : (
                                <Card className="flex items-center justify-center h-40 text-secondary-500">Nenhuma apostila cadastrada.</Card>
                            )}
                        </div>

                        {/* Estudo Ativo Buttons */}
                        <div className="mt-8 pt-6 border-t border-secondary-800 flex flex-col items-center">
                            <p className="text-sm text-secondary-400 mb-4 font-medium uppercase tracking-wider">Fixe o aprendizado com Estudo Ativo</p>
                            <div className="flex gap-4">
                                <Button
                                    variant="secondary"
                                    className="flex items-center gap-2"
                                    onClick={() => navigate(`/flashcards?subject=${activeItem.subject}`)}
                                >
                                    <BrainCircuit className="w-4 h-4" /> Flashcards
                                </Button>
                                <Button
                                    variant="primary"
                                    className="flex items-center gap-2"
                                    onClick={() => navigate(`/questoes?subject=${activeItem.subject}`)}
                                >
                                    <ClipboardList className="w-5 h-5" /> Fazer Questões
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Busca e Listagem */}
                <Card className="p-4 flex items-center gap-3">
                    <Search className="w-5 h-5 text-secondary-500" />
                    <input
                        type="text"
                        placeholder="Buscar assunto ou área..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="flex-1 bg-transparent border-none text-secondary-100 placeholder:text-secondary-600 focus:ring-0 px-0"
                    />
                </Card>

                {/* Conteúdos */}
                <div className="flex flex-col gap-3">
                    {filteredContents.map((content) => {
                        const subjectColor = SUBJECT_COLORS[content.subject as MedicalSubject] || '#64748b';
                        const subjectLabel = SUBJECT_LABELS[content.subject as MedicalSubject] || 'Geral';

                        return (
                            <Card
                                key={content.id}
                                className="p-4 hover:border-primary-500/50 transition-colors cursor-pointer"
                            >
                                <div className="flex flex-col md:flex-row md:items-center gap-4" onClick={() => setActiveItem(content)}>
                                    <div className="flex items-center gap-3 md:w-48 shrink-0">
                                        {content.week && (
                                            <span className="text-sm font-bold text-secondary-200 bg-secondary-800 px-3 py-1.5 rounded-md border border-secondary-700">
                                                Semana {content.week}
                                            </span>
                                        )}
                                        <span
                                            className="text-xs px-2 py-1 rounded font-medium"
                                            style={{ backgroundColor: `${subjectColor}20`, color: subjectColor }}
                                        >
                                            {subjectLabel}
                                        </span>
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-secondary-100 font-medium leading-snug">{content.title}</h3>
                                        {content.type && <p className="text-sm text-secondary-500 capitalize">{content.type}</p>}
                                    </div>

                                    <div className="flex justify-end items-center gap-4 text-secondary-500 shrink-0">
                                        <span className="text-xs flex items-center gap-1">
                                            <Play className="w-4 h-4" /> {(content.driveVideos?.length > 0 || content.driveVideoId) ? 'Vídeo' : '---'}
                                        </span>
                                        <span className="text-xs flex items-center gap-1">
                                            <FileText className="w-4 h-4" /> {(content.driveDocs?.length > 0 || content.driveDocId) ? 'PDF' : '---'}
                                        </span>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                </div>
            </div>
        </div>
    );
}
