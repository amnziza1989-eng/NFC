import React, { useEffect, useState } from 'react';
import { Mail, Smartphone, Plus, Lock, RefreshCw, CheckCircle } from 'lucide-react';
import { api, LinkedMethod } from '../../services/apiClient';
import { useLanguage } from '../../i18n/LanguageContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const LoginMethodsCard: React.FC = () => {
  const { language } = useLanguage();
  const isFa = language === 'fa';

  const [methods, setMethods] = useState<LinkedMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Link flow state
  const [isLinking, setIsLinking] = useState(false);
  const [step, setStep] = useState<'select' | 'request' | 'verify' | 'google-mock'>('select');
  const [selectedProvider, setSelectedProvider] = useState<'PHONE' | 'EMAIL' | 'GOOGLE' | null>(null);
  const [providerValue, setProviderValue] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setIsLoading(true);
      const data = await api.getLinkedMethods();
      setMethods(data);
    } catch (err: any) {
      console.error('Failed to load methods', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartLink = (provider: 'PHONE' | 'EMAIL' | 'GOOGLE') => {
    setSelectedProvider(provider);
    setError(null);
    if (provider === 'GOOGLE') {
      setStep('google-mock');
      setProviderValue('');
    } else {
      setStep('request');
      setProviderValue('');
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerValue.trim()) return;
    
    setActionLoading(true);
    setError(null);
    try {
      await api.requestProviderLink(selectedProvider as 'PHONE' | 'EMAIL', providerValue.trim());
      setStep('verify');
      setOtpCode('');
    } catch (err: any) {
      setError(err.message || 'Failed to send code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || !selectedProvider) return;

    setActionLoading(true);
    setError(null);
    try {
      await api.verifyProviderLink(selectedProvider, providerValue.trim(), otpCode.trim());
      await loadMethods();
      setIsLinking(false);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGoogleMockLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!providerValue.trim() || !selectedProvider) return;

    setActionLoading(true);
    setError(null);
    try {
      await api.verifyProviderLink('GOOGLE', providerValue.trim());
      await loadMethods();
      setIsLinking(false);
    } catch (err: any) {
      setError(err.message || 'Google link failed');
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading && methods.length === 0) {
    return <div className="animate-pulse h-32 bg-slate-100 rounded-3xl"></div>;
  }

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            {isFa ? 'روش‌های ورود' : 'Login Methods'}
          </h2>
          <p className="text-sm text-slate-500">
            {isFa ? 'حساب‌های متصل به شناسه شما' : 'Accounts linked to your identity'}
          </p>
        </div>
        {!isLinking && (
          <Button variant="outline" onClick={() => { setIsLinking(true); setStep('select'); setError(null); }} className="text-sm py-2">
            <Plus className="w-4 h-4 mr-1" />
            {isFa ? 'افزودن' : 'Add'}
          </Button>
        )}
      </div>

      {!isLinking ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {methods.map((m, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm text-slate-600">
                {m.provider === 'PHONE' && <Smartphone className="w-5 h-5 text-blue-600" />}
                {m.provider === 'EMAIL' && <Mail className="w-5 h-5 text-slate-600" />}
                {m.provider === 'GOOGLE' && (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate" dir="ltr">{m.provider_value}</p>
                <div className="flex items-center gap-1 mt-0.5 text-xs text-emerald-600 font-medium">
                  <CheckCircle className="w-3 h-3" />
                  {isFa ? 'تایید شده' : 'Verified'}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900">
              {step === 'select' && (isFa ? 'انتخاب روش اتصال' : 'Select Method to Link')}
              {step === 'request' && (isFa ? 'درخواست اتصال' : 'Link Request')}
              {step === 'verify' && (isFa ? 'تایید کد' : 'Verify Code')}
              {step === 'google-mock' && (isFa ? 'ورود توسعه گوگل' : 'Dev Google Link')}
            </h3>
            <button onClick={() => setIsLinking(false)} className="text-sm text-slate-500 hover:text-slate-700">
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {step === 'select' && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleStartLink('PHONE')}
                className="w-full flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors text-left"
              >
                <Smartphone className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-slate-700 flex-1 text-right">{isFa ? 'شماره موبایل جدید' : 'New Mobile Phone'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartLink('GOOGLE')}
                className="w-full flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors text-left"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="font-medium text-slate-700 flex-1 text-right">{isFa ? 'اتصال حساب Google' : 'Link Google Account'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleStartLink('EMAIL')}
                className="w-full flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 transition-colors text-left"
              >
                <Mail className="w-5 h-5 text-slate-500" />
                <span className="font-medium text-slate-700 flex-1 text-right">{isFa ? 'ایمیل جدید' : 'New Email Address'}</span>
              </button>
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <Input
                type={selectedProvider === 'EMAIL' ? 'email' : 'tel'}
                value={providerValue}
                onChange={(e) => setProviderValue(e.target.value)}
                placeholder={selectedProvider === 'EMAIL' ? 'your@email.com' : '0912...'}
                dir="ltr"
                icon={selectedProvider === 'EMAIL' ? <Mail className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              />
              <Button type="submit" variant="primary" className="w-full" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : (isFa ? 'دریافت کد' : 'Get Code')}
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-sm font-mono text-center text-slate-600 mb-2">{providerValue}</div>
              <Input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="------"
                maxLength={6}
                dir="ltr"
                className="text-center text-xl tracking-widest font-mono font-bold"
                icon={<Lock className="w-5 h-5" />}
              />
              <Button type="submit" variant="primary" className="w-full" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : (isFa ? 'تایید و اتصال' : 'Verify & Link')}
              </Button>
            </form>
          )}

          {step === 'google-mock' && (
            <form onSubmit={handleGoogleMockLink} className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-lg mb-2">
                {isFa ? 'محیط توسعه: شبیه‌سازی اتصال گوگل.' : 'Dev Env: Google Link Mock.'}
              </div>
              <Input
                type="email"
                value={providerValue}
                onChange={(e) => setProviderValue(e.target.value)}
                placeholder="test@google.com"
                dir="ltr"
              />
              <Button type="submit" variant="primary" className="w-full" disabled={actionLoading}>
                {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin mx-auto" /> : (isFa ? 'اتصال Mock' : 'Link Mock')}
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
