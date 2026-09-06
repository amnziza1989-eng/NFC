import React from 'react';
import { Link } from 'react-router-dom';
import {
  Check,
  X,
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export const TapNowWhyTapNow: React.FC = () => {
  const comparisonRows = [
    {
      feature: 'روش تعامل مشتری',
      traditional: 'فقط اسکن با دوربین (بدون NFC)',
      tapnow: 'تماس لمسی NFC + اسکن QR هوشمند',
    },
    {
      feature: 'تغییر مقصد یا آدرس لینک',
      traditional: 'غیرممکن؛ نیاز به طراحی و چاپ مجدد',
      tapnow: 'آنی از پنل مدیریت بدون تعویض کارت',
    },
    {
      feature: 'ماندگاری و مقاومت فیزیکی',
      traditional: 'کاغذی / مقوایی با استهلاک سریع',
      tapnow: 'کارت PVC صنعتی، ضدآب و ضدخش',
    },
    {
      feature: 'مشاهده آمار تعامل‌ها',
      traditional: 'بدون هیچ‌گونه آمار یا گزارش',
      tapnow: 'آمار تفکیکی لمس NFC و اسکن QR',
    },
    {
      feature: 'حفظ مشتری و عدم قطعی',
      traditional: 'خطر خرابی لینک و از دست رفتن مشتری',
      tapnow: 'لینک ابری همیشه در دسترس و امن',
    },
  ];

  return (
    <section id="why-tapnow" className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>مقایسه رو در رو</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            چرا چاپ بارکد سنتی دیگر کافی نیست؟
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            تفاوت بین یک کاغذ چاپی یکبار مصرف با یک ابزار دیجیتال هوشمند و ماندگار را مشاهده کنید.
          </p>
        </div>

        {/* Comparison Table / Card */}
        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-5 px-6 text-start text-xs font-bold text-slate-500 uppercase tracking-wider w-1/3">
                    ویژگی و قابلیت
                  </th>
                  <th className="py-5 px-6 text-start text-xs font-bold text-rose-700 bg-rose-50/50 w-1/3">
                    کارت و بارکد سنتی (کاغذی)
                  </th>
                  <th className="py-5 px-6 text-start text-xs font-bold text-blue-800 bg-blue-50/80 w-1/3">
                    کارت هوشمند TapNow
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-800">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6 text-slate-600 bg-rose-50/20">
                      <div className="flex items-center gap-2">
                        <X className="w-4 h-4 text-rose-500 shrink-0" />
                        <span>{row.traditional}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-bold text-blue-900 bg-blue-50/30">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                        <span>{row.tapnow}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Callout */}
        <div className="text-center pt-10">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-sm font-bold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>🛒 مشاهده و خرید کارت‌ها</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </section>
  );
};
