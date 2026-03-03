// ============================================
// COMMON UI COMPONENTS
// ============================================

import { ReactNode, ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

// ============================================
// BUTTON
// ============================================

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-secondary-900 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variants = {
      primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-glow hover:shadow-glow-lg focus:ring-primary-500',
      secondary: 'bg-secondary-700 hover:bg-secondary-600 text-secondary-100 border border-secondary-600 focus:ring-secondary-500',
      ghost: 'bg-transparent hover:bg-secondary-800 text-secondary-300 hover:text-secondary-100 focus:ring-secondary-500',
      danger: 'bg-accent-rose hover:bg-red-600 text-white focus:ring-red-500',
    };
    
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// CARD
// ============================================

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export function Card({ children, className, hover = false, glow = false }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-secondary-800/50 backdrop-blur-sm rounded-2xl border border-secondary-700/50',
        hover && 'hover:border-primary-500/50 hover:bg-secondary-800/70 transition-all duration-300',
        glow && 'shadow-glow',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================
// INPUT
// ============================================

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-secondary-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-secondary-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-secondary-800 border border-secondary-600 rounded-xl px-4 py-2.5',
              'text-secondary-100 placeholder-secondary-500',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
              'transition-all duration-200',
              icon && 'pl-10',
              error && 'border-accent-rose focus:ring-accent-rose',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-accent-rose">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// ============================================
// BADGE
// ============================================

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'default', size = 'sm', className }: BadgeProps) {
  const variants = {
    default: 'bg-secondary-700 text-secondary-200',
    success: 'bg-accent-emerald/20 text-accent-emerald',
    warning: 'bg-accent-amber/20 text-accent-amber',
    danger: 'bg-accent-rose/20 text-accent-rose',
    info: 'bg-accent-cyan/20 text-accent-cyan',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// ============================================
// PROGRESS BAR
// ============================================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  size = 'md', 
  color = 'bg-primary-500',
  showLabel = false,
  className 
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={clsx('w-full', className)}>
      <div className={clsx('w-full bg-secondary-700 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={clsx('h-full rounded-full transition-all duration-500 ease-out', color)}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <p className="mt-1 text-xs text-secondary-400 text-right">
          {Math.round(percentage)}%
        </p>
      )}
    </div>
  );
}

// ============================================
// LOADING SPINNER
// ============================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <Loader2 
      className={clsx(
        'animate-spin text-primary-500',
        sizes[size],
        className
      )} 
    />
  );
}

// ============================================
// LOADING SCREEN
// ============================================

export function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary-900">
      <div className="text-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-secondary-700 rounded-full animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
        <p className="mt-4 text-secondary-400 font-medium">Carregando...</p>
      </div>
    </div>
  );
}

// ============================================
// EMPTY STATE
// ============================================

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-secondary-800 flex items-center justify-center text-secondary-400 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-secondary-200 mb-1">{title}</h3>
      {description && (
        <p className="text-secondary-400 mb-4 max-w-sm">{description}</p>
      )}
      {action}
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  color?: string;
}

export function StatCard({ label, value, icon, trend, trendValue, color = 'text-primary-500' }: StatCardProps) {
  const trendColors = {
    up: 'text-accent-emerald',
    down: 'text-accent-rose',
    stable: 'text-secondary-400',
  };

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-secondary-400 mb-1">{label}</p>
          <p className={clsx('text-2xl font-bold', color)}>{value}</p>
          {trend && trendValue && (
            <p className={clsx('text-xs mt-1', trendColors[trend])}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'stable' && '→'}
              {' '}{trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx('p-2 rounded-lg bg-secondary-700/50', color)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
