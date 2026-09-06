import React, { useState } from 'react';
import {
  HelpCircle,
  ChevronDown,
} from 'lucide-react';

export const TapNowFAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0); // First item open by default

  const faqs = [
    {
      q: 'آیا برای استفاده از کارت، مشتری نیاز به نصب اپلیکیشن خاصی دارد؟',
      a: 'خیر، به هیچ عنوان. فناوری NFC و اسکنر بارکد در تمام گوشی‌های هوشمند امروزی (اندروید و آیفون) به صورت پیش‌فرض فعال است. مشتری تنها با نزدیک کردن گوشی به کارت یا باز کردن دوربین، در کمتر از ۱ ثانیه وارد صفحه اختصاصی می‌شود.',
    },
    {
      q: 'اگر آدرس اینترنتی یا لوکیشن کسب‌وکار ما تغییر کند چه اتفاقی می‌افتد؟',
      a: 'هیچ مشکلی پیش نمی‌آید! شما در هر زمان می‌توانید با ورود به پنل مدیریت TapNow، آدرس مقصد جدید را ثبت کنید. کارت‌های فیزیکی روی میزها و پیشخوان‌ها بدون نیاز به هیچ تغییری، مراجعات بعدی را به مقصد جدید هدایت می‌کنند.',
    },
    {
      q: 'آیا با تغییر لینک یا شعبه، باید کارت جدید چاپ کنیم؟',
      a: 'خیر. بزرگترین مزیت TapNow ماندگاری آن است. چون کارت‌ها به سیستم هدایت ابری هوشمند متصل هستند، بدون نیاز به تعویض کارت یا صرف هزینه چاپ مجدد، مسیر هدایت به صورت آنی تغییر می‌یابد.',
    },
    {
      q: 'تفاوت کارت NFC با کارت NFC + QR چیست و کدام برای من مناسب‌تر است؟',
      a: 'کارت هوشمند NFC طراحی بسیار شیک و مینیمالی دارد و با لمس گوشی کار می‌کند. کارت ترکیبی NFC + QR علاوه بر چیپست NFC، دارای بارکد QR داینامیک نیز هست که پوشش ۱۰۰٪ تمام گوشی‌ها را تضمین می‌کند. اگر می‌خواهید مشتریان حق انتخاب بین لمس و اسکن داشته باشند، مدل NFC + QR پیشنهاد می‌شود.',
    },
    {
      q: 'آیا می‌توانم آمار تعداد استفاده از کارت‌ها را بررسی کنم؟',
      a: 'بله؛ پنل مدیریت اختصاصی TapNow به شما امکان می‌دهد تعداد کل کلیک‌ها و مراجعات را به تفکیک تماس‌های NFC و اسکن‌های QR به صورت دقیق مشاهده کنید.',
    },
    {
      q: 'آیا TapNow فقط برای ثبت نظر در گوگل مپ (Google Reviews) است؟',
      a: 'درحال حاضر مهم‌ترین و اثربخش‌ترین کاربرد آن برای افزایش اعتبار و ثبت نظرات گوگل است، اما شما می‌توانید لینک مقصد را به وب‌سایت، پیج اینستاگرام، شماره واتساپ، منوی دیجیتال یا هر لینک دلخواه دیگری متصل کنید.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 bg-slate-50 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
            <span>پاسخ به ابهامات متداول</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            پرسش‌های متداول کسب‌وکارها
          </h2>
          <p className="text-base text-slate-600 leading-relaxed font-normal">
            پاسخ سریع به متداول‌ترین سوالات درباره عملکرد و نحوه استفاده از کارت‌های TapNow.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-slate-200/90 shadow-xs overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => toggleFAQ(idx)}
                  className="w-full p-5 text-start flex items-center justify-between gap-4 font-bold text-sm text-slate-900 hover:text-blue-700 transition-colors focus:outline-none select-none cursor-pointer"
                >
                  <span className="leading-snug">{faq.q}</span>
                  <div className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 bg-blue-50 text-blue-700' : 'text-slate-500'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-slate-600 leading-relaxed border-t border-slate-100/80 font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
