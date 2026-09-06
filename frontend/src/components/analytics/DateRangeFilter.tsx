import React, { useState } from 'react';
import { Calendar, Filter, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../ui/Button';

export type DatePreset = 'ALL' | 'TODAY' | 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'CUSTOM';

export interface DateRangeFilterProps {
  value?: { start_date?: string; end_date?: string };
  onChange: (range: { start_date?: string; end_date?: string }) => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value = {},
  onChange,
}) => {
  const { t } = useLanguage();

  const [activePreset, setActivePreset] = useState<DatePreset>('ALL');
  const [customStart, setCustomStart] = useState(value.start_date || '');
  const [customEnd, setCustomEnd] = useState(value.end_date || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  const handlePresetSelect = (preset: DatePreset) => {
    setActivePreset(preset);
    setValidationError(null);

    const now = new Date();
    if (preset === 'ALL') {
      setCustomStart('');
      setCustomEnd('');
      onChange({ start_date: undefined, end_date: undefined });
    } else if (preset === 'TODAY') {
      const todayStr = formatDate(now);
      setCustomStart(todayStr);
      setCustomEnd(todayStr);
      onChange({ start_date: todayStr, end_date: todayStr });
    } else if (preset === 'LAST_7_DAYS') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      const startStr = formatDate(past7);
      const endStr = formatDate(now);
      setCustomStart(startStr);
      setCustomEnd(endStr);
      onChange({ start_date: startStr, end_date: endStr });
    } else if (preset === 'LAST_30_DAYS') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      const startStr = formatDate(past30);
      const endStr = formatDate(now);
      setCustomStart(startStr);
      setCustomEnd(endStr);
      onChange({ start_date: startStr, end_date: endStr });
    } else if (preset === 'CUSTOM') {
      // Keep inputs open for user selection
    }
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd && customStart > customEnd) {
      setValidationError(t.analytics.invalidRange);
      return;
    }
    setValidationError(null);
    onChange({
      start_date: customStart || undefined,
      end_date: customEnd || undefined,
    });
  };

  const handleReset = () => {
    handlePresetSelect('ALL');
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
      {/* Top Header & Presets */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>{t.analytics.dateFilter}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePresetSelect('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreset === 'ALL'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {t.analytics.presetAll}
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('TODAY')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreset === 'TODAY'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {t.analytics.presetToday}
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('LAST_7_DAYS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreset === 'LAST_7_DAYS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {t.analytics.preset7Days}
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('LAST_30_DAYS')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreset === 'LAST_30_DAYS'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {t.analytics.preset30Days}
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect('CUSTOM')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activePreset === 'CUSTOM'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
            }`}
          >
            {t.analytics.presetCustom}
          </button>

          {activePreset !== 'ALL' && (
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
              title={t.analytics.resetFilter}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Picker Inputs */}
      {activePreset === 'CUSTOM' && (
        <form onSubmit={handleApplyCustom} className="pt-3 border-t border-slate-200 space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {t.analytics.startDate}
              </label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono shadow-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {t.analytics.endDate}
              </label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full bg-white text-xs text-slate-900 rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono shadow-xs"
              />
            </div>
          </div>

          {validationError && (
            <p className="text-[11px] text-rose-700 bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 font-medium">
              {validationError}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="submit" variant="primary" size="sm">
              {t.analytics.applyFilter}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
