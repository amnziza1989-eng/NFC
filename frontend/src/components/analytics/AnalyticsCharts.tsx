import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Radio, QrCode, Activity, Sparkles } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { CardEvent } from '../../types/api';

export interface AnalyticsChartsProps {
  total: number;
  nfc: number;
  qr: number;
  recent?: CardEvent[];
  isLoading?: boolean;
  isError?: boolean;
}

const COLORS = ['#2563eb', '#6366f1']; // TapNow Blue (NFC) and Indigo (QR)

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  total,
  nfc,
  qr,
  recent = [],
  isLoading = false,
  isError = false,
}) => {
  const { t, isRtl } = useLanguage();

  if (isLoading) {
    return (
      <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 animate-pulse">
        {t.common.loading}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-6 text-center text-xs text-rose-700 bg-rose-50 rounded-2xl border border-rose-200 font-medium">
        {t.common.error}
      </div>
    );
  }

  const nfcPct = total > 0 ? Math.round((nfc / total) * 100) : 0;
  const qrPct = total > 0 ? Math.round((qr / total) * 100) : 0;

  const chartData = [
    { name: t.dashboard.nfcEvents, value: nfc },
    { name: t.dashboard.qrEvents, value: qr },
  ];

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>{t.analytics.totalInteractions}</span>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono">{total.toLocaleString('fa-IR')}</p>
        </div>

        {/* NFC */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-blue-200 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-700 text-xs font-bold">
            <Radio className="w-3.5 h-3.5" />
            <span>{t.dashboard.nfcEvents}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-black text-blue-700 font-mono">{nfc.toLocaleString('fa-IR')}</p>
            <span className="text-[11px] text-blue-600 font-bold font-mono">{nfcPct}%</span>
          </div>
        </div>

        {/* QR */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-indigo-200 space-y-1">
          <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold">
            <QrCode className="w-3.5 h-3.5" />
            <span>{t.dashboard.qrEvents}</span>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-xl font-black text-indigo-700 font-mono">{qr.toLocaleString('fa-IR')}</p>
            <span className="text-[11px] text-indigo-600 font-bold font-mono">{qrPct}%</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      {total > 0 ? (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            {t.analytics.distributionChart}
          </h4>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '12px',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    direction: isRtl ? 'rtl' : 'ltr',
                  }}
                  itemStyle={{ color: '#0f172a', fontWeight: 600 }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => <span className="text-xs text-slate-700 font-bold">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <Activity className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-xs text-slate-500 font-medium">{t.analytics.noDataPeriod}</p>
        </div>
      )}

      {/* Recent Events Feed */}
      {recent && recent.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t.analytics.recentEvents} ({recent.length} رویداد اخیر)
          </h4>
          <div className="max-h-48 overflow-y-auto divide-y divide-slate-200/80">
            {recent.map((evt) => (
              <div key={evt.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                      evt.type === 'NFC'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    }`}
                  >
                    {evt.type}
                  </span>
                  <span className="text-slate-600 font-mono text-[11px] max-w-[200px] truncate">
                    {evt.user_agent ? evt.user_agent.substring(0, 30) + '...' : 'Unknown Browser'}
                  </span>
                </div>
                <span className="text-slate-400 font-mono text-[11px]">
                  {new Date(evt.created_at).toLocaleTimeString('fa-IR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
