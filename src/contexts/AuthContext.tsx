// ============================================
// AUTH CONTEXT
// Gerenciamento de estado de autenticação
// ============================================
/* eslint-disable react-refresh/only-export-components */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode
} from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { authService, userService } from '../services/firebase';
import { User } from '../types';

const checkIsExpired = (dateString?: string): boolean => {
  if (!dateString) return false;
  try {
    const parts = dateString.split(/[-/]/);
    let expDate = new Date(dateString);
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 23, 59, 59, 999);
      } else if (parts[2].length === 4) {
        // DD/MM/YYYY
        expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 23, 59, 59, 999);
      }
    } else {
      expDate.setHours(23, 59, 59, 999);
    }
    if (isNaN(expDate.getTime())) return false;
    return new Date() > expDate;
  } catch {
    return false;
  }
};

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(async (fbUser) => {
      console.log('[AUTH] Auth state changed. fbUser:', fbUser?.email);
      setFirebaseUser(fbUser);

      if (fbUser) {
        try {
          // Buscar dados do usuário no Firestore
          console.log('[AUTH] Fetching user data from Firestore for:', fbUser.uid);
          const userData = await userService.getUser(fbUser.uid);
          console.log('[AUTH] User data result:', userData);
          console.log('[AUTH] User data is truthy:', !!userData);

          if (userData) {
            const userModel = userData as any as User;
            if (checkIsExpired(userModel.expirationDate)) {
              console.warn('[AUTH] User access has expired.', userModel.expirationDate);
              await authService.logout();
              setError('Seu acesso à plataforma expirou. Entre em contato com o suporte.');
              setFirebaseUser(null);
              setUser(null);
              setLoading(false);
              return;
            }

            console.log('[AUTH] Setting user:', userModel);
            setUser(userModel);
            // Atualizar último login
            await userService.updateLastLogin(fbUser.uid);
            console.log('[AUTH] Last login updated');
          } else {
            // Usuário não existe e não foi possível criar
            console.error('[AUTH] userData is null/undefined after getUser');
            setError('Falha ao carregar dados do usuário.');
            await authService.logout();
          }
        } catch (err) {
          console.error('[AUTH] Error loading user data:', err);
          setError('Erro ao carregar dados do usuário.');
        }
      } else {
        console.log('[AUTH] User logged out');
        setUser(null);
      }

      console.log('[AUTH] Setting loading to false');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const fbUser = await authService.login(email, password);

      // Security Check: Verify expiration BEFORE confirming login sequence
      const userData = await userService.getUser(fbUser.uid);
      if (userData) {
        const userModel = userData as any as User;
        if (checkIsExpired(userModel.expirationDate)) {
          await authService.logout(); // Kill the just-created session instantly
          throw new Error('Seu acesso à plataforma expirou. Entre em contato com o suporte.');
        }
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao fazer login';
      const firebaseError = err as { code?: string };

      if (firebaseError.code === 'auth/user-not-found') {
        setError('Usuário não encontrado.');
      } else if (firebaseError.code === 'auth/wrong-password') {
        setError('Senha incorreta.');
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError('Muitas tentativas. Tente novamente mais tarde.');
      } else {
        setError(errorMessage);
      }

      setLoading(false);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUser(null);
      setFirebaseUser(null);
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        error,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}

export default AuthContext;
