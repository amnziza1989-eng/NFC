import React from 'react';
import {
  RefreshCw,
  Star,
  BarChart3,
  Zap,
  Repeat,
  Smartphone,
  Sparkles,
} from 'lucide-react';

export const TapNowBenefits: React.FC = () => {
  const benefits = [
    {
      icon: RefreshCw,
      title: 'مقصد قابل تغییر و داینامیک',
      desc: 'کارت فیزیکی روی پیشخوان ثابت می‌ماند، اما مقصد اینترنتی آن در هر زمان از پنل مدیریت قابل بروزرسانی است.',
      color: 'text-blue-600 bg-blue-50 border-blue-100',
    },
    {
      icon: Star,
      title: 'ساده‌تر شدن ثبت نظر در گوگل',
      desc: 'مسیر مشتری از جستجوی خسته‌کننده به یک لمس ۱ ثانیه‌ای کاهش یافته و احتمال ثبت بازخورد مثبت چند برابر می‌شود.',
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      icon: BarChart3,
      title: 'مشاهده آمار و تعامل‌ها',
      desc: 'تعداد کل تماس‌های NFC و اسکن‌های QR را به تفکیک در پنل مدیریت مشاهده کنید و میزان مشارکت مشتریان را بسنجید.',
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      icon: Zap,
      title: 'سریع، روان و بدون اصطکاک',
      desc: 'مشتری در لحظه حضور در فروشگاه یا کافه، در اوج رضایت و بدون معطلی به صفحه نهایی هدایت می‌شود.',
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      icon: Repeat,
      title: 'بدون نیاز به چاپ مجدد',
      desc: 'با تغییر منو، لینک سایت یا اکانت شبکه‌های اجتماعی، نیازی به چاپ مجدد یا دور انداختن کارت‌ها نخواهید داشت.',
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
    {
      icon: Smartphone,
      title: 'بدون نیاز به نصب اپلیکیشن',
      desc: 'فناوری NFC و دوربین گوشی به صورت پیش‌فرض در تمام تلفن‌های همراه هوشمند فعال بوده و نیازی به اپ اضافی ندارد.',
      color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    },
  ];

  return (
    <section id="benefits" className="py-20 bg-slate-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>چرا کسب‌وکارها TapNow را انتخاب می‌کنند؟</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            مزایای کلیدی کارت‌های هوشمند TapNow
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            ترکیب سخت‌افزار باکیفیت و سیستم هدایت ابری هوشمند، بهترین تجربه را برای شما و مشتریانتان فراهم می‌کند.
          </p>
        </div>

        {/* 6 Benefit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-200 transition-all space-y-4 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${b.color} group-hover:scale-105 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {b.title}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-normal">
                    {b.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
