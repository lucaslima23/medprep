import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/firebase';
import { Card, Button } from '../common';
import { Settings, Lock, CheckCircle, AlertCircle, Mail } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useAuth();
    const [isResetting, setIsResetting] = useState(false);
    const [resetMsg, setResetMsg] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handlePasswordReset = async () => {
        if (!user?.email) return;

        setIsResetting(true);
        setResetMsg('');
        setErrorMsg('');

        try {
            await authService.resetPassword(user.email);
            setResetMsg(`Um e-mail de redefinição de senha foi enviado para ${user.email}. Por favor, verifique sua caixa de entrada.`);
        } catch (err: any) {
            console.error(err);
            setErrorMsg(err.message || 'Erro ao tentar enviar o e-mail de redefinição.');
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div>
                <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-primary-400" />
                    Configurações
                </h1>
                <p className="text-secondary-400 mt-2">
                    Gerencie os dados da sua conta e preferências do sistema.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-800">
                        <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Sua Conta</h2>
                            <p className="text-sm text-secondary-400">Dados do perfil atual logado</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-secondary-500 uppercase font-bold tracking-wider">Nome</label>
                            <p className="text-secondary-100 font-medium">{user?.displayName}</p>
                        </div>
                        <div>
                            <label className="text-xs text-secondary-500 uppercase font-bold tracking-wider">E-mail</label>
                            <p className="text-secondary-100 font-medium">{user?.email}</p>
                        </div>
                        <div>
                            <label className="text-xs text-secondary-500 uppercase font-bold tracking-wider">Tipo de Acesso</label>
                            <p className="text-secondary-100 font-medium uppercase text-sm">
                                {user?.role === 'admin' ? 'Administrador Pleno' : 'Estudante'}
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-secondary-800">
                        <div className="w-10 h-10 rounded-full bg-accent-amber/20 flex items-center justify-center">
                            <Lock className="w-5 h-5 text-accent-amber" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">Segurança</h2>
                            <p className="text-sm text-secondary-400">Proteger sua conta MedPrep</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <p className="text-sm text-secondary-300">
                            Caso você tenha esquecido ou simplesmente queira alterar sua senha atual, use o botão abaixo para enviarmos um link seguro ao seu e-mail cadastrado.
                        </p>

                        {resetMsg && (
                            <div className="p-3 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-accent-emerald shrink-0 mt-0.5" />
                                <p className="text-sm text-accent-emerald">{resetMsg}</p>
                            </div>
                        )}

                        {errorMsg && (
                            <div className="p-3 rounded-lg bg-accent-rose/10 border border-accent-rose/20 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-accent-rose shrink-0 mt-0.5" />
                                <p className="text-sm text-accent-rose">{errorMsg}</p>
                            </div>
                        )}

                        <Button
                            variant="secondary"
                            className="w-full mt-4 border-accent-amber/50 text-accent-amber hover:bg-accent-amber/10"
                            onClick={handlePasswordReset}
                            disabled={isResetting}
                        >
                            <Lock className="w-4 h-4 mr-2" />
                            {isResetting ? 'Enviando...' : 'Alterar Minha Senha'}
                        </Button>
                    </div>
                </Card>
            </div>

        </div>
    );
}
