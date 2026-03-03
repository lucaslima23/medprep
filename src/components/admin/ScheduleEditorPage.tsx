// ============================================
// ADMIN TRACK EDITOR PAGE
// ============================================

import React, { useState, useEffect } from 'react';

import {
    Plus,
    Save,
    Trash2,
    AlertCircle,
    FileText,
    Play,
    GripVertical
} from 'lucide-react';
import { Card, Button, Input } from '../common';
import { scheduleService } from '../../services/firebase';
import { SUBJECT_LABELS, MedicalSubject } from '../../types';
import { clsx } from 'clsx';

export function ScheduleEditorPage() {
    const [contents, setContents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [formData, setFormData] = useState<any>({
        title: '',
        subject: 'clinica',
        type: 'teoria',
        week: 1,
        order: 0,
        driveVideos: [],
        driveDocs: []
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadContents = async () => {
        try {
            setLoading(true);
            const data = await scheduleService.getMetaContents();
            // Sort by order safely using any to bypass strict type
            data.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
            setContents(data);
        } catch (err) {
            console.error('Error loading contents:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadContents();
    }, []);

    const handleSelectItem = (item: any) => {
        setSelectedItem(item);
        setFormData({
            title: item.title || '',
            subject: item.subject || 'clinica',
            type: item.type || 'teoria',
            week: item.week || 1,
            order: item.order || 0,
            driveVideos: item.driveVideos ? [...item.driveVideos] : (item.driveVideoId ? [{ id: item.driveVideoId, title: 'Vídeo Principal' }] : []),
            driveDocs: item.driveDocs ? [...item.driveDocs] : (item.driveDocId ? [{ id: item.driveDocId, title: 'Apostila Principal' }] : []),
        });
        setError('');
        setSuccess('');
    };

    const handleCreateNew = () => {
        setSelectedItem(null);
        const lastItem = contents[contents.length - 1];
        setFormData({
            title: '',
            subject: 'clinica',
            type: 'teoria',
            week: lastItem ? (lastItem.week || 1) : 1,
            order: lastItem ? (lastItem.order || 0) + 1 : 1,
            driveVideos: [],
            driveDocs: []
        });
        setError('');
        setSuccess('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev: any) => ({
            ...prev,
            [name]: name === 'week' || name === 'order' ? Number(value) : value
        }));
    };

    const handleAddVideo = () => {
        setFormData((prev: any) => ({ ...prev, driveVideos: [...(prev.driveVideos || []), { id: '', title: '' }] }));
    };

    const handleRemoveVideo = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            driveVideos: prev.driveVideos.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleUpdateVideo = (index: number, field: string, value: string) => {
        setFormData((prev: any) => {
            const newVideos = [...prev.driveVideos];
            newVideos[index] = { ...newVideos[index], [field]: value };
            return { ...prev, driveVideos: newVideos };
        });
    };

    const handleAddDoc = () => {
        setFormData((prev: any) => ({ ...prev, driveDocs: [...(prev.driveDocs || []), { id: '', title: '' }] }));
    };

    const handleRemoveDoc = (index: number) => {
        setFormData((prev: any) => ({
            ...prev,
            driveDocs: prev.driveDocs.filter((_: any, i: number) => i !== index)
        }));
    };

    const handleUpdateDoc = (index: number, field: string, value: string) => {
        setFormData((prev: any) => {
            const newDocs = [...prev.driveDocs];
            newDocs[index] = { ...newDocs[index], [field]: value };
            return { ...prev, driveDocs: newDocs };
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title) {
            setError('O título é obrigatório.');
            return;
        }

        try {
            setIsSaving(true);
            setError('');
            setSuccess('');

            const payload = {
                ...formData,
                driveVideoId: null, // Clear legacy values inside database
                driveDocId: null
            };

            if (selectedItem) {
                // Update
                await scheduleService.updateMetaContent(selectedItem.id, payload);
                setSuccess('Tópico atualizado com sucesso!');
            } else {
                // Create
                await scheduleService.addMetaContent(payload);
                setSuccess('Novo tópico criado com sucesso!');
            }

            await loadContents(); // Reload list

            // Keep selected state if it was an edit
            if (!selectedItem) {
                handleCreateNew();
            }

        } catch (err) {
            console.error('Save error', err);
            setError('Erro ao salvar as informações.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedItem) return;
        const confirm = window.confirm(`Tem certeza que deseja excluir "${selectedItem.title}"? Esta ação não pode ser desfeita.`);
        if (!confirm) return;

        try {
            setIsSaving(true);
            await scheduleService.deleteMetaContent(selectedItem.id);
            setSuccess('Tópico excluído!');
            setSelectedItem(null);
            await loadContents();
        } catch (err) {
            console.error('Delete error', err);
            setError('Erro ao excluir tópico.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-display font-bold text-white">Editor da Trilha</h1>
                <p className="text-secondary-400 mt-2">
                    Crie, edite e reorganize os tópicos, vídeo-aulas e PDFs da Trilha ENARE.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: LIST */}
                <Card className="lg:col-span-1 p-4 flex flex-col h-[75vh]">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-secondary-100 flex items-center gap-2">
                            Tópicos ({contents.length})
                        </h2>
                        <Button variant="primary" size="sm" onClick={handleCreateNew}>
                            <Plus className="w-4 h-4 mr-1" />
                            Novo
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {loading ? (
                            <div className="text-center py-10 text-secondary-500">Carregando...</div>
                        ) : (
                            contents.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => handleSelectItem(item)}
                                    className={clsx(
                                        "p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3",
                                        selectedItem?.id === item.id
                                            ? "bg-primary-500/10 border-primary-500/50"
                                            : "bg-secondary-800 border-secondary-700 hover:border-secondary-600"
                                    )}
                                >
                                    <div className="text-secondary-500 mt-0.5"><GripVertical className="w-4 h-4" /></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-secondary-200 truncate">{item.title}</p>
                                        <div className="flex gap-2 mt-1 text-xs">
                                            <span className="text-primary-400">Semana {item.week}</span>
                                            <span className="text-secondary-500 truncate">{SUBJECT_LABELS[item.subject as MedicalSubject] || item.subject}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* RIGHT COLUMN: EDITOR FORM */}
                {/* RIGHT COLUMN: EDITOR FORM */}
                <Card className="lg:col-span-2 p-6 flex flex-col h-[75vh]">
                    <h2 className="text-xl font-display font-bold text-white mb-6">
                        {selectedItem ? 'Editar Tópico' : 'Criar Novo Tópico'}
                    </h2>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg bg-accent-rose/10 border border-accent-rose/20 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-accent-rose shrink-0 mt-0.5" />
                            <p className="text-sm text-accent-rose">{error}</p>
                        </div>
                    )}

                    {success && (
                        <div className="mb-6 p-4 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-accent-emerald shrink-0 mt-0.5" />
                            <p className="text-sm text-accent-emerald">{success}</p>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6 flex-1 overflow-y-auto pr-2">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Input
                                    label="Título do Módulo/Aula *"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-secondary-300">Matéria</label>
                                <select
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleInputChange}
                                    className="w-full bg-secondary-900 border border-secondary-700 text-secondary-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none"
                                >
                                    {Object.entries(SUBJECT_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-secondary-300">Tipo de Atividade</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleInputChange}
                                    className="w-full bg-secondary-900 border border-secondary-700 text-secondary-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none"
                                >
                                    <option value="teoria">Teoria</option>
                                    <option value="pratica">Prática / Questões</option>
                                    <option value="revisao">Revisão</option>
                                </select>
                            </div>

                            <Input
                                label="Semana Indicada"
                                name="week"
                                type="number"
                                min="1"
                                value={formData.week}
                                onChange={handleInputChange}
                                required
                            />

                            <Input
                                label="Ordem na Trilha (ID interno)"
                                name="order"
                                type="number"
                                value={formData.order}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="border-t border-secondary-800 pt-6 space-y-6">

                            {/* Videos Section */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-secondary-300">Vídeo-Aulas (Google Drive)</h3>
                                    <Button type="button" variant="ghost" size="sm" onClick={handleAddVideo} className="h-8 text-xs border border-secondary-700">
                                        <Plus className="w-3 h-3 mr-1" /> Adicionar Vídeo
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {formData.driveVideos?.map((v: any, index: number) => (
                                        <div key={`video-${index}`} className="flex items-start gap-2 bg-secondary-800/50 p-3 rounded-lg border border-secondary-700">
                                            <div className="flex-1 space-y-3">
                                                <Input
                                                    placeholder="Título do Vídeo (ex: Parte 1)"
                                                    value={v.title}
                                                    onChange={(e) => handleUpdateVideo(index, 'title', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Google Drive View ID (ex: 1aBc3...)"
                                                    value={v.id}
                                                    onChange={(e) => handleUpdateVideo(index, 'id', e.target.value)}
                                                    icon={<Play className="w-4 h-4" />}
                                                />
                                            </div>
                                            <Button type="button" variant="danger" className="mt-1 shrink-0 h-11 w-11 p-0 flex items-center justify-center" onClick={() => handleRemoveVideo(index)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!formData.driveVideos || formData.driveVideos.length === 0) && (
                                        <p className="text-sm text-secondary-500 text-center py-3 bg-secondary-900/50 rounded-lg border border-secondary-800 border-dashed">Nenhum vídeo adicionado.</p>
                                    )}
                                </div>
                            </div>

                            {/* Docs Section */}
                            <div className="pt-4 border-t border-secondary-800/50">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-medium text-secondary-300">Apostilas PDF (Google Drive)</h3>
                                    <Button type="button" variant="ghost" size="sm" onClick={handleAddDoc} className="h-8 text-xs border border-secondary-700">
                                        <Plus className="w-3 h-3 mr-1" /> Adicionar PDF
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    {formData.driveDocs?.map((d: any, index: number) => (
                                        <div key={`doc-${index}`} className="flex items-start gap-2 bg-secondary-800/50 p-3 rounded-lg border border-secondary-700">
                                            <div className="flex-1 space-y-3">
                                                <Input
                                                    placeholder="Título do PDF (ex: Apostila Principal)"
                                                    value={d.title}
                                                    onChange={(e) => handleUpdateDoc(index, 'title', e.target.value)}
                                                />
                                                <Input
                                                    placeholder="Google Drive View ID (ex: 1xYz2...)"
                                                    value={d.id}
                                                    onChange={(e) => handleUpdateDoc(index, 'id', e.target.value)}
                                                    icon={<FileText className="w-4 h-4" />}
                                                />
                                            </div>
                                            <Button type="button" variant="danger" className="mt-1 shrink-0 h-11 w-11 p-0 flex items-center justify-center" onClick={() => handleRemoveDoc(index)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!formData.driveDocs || formData.driveDocs.length === 0) && (
                                        <p className="text-sm text-secondary-500 text-center py-3 bg-secondary-900/50 rounded-lg border border-secondary-800 border-dashed">Nenhum PDF adicionado.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>

                    <div className="border-t border-secondary-800 pt-4 mt-6 flex items-center justify-between">
                        {selectedItem ? (
                            <Button
                                type="button"
                                variant="danger"
                                onClick={handleDelete}
                                disabled={isSaving}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Excluir Tópico
                            </Button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        <Button
                            type="submit"
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default ScheduleEditorPage;
