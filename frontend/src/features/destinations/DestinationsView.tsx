import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Link2,
  Plus,
  ExternalLink,
  Building2,
  Edit3,
  Search,
  Copy,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { AsyncSelect } from '../../components/ui/AsyncSelect';
import { DestinationDetailDrawer } from './DestinationDetailDrawer';
import { Destination, Business } from '../../types/api';
import { DEST_TYPE_META } from '../orders/NewOrderWizard';

export const DestinationsView: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState('');
  const [destType, setDestType] = useState('GOOGLE_REVIEW');
  const [destUrl, setDestUrl] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Selected Destination for Slide-over Drawer
  const [selectedDestinationId, setSelectedDestinationId] = useState<string | null>(null);

  // Queries
  const { data: destinations = [], isLoading: isDestLoading } = useQuery({
    queryKey: ['destinations'],
    queryFn: () => api.listDestinations({ limit: 100 }),
  });

  const { data: businesses = [], isLoading: isBizLoading } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => api.listBusinesses({ limit: 100 }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: { business_id: string; type: string; url: string }) =>
      api.createDestination(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['destinations'] });
      setIsCreateModalOpen(false);
      setDestUrl('');
      setSelectedBizId('');
      setCreateError(null);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizId) {
      setCreateError('لطفاً یک کسب‌وکار را انتخاب کنید');
      return;
    }
    if (!destUrl.trim()) {
      setCreateError('آدرس مقصد الزامی است');
      return;
    }
    try {
      const parsed = new URL(destUrl.trim());
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setCreateError('آدرس مقصد باید با http:// یا https:// شروع شود');
        return;
      }
    } catch {
      setCreateError('آدرس اینترنتی وارد شده نامعتبر است');
      return;
    }

    createMutation.mutate({
      business_id: selectedBizId,
      type: destType,
      url: destUrl.trim(),
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Group destinations by business
  const businessMap = useMemo(() => {
    const map = new Map<string, Business>();
    businesses.forEach((b: Business) => map.set(b.id, b));
    return map;
  }, [businesses]);

  const groupedDestinations = useMemo(() => {
    const groups: { business: Business | { id: string; name: string }; destinations: Destination[] }[] = [];
    const destsByBiz = new Map<string, Destination[]>();

    destinations.forEach((dest: Destination) => {
      const list = destsByBiz.get(dest.business_id) || [];
      list.push(dest);
      destsByBiz.set(dest.business_id, list);
    });

    // Match each group with its business
    destsByBiz.forEach((dests, bizId) => {
      const biz = businessMap.get(bizId) || { id: bizId, name: `کسب‌وکار (${bizId.substring(0, 8)}...)` };
      
      // Filter if search term exists
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const bizMatch = biz.name.toLowerCase().includes(term);
        const matchedDests = dests.filter(d => 
          d.url.toLowerCase().includes(term) || 
          d.type.toLowerCase().includes(term) ||
          (DEST_TYPE_META[d.type]?.label || '').toLowerCase().includes(term)
        );
        if (bizMatch) {
          groups.push({ business: biz, destinations: dests });
        } else if (matchedDests.length > 0) {
          groups.push({ business: biz, destinations: matchedDests });
        }
      } else {
        groups.push({ business: biz, destinations: dests });
      }
    });

    // Also include businesses with 0 destinations if matching search
    if (searchTerm.trim()) {
      businesses.forEach((b: Business) => {
        if (!destsByBiz.has(b.id) && b.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          groups.push({ business: b, destinations: [] });
        }
      });
    }

    return groups;
  }, [destinations, businesses, businessMap, searchTerm]);

  const isLoading = isDestLoading || isBizLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.destinations.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">مدیریت لینک‌های هدف برای هر کسب‌وکار (دسته‌بندی شده به ازای هر کسب‌وکار)</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
        >
          {t.destinations.createBtn}
        </Button>
      </div>

      {/* Search Bar */}
      <Card className="p-4 bg-white border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute inset-y-0 start-3.5 my-auto text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی کسب‌وکار یا لینک مقصد..."
            className="w-full bg-slate-50 text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 ps-10 pe-4 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </Card>

      {/* Grouped Destinations List */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400">{t.common.loading}</div>
      ) : groupedDestinations.length === 0 ? (
        <Card className="p-12 text-center text-slate-400 bg-white border-slate-200">
          <Link2 className="w-10 h-10 mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium">{t.destinations.empty}</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-4"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            ایجاد اولین مقصد
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {groupedDestinations.map(({ business, destinations: dests }) => (
            <Card key={business.id} className="overflow-hidden bg-white border-slate-200 shadow-sm">
              {/* Business Header */}
              <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100/80 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span>🏢 {business.name}</span>
                      <span className="text-[11px] font-mono font-medium text-slate-400">({dests.length} مقصد فعال)</span>
                    </h2>
                    <p className="text-[10px] text-slate-400 font-mono">شناسه: {business.id}</p>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setSelectedBizId(business.id);
                    setCreateError(null);
                    setIsCreateModalOpen(true);
                  }}
                >
                  افزودن مقصد به این کسب‌وکار
                </Button>
              </div>

              {/* Destinations Table for this business */}
              {dests.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  هنوز مقصدی برای این کسب‌وکار ثبت نشده است.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {dests.map((dest: Destination) => {
                    const meta = DEST_TYPE_META[dest.type] || DEST_TYPE_META.CUSTOM_URL;
                    return (
                      <div
                        key={dest.id}
                        onClick={() => setSelectedDestinationId(dest.id)}
                        className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-2xl shrink-0 p-2 rounded-xl bg-slate-100 border border-slate-200">
                            {meta.emoji}
                          </span>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900">{meta.label}</span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                {dest.type}
                              </span>
                              <Badge variant={dest.status === 'ACTIVE' ? 'active' : 'disabled'}>
                                {dest.status === 'ACTIVE' ? t.common.active : t.common.disabled}
                              </Badge>
                            </div>
                            <p className="text-xs font-mono text-slate-600 truncate">{dest.url}</p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-center shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            title="کپی لینک مقصد"
                            icon={copiedId === dest.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            onClick={() => handleCopy(dest.url, dest.id)}
                          >
                            {copiedId === dest.id ? 'کپی شد' : 'کپی'}
                          </Button>

                          <a
                            href={dest.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors flex items-center justify-center"
                            title="تست باز کردن لینک"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <Button
                            variant="ghost"
                            size="sm"
                            title="ویرایش مشخصات مقصد"
                            icon={<Edit3 className="w-3.5 h-3.5 text-slate-600 hover:text-blue-600" />}
                            onClick={() => setSelectedDestinationId(dest.id)}
                          >
                            ویرایش
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Create Destination Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="تعریف مقصد هدایت جدید"
        subtitle="لینک بازخورد مشتریان (مانند گوگل ریویو یا اینستاگرام) را وارد نمایید"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              انتخاب کسب‌وکار *
            </label>
            <AsyncSelect<Business>
              value={selectedBizId}
              onChange={setSelectedBizId}
              queryKey="businessSearch"
              queryFn={async (search) => {
                const res = await api.listBusinesses({ search, limit: 10 });
                return res;
              }}
              getOptionLabel={(b) => b.name}
              getOptionValue={(b) => b.id}
              placeholder="جستجو و انتخاب کسب‌وکار..."
              searchPlaceholder="نام کسب‌وکار را تایپ کنید..."
              noOptionsText="کسب‌وکاری یافت نشد"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              نوع مقصد
            </label>
            <select
              value={destType}
              onChange={(e) => setDestType(e.target.value)}
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs font-medium"
            >
              <option value="GOOGLE_REVIEW">⭐ ثبت نظر گوگل (Google Review)</option>
              <option value="GOOGLE_MAPS">📍 گوگل مپس (Google Maps)</option>
              <option value="INSTAGRAM">📸 صفحه اینستاگرام (Instagram)</option>
              <option value="WEBSITE">🌐 وب‌سایت اختصاصی (Website)</option>
              <option value="WHATSAPP">💬 واتساپ پشتیبانی (WhatsApp)</option>
              <option value="CUSTOM_URL">🔗 لینک سفارشی (Custom URL)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              آدرس اینترنتی مقصد (URL) *
            </label>
            <input
              type="url"
              value={destUrl}
              onChange={(e) => setDestUrl(e.target.value)}
              placeholder="https://g.page/r/your-id/review"
              dir="ltr"
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono shadow-xs"
              required
            />
          </div>

          {createError && (
            <p className="text-xs text-rose-600 font-medium">{createError}</p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              {t.destinations.createBtn}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Slide-over Drawer for Destination Edit */}
      <DestinationDetailDrawer
        destinationId={selectedDestinationId}
        onClose={() => setSelectedDestinationId(null)}
      />
    </div>
  );
};
