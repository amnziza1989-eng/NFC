import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Plus,
  Search,
  Building2,
  Power,
  BarChart3,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Card as CardUI } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { CardDetailDrawer } from './CardDetailDrawer';
import { Card, Business, Destination } from '../../types/api';

export const CardsView: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState('');
  const [selectedDestId, setSelectedDestId] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Selected Card for Slide-over Drawer
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Queries
  const { data: cards, isLoading, isError } = useQuery({
    queryKey: ['cards', searchTerm, statusFilter],
    queryFn: () =>
      api.listCards({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => api.listBusinesses(),
  });

  const { data: destinations } = useQuery({
    queryKey: ['destinations', selectedBizId],
    queryFn: () =>
      api.listDestinations({
        business_id: selectedBizId || undefined,
      }),
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: { business_id: string; destination_id: string }) => api.createCard(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
      setIsCreateModalOpen(false);
      setSelectedBizId('');
      setSelectedDestId('');
      setCreateError(null);
    },
    onError: (err: Error) => {
      setCreateError(err.message);
    },
  });

  // Toggle Status Mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, newStatus }: { id: string; newStatus: 'ACTIVE' | 'DISABLED' }) =>
      api.updateCard(id, { status: newStatus }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['cardInfo'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBizId || !selectedDestId) {
      setCreateError('انتخاب کسب‌وکار و مقصد الزامی است');
      return;
    }
    createMutation.mutate({
      business_id: selectedBizId,
      destination_id: selectedDestId,
    });
  };

  const getQcBadge = (card: Card): { variant: BadgeVariant; label: string } => {
    const passed = card.qc_nfc_tested && card.qc_qr_tested && card.qc_destination_verified;
    const partial = card.qc_nfc_tested || card.qc_qr_tested || card.qc_destination_verified;
    if (passed) return { variant: 'qcPassed', label: t.common.qcPassed };
    if (partial) return { variant: 'qcIncomplete', label: t.common.qcIncomplete };
    return { variant: 'untested', label: t.common.untested };
  };

  const getBusinessName = (bizId: string) => {
    const biz = businesses?.find((b: Business) => b.id === bizId);
    return biz ? biz.name : `${bizId.substring(0, 8)}...`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.cards.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.cards.subtitle}</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            setCreateError(null);
            setIsCreateModalOpen(true);
          }}
        >
          {t.cards.createBtn}
        </Button>
      </div>

      {/* Filters Bar */}
      <CardUI className="p-4 flex flex-col sm:flex-row items-center gap-3 bg-white border-slate-200 shadow-sm">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 absolute inset-y-0 start-3.5 my-auto text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.cards.searchPlaceholder}
            className="w-full bg-slate-50 text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 ps-10 pe-4 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 text-sm text-slate-700 font-medium rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto transition-all"
        >
          <option value="">{t.orders.allStatuses}</option>
          <option value="ACTIVE">{t.common.active}</option>
          <option value="DISABLED">{t.common.disabled}</option>
        </select>
      </CardUI>

      {/* Cards Table */}
      <CardUI className="overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-start">{t.cards.code}</th>
                <th className="py-3.5 px-4 text-start">{t.cards.business}</th>
                <th className="py-3.5 px-4 text-start">{t.cards.status}</th>
                <th className="py-3.5 px-4 text-start">{t.cards.qcStatus}</th>
                <th className="py-3.5 px-4 text-start">{t.businesses.createdAt}</th>
                <th className="py-3.5 px-4 text-end">{t.cards.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-rose-600">
                    {t.common.error}
                  </td>
                </tr>
              ) : cards && cards.length > 0 ? (
                cards.map((c: Card) => {
                  const qc = getQcBadge(c);
                  return (
                    <tr
                      key={c.id}
                      onClick={() => setSelectedCardId(c.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-sm font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          {c.code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-900">{getBusinessName(c.business_id)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={c.status === 'ACTIVE' ? 'active' : 'disabled'}>
                          {c.status === 'ACTIVE' ? t.common.active : t.common.disabled}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={qc.variant}>{qc.label}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {new Date(c.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="py-3.5 px-4 text-end" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="مشاهده مشخصات و آمار"
                            icon={<BarChart3 className="w-4 h-4 text-slate-500 hover:text-blue-600" />}
                            onClick={() => setSelectedCardId(c.id)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            title={c.status === 'ACTIVE' ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                            icon={
                              <Power
                                className={`w-4 h-4 ${
                                  c.status === 'ACTIVE'
                                    ? 'text-emerald-600 hover:text-rose-600'
                                    : 'text-slate-400 hover:text-emerald-600'
                                }`}
                              />
                            }
                            onClick={() =>
                              toggleStatusMutation.mutate({
                                id: c.id,
                                newStatus: c.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
                              })
                            }
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p>{t.cards.empty}</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardUI>

      {/* Create Card Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="صدور کارت سخت‌افزاری جدید"
        subtitle="کارت به صورت پیش‌فرض فعال بوده و آماده تست QC می‌باشد"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              انتخاب کسب‌وکار *
            </label>
            <select
              value={selectedBizId}
              onChange={(e) => {
                setSelectedBizId(e.target.value);
                setSelectedDestId('');
              }}
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs"
              required
            >
              <option value="">-- یک کسب‌وکار را انتخاب کنید --</option>
              {businesses?.map((b: Business) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              انتخاب مقصد هدایت پیش‌فرض *
            </label>
            <select
              value={selectedDestId}
              onChange={(e) => setSelectedDestId(e.target.value)}
              disabled={!selectedBizId}
              className="w-full bg-white text-slate-900 text-sm rounded-xl border border-slate-300 px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-xs disabled:opacity-50 disabled:bg-slate-50"
              required
            >
              <option value="">
                {selectedBizId ? '-- یک مقصد را انتخاب کنید --' : 'ابتدا کسب‌وکار را انتخاب فرمایید'}
              </option>
              {destinations?.map((d: Destination) => (
                <option key={d.id} value={d.id}>
                  [{d.type}] {d.url}
                </option>
              ))}
            </select>
          </div>

          {createError && (
            <p className="text-xs text-rose-600 font-medium">{createError}</p>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              {t.common.cancel}
            </Button>
            <Button variant="primary" type="submit" isLoading={createMutation.isPending}>
              {t.cards.createBtn}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Slide-over Drawer for Card Detail */}
      <CardDetailDrawer
        cardId={selectedCardId}
        onClose={() => setSelectedCardId(null)}
      />
    </div>
  );
};
