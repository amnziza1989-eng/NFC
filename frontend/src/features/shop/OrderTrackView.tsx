import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../../services/apiClient';
import { ShopOrderTrackResponse } from '../../types/api';
import {
  Search,
  Package,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  QrCode,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export const OrderTrackView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialOrderNum = searchParams.get('num') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderNum);
  const [verificationContact, setVerificationContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackData, setTrackData] = useState<ShopOrderTrackResponse | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim() || !verificationContact.trim()) {
      setError('لطفاً شماره سفارش و شماره تماس/ایمیل را وارد نمایید.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await api.trackShopOrder(orderNumber.trim(), verificationContact.trim());
      setTrackData(data);
    } catch (err: any) {
      setError(err.message || 'خطا در استعلام وضعیت سفارش.');
      setTrackData(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          سامانه امن استعلام و رهگیری وضعیت سفارش
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">پیگیری سفارش و بسته‌بندی</h1>
        <p className="text-slate-600 text-sm max-w-lg mx-auto leading-relaxed">
          جهت مشاهده وضعیت لحظه‌ای تولید، کنترل کیفیت سخت‌افزاری و ارسال پستی، شماره سفارش و شماره تماس خریدار را وارد نمایید.
        </p>
      </div>

      {/* Search Box */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        <form onSubmit={handleTrack} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شماره سفارش <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="مثال: SHOP-20260828-XXXX"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  dir="ltr"
                  className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono shadow-xs"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                شماره تماس یا ایمیل ثبت‌شده <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="مثال: 09121234567 یا user@example.com"
                value={verificationContact}
                onChange={(e) => setVerificationContact(e.target.value)}
                dir="ltr"
                className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all shadow-xs"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm shadow-blue-500/25 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>در حال استعلام...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>رهگیری و مشاهده جزئیات</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Track Result Display */}
      {trackData && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Top Status Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="space-y-1">
                <div className="text-xs text-slate-500 font-bold">شناسه رسمی سفارش</div>
                <div className="text-xl font-black text-slate-900 font-mono">{trackData.shop_order_number}</div>
              </div>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  {trackData.payment_status === 'MOCK_PAID' ? 'پرداخت تستی موفق (MOCK_PAID)' : 'پرداخت شده'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-700">
                  وضعیت: {trackData.status}
                </span>
              </div>
            </div>

            {/* Timeline Milestones */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">مراحل آماده‌سازی و ارسال</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {trackData.timeline.map((step) => (
                  <div
                    key={step.step}
                    className={`p-4 rounded-2xl border transition-all ${
                      step.is_completed
                        ? 'bg-emerald-50/70 border-emerald-200'
                        : step.is_current
                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200/80 opacity-70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-600">مرحله {step.step}</span>
                      {step.is_completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : step.is_current ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping" />
                      ) : (
                        <Clock className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-900 mb-1">{step.title_fa}</div>
                    <div className="text-[11px] text-slate-500 leading-relaxed">{step.description_fa}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & Recipient Info Masked */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <span className="text-slate-500 font-bold">گیرنده سفارش:</span>
                <div className="font-bold text-slate-900 text-sm">{trackData.customer_name_masked}</div>
              </div>
              <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
                <span className="text-slate-500 font-bold">مقصد ارسال:</span>
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" />
                  {trackData.shipping_city} — {trackData.shipping_address_masked}
                </div>
              </div>
            </div>
          </div>

          {/* Items Breakdown */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              اقلام موجود در این مرسوله
            </h3>

            <div className="space-y-3">
              {trackData.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      {item.product_title}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                        {item.quantity} عدد
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {item.destination_configured ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium">
                          مقصد متصل ({item.destination_type})
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[11px] font-medium">
                          نیازمند فعال‌سازی و اتصال لینک
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Codes & Activation Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {item.card_codes.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {item.card_codes.map((code) => (
                          <Link
                            key={code}
                            to={`/activate/${code}?num=${trackData.shop_order_number}`}
                            className="px-3 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-mono font-bold text-blue-700 flex items-center gap-1.5 transition-all shadow-xs"
                            title="فعال‌سازی یا مشاهده وضعیت کارت"
                          >
                            <QrCode className="w-3.5 h-3.5 text-blue-600" />
                            {code}
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">کارت‌ها پس از تأیید تولید صادر خواهند شد</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
