import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type BadgeVariant = 
  | 'active' 
  | 'disabled' 
  | 'pending' 
  | 'info' 
  | 'qcPassed' 
  | 'qcIncomplete' 
  | 'untested';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  dot = true,
  className,
}) => {
  const variants: Record<BadgeVariant, { bg: string; text: string; border: string; dot: string }> = {
    active: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700 font-semibold',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    disabled: {
      bg: 'bg-rose-50',
      text: 'text-rose-700 font-semibold',
      border: 'border-rose-200',
      dot: 'bg-rose-500',
    },
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-700 font-semibold',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    info: {
      bg: 'bg-blue-50',
      text: 'text-blue-700 font-semibold',
      border: 'border-blue-200',
      dot: 'bg-blue-600',
    },
    qcPassed: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-800 font-bold',
      border: 'border-emerald-300',
      dot: 'bg-emerald-600',
    },
    qcIncomplete: {
      bg: 'bg-amber-50',
      text: 'text-amber-800 font-bold',
      border: 'border-amber-300',
      dot: 'bg-amber-600',
    },
    untested: {
      bg: 'bg-slate-100',
      text: 'text-slate-600 font-medium',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const style = variants[variant] || variants.info;

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border tracking-wide select-none',
          style.bg,
          style.text,
          style.border,
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full', style.dot)} />}
      {children}
    </span>
  );
};
