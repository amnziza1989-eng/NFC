import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Package,
  Plus,
  Search,
  Building2,
  Radio,
  QrCode,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Card as CardUI } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { OrderDetailDrawer } from './OrderDetailDrawer';
import { NewOrderWizard } from './NewOrderWizard';
import { Order, Business, OrderStatus } from '../../types/api';

export const OrdersView: React.FC = () => {
  const { t } = useLanguage();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Selected Order for Slide-over Drawer
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Queries
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['orders', searchTerm, statusFilter],
    queryFn: () =>
      api.listOrders({
        search: searchTerm || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: businesses } = useQuery({
    queryKey: ['businesses'],
    queryFn: () => api.listBusinesses({ limit: 200 }),
  });

  const getOrderStatusBadge = (status: OrderStatus): { variant: BadgeVariant; label: string } => {
    switch (status) {
      case 'CREATED':
        return { variant: 'untested', label: t.orders.statusCreated };
      case 'CARDS_GENERATED':
        return { variant: 'active', label: t.orders.statusGenerated };
      case 'PROVISIONING':
        return { variant: 'active', label: t.orders.statusProvisioning };
      case 'QC_PENDING':
        return { variant: 'qcIncomplete', label: t.orders.statusQcPending };
      case 'COMPLETED':
        return { variant: 'qcPassed', label: t.orders.statusCompleted };
      case 'CANCELLED':
        return { variant: 'disabled', label: t.orders.statusCancelled };
      default:
        return { variant: 'untested', label: status };
    }
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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.orders.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t.orders.subtitle}</p>
        </div>
        <Button
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setIsWizardOpen(true)}
        >
          {t.orders.createBtn}
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
            placeholder={t.orders.searchPlaceholder}
            className="w-full bg-slate-50 text-sm text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 ps-10 pe-4 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-50 text-sm text-slate-700 font-medium rounded-xl border border-slate-200 px-3.5 py-2 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 w-full sm:w-auto transition-all"
        >
          <option value="">{t.orders.allStatuses}</option>
          <option value="CREATED">{t.orders.statusCreated}</option>
          <option value="CARDS_GENERATED">{t.orders.statusGenerated}</option>
          <option value="PROVISIONING">{t.orders.statusProvisioning}</option>
          <option value="QC_PENDING">{t.orders.statusQcPending}</option>
          <option value="COMPLETED">{t.orders.statusCompleted}</option>
          <option value="CANCELLED">{t.orders.statusCancelled}</option>
        </select>
      </CardUI>

      {/* Orders Table */}
      <CardUI className="overflow-hidden bg-white border-slate-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4 text-start">{t.orders.orderNumber}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.business}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.productType}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.quantity}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.status}</th>
                <th className="py-3.5 px-4 text-start">{t.orders.createdAt}</th>
                <th className="py-3.5 px-4 text-end">{t.orders.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {t.common.loading}
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-rose-600">
                    {t.common.error}
                  </td>
                </tr>
              ) : orders && orders.length > 0 ? (
                orders.map((ord: Order) => {
                  const statusBadge = getOrderStatusBadge(ord.status);
                  const isNfcOnly = ord.product_type === 'NFC_ONLY';
                  const hasCards = ord.cards_generated_count > 0;
                  return (
                    <tr
                      key={ord.id}
                      onClick={() => setSelectedOrderId(ord.id)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                            {ord.order_number}
                          </span>
                          {!hasCards && (
                            <span className="text-[10px] text-amber-600 font-bold flex items-center gap-1 ps-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                              کارت تولید نشده
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-bold text-slate-900">{getBusinessName(ord.business_id)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {isNfcOnly ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold flex items-center gap-1">
                              <Radio className="w-3 h-3" />
                              📡 NFC
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold flex items-center gap-1">
                              <QrCode className="w-3 h-3" />
                              📡 NFC + ▣ QR
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${
                          hasCards
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-amber-700 bg-amber-50 border-amber-200'
                        }`}>
                          {ord.cards_generated_count} / {ord.quantity}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {new Date(ord.created_at).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="py-3.5 px-4 text-end">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(ord.id);
                          }}
                        >
                          {t.orders.generatedCards}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Package className="w-10 h-10 text-slate-200" />
                      <p className="text-sm">{t.orders.empty}</p>
                      <Button
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => setIsWizardOpen(true)}
                      >
                        ثبت اولین سفارش
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardUI>

      {/* New Order Wizard Modal */}
      <NewOrderWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onOrderCreated={(orderId) => {
          setIsWizardOpen(false);
          setSelectedOrderId(orderId);
        }}
      />

      {/* Slide-over Drawer for Order Details */}
      <OrderDetailDrawer
        orderId={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
      />
    </div>
  );
};
