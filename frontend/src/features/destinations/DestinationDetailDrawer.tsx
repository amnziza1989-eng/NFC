import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link2, ExternalLink, Check, Globe } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Drawer } from '../../components/ui/Drawer';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { EntityStatus, UpdateDestinationRequest, Destination, Business } from '../../types/api';

export interface DestinationDetailDrawerProps {
  destinationId: string | null;
  onClose: () => void;
}

export const DestinationDetailDrawer: React.FC<DestinationDetailDrawerProps> = ({
  destinationId,
  onClose,
}) => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [url, setUrl] = useState('');
  const [type, setType] = useState('GOOGLE_REVIEW');
  const [status, setStatus] = useState<EntityStatus>('ACTIVE');
  const [formError, setFormError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Queries
  const { data: destinations, isLoading: isDestLoading } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => api.listDestinations({ limit: 100 }),
  });

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => api.listBusinesses(),
  });

  const destination = destinations?.find((d: Destination) => d.id === destinationId);
  const business = businesses?.find((b: Business) => b.id === destination?.business_id);

  // Sync form state
  useEffect(() => {
    if (destination) {
      setUrl(destination.url);
      setType(destination.type);
      setStatus(destination.status);
      setFormError(null);
      setSaveSuccess(false);
    }
  }, [destination]);

  // Mutation
  const updateMutation = useMutation({
    mutationFn: (data: UpdateDestinationRequest) => {
      if (!destinationId) throw new Error('Destination ID missing');
      return api.updateDestination(destinationId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['cardInfo'] });
      queryClient.invalidateQueries({ queryKey: ['cardProvisioning'] });
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
    if (!url.trim()) {
      setFormError('آدرس لینک مقصد الزامی است');
      return;
    }

    try {
      const parsed = new URL(url.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setFormError('آدرس باید با http:// یا https:// شروع شود');
        return;
      }
    } catch {
      setFormError('آدرس اینترنتی وارد شده نامعتبر است');
      return;
    }

    setFormError(null);
    updateMutation.mutate({
      url: url.trim(),
      type,
      status,
    });
  };

  return (
    <Drawer
      isOpen={!!destinationId}
      onClose={onClose}
      title={t.destinations.title}
      subtitle={destination ? `شناسه مقصد: ${destination.id.substring(0, 8)}...` : undefined}
      maxWidth="lg"
    >
      {isDestLoading || !destination ? (
        <div className="py-16 text-center text-slate-400">{t.common.loading}</div>
      ) : (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Link2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {business ? business.name : 'کسب‌وکار ناشناس'}
                  </h3>
                  <span className="text-xs text-blue-700 font-mono font-bold">[{destination.type}]</span>
                </div>
              </div>
              <Badge variant={destination.status === 'ACTIVE' ? 'active' : 'disabled'}>
                {destination.status === 'ACTIVE' ? t.common.active : t.common.disabled}
              </Badge>
            </div>

            <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-mono truncate max-w-[240px]">{destination.url}</span>
              <a
                href={destination.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-bold shrink-0"
              >
                باز کردن
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                نوع مقصد
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs font-medium"
              >
                <option value="GOOGLE_REVIEW">ثبت نظر گوگل (Google Review)</option>
                <option value="INSTAGRAM">صفحه اینستاگرام (Instagram)</option>
                <option value="WEBSITE">وب‌سایت اختصاصی (Website)</option>
                <option value="CUSTOM_URL">لینک سفارشی (Custom URL)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                آدرس اینترنتی مقصد (URL) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-4 h-4" />
                </div>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://g.page/r/your-id/review"
                  dir="ltr"
                  className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 ps-10 pe-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono shadow-xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                وضعیت مقصد
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as EntityStatus)}
                className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs font-medium"
              >
                <option value="ACTIVE">{t.common.active}</option>
                <option value="DISABLED">{t.common.disabled}</option>
              </select>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {formError}
              </div>
            )}

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 font-semibold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>تغییرات مقصد با موفقیت ذخیره گردید.</span>
              </div>
            )}

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
        </div>
      )}
    </Drawer>
  );
};
