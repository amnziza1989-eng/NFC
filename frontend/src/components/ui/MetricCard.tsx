import React from 'react';
import { Card } from './Card';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    positive?: boolean;
  };
  accent?: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'blue';
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent = 'blue',
}) => {
  const accentBorders = {
    blue: 'border-s-4 border-s-blue-600',
    emerald: 'border-s-4 border-s-emerald-500',
    cyan: 'border-s-4 border-s-cyan-500',
    amber: 'border-s-4 border-s-amber-500',
    indigo: 'border-s-4 border-s-indigo-500',
  };

  const accentIcons = {
    blue: 'text-blue-600 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    cyan: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    amber: 'text-amber-600 bg-amber-50 border-amber-100',
    indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
  };

  return (
    <Card hoverable className={clsx('p-5 overflow-hidden relative bg-white border-slate-200/90 shadow-sm', accentBorders[accent])}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
            {trend && (
              <span
                className={clsx(
                  'text-xs font-bold px-2 py-0.5 rounded-full border',
                  trend.positive
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-rose-700 bg-rose-50 border-rose-200'
                )}
              >
                {trend.value}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-slate-400 pt-0.5">{subtitle}</p>}
        </div>
        <div className={clsx('p-3 rounded-xl border', accentIcons[accent])}>
          {icon}
        </div>
      </div>
    </Card>
  );
};
