import React, { useState, useEffect } from 'react';
import { Search, ShieldCheck, Activity, Key, Check } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { t } = useLanguage();
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(api.getApiKey());
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const res = await api.getHealth();
        if (isMounted) setIsHealthy(res.status === 'ok');
      } catch {
        if (isMounted) setIsHealthy(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSaveApiKey = () => {
    api.setApiKey(apiKeyInput);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsKeyModalOpen(false);
    }, 800);
  };

  return (
    <>
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-xs">
        {/* Global Search Placeholder */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 start-0 ps-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder={t.header.searchPlaceholder}
              className="w-full bg-slate-50 text-xs text-slate-900 placeholder-slate-400 rounded-xl border border-slate-200 ps-9 pe-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Right Tools & Status */}
        <div className="flex items-center gap-4">
          {/* Health status badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 text-xs">
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-700 font-medium">
              {isHealthy === null
                ? t.header.systemChecking
                : isHealthy
                ? t.header.systemHealthy
                : t.header.systemOffline}
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy === true
                  ? 'bg-emerald-500'
                  : isHealthy === false
                  ? 'bg-rose-500'
                  : 'bg-amber-500'
              }`}
            />
          </div>

          {/* API Key Modal Trigger */}
          <button
            onClick={() => setIsKeyModalOpen(true)}
            title="پیکربندی کلید دسترسی API"
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4" />
          </button>

          {/* Operator Profile Pill */}
          <div className="flex items-center gap-2.5 ps-3 border-s border-slate-200">
            <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold text-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-start hidden sm:block">
              <p className="text-xs font-bold text-slate-900">{t.header.roleSuperAdmin}</p>
              <p className="text-[10px] text-slate-500 font-mono">X-API-Key Mode</p>
            </div>
          </div>
        </div>
      </header>

      {/* API Key Config Modal */}
      <Modal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        title="پیکربندی کلید امنیتی (X-API-Key)"
        subtitle="این کلید برای احراز هویت درخواست‌های مدیریتی به پورت ۸۳۰۰ ارسال می‌شود"
      >
        <div className="space-y-4">
          <Input
            label="کلید API Header"
            type="password"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            placeholder="your-secure-api-key-here"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setIsKeyModalOpen(false)}>
              انصراف
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveApiKey} icon={savedSuccess ? <Check className="w-4 h-4" /> : undefined}>
              {savedSuccess ? 'ذخیره شد' : 'ذخیره کلید'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
