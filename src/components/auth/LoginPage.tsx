// ============================================
// LOGIN PAGE COMPONENT
// ============================================

import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, AlertCircle, Stethoscope, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Input, Card } from '../common';
import { authService } from '../../services/firebase';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const { login, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLocalError('');
    setResetMsg('');

    if (!email || !password) {
      setLocalError('Preencha todos os campos.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      // Error is handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      setLocalError('Preencha seu e-mail para recuperar a senha.');
      return;
    }
    setLocalError('');
    setResetMsg('');
    setIsResetting(true);

    try {
      await authService.resetPassword(email);
      setResetMsg('E-mail de redefinição enviado! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setLocalError(err.message || 'Erro ao tentar enviar o e-mail de redefinição.');
    } finally {
      setIsResetting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-medical bg-mesh-pattern p-4">
      {/* Decorative elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="p-8" glow>
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-glow"
            >
              <Stethoscope className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-3xl font-display font-bold text-white mb-2">
              MedPrep
            </h1>
            <p className="text-secondary-400">
              Plataforma de Estudos para Residência Médica
            </p>
          </div>

          {/* Error Alert */}
          {displayError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-accent-rose flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent-rose">{displayError}</p>
            </motion.div>
          )}

          {/* Success Alert */}
          {resetMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 flex items-start gap-3"
            >
              <CheckCircle className="w-5 h-5 text-accent-emerald flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent-emerald">{resetMsg}</p>
            </motion.div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="w-5 h-5" />}
              autoComplete="email"
              disabled={isLoading}
            />

            <div>
              <Input
                label="Senha"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="w-5 h-5" />}
                autoComplete="current-password"
                disabled={isLoading}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={handleResetPassword}
                  disabled={isResetting || isLoading}
                  className="text-xs text-primary-400 hover:text-primary-300 font-medium transition-colors disabled:opacity-50"
                >
                  {isResetting ? 'Enviando...' : 'Esqueci minha senha'}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              loading={isLoading}
            >
              Entrar
            </Button>
          </form>

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-secondary-700">
            <p className="text-xs text-center text-secondary-500">
              Acesso restrito. Caso não possua conta,
              <br />entre em contato com o administrador.
            </p>
          </div>
        </Card>

        {/* Footer */}
        <p className="text-center text-xs text-secondary-600 mt-6">
          ENAMED • ENARE • Preparação para Residência Médica
        </p>
      </motion.div>
    </div>
  );
}

export default LoginPage;
