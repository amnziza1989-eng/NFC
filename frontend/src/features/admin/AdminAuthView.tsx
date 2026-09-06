import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { ShieldCheck, User, Smartphone, Mail, Globe, CheckCircle2, AlertCircle, Clock, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';

// Types for the Admin Auth View
interface IdentityMethod {
  id: string;
  provider: string;
  provider_value: string;
  verified_at: string | null;
  created_at: string;
}

interface CustomerIdentity {
  id: string;
  name: string | null;
  created_at: string;
  updated_at: string;
  methods: IdentityMethod[];
}

interface OtpSession {
  id: string;
  provider: string;
  provider_value: string;
  purpose: string;
  debug_code: string | null;
  expires_at: string;
  attempts: number;
  resend_count: number;
  consumed: boolean;
  created_at: string;
}

export const AdminAuthView: React.FC = () => {
  const { language } = useLanguage();
  const isFa = language === 'fa';
  
  const [activeTab, setActiveTab] = useState<'identities' | 'otp'>('identities');
  
  const [identities, setIdentities] = useState<CustomerIdentity[]>([]);
  const [otpSessions, setOtpSessions] = useState<OtpSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [identitiesData, otpData] = await Promise.all([
        api.listIdentities(),
        api.listOtpSessions()
      ]);
      setIdentities(identitiesData);
      setOtpSessions(otpData);
    } catch (err) {
      console.error('Failed to load auth admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'PHONE': return <Smartphone className="w-4 h-4 text-blue-500" />;
      case 'EMAIL': return <Mail className="w-4 h-4 text-emerald-500" />;
      case 'GOOGLE': return <Globe className="w-4 h-4 text-orange-500" />;
      default: return <User className="w-4 h-4 text-slate-500" />;
    }
  };

  const maskValue = (val: string, provider: string) => {
    if (provider === 'PHONE' && val.length >= 11) {
      return val.substring(0, 4) + '***' + val.substring(val.length - 4);
    } else if (provider === 'EMAIL') {
      const parts = val.split('@');
      if (parts.length === 2 && parts[0].length > 3) {
        return parts[0].substring(0, 3) + '***@' + parts[1];
      }
    }
    return val.substring(0, 3) + '***';
  };

  return (
    <div className="space-y-6" dir={isFa ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-600" />
            {isFa ? 'مدیریت احراز هویت' : 'Authentication Center'}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {isFa 
              ? 'نظارت بر هویت مشتریان و جلسات تأییدیه' 
              : 'Monitor customer identities and verification sessions'}
          </p>
        </div>
        <Button variant="outline" onClick={loadData}>
          <RefreshCw className={`w-4 h-4 ${isFa ? 'ml-2' : 'mr-2'} ${isLoading ? 'animate-spin' : ''}`} />
          {isFa ? 'به‌روزرسانی' : 'Refresh'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('identities')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'identities' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          {isFa ? 'هویت مشتریان' : 'Customer Identities'}
        </button>
        <button
          onClick={() => setActiveTab('otp')}
          className={`pb-3 px-4 text-sm font-bold border-b-2 transition-colors ${
            activeTab === 'otp' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          {isFa ? 'مانیتورینگ کدهای یکبار مصرف' : 'OTP Monitor'}
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="h-40 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mb-3 text-blue-400" />
          <p className="text-sm font-medium">{isFa ? 'در حال بارگذاری اطلاعات...' : 'Loading...'}</p>
        </div>
      ) : activeTab === 'identities' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" dir={isFa ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isFa ? 'شناسه مشتری' : 'Customer ID'}</th>
                  <th className="px-6 py-4 font-semibold">{isFa ? 'تاریخ ثبت نام' : 'Joined'}</th>
                  <th className="px-6 py-4 font-semibold">{isFa ? 'روش‌های متصل' : 'Linked Methods'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {identities.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      {isFa ? 'هیچ مشتری یافت نشد' : 'No identities found'}
                    </td>
                  </tr>
                ) : (
                  identities.map(identity => (
                    <tr key={identity.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 font-mono text-xs mb-1">
                          {identity.id.substring(0, 13)}...
                        </div>
                        <div className="text-slate-500">{identity.name || (isFa ? 'بدون نام' : 'Unnamed')}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {new Date(identity.created_at).toLocaleDateString(isFa ? 'fa-IR' : 'en-US')}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          {identity.methods.map(m => (
                            <div key={m.id} className="flex items-center gap-2 text-xs">
                              {getProviderIcon(m.provider)}
                              <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                                {maskValue(m.provider_value, m.provider)}
                              </span>
                              {m.verified_at ? (
                                <span className="flex items-center text-emerald-600 font-semibold gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {isFa ? 'تأیید شده' : 'Verified'}
                                </span>
                              ) : (
                                <span className="flex items-center text-amber-500 font-semibold gap-1">
                                  <Clock className="w-3 h-3" />
                                  {isFa ? 'در انتظار' : 'Pending'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm" dir={isFa ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold">{isFa ? 'شناسه / زمان' : 'Session'}</th>
                  <th className="px-6 py-4 font-semibold">{isFa ? 'مقصد' : 'Target'}</th>
                  <th className="px-6 py-4 font-semibold">{isFa ? 'وضعیت' : 'Status'}</th>
                  <th className="px-6 py-4 font-semibold">{isFa ? 'کد تایید (توسعه)' : 'Dev Code'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {otpSessions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                      {isFa ? 'هیچ نشست کد تایید یافت نشد' : 'No OTP sessions found'}
                    </td>
                  </tr>
                ) : (
                  otpSessions.map(session => {
                    const isExpired = new Date(session.expires_at) < new Date();
                    return (
                      <tr key={session.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 font-mono text-xs mb-1">
                            {session.id.substring(0, 8)}...
                          </div>
                          <div className="text-slate-500 text-xs">
                            {new Date(session.created_at).toLocaleString(isFa ? 'fa-IR' : 'en-US')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-xs">
                            {getProviderIcon(session.provider)}
                            <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                              {maskValue(session.provider_value, session.provider)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-slate-400">
                            {session.purpose}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {session.attempts >= 3 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-1 rounded-lg">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {isFa ? 'مسدود شده' : 'Locked'}
                            </span>
                          ) : session.consumed ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-lg">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {isFa ? 'استفاده شده' : 'Consumed'}
                            </span>
                          ) : isExpired ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded-lg">
                              <Clock className="w-3.5 h-3.5" />
                              {isFa ? 'منقضی شده' : 'Expired'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg">
                              <RefreshCw className="w-3.5 h-3.5" />
                              {isFa ? 'فعال' : 'Active'}
                            </span>
                          )}
                          <div className="text-[10px] text-slate-400 mt-1">
                            {isFa ? 'تلاش‌ها:' : 'Attempts:'} {session.attempts}/3
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {session.debug_code ? (
                            <div className="flex flex-col gap-1">
                              <span className="font-mono text-lg font-black tracking-widest text-slate-900">
                                {session.debug_code}
                              </span>
                              <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded w-max">
                                {isFa ? 'فقط در توسعه' : 'Development Only'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">
                              {isFa ? 'مخفی' : 'Hidden'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
