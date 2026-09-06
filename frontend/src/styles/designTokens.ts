/**
 * TapNow Design System Tokens
 * Defines semantic tokens for status, surfaces, and interactive states.
 */

export const DESIGN_TOKENS = {
  colors: {
    surface: {
      base: 'bg-surface-0',
      panel: 'bg-surface-1',
      card: 'bg-surface-2',
      elevated: 'bg-surface-3',
      border: 'border-white/10',
      borderSubtle: 'border-white/5',
      borderHighlight: 'border-brand-500/40',
    },
    brand: {
      primary: 'text-brand-500',
      primaryBg: 'bg-brand-500',
      primaryHover: 'hover:bg-brand-600',
      glow: 'shadow-glow-emerald',
    },
    status: {
      active: {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-400',
      },
      disabled: {
        bg: 'bg-rose-500/10',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
        dot: 'bg-rose-400',
      },
      pending: {
        bg: 'bg-amber-500/10',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
      },
      info: {
        bg: 'bg-cyan-500/10',
        text: 'text-cyan-400',
        border: 'border-cyan-500/30',
        dot: 'bg-cyan-400',
      },
      qcPassed: {
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-300',
        border: 'border-emerald-500/40',
        dot: 'bg-emerald-400',
      },
      qcIncomplete: {
        bg: 'bg-amber-500/15',
        text: 'text-amber-300',
        border: 'border-amber-500/40',
        dot: 'bg-amber-400',
      },
      untested: {
        bg: 'bg-slate-500/15',
        text: 'text-slate-400',
        border: 'border-slate-500/30',
        dot: 'bg-slate-400',
      },
    },
  },
  typography: {
    pageTitle: 'text-2xl font-bold tracking-tight text-white',
    sectionTitle: 'text-lg font-semibold text-slate-100',
    cardTitle: 'text-sm font-medium text-slate-400 uppercase tracking-wider',
    body: 'text-sm text-slate-300',
    metadata: 'text-xs text-slate-500',
    numberLg: 'text-3xl font-extrabold text-white tracking-tight',
  },
  transitions: {
    default: 'transition-all duration-200 ease-in-out',
    fast: 'transition-all duration-150 ease-out',
  },
} as const;
