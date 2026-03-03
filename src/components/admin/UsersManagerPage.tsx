import { useState, useEffect } from 'react';
import { userService } from '../../services/firebase';
import { Card, Input, Button } from '../common';
import { Users, Search, Edit2, CheckCircle, Plus } from 'lucide-react';
import { clsx } from 'clsx';

export function UsersManagerPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    // Edit State
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [mode, setMode] = useState<'edit' | 'create'>('edit');
    const [formData, setFormData] = useState({
        displayName: '',
        email: '',
        password: '',
        role: 'student',
        expirationDate: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        const data = await userService.getAllUsers();
        // Sort logic (optional): sort by createdAt descending
        const sorted = data.sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
        setUsers(sorted);
        setFilteredUsers(sorted);
        setLoading(false);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const term = e.target.value.toLowerCase();
        setSearchTerm(term);
        const filtered = users.filter((u) =>
            u.displayName?.toLowerCase().includes(term) ||
            u.email?.toLowerCase().includes(term)
        );
        setFilteredUsers(filtered);
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);
        setMode('edit');
        setFormData({
            displayName: user.displayName || '',
            email: user.email || '',
            password: '',
            role: user.role || 'student',
            expirationDate: user.expirationDate || '',
        });
        setSuccessMsg('');
        setErrorMsg('');
    };

    const handleCreateClick = () => {
        setSelectedUser(null);
        setMode('create');
        setFormData({
            displayName: '',
            email: '',
            password: '',
            role: 'student',
            expirationDate: '',
        });
        setSuccessMsg('');
        setErrorMsg('');
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();

        setIsSaving(true);
        setSuccessMsg('');
        setErrorMsg('');

        try {
            if (mode === 'create') {
                if (!formData.password || formData.password.length < 6) {
                    throw new Error("A senha deve ter pelo menos 6 caracteres.");
                }
                await userService.adminCreateUser({
                    displayName: formData.displayName,
                    email: formData.email,
                    role: formData.role as 'student' | 'admin',
                    expirationDate: formData.expirationDate
                }, formData.password);

                setSuccessMsg(`Usuário ${formData.displayName} criado com sucesso!`);
                setFormData(prev => ({ ...prev, password: '' })); // clear password after creation
                await loadUsers(); // reload list
            } else {
                if (!selectedUser) return;
                await userService.updateUserAdmin(selectedUser.uid, {
                    displayName: formData.displayName,
                    email: formData.email, // Atualiza apenas display db
                    role: formData.role as 'student' | 'admin',
                    expirationDate: formData.expirationDate
                });

                setSuccessMsg(`Usuário ${formData.displayName} atualizado com sucesso!`);
                await loadUsers(); // reload list

                setSelectedUser({
                    ...selectedUser,
                    ...formData
                });
            }
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || "Erro ao salvar usuário");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6">

            {/* HEADER */}
            <div>
                <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                    <Users className="w-8 h-8 text-primary-400" />
                    Gerenciamento de Usuários
                </h1>
                <p className="text-secondary-400 mt-2">
                    Controle de acessos, papéis, permissões e status das contas cadastradas.
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">

                {/* LEFT LIST: ALL USERS */}
                <Card className="lg:col-span-1 p-4 flex flex-col h-[75vh]">
                    <div className="mb-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-secondary-100 flex items-center">
                                Total: {filteredUsers.length}
                            </h2>
                            <Button variant="primary" size="sm" onClick={handleCreateClick}>
                                <Plus className="w-4 h-4 mr-1" />
                                Novo
                            </Button>
                        </div>
                        <Input
                            icon={<Search className="w-4 h-4" />}
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                        {loading ? (
                            <div className="text-center py-10 text-secondary-500">Carregando usuários...</div>
                        ) : filteredUsers.length === 0 ? (
                            <div className="text-center py-10 text-secondary-500">Nenhum usuário encontrado.</div>
                        ) : (
                            filteredUsers.map(u => (
                                <div
                                    key={u.uid}
                                    onClick={() => handleEditClick(u)}
                                    className={clsx(
                                        "p-3 rounded-lg border cursor-pointer transition-all",
                                        selectedUser?.uid === u.uid
                                            ? "bg-primary-500/10 border-primary-500/50"
                                            : "bg-secondary-800 border-secondary-700 hover:border-secondary-600"
                                    )}
                                >
                                    <p className="text-sm font-medium text-secondary-100 truncate">{u.displayName || 'Sem Nome'}</p>
                                    <p className="text-xs text-secondary-400 truncate mt-0.5">{u.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className={clsx(
                                            "text-[10px] uppercase font-bold px-2 py-0.5 rounded flex items-center gap-1",
                                            u.role === 'admin' ? "bg-accent-emerald/20 text-accent-emerald" : "bg-secondary-700 text-secondary-300"
                                        )}>
                                            {u.role === 'admin' ? <CheckCircle className="w-3 h-3" /> : null}
                                            {u.role || 'student'}
                                        </span>
                                        {u.expirationDate && (
                                            <span className="text-[10px] bg-accent-amber/10 text-accent-amber border border-accent-amber/20 px-2 py-0.5 rounded">
                                                Expira: {new Date(u.expirationDate).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* RIGHT EDITOR */}
                <Card className="lg:col-span-2 p-6 flex flex-col h-[75vh]">
                    <h2 className="text-xl font-display font-bold text-white mb-6 flex items-center gap-2">
                        <Edit2 className="w-5 h-5 text-primary-400" />
                        {mode === 'create' ? 'Criar Novo Usuário' : 'Detalhes do Usuário'}
                    </h2>

                    {!selectedUser && mode === 'edit' ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-secondary-500">
                            <Users className="w-16 h-16 mb-4 opacity-20" />
                            <p>Selecione um usuário na lista ou crie um novo.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSaveUser} className="flex-1 overflow-y-auto pr-2 flex flex-col">

                            {successMsg && (
                                <div className="mb-6 p-4 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20 flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-accent-emerald shrink-0 mt-0.5" />
                                    <p className="text-sm text-accent-emerald">{successMsg}</p>
                                </div>
                            )}

                            {errorMsg && (
                                <div className="mb-6 p-4 rounded-lg bg-accent-rose/10 border border-accent-rose/20 flex items-start gap-3">
                                    <p className="text-sm text-accent-rose">{errorMsg}</p>
                                </div>
                            )}

                            <div className="space-y-6 flex-1">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <Input
                                            label="Nome Completo"
                                            name="displayName"
                                            value={formData.displayName}
                                            onChange={handleInputChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-span-2">
                                        <Input
                                            label="Email (Login/Firebase)"
                                            name="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            disabled={mode === 'edit'} // Pode ser read-only na edição
                                            required
                                        />
                                    </div>

                                    {mode === 'create' && (
                                        <div className="col-span-2">
                                            <Input
                                                label="Senha Provisória *"
                                                name="password"
                                                type="password"
                                                value={formData.password}
                                                onChange={handleInputChange}
                                                placeholder="Mín. 6 caracteres"
                                                required
                                            />
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-secondary-300">Tipo de Usuário</label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleInputChange}
                                            className="w-full bg-secondary-900 border border-secondary-700 text-secondary-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all appearance-none"
                                        >
                                            <option value="student">Aluno Padrão</option>
                                            <option value="associado">Associado (Premium)</option>
                                            <option value="admin">Super Usuário (Admin)</option>
                                        </select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-secondary-300">Data de Expiração do Acesso</label>
                                        <input
                                            type="date"
                                            name="expirationDate"
                                            value={formData.expirationDate}
                                            onChange={handleInputChange}
                                            className="w-full bg-secondary-900 border border-secondary-700 text-secondary-100 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all"
                                        />
                                    </div>
                                </div>

                                {mode === 'edit' && selectedUser && (
                                    <div className="p-4 bg-secondary-800/50 rounded-xl border border-secondary-700 mt-6">
                                        <h3 className="text-sm font-semibold text-secondary-200 mb-2">Informações do Sistema</h3>
                                        <div className="text-xs text-secondary-400 space-y-1">
                                            <p><strong>UID:</strong> {selectedUser.uid}</p>
                                            <p><strong>Criado em:</strong> {selectedUser.createdAt?.seconds ? new Date(selectedUser.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                                            <p><strong>Último Login:</strong> {selectedUser.lastLoginAt?.seconds ? new Date(selectedUser.lastLoginAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="pt-6 mt-6 border-t border-secondary-800 flex justify-end">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    disabled={isSaving}
                                >
                                    {isSaving ? 'Salvando...' : mode === 'create' ? 'Criar Usuário' : 'Salvar Perfil'}
                                </Button>
                            </div>

                        </form>
                    )}

                </Card>
            </div>

        </div>
    );
}
