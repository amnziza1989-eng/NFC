import React from 'react';
import {
  BarChart3,
  Radio,
  QrCode,
  TrendingUp,
  Activity,
} from 'lucide-react';

export const TapNowAnalytics: React.FC = () => {
  return (
    <section className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs">
            <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
            <span>شفافیت و آمار واقعی</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            فقط کارت ندهید؛ تعامل مشتری را هم بهتر بشناسید
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            در پنل مدیریت اختصاصی TapNow، می‌توانید آمار دقیق تعامل مشتریان با کارت‌های مستقر در فروشگاه یا کافه را به تفکیک روش تعامل مشاهده کنید.
          </p>
        </div>

        {/* Analytics Simulation Dashboard Preview */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6">
          
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
              <span className="text-xs text-blue-700 font-bold flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                تعامل‌های NFC (لمس آنی)
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">۲۴۸ <span className="text-xs font-normal text-slate-500">لمس</span></p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1">
              <span className="text-xs text-indigo-700 font-bold flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5" />
                تعامل‌های QR (اسکن بارکد)
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">۱۶۳ <span className="text-xs font-normal text-slate-500">اسکن</span></p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1">
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                مجموع هدایت به مقصد
              </span>
              <p className="text-2xl font-black text-slate-900 font-mono">۴۱۱ <span className="text-xs font-normal text-slate-500">کلیک موفق</span></p>
            </div>

          </div>

          {/* Interactive Progress Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                نسبت تعامل NFC در برابر QR
              </span>
              <span className="text-slate-500 font-mono">۶۰٪ NFC / ۴۰٪ QR</span>
            </div>
            
            <div className="w-full h-3 rounded-full bg-slate-200 flex overflow-hidden">
              <div className="bg-blue-600 h-full w-[60%]" title="NFC: 60%" />
              <div className="bg-indigo-500 h-full w-[40%]" title="QR: 40%" />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                لمس چیپ هوشمند NFC
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
                اسکن بارکد QR داینامیک
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
