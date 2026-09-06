import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  AlertCircle,
  Truck,
  User,
  Sparkles,
  Info,
  ChevronDown,
} from 'lucide-react';
import { useCart } from './context/CartContext';
import { useLanguage } from '../../i18n/LanguageContext';
import { api } from '../../services/apiClient';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { AuthModal } from '../../components/AuthModal';
import { useAuth } from './context/AuthContext';
import { ShippingQuoteResponse } from '../../types/api';

export const IRAN_PROVINCES = [
  'تهران',
  'آذربایجان شرقی',
  'آذربایجان غربی',
  'اردبیل',
  'اصفهان',
  'البرز',
  'ایلام',
  'بوشهر',
  'چهارمحال و بختیاری',
  'خراسان جنوبی',
  'خراسان رضوی',
  'خراسان شمالی',
  'خوزستان',
  'زنجان',
  'سمنان',
  'سیستان و بلوچستان',
  'فارس',
  'قزوین',
  'قم',
  'کردستان',
  'کرمان',
  'کرمانشاه',
  'کهگیلویه و بویراحمد',
  'گلستان',
  'گیلان',
  'لرستان',
  'مازندران',
  'مرکزی',
  'هرمزگان',
  'همدان',
  'یزد',
];

export const PROVINCE_CITIES: Record<string, string[]> = {
  'تهران': ['تهران', 'ری', 'تجریش', 'اسلامشهر', 'دماوند', 'پردیس', 'شهریار', 'ورامین', 'پاکدشت', 'قدس', 'رباط‌کریم', 'فیروزکوه', 'بومهن', 'رودهن'],
  'آذربایجان شرقی': ['تبریز', 'مراغه', 'مرند', 'میانه', 'اهر', 'بناب', 'سراب', 'آذرشهر', 'هادیشهر', 'عجب‌شیر', 'جلفا'],
  'آذربایجان غربی': ['ارومیه', 'خوی', 'بوکان', 'مهاباد', 'میاندوآب', 'سلماس', 'پیرانشهر', 'نقده', 'سردشت', 'ماکو'],
  'اردبیل': ['اردبیل', 'پارس‌آباد', 'مشگین‌شهر', 'خلخال', 'گرمی', 'نمین', 'بیله‌سوار', 'سرعین'],
  'اصفهان': ['اصفهان', 'کاشان', 'نجف‌آباد', 'شاهین‌شهر', 'خمینی‌شهر', 'فولادشهر', 'لنجان', 'فلاورجان', 'شهرضا', 'مبارکه', 'گلپایگان', 'آران و بیدگل', 'نطنز', 'نایین'],
  'البرز': ['کرج', 'فردیس', 'کمال‌شهر', 'نظرآباد', 'محمدشهر', 'ماهدشت', 'هشتگرد', 'چهارباغ', 'اشتهارد', 'طالقان'],
  'ایلام': ['ایلام', 'دهلران', 'ایوان', 'آبدانان', 'دره‌شهر', 'مهران', 'سرابله'],
  'بوشهر': ['بوشهر', 'برازجان', 'بندر گناوه', 'بندر کنگان', 'خورموج', 'بندر عسلویه', 'بندر دیلم', 'بندر جم', 'بندر دیر'],
  'چهارمحال و بختیاری': ['شهرکرد', 'بروجن', 'فرخ‌شهر', 'فارسان', 'لردگان', 'سامان'],
  'خراسان جنوبی': ['بیرجند', 'قائن', 'طبس', 'فردوس', 'نهبندان', 'سرایان'],
  'خراسان رضوی': ['مشهد', 'نیشابور', 'سبزوار', 'تربت حیدریه', 'کاشمر', 'قوچان', 'تربت جام', 'تایباد', 'چناران', 'سرخس', 'گناباد'],
  'خراسان شمالی': ['بجنورد', 'شیروان', 'اسفراین', 'آشخانه', 'جاجرم', 'گرمه'],
  'خوزستان': ['اهواز', 'دزفول', 'آبادان', 'بندر ماهشهر', 'خرمشهر', 'اندیمشک', 'ایذه', 'بهبهان', 'شوشتر', 'مسجد سلیمان', 'بندر امام خمینی', 'شوش', 'رامهرمز', 'امیدیه'],
  'زنجان': ['زنجان', 'ابهر', 'خرمدره', 'قیدار', 'هیدج', 'صائین‌قلعه'],
  'سمنان': ['سمنان', 'شاهرود', 'دامغان', 'گرمسار', 'مهدی‌شهر', 'ایوانکی'],
  'سیستان و بلوچستان': ['زاهدان', 'زابل', 'ایرانشهر', 'چابهار', 'سراوان', 'خاش', 'کنارک', 'نیک‌شهر'],
  'فارس': ['شیراز', 'مرودشت', 'جهرم', 'فسا', 'کازرون', 'صدرا', 'لار', 'آباده', 'اقلید', 'نورآباد', 'فیروزآباد', 'نی‌ریز', 'داراب'],
  'قزوین': ['قزوین', 'الوند', 'محمدیه', 'تاکستان', 'آبیک', 'بویین‌زهرا', 'اقبالیه'],
  'قم': ['قم', 'جعفریه', 'کهک', 'قنوات', 'دستجرد'],
  'کردستان': ['سنندج', 'سقز', 'مریوان', 'بانه', 'قروه', 'کامیاران', 'بیجار', 'دیواندره'],
  'کرمان': ['کرمان', 'سیرجان', 'رفسنجان', 'جیرفت', 'بم', 'زرند', 'کهنوج', 'شهربابک', 'بافت'],
  'کرمانشاه': ['کرمانشاه', 'اسلام‌آباد غرب', 'جوانرود', 'کنگاور', 'سرپل ذهاب', 'سنقر', 'صحنه', 'هرسین', 'پاوه'],
  'کهگیلویه و بویراحمد': ['یاسوج', 'دوگنبدان (گچساران)', 'دهدشت', 'لیکک', 'چرام'],
  'گلستان': ['گرگان', 'گنبد کاووس', 'علی‌آباد کتول', 'بندر ترکمن', 'آق‌قلا', 'مینودشت', 'کردکوی', 'کلاله', 'آزادشهر'],
  'گیلان': ['رشت', 'بندر انزلی', 'لاهیجان', 'لنگرود', 'هشتپر (تالش)', 'آستارا', 'صومعه‌سرا', 'آستانه اشرفیه', 'رودسر', 'فومن', 'ماسال', 'رودبار', 'کلاچای'],
  'لرستان': ['خرم‌آباد', 'بروجرد', 'دورود', 'کوهدشت', 'الیگودرز', 'نورآباد', 'ازنا', 'الشتر', 'پلدختر'],
  'مازندران': ['ساری', 'بابل', 'آمل', 'قائم‌شهر', 'بهشهر', 'چالوس', 'نکا', 'بابلسر', 'تنکابن', 'نوشهر', 'فریدونکنار', 'رامسر', 'محمودآباد', 'نور', 'کلاردشت'],
  'مرکزی': ['اراک', 'ساوه', 'خمین', 'محلات', 'دلیجان', 'زرندیه', 'شازند', 'تفرش'],
  'هرمزگان': ['بندرعباس', 'میناب', 'قشم', 'کیش', 'دهبارز', 'بندر لنگه', 'بندر جاسک', 'بندر خمیر', 'پارسیان', 'حاجی‌آباد'],
  'همدان': ['همدان', 'ملایر', 'نهاوند', 'اسدآباد', 'تویسرکان', 'بهار', 'کبودرآهنگ', 'رزن'],
  'یزد': ['یزد', 'میبد', 'اردکان', 'بافق', 'مهریز', 'ابرکوه', 'تفت', 'شاهدیه', 'زارچ'],
};


