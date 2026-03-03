// ============================================
// MAIN LAYOUT WITH SIDEBAR
// ============================================

import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  BookOpen,
  ClipboardList,
  Trophy,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Stethoscope,
  BrainCircuit,
  ChevronRight,
  Edit,
  Users,
  Database,
  Medal
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudy } from '../../contexts/StudyContext';
import { clsx } from 'clsx';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
}

function NavItem({ to, icon, label, badge, onClick }: NavItemProps) {
  return (
    <NavLink
      to={to}
      onClick={() => {
        // Executa o fechamento do menu imediatamente ao clicar
        if (onClick) {
          onClick();
        }
        // Garante que o scroll da página seja liberado caso tenha travado
        document.body.style.overflow = 'unset';
      }}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group',
          isActive
            ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
            : 'text-secondary-400 hover:text-secondary-200 hover:bg-secondary-800/50'
        )
      }
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="font-medium">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-primary-500 text-white">
          {badge}
        </span>
      )}
      <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
    </NavLink>
  );
}

export function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { srsStats } = useStudy();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    document.body.style.overflow = 'unset'; // Garante que a trava de scroll saia
  };

  const navItems = [
    { to: '/rankings', icon: <Medal className="w-5 h-5" />, label: 'Rankings', badge: undefined },
    { to: '/dashboard', icon: <Calendar className="w-5 h-5" />, label: 'Agenda', badge: undefined },
    { to: '/questoes', icon: <ClipboardList className="w-5 h-5" />, label: 'Questões', badge: undefined },
    { to: '/flashcards', icon: <BrainCircuit className="w-5 h-5" />, label: 'Flashcards', badge: srsStats.dueToday },
    { to: '/revisao', icon: <BookOpen className="w-5 h-5" />, label: 'Revisão SRS', badge: srsStats.dueToday },
    { to: '/simulado', icon: <Trophy className="w-5 h-5" />, label: 'Super Simu', badge: undefined },
    { to: '/desempenho', icon: <BarChart3 className="w-5 h-5" />, label: 'Desempenho', badge: undefined },
  ];

  return (
    <div className="min-h-screen bg-secondary-900 flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-72 bg-secondary-950/95 backdrop-blur-xl border-r border-secondary-800 flex flex-col transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="p-6 border-b border-secondary-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-display font-bold text-white">MedPrep</h1>
              <p className="text-xs text-secondary-500">Residência Médica</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.filter(item => {
            if (user?.role === 'student' && (item.to === '/dashboard' || item.to === '/revisao')) {
              return false;
            }
            return true;
          }).map((item) => (
            <NavItem
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              onClick={closeSidebar}
            />
          ))}

          {/* Admin Section */}
          {user?.role === 'admin' && (
            <div className="pt-6 pb-2">
              <p className="px-4 text-xs font-bold tracking-wider text-secondary-500 uppercase mb-2">
                Administração
              </p>
              <div className="space-y-1.5">
                <NavItem
                  to="/admin/schedule-editor"
                  icon={<Edit className="w-5 h-5 text-accent-emerald" />}
                  label="Trilha"
                  onClick={closeSidebar}
                />
                <NavItem
                  to="/admin/users"
                  icon={<Users className="w-5 h-5 text-primary-400" />}
                  label="Usuários"
                  onClick={closeSidebar}
                />
                <NavItem
                  to="/admin-import"
                  icon={<Database className="w-5 h-5 text-accent-amber" />}
                  label=" Questões"
                  onClick={closeSidebar}
                />
              </div>
            </div>
          )}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-secondary-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center">
              <span className="text-sm font-bold text-white">
                {user?.displayName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-secondary-200 truncate">
                {user?.displayName || 'Usuário'}
              </p>
              <p className="text-xs text-secondary-500 truncate">
                {user?.email}
              </p>
              {user?.expirationDate && (
                <p className="text-[10px] text-accent-amber mt-0.5 opacity-80 uppercase tracking-wide font-medium">
                  Acesso até: {new Date(user.expirationDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2 max-w-full overflow-x-auto pb-2 scrollbar-hide">
            <NavLink
              to="/configuracoes"
              onClick={closeSidebar}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary-800 text-secondary-400 hover:text-secondary-200 transition-colors whitespace-nowrap min-w-max"
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span className="text-sm">Config</span>
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-secondary-800 text-secondary-400 hover:text-accent-rose transition-colors whitespace-nowrap min-w-max"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-30 bg-secondary-900/95 backdrop-blur-xl border-b border-secondary-800 px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-secondary-400 hover:text-secondary-200 hover:bg-secondary-800"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary-500" />
              <span className="font-display font-bold text-white">MedPrep</span>
            </div>

            <div className="w-10" /> {/* Spacer for centering */}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8 overflow-auto">
          <Outlet />
        </div>
      </main>

      {/* Mobile sidebar close button */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={closeSidebar}
            className="fixed top-4 right-4 z-50 lg:hidden p-2 rounded-full bg-secondary-800 text-secondary-400"
          >
            <X className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default MainLayout;
