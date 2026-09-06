import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Radio,
  QrCode,
  CreditCard,
  Building2,
  Plus,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Package,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { MetricCard } from '../../components/ui/MetricCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const DashboardOverview: React.FC = () => {
  const { t, language } = useLanguage();
  const isFa = language === 'fa';

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboardOverview'],
    queryFn: () => api.getDashboardOverview(),
  });

  const totalEvents = overview?.total_events ?? 0;
  const nfcEvents = overview?.nfc_events ?? 0;
  const qrEvents = overview?.qr_events ?? 0;
  const nfcPercent = totalEvents > 0 ? Math.round((nfcEvents / totalEvents) * 100) : 50;
  const qrPercent = totalEvents > 0 ? Math.round((qrEvents / totalEvents) * 100) : 50;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.dashboard.overviewTitle}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.dashboard.overviewSubtitle}</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/qc">
            <Button variant="secondary" size="sm" icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}>
              {t.dashboard.openQC}
            </Button>
          </Link>
          <Link to="/cards">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              {t.dashboard.issueCard}
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title={t.dashboard.totalEvents}
          value={isLoading ? '...' : totalEvents.toLocaleString()}
          subtitle="مجموع تپ‌ها و اسکن‌ها"
          icon={<Activity className="w-6 h-6" />}
          accent="blue"
        />
        <MetricCard
          title={t.dashboard.nfcEvents}
          value={isLoading ? '...' : nfcEvents.toLocaleString()}
          subtitle={`${nfcPercent}٪ از کل تعاملات`}
          icon={<Radio className="w-6 h-6" />}
          accent="cyan"
        />
        <MetricCard
          title={t.dashboard.qrEvents}
          value={isLoading ? '...' : qrEvents.toLocaleString()}
          subtitle={`${qrPercent}٪ از کل تعاملات`}
          icon={<QrCode className="w-6 h-6" />}
          accent="indigo"
        />
        <MetricCard
          title={t.dashboard.activeCards}
          value={isLoading ? '...' : `${overview?.active_cards ?? 0} / ${overview?.total_cards ?? 0}`}
          subtitle="کارت‌های فعال در گردش"
          icon={<CreditCard className="w-6 h-6" />}
          accent="amber"
        />
      </div>

      {/* Interaction Ratio & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interaction Ratio Breakdown */}
        <Card className="p-6 lg:col-span-2 space-y-5 bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.tapRatio}
            </h3>
            <span className="text-xs text-slate-400 font-mono">NFC vs QR Distribution</span>
          </div>

          <div className="space-y-3">
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${nfcPercent}%` }}
                className="bg-blue-600 transition-all duration-500"
              />
              <div
                style={{ width: `${qrPercent}%` }}
                className="bg-indigo-500 transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-xs font-bold">
              <div className="flex items-center gap-1.5 text-blue-700">
                <Radio className="w-3.5 h-3.5" />
                <span>NFC ({nfcPercent}٪)</span>
              </div>
              <div className="flex items-center gap-1.5 text-indigo-700">
                <QrCode className="w-3.5 h-3.5" />
                <span>QR Code ({qrPercent}٪)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs text-slate-500 font-medium">کسب‌وکارهای فعال</p>
              <p className="text-xl font-black text-slate-900 mt-1">
                {isLoading ? '...' : `${overview?.active_businesses ?? 0} از ${overview?.total_businesses ?? 0}`}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <p className="text-xs text-slate-500 font-medium">نرخ فعال بودن سخت‌افزار</p>
              <p className="text-xl font-black text-emerald-600 mt-1">
                {overview?.total_cards ? Math.round(((overview.active_cards) / overview.total_cards) * 100) : 100}٪
              </p>
            </div>
          </div>
        </Card>

        {/* Quick Action Navigation */}
        <Card className="p-6 space-y-4 bg-white border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-3">
            {t.dashboard.quickActions}
          </h3>
          <div className="space-y-2.5">
            <Link
              to="/orders"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-blue-50/80 hover:bg-blue-100/80 border border-blue-200 text-blue-900 transition-all group font-bold shadow-xs"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-black">{isFa ? '➕ ثبت سفارش کارت جدید' : 'New Physical Card Order'}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-blue-600 transition-colors" />
            </Link>

            <Link
              to="/businesses"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-all text-slate-700 hover:text-blue-900 group"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold">{t.dashboard.newBusiness}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link
              to="/destinations"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-all text-slate-700 hover:text-blue-900 group"
            >
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold">{t.dashboard.newDestination}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link
              to="/cards"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-all text-slate-700 hover:text-blue-900 group"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold">{t.dashboard.issueCard}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link
              to="/qc"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-all text-slate-700 hover:text-blue-900 group"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold">{t.dashboard.openQC}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link
              to="/shop-orders"
              className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200/80 hover:border-blue-200 transition-all text-slate-700 hover:text-blue-900 group"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold">{isFa ? 'سفارشات فروشگاه' : 'Shop Orders'}</span>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
            </Link>
          </div>
        </Card>
      </div>

      {isError && (
        <Card className="p-4 bg-rose-50 border-rose-200 text-rose-700 flex items-center justify-between">
          <p className="text-xs font-medium">{t.common.error} — عدم دسترسی به API پورت ۸۳۰۰</p>
          <Button variant="danger" size="sm" onClick={() => refetch()}>
            {t.common.retry}
          </Button>
        </Card>
      )}
    </div>
  );
};
