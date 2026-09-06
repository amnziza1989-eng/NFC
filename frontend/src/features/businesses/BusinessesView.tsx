import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Plus,
  Search,
  ExternalLink,
  BarChart3,
  Edit3,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { BusinessDetailDrawer } from './BusinessDetailDrawer';
import { Business } from '../../types/api';

export const BusinessesView: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newBizName, setNewBizName] = useState('');
  const [newBizLogo, setNewBizLogo] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Selected Business for Slide-over Detail Drawer
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  // Query businesses
  const { data: businesses, isLoading, isError } = useQuery({
    queryKey: ['businesses', searchTerm, statusFilter],
    queryFn: () =>
      api.listBusinesses({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  // Create Business Mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; logo_url?: string | null }) => api.createBusiness(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['businesses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      setIsCreateModalOpen(false);
      setNewBizName('');
      setNewBizLogo('');
      setCreateError(null);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBizName.trim()) {
      setCreateError('نام کسب‌وکار الزامی است');
      return;
    }
    if (newBizLogo.trim()) {
      try {
        const parsed = new URL(newBizLogo.trim());
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          setCreateError('آدرس لوگو باید با http:// یا https:// شروع شود');
          return;
        }
      } catch {
        setCreateError('آدرس اینترنتی وارد شده برای لوگو نامعتبر است');
        return;
      }
    }
    createMutation.mutate({
      name: newBizName.trim(),
      logo_url: newBizLogo.trim() || null,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.businesses.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.businesses.subtitle}</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
        >
          {t.businesses.createBtn}
        </Button>
      </div>

      {/* Filters Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-3 bg-white border-slate-200 shadow-sm">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute inset-y-0 start-3.5 my-auto text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.businesses.searchPlaceholder}
            className="w-full bg-slate-50 text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 ps-10 pe-4 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 text-sm text-slate-700 font-medium rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto transition-all"
        >
          <option value="">{t.businesses.allStatuses}</option>
          <option value="ACTIVE">فقط فعال</option>
          <option value="DISABLED">غیرفعال</option>
        </select>
      </Card>

      {/* Businesses Table */}
      <Card className="overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-start">{t.businesses.name}</th>
                <th className="py-3.5 px-4 text-start">{t.businesses.status}</th>
                <th className="py-3.5 px-4 text-start">{t.businesses.createdAt}</th>
                <th className="py-3.5 px-4 text-end">{t.businesses.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-rose-600">
                    {t.common.error}
                  </td>
                </tr>
              ) : businesses && businesses.length > 0 ? (
                businesses.map((biz: Business) => (
                  <tr
                    key={biz.id}
                    onClick={() => setSelectedBusinessId(biz.id)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {biz.logo_url ? (
                          <img
                            src={biz.logo_url}
                            alt={biz.name}
                            className="w-9 h-9 rounded-xl object-cover bg-slate-50 border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                            <Building2 className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900">{biz.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{biz.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={biz.status === 'ACTIVE' ? 'active' : 'disabled'}>
                        {biz.status === 'ACTIVE' ? t.common.active : t.common.disabled}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                      {new Date(biz.created_at).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3.5 px-4 text-end" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          title="مشاهده آمار و ویرایش"
                          icon={<BarChart3 className="w-4 h-4 text-slate-500 hover:text-blue-600" />}
                          onClick={() => setSelectedBusinessId(biz.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          title="ویرایش مشخصات"
                          icon={<Edit3 className="w-4 h-4 text-slate-500 hover:text-blue-600" />}
                          onClick={() => setSelectedBusinessId(biz.id)}
                        />
                        {biz.logo_url && (
                          <a
                            href={biz.logo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>{t.businesses.empty}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Business Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="ثبت کسب‌وکار جدید"
        subtitle="مشخصات اولیه برند یا فروشگاه را وارد نمایید"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              نام کسب‌وکار *
            </label>
            <input
              type="text"
              value={newBizName}
              onChange={(e) => setNewBizName(e.target.value)}
              placeholder="مثلاً کافه رستوران رویال"
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              آدرس اینترنتی لوگو (اختیاری)
            </label>
            <input
              type="url"
              value={newBizLogo}
              onChange={(e) => setNewBizLogo(e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono shadow-xs"
              dir="ltr"
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
              {t.businesses.createBtn}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Slide-over Detail Drawer */}
      <BusinessDetailDrawer
        businessId={selectedBusinessId}
        onClose={() => setSelectedBusinessId(null)}
      />
    </div>
  );
};
