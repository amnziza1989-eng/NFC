import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Radio,
  QrCode,
  Sparkles,
  Download,
  Copy,
  Check,
  Building2,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Card as CardUI } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge';
import { Card, CardProvisioning } from '../../types/api';

export const QCFulfillmentView: React.FC = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Queries
  const { data: cards, isLoading: isCardsLoading } = useQuery({
    queryKey: ['cards'],
    queryFn: () => api.listCards({ limit: 100 }),
  });

  const { data: provisioning, isLoading: isProvLoading } = useQuery({
    queryKey: ['cardProvisioning', selectedCardId],
    queryFn: () => (selectedCardId ? api.getCardProvisioning(selectedCardId) : null),
    enabled: !!selectedCardId,
  });

  // Auto-select first card if none selected
  React.useEffect(() => {
    if (cards && cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards, selectedCardId]);

  // QC Update Mutation
  const qcMutation = useMutation({
    mutationFn: (data: { id: string; updates: { qc_nfc_tested?: boolean; qc_qr_tested?: boolean; qc_destination_verified?: boolean } }) =>
      api.updateCard(data.id, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cardProvisioning', selectedCardId] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orderReconciliation'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardOverview'] });
    },
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const getQcBadge = (card: Card | CardProvisioning): { variant: BadgeVariant; label: string } => {
    const passed = card.qc_nfc_tested && card.qc_qr_tested && card.qc_destination_verified;
    const partial = card.qc_nfc_tested || card.qc_qr_tested || card.qc_destination_verified;
    if (passed) return { variant: 'qcPassed', label: t.common.qcPassed };
    if (partial) return { variant: 'qcIncomplete', label: t.common.qcIncomplete };
    return { variant: 'untested', label: t.common.untested };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{t.qc.title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{t.qc.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Card Selector */}
        <CardUI className="p-4 space-y-3 lg:col-span-1 overflow-hidden flex flex-col h-[680px] bg-white border-slate-200 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              {t.qc.selectCard}
            </h3>
            <span className="text-xs text-slate-400 font-mono">{cards?.length ?? 0} کارت</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pe-1">
            {isCardsLoading ? (
              <div className="py-8 text-center text-xs text-slate-400">{t.common.loading}</div>
            ) : cards && cards.length > 0 ? (
              cards.map((c) => {
                const qc = getQcBadge(c);
                const isSelected = c.id === selectedCardId;
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedCardId(c.id)}
                    className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600/20 shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm font-bold text-slate-900">{c.code}</span>
                      <Badge variant={qc.variant}>{qc.label}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                      ID: {c.id.substring(0, 8)}...
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">کارتی برای بازرسی وجود ندارد</div>
            )}
          </div>
        </CardUI>

        {/* Right column: Fulfillment Workbench */}
        <CardUI className="p-6 lg:col-span-2 space-y-6 bg-white border-slate-200 shadow-sm">
          {isProvLoading || !provisioning ? (
            <div className="py-16 text-center text-slate-400">{t.common.loading}</div>
          ) : (
            <>
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                      کارت: {provisioning.card_code}
                    </span>
                    <Badge variant={getQcBadge(provisioning).variant}>
                      {getQcBadge(provisioning).label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span className="font-bold text-slate-800">{provisioning.business.name}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-blue-700 font-mono font-bold">[{provisioning.destination.type}]</span>
                  </div>
                </div>
                <a
                  href={provisioning.destination.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors font-mono max-w-xs truncate font-bold"
                >
                  <span className="truncate">{provisioning.destination.url}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>

              {/* Hardware Encoding Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* NFC Writer Payload */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Radio className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">{t.qc.nfcUrlBadge}</h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    این آدرس را با نرم‌افزار NFC Tools روی چیپ NTAG213 رایت کنید:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={provisioning.nfc_url}
                      className="w-full bg-white text-xs font-mono text-slate-900 rounded-xl border border-slate-300 px-3 py-2 select-all shadow-xs"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleCopy(provisioning.nfc_url, 'nfc')}
                      icon={copiedKey === 'nfc' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    >
                      {copiedKey === 'nfc' ? t.cards.copySuccess : t.common.copy}
                    </Button>
                  </div>
                </div>

                {/* QR Visual Code */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                  <div className="flex items-center gap-2 text-blue-700">
                    <QrCode className="w-4 h-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">{t.qc.qrCodeBadge}</h4>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 rounded-2xl bg-white p-2 border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                      <img
                        src={provisioning.qr_image_url}
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-slate-500">تصویر پویا و رزولوشن بالا برای چاپ روی بدنه کارت</p>
                      <a
                        href={provisioning.qr_image_url}
                        download={`card-${provisioning.card_code}-qr.png`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="secondary" size="sm" icon={<Download className="w-3.5 h-3.5" />}>
                          {t.qc.downloadQR}
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* QC Interactive Checklist */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    چک‌لیست آزمایش سخت‌افزاری (Quality Control)
                  </h4>
                  <span className="text-xs text-slate-500">تغییر وضعیت آنی ذخیره می‌شود</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Test 1: NFC Tap */}
                  <div
                    onClick={() =>
                      qcMutation.mutate({
                        id: provisioning.card_id,
                        updates: { qc_nfc_tested: !provisioning.qc_nfc_tested },
                      })
                    }
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      provisioning.qc_nfc_tested
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Radio className="w-5 h-5 text-blue-600" />
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          provisioning.qc_nfc_tested
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {provisioning.qc_nfc_tested && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-xs font-bold">{t.qc.nfcTested}</span>
                  </div>

                  {/* Test 2: QR Scan */}
                  <div
                    onClick={() =>
                      qcMutation.mutate({
                        id: provisioning.card_id,
                        updates: { qc_qr_tested: !provisioning.qc_qr_tested },
                      })
                    }
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      provisioning.qc_qr_tested
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <QrCode className="w-5 h-5 text-blue-600" />
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          provisioning.qc_qr_tested
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {provisioning.qc_qr_tested && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-xs font-bold">{t.qc.qrTested}</span>
                  </div>

                  {/* Test 3: Destination Verified */}
                  <div
                    onClick={() =>
                      qcMutation.mutate({
                        id: provisioning.card_id,
                        updates: { qc_destination_verified: !provisioning.qc_destination_verified },
                      })
                    }
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      provisioning.qc_destination_verified
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <CheckCircle2 className="w-5 h-5 text-blue-600" />
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                          provisioning.qc_destination_verified
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {provisioning.qc_destination_verified && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                    <span className="text-xs font-bold">{t.qc.destinationVerified}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardUI>
      </div>
    </div>
  );
};
