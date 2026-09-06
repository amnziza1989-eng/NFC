import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, BarChart3, Edit3, Check, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { DateRangeFilter } from '../../components/analytics/DateRangeFilter';
import { AnalyticsCharts } from '../../components/analytics/AnalyticsCharts';
import { EntityStatus, UpdateBusinessRequest } from '../../types/api';

export interface BusinessDetailDrawerProps {
  businessId: string | null;
  onClose: () => void;
}

export const BusinessDetailDrawer: React.FC<BusinessDetailDrawerProps> = ({
  businessId,
  onClose,
}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'analytics' | 'edit'>('analytics');
  const [dateRange, setDateRange] = useState<{ start_date?: string; end_date?: string }>({});

  // Form State
  const [name, setName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [status, setStatus] = useState<EntityStatus>('ACTIVE');
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Queries
  const { data: business, isLoading: isBizLoading } = useQuery({
    queryKey: ['business', businessId],
    queryFn: () => (businessId ? api.getBusiness(businessId) : null),
    enabled: !!businessId,
  });

  const { data: analytics, isLoading: isAnalyticsLoading, isError: isAnalyticsError } = useQuery({
    queryKey: ['businessAnalytics', businessId, dateRange],
    queryFn: () => (businessId ? api.getBusinessAnalytics(businessId, dateRange) : null),
    enabled: !!businessId,
  });

  // Sync form state when business data loads
  useEffect(() => {
    if (business) {
      setName(business.name);
      setLogoUrl(business.logo_url || '');
      setStatus(business.status);
      setFormError(null);
      setSaveSuccess(false);
    }
  }, [business]);

  // Edit Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateBusinessRequest) => {
      if (!businessId) throw new Error('Business ID missing');
      return api.updateBusiness(businessId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business', businessId] });
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      setSaveSuccess(true);
      setFormError(null);
      setTimeout(() => setSaveSuccess(false), 2500);
    },
    onError: (err: Error) => {
      setFormError(err.message);
      setSaveSuccess(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('نام کسب‌وکار الزامی است');
      return;
    }

    if (logoUrl.trim()) {
      try {
        const parsed = new URL(logoUrl.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setFormError('آدرس لوگو باید با http:// یا https:// شروع شود');
          return;
        }
      } catch {
        setFormError('آدرس اینترنتی لوگو نامعتبر است');
        return;
      }
    }

    setFormError(null);
    updateMutation.mutate({
      name: name.trim(),
      logo_url: logoUrl.trim() || null,
      status: status,
    });
  };

  return (
    <Drawer
      isOpen={!!businessId}
      onClose={onClose}
      title={business?.name || t.businesses.title}
      subtitle={business ? `شناسه: ${business.id}` : undefined}
      maxWidth="2xl"
    >
      {isBizLoading || !business ? (
        <div className="py-16 text-center text-slate-400">{t.common.loading}</div>
      ) : (
        <div className="space-y-6">
          {/* Business Header Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {business.logo_url ? (
                <img
                  src={business.logo_url}
                  alt={business.name}
                  className="w-12 h-12 rounded-xl object-cover bg-white border border-slate-200 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-base">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-slate-900 text-base">{business.name}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  ثبت شده در: {new Date(business.created_at).toLocaleDateString('fa-IR')}
                </p>
              </div>
            </div>
            <Badge variant={business.status === 'ACTIVE' ? 'active' : 'disabled'}>
              {business.status === 'ACTIVE' ? t.common.active : t.common.disabled}
            </Badge>
          </div>

          {/* Tabs Selector */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>آمار و تحلیل تعاملات</span>
            </button>
            <button
              onClick={() => setActiveTab('edit')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Edit3 className="w-4 h-4 text-blue-600" />
              <span>ویرایش مشخصات</span>
            </button>
          </div>

          {/* TAB 1: ANALYTICS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Date Filter */}
              <DateRangeFilter value={dateRange} onChange={setDateRange} />

              {/* Charts & Metric Breakdown */}
              <AnalyticsCharts
                total={analytics?.total ?? 0}
                nfc={analytics?.nfc ?? 0}
                qr={analytics?.qr ?? 0}
                recent={analytics?.recent ?? []}
                isLoading={isAnalyticsLoading}
                isError={isAnalyticsError}
              />
            </div>
          )}

          {/* TAB 2: EDIT FORM */}
          {activeTab === 'edit' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  نام کسب‌وکار / فروشگاه <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
                  required
                />
              </div>

              {/* Logo URL Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  آدرس تصویر لوگو (URL)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                    <Globe className="w-4 h-4" />
                  </div>
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    dir="ltr"
                    className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 ps-10 pe-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono shadow-xs"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  وضعیت فعالیت
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as EntityStatus)}
                  className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs font-medium"
                >
                  <option value="ACTIVE">{t.common.active} (تپ‌ها و اسکن‌ها مجازند)</option>
                  <option value="DISABLED">{t.common.disabled} (عدم هدایت به مقصد)</option>
                </select>
              </div>

              {/* Feedback banners */}
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>تغییرات با موفقیت ذخیره شد.</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200">
                <Button variant="ghost" onClick={onClose}>
                  {t.common.close}
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  isLoading={updateMutation.isPending}
                >
                  {t.common.save}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Drawer>
  );
};
