import React, { useState } from 'react';
import { X, Phone, Mail, Lock, ShieldCheck, ArrowRight, RefreshCw, Smartphone, CheckCircle2 } from 'lucide-react';
import { api } from '../services/apiClient';
import { useLanguage } from '../i18n/LanguageContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultPhone?: string;
  defaultEmail?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, defaultPhone, defaultEmail }) => {
  const { language } = useLanguage();
  const isFa = language === 'fa';

  const [step, setStep] = useState<'request' | 'verify' | 'google-mock'>('request');
  const [authMethod, setAuthMethod] = useState<'PHONE' | 'EMAIL'>('PHONE');
  const [providerValue, setProviderValue] = useState(defaultPhone || '');
  
  const [otpCode, setOtpCode] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<{title: string; description?: string} | null>(null);

  const [isShaking, setIsShaking] = useState(false);

  if (!isOpen) return null;

  const handleRequestOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!providerValue.trim()) {
      setError({ title: isFa ? 'لطفا شماره موبایل یا ایمیل را وارد کنید' : 'Please enter your phone or email' });
      return;
    }
    
    setError(null);
    setIsLoading(true);
    try {
      await api.requestOtp(authMethod, providerValue.trim());
      setStep('verify');
    } catch (err: any) {
      setError({ title: isFa ? 'خطا در ارسال کد تایید' : 'Error sending verification code', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 5) {
      setError({ title: isFa ? 'لطفا کد تایید معتبر وارد کنید' : 'Please enter a valid code' });
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await api.verifyOtp(authMethod, providerValue.trim(), otpCode.trim());
      // Save token
      localStorage.setItem('tapnow_customer_token', response.access_token);
      localStorage.setItem('tapnow_customer_id', response.customer_id);
      
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('Invalid OTP') || msg.includes('اشتباه') || msg.includes('صحیح نیست')) {
        setError({
          title: isFa ? 'کد تأیید صحیح نیست' : 'Invalid Verification Code',
          description: isFa ? 'لطفاً کد ۶ رقمی ارسال‌زده را بررسی کرده و دوباره تلاش کنید.' : 'Please check the 6-digit code and try again.'
        });
      } else if (msg.includes('Too many failed attempts') || msg.includes('دفعات')) {
        setError({
          title: isFa ? 'دسترسی مسدود شد' : 'Access Locked',
          description: isFa ? 'تعداد دفعات مجاز به پایان رسیده است. لطفاً دوباره کد درخواست کنید.' : 'Too many failed attempts. Please request a new code.'
        });
      } else {
        setError({
          title: isFa ? 'خطا در تایید' : 'Verification Error',
          description: msg
        });
      }
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMockGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setError({ title: isFa ? 'لطفا ایمیل گوگل را وارد کنید' : 'Please enter Google email' });
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const response = await api.mockGoogleLogin(googleEmail.trim(), googleName.trim() || undefined);
      // Save token
      localStorage.setItem('tapnow_customer_token', response.access_token);
      localStorage.setItem('tapnow_customer_id', response.customer_id);
      
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (err: any) {
      setError({ title: isFa ? 'خطا در ورود با گوگل' : 'Google Login Error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToRequest = () => {
    setStep('request');
    setOtpCode('');
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div 
        className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir={isFa ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg">
                {step === 'request' 
                  ? (isFa ? 'ورود به حساب کاربری' : 'Sign In')
                  : step === 'google-mock' 
                    ? (isFa ? 'توسعه: ورود با گوگل' : 'Dev: Google Login')
                    : (isFa ? 'تایید شماره موبایل' : 'Verify Account')}
              </h3>
              <p className="text-sm text-slate-500">
                {step === 'request'
                  ? (isFa ? 'برای پیگیری سفارشات وارد شوید' : 'Sign in to track orders')
                  : step === 'google-mock'
                    ? (isFa ? 'ایمیل تست خود را وارد کنید' : 'Enter a test email')
                    : (isFa ? 'کد پیامک شده را وارد کنید' : 'Enter the code sent to you')}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <style>{`
            @keyframes shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-4px); }
              75% { transform: translateX(4px); }
            }
            .animate-shake {
              animation: shake 0.2s ease-in-out 0s 2;
            }
          `}</style>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
              <div className="p-2 bg-red-100 rounded-xl text-red-600 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="flex flex-col pt-0.5">
                <span className="text-red-800 font-bold text-sm mb-1">{error.title}</span>
                {error.description && (
                  <span className="text-red-600/90 text-xs leading-relaxed">
                    {error.description}
                  </span>
                )}
              </div>
            </div>
          )}

          {isSuccess ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">
                  {isFa ? 'ورود با موفقیت انجام شد' : 'Authentication Successful'}
                </h4>
                <p className="text-xs text-slate-500 mt-1.5 flex items-center justify-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>{isFa ? 'در حال ادامه فرآیند خرید و ثبت سفارش...' : 'Continuing your purchase...'}</span>
                </p>
              </div>
            </div>
          ) : step === 'request' ? (
            <div className="space-y-5">
              <form onSubmit={handleRequestOtp} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {authMethod === 'PHONE' 
                      ? (isFa ? 'شماره موبایل' : 'Phone Number')
                      : (isFa ? 'آدرس ایمیل' : 'Email Address')}
                  </label>
                  <Input
                    type={authMethod === 'PHONE' ? 'tel' : 'email'}
                    value={providerValue}
                    onChange={(e) => setProviderValue(e.target.value)}
                    placeholder={authMethod === 'PHONE' ? '09123456789' : 'name@example.com'}
                    icon={authMethod === 'PHONE' ? <Phone className="w-5 h-5 text-slate-400" /> : <Mail className="w-5 h-5 text-slate-400" />}
                    dir="ltr"
                    className="text-left"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {isFa ? 'در حال ارسال...' : 'Sending...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {isFa ? 'دریافت کد تایید' : 'Get Code'}
                      <ArrowRight className={`w-5 h-5 ${isFa ? 'rotate-180' : ''}`} />
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500 font-medium">
                    {isFa ? 'یا' : 'or'}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('google-mock');
                    setError(null);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {isFa ? 'ادامه با Google' : 'Continue with Google'}
                </button>

                {authMethod === 'PHONE' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('EMAIL');
                      setProviderValue(defaultEmail || '');
                      setError(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    <Mail className="w-5 h-5 text-slate-400" />
                    {isFa ? 'ورود با ایمیل' : 'Login with Email'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethod('PHONE');
                      setProviderValue(defaultPhone || '');
                      setError(null);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 rounded-xl text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                  >
                    <Smartphone className="w-5 h-5 text-slate-400" />
                    {isFa ? 'ورود با موبایل' : 'Login with Phone'}
                  </button>
                )}
              </div>
            </div>
          ) : step === 'verify' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 rounded-2xl">
                <span className="text-sm font-medium text-slate-600 font-mono" dir="ltr">
                  {providerValue}
                </span>
                <button
                  type="button"
                  onClick={handleBackToRequest}
                  className="text-sm text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  {isFa ? 'اصلاح' : 'Edit'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isFa ? 'کد ۶ رقمی پیامک شده' : '6-digit verification code'}
                </label>
                <div className={isShaking ? 'animate-shake' : ''}>
                  <Input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="------"
                    maxLength={6}
                    icon={<Lock className={`w-5 h-5 ${error ? 'text-red-400' : 'text-slate-400'}`} />}
                    dir="ltr"
                    className={`text-center text-xl tracking-widest font-mono font-bold transition-all ${
                      error ? 'border-red-300 focus:border-red-500 focus:ring-red-500/20 bg-red-50/50 text-red-700' : 'text-slate-700'
                    }`}
                  />
                </div>
                
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleRequestOtp}
                    className="text-sm text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    {isFa ? 'کد را دریافت نکرده‌اید؟ ' : 'Didn\'t receive code? '}
                    <span className="font-semibold underline underline-offset-4 text-blue-600">{isFa ? 'ارسال مجدد' : 'Resend'}</span>
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    {isFa ? 'در حال تایید...' : 'Verifying...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {isFa ? 'تایید و ورود' : 'Verify & Sign In'}
                    <ShieldCheck className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleMockGoogleLogin} className="space-y-5">
              <div className="p-3 mb-4 rounded-xl bg-amber-50 border border-amber-100 text-amber-800 text-sm">
                {isFa 
                  ? 'این بخش فقط برای توسعه است تا ورود با گوگل را بدون اتصال به OAuth واقعی تست کنید.' 
                  : 'This is a development mock to test Google login flow without real OAuth credentials.'}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isFa ? 'ایمیل تست (Google)' : 'Test Email (Google)'}
                </label>
                <Input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="test@gmail.com"
                  icon={<Mail className="w-5 h-5 text-slate-400" />}
                  dir="ltr"
                  className="text-left"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {isFa ? 'نام (اختیاری)' : 'Name (Optional)'}
                </label>
                <Input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="John Doe"
                  className="text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      {isFa ? 'در حال ورود...' : 'Logging in...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      {isFa ? 'تایید ورود Mock' : 'Confirm Mock Login'}
                    </span>
                  )}
                </Button>
                
                <button
                  type="button"
                  onClick={handleBackToRequest}
                  className="w-full text-sm text-slate-500 font-medium hover:text-slate-700 transition-colors"
                >
                  {isFa ? 'بازگشت' : 'Back'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