export const CheckoutView: React.FC = () => {
  const { items, totalAmount, totalItems, clearCart } = useCart();
  const { language } = useLanguage();
  const isFa = language === 'fa';
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [companyName, setCompanyName] = useState('');

  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('تهران');
  const [shippingProvince, setShippingProvince] = useState('تهران');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [shippingMethod, setShippingMethod] = useState<'POST' | 'COURIER'>('POST');

  // Dynamic Shipping Quote State
  const [shippingQuote, setShippingQuote] = useState<ShippingQuoteResponse>({
    province: 'تهران',
    shipping_method: 'POST',
    shipping_cost: 35000,
    postal_price: 35000,
    courier_available: true,
    courier_price: 65000,
  });
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Helper check for Tehran Courier city address
  const isTehranAddress = (cityStr: string): boolean => {
    const cleaned = cityStr.trim().replace(/ي/g, 'ی').replace(/ك/g, 'ک').toLowerCase();
    const outerSuburbs = ['ورامین', 'شهریار', 'دماوند', 'پردیس', 'رودهن', 'فیروزکوه', 'اسلامشهر', 'رباط کریم', 'ملارد', 'قدس', 'پاکدشت', 'اندیشه', 'بومهن'];
    if (outerSuburbs.some(sub => cleaned.includes(sub))) return false;
    return cleaned.includes('تهران') || cleaned.includes('tehran');
  };

  // Determine courier eligibility based on both province rule and city
  const isCourierEligible = Boolean(shippingQuote.courier_available && isTehranAddress(shippingCity));

  // Fetch / update shipping quote whenever province or shipping method changes
  useEffect(() => {
    let isMounted = true;
    const fetchQuote = async () => {
      try {
        setIsQuoteLoading(true);
        const quote = await api.getShippingQuote(shippingProvince, shippingMethod);
        if (isMounted) {
          setShippingQuote(quote);
          if (!quote.courier_available && shippingMethod === 'COURIER') {
            setShippingMethod('POST');
          }
        }
      } catch (err: any) {
        // Fallback default
        if (isMounted) {
          const isTehran = shippingProvince.includes('تهران');
          setShippingQuote({
            province: shippingProvince,
            shipping_method: shippingMethod,
            shipping_cost: isTehran ? (shippingMethod === 'COURIER' ? 65000 : 35000) : 45000,
            postal_price: isTehran ? 35000 : 45000,
            courier_available: isTehran,
            courier_price: isTehran ? 65000 : 0,
          });
        }
      } finally {
        if (isMounted) setIsQuoteLoading(false);
      }
    };

    fetchQuote();
    return () => {
      isMounted = false;
    };
  }, [shippingProvince, shippingMethod]);

  // Auto-switch away from COURIER if not eligible
  useEffect(() => {
    if (!isCourierEligible && shippingMethod === 'COURIER') {
      setShippingMethod('POST');
    }
  }, [isCourierEligible, shippingMethod]);

  if (items.length === 0) {
    navigate('/shop');
    return null;
  }

  const currentShippingCost = shippingMethod === 'COURIER'
    ? shippingQuote.courier_price
    : shippingQuote.postal_price;

  const finalPayableTotal = totalAmount + currentShippingCost;

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim()) {
      setErrorMessage(isFa ? 'لطفاً تمامی فیلدهای مشخصات خریدار را پر کنید.' : 'Please fill all customer fields.');
      return;
    }
    if (customerName.trim().length < 2) {
      setErrorMessage(isFa ? 'نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.' : 'Full name must be at least 2 characters.');
      return;
    }
    if (customerPhone.trim().length < 10) {
      setErrorMessage(isFa ? 'شماره موبایل وارد شده معتبر نیست.' : 'Please enter a valid phone number.');
      return;
    }
    if (!shippingAddress.trim() || !shippingCity.trim() || !shippingPostalCode.trim()) {
      setErrorMessage(isFa ? 'لطفاً تمامی فیلدهای آدرس ارسال را پر کنید.' : 'Please fill all shipping fields.');
      return;
    }

    if (shippingMethod === 'COURIER' && !isCourierEligible) {
      setErrorMessage(
        isFa
          ? `ارسال با پیک برای استان «${shippingProvince}» در دسترس نیست. لطفاً روش پست پیشتاز را انتخاب نمایید.`
          : 'Courier delivery is only available in Tehran city.'
      );
      return;
    }

    executeCheckout();
  };

  const executeCheckout = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);
      const payload = {
        customer: {
          name: customerName.trim(),
          email: customerEmail.trim(),
          phone: customerPhone.trim(),
          company_name: companyName.trim() || undefined,
        },
        shipping: {
          address: shippingAddress.trim(),
          city: shippingCity.trim(),
          province: shippingProvince.trim() || 'تهران',
          postal_code: shippingPostalCode.trim(),
          notes: shippingNotes.trim() || undefined,
          shipping_method: shippingMethod,
        },
        items: items.map((it) => ({
          product_type: it.productType,
          product_title: it.productTitle,
          unit_price: it.unitPrice,
          quantity: it.quantity,
          destination_configured: it.destinationConfigured,
          destination_type: it.destinationType,
          destination_url: it.destinationUrl,
          customization_logo_url: it.customizationLogoUrl,
          customization_color: it.customizationColor || '#0F172A',
          customization_template: it.customizationTemplate || 'classic',
        })),
        idempotency_key: `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      };

      const response = await api.checkoutShop(payload);
      clearCart();
      navigate('/shop/success', { state: { orderData: response } });
    } catch (err: any) {
      setErrorMessage(err.message || (isFa ? 'خطا در ثبت سفارش' : 'Failed to process checkout'));
      if (err.message?.includes('Not authenticated') || err.message?.includes('Authentication required')) {
        logout();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        defaultPhone={customerPhone}
        defaultEmail={customerEmail}
        onSuccess={() => {
          setIsAuthModalOpen(false);
          const token = localStorage.getItem('tapnow_customer_token');
          const customerId = localStorage.getItem('tapnow_customer_id');
          if (token && customerId) {
            login(token, customerId);
          }
          executeCheckout();
        }}
      />

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
          <CreditCard className="w-6 h-6 text-blue-600" />
          {isFa ? 'تکمیل اطلاعات و پرداخت سفارش' : 'Checkout & Payment'}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {isFa
            ? 'اطلاعات گیرنده و آدرس ارسال سفارش را وارد کرده و روش ارسال را انتخاب کنید'
            : 'Enter recipient, delivery address, and choose your preferred shipping method'}
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleProcessCheckout} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Customer & Shipping Forms */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Customer Contact Info */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <User className="w-4 h-4 text-blue-600" />
              {isFa ? '۱. مشخصات خریدار و کسب‌وکار' : '1. Customer Details'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={isFa ? 'نام و نام خانوادگی' : 'Full Name'}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
              />
              <Input
                label={isFa ? 'نام برند / کسب‌وکار (جهت نامگذاری کارت)' : 'Business / Brand Name'}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="کافه رستوران صدف"
              />
              <Input
                label={isFa ? 'شماره موبایل' : 'Mobile Phone'}
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                dir="ltr"
                required
              />
              <Input
                label={isFa ? 'آدرس ایمیل' : 'Email Address'}
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                dir="ltr"
                required
              />
            </div>
          </div>

          {/* Section 2: Shipping Address */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-4 h-4 text-blue-600" />
              {isFa ? '۲. آدرس تحویل بسته' : '2. Shipping Address'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              
              {/* Standard Province Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isFa ? 'استان مقصد' : 'Destination Province'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={shippingProvince}
                    onChange={(e) => {
                      const newProv = e.target.value;
                      setShippingProvince(newProv);
                      const cities = PROVINCE_CITIES[newProv];
                      if (cities && cities.length > 0 && !cities.includes(shippingCity)) {
                        setShippingCity(cities[0]);
                      }
                    }}
                    className="w-full h-11 px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 appearance-none cursor-pointer text-slate-900 font-medium"
                    required
                  >
                    {IRAN_PROVINCES.map((prov) => (
                      <option key={prov} value={prov}>
                        {prov}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 absolute end-3 top-3.5 pointer-events-none" />
                </div>
              </div>

              {/* City Selection with Autocomplete & Suggestions */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {isFa ? 'شهر مقصد' : 'City'} <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="iran-cities-list"
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder={isFa ? 'انتخاب یا تایپ شهر...' : 'Select or type city...'}
                    className="w-full h-11 px-3.5 py-2 text-xs rounded-xl bg-white border border-slate-200 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 text-slate-900 font-medium"
                    required
                  />
                  <datalist id="iran-cities-list">
                    {(PROVINCE_CITIES[shippingProvince] || []).map((city) => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                </div>
              </div>

              <Input
                label={isFa ? 'کد پستی (۱۰ رقمی)' : 'Postal Code'}
                value={shippingPostalCode}
                onChange={(e) => setShippingPostalCode(e.target.value)}
                dir="ltr"
                required
              />

              {/* Quick City Selection Pills */}
              {PROVINCE_CITIES[shippingProvince] && (
                <div className="sm:col-span-3 flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-slate-500">
                    {isFa ? 'انتخاب سریع شهر:' : 'Quick Select:'}
                  </span>
                  {PROVINCE_CITIES[shippingProvince].slice(0, 8).map((city) => (
                    <button
                      key={city}
                      type="button"
                      onClick={() => setShippingCity(city)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        shippingCity === city
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                      }`}
                    >
                      {city}
                    </button>
                  ))}
                </div>
              )}

              <div className="sm:col-span-3">
                <Input
                  label={isFa ? 'آدرس دقیق پستی' : 'Street Address'}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  required
                />
              </div>
              <div className="sm:col-span-3">
                <Input
                  label={isFa ? 'توضیحات تکمیلی یا زمان ارسال (اختیاری)' : 'Delivery Notes (Optional)'}
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Shipping Method Selection */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <Truck className="w-4 h-4 text-blue-600" />
              {isFa ? '۳. روش ارسال سفارش' : '3. Shipping Method'}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option 1: Postal Shipping */}
              <label
                className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  shippingMethod === 'POST'
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">📦</span>
                      <span className="text-xs font-bold text-slate-900">
                        {isFa ? 'ارسال با پست پیشتاز' : 'Postal Shipping'}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="POST"
                      checked={shippingMethod === 'POST'}
                      onChange={() => setShippingMethod('POST')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                    {isFa
                      ? `پوشش سراسری در استان ${shippingProvince} و تمام شهرهای کشور با دریافت کد رهگیری پستی (۲ الی ۴ روز کاری)`
                      : `Nationwide delivery in ${shippingProvince} with postal tracking code (2-4 business days)`}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600">هزینه ارسال پستی:</span>
                  <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                    {shippingQuote.postal_price.toLocaleString('fa-IR')} تومان
                  </span>
                </div>
              </label>

              {/* Option 2: Courier Delivery */}
              <label
                className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all ${
                  !isCourierEligible
                    ? 'opacity-65 bg-slate-50 border-slate-200 cursor-not-allowed'
                    : shippingMethod === 'COURIER'
                    ? 'border-blue-600 bg-blue-50/40 shadow-xs cursor-pointer'
                    : 'border-slate-200 hover:border-slate-300 bg-white cursor-pointer'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">🛵</span>
                      <span className="text-xs font-bold text-slate-900">
                        {isFa ? 'ارسال با پیک موتوری (سریع)' : 'Courier Delivery'}
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="shippingMethod"
                      value="COURIER"
                      disabled={!isCourierEligible}
                      checked={shippingMethod === 'COURIER'}
                      onChange={() => isCourierEligible && setShippingMethod('COURIER')}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 disabled:opacity-40"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                    {isFa
                      ? 'تحویل سریع درون‌شهری در همان روز (ویژه مناطق ۲۲ گانه شهر تهران)'
                      : 'Same-day rapid delivery (Only active for eligible addresses in Tehran city)'}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  {isCourierEligible ? (
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">هزینه ارسال با پیک:</span>
                      <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200 font-mono">
                        {shippingQuote.courier_price.toLocaleString('fa-IR')} تومان
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-start gap-1.5 text-[10px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200">
                      <Info className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                      <span>
                        {isFa
                          ? `ارسال با پیک برای استان ${shippingProvince} در دسترس نیست؛ ارسال با پست پیشتاز انجام می‌گردد.`
                          : `Courier is unavailable for ${shippingProvince}; postal shipping will be used.`}
                      </span>
                    </div>
                  )}
                </div>
              </label>

            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Mock Payment Simulator */}
        <div className="space-y-6 sticky top-24">
          <div className="p-6 rounded-3xl bg-white border border-slate-200 space-y-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
              {isFa ? 'اقلام سفارش شما' : 'Order Items'}
            </h2>

            {/* Quick Item List */}
            <div className="space-y-3 max-h-48 overflow-y-auto pe-1">
              {items.map((it) => (
                <div key={it.id} className="flex justify-between items-start text-xs pb-2 border-b border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">{it.productTitle}</p>
                    <p className="text-[10px] text-slate-500">
                      {it.quantity} × {it.unitPrice.toLocaleString('fa-IR')} تومان
                    </p>
                    <span className="text-[9px] font-bold text-blue-600">
                      {it.destinationConfigured ? `✓ ${it.destinationType}` : '🛡️ تنظیم بعداً'}
                    </span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {(it.unitPrice * it.quantity).toLocaleString('fa-IR')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price breakdown */}
            <div className="space-y-2.5 text-xs pt-2">
              <div className="flex justify-between text-slate-600">
                <span>{isFa ? 'تعداد کل اقلام' : 'Total Items'}</span>
                <span className="font-mono font-bold text-slate-900">{totalItems}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>{isFa ? 'مجموع قیمت کارت‌ها' : 'Products Subtotal'}</span>
                <span className="font-mono font-bold text-slate-900">
                  {totalAmount.toLocaleString('fa-IR')} تومان
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span className="flex items-center gap-1">
                  <span>{isFa ? 'هزینه ارسال' : 'Shipping Fee'}</span>
                  <span className="text-[10px] text-slate-400">({shippingProvince})</span>
                </span>
                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                  {isQuoteLoading ? (isFa ? 'در حال محاسبه...' : 'Calculating...') : `${currentShippingCost.toLocaleString('fa-IR')} تومان`}
                </span>
              </div>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-sm font-black text-slate-900">{isFa ? 'مبلغ نهایی فاکتور' : 'Total'}</span>
                <span className="text-xl font-black text-blue-600">
                  {finalPayableTotal.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-500">{isFa ? 'تومان' : 'Toman'}</span>
                </span>
              </div>
            </div>

            {/* Mock Payment Simulation Box */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs space-y-2">
              <div className="flex items-center gap-2 text-blue-800 font-bold">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>{isFa ? 'درگاه پرداخت شبیه‌سازی تستی' : 'Localhost Mock Payment Gateway'}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {isFa
                  ? 'این پرداخت به عنوان تست لوکال‌هاست شبیه‌سازی می‌شود. پس از فشردن دکمه زیر، سفارش فوراً با وضعیت پرداخت‌شده (MOCK_PAID) در دیتابیس ثبت و کارت‌های کارخانه تولید خواهند شد.'
                  : 'Simulated payment for Localhost testing. Order will be marked MOCK_PAID and dispatched to factory.'}
              </p>
            </div>

            {/* Validation / Server Error Box */}
            {errorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="font-bold">{errorMessage}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full shadow-lg shadow-blue-500/25 cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? (isFa ? 'در حال ثبت سفارش...' : 'Processing...')
                : (isFa ? `پرداخت شبیه‌سازی (${finalPayableTotal.toLocaleString('fa-IR')} تومان)` : `Pay (${finalPayableTotal.toLocaleString('en-US')} Toman)`)}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
