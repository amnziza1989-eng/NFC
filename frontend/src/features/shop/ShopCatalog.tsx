import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CreditCard,
  QrCode,
  Radio,
  CheckCircle2,
  Sparkles,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
  ShoppingBag,
  Check,
  Smartphone,
  Star,
} from 'lucide-react';
import { api } from '../../services/apiClient';
import { ShopProduct } from '../../types/api';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from './context/CartContext';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const ShopCatalog: React.FC = () => {
  const { language } = useLanguage();
  const isFa = language === 'fa';
  const { addItem } = useCart();

  // Selected product for modal configuration
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);

  // Modal configuration state
  const [quantity, setQuantity] = useState<number>(1);
  const [destinationConfigured, setDestinationConfigured] = useState<boolean>(true);
  const [destinationType, setDestinationType] = useState<string>('GOOGLE_REVIEW');
  const [destinationUrl, setDestinationUrl] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [addedToast, setAddedToast] = useState(false);

  // Query catalog from backend (backend filters to active 2 card products)
  const { data, isLoading, isError } = useQuery({
    queryKey: ['shop-products'],
    queryFn: () => api.getShopProducts(),
  });

  const handleOpenConfigModal = (product: ShopProduct) => {
    setSelectedProduct(product);
    setQuantity(1);
    setDestinationConfigured(true);
    setDestinationType('GOOGLE_REVIEW');
    setDestinationUrl('');
    setUrlError(null);
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
  };

  const handleAddToCart = () => {
    if (!selectedProduct) return;

    if (destinationConfigured) {
      if (!destinationUrl.trim()) {
        setUrlError(isFa ? 'لطفاً لینک مقصد را وارد کنید' : 'Please enter destination URL');
        return;
      }
      if (!destinationUrl.startsWith('http://') && !destinationUrl.startsWith('https://')) {
        setUrlError(isFa ? 'آدرس اینترنتی باید با http:// یا https:// شروع شود' : 'URL must start with http:// or https://');
        return;
      }
    }

    addItem({
      productId: selectedProduct.id,
      productType: selectedProduct.product_type,
      productTitle: isFa ? selectedProduct.title_fa : selectedProduct.title_en,
      unitPrice: selectedProduct.unit_price,
      quantity: quantity,
      destinationConfigured: destinationConfigured,
      destinationType: destinationType,
      destinationUrl: destinationConfigured ? destinationUrl.trim() : undefined,
    });

    handleCloseModal();
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  return (
    <div className="space-y-12">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 end-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold">
              {isFa ? 'محصول با موفقیت به سبد خرید اضافه شد!' : 'Product added to cart!'}
            </span>
          </div>
        </div>
      )}

      {/* Hero Section — White + Blue Accent */}
      <section className="relative overflow-hidden rounded-3xl bg-white border border-slate-200 p-8 sm:p-12 shadow-sm">
        <div className="absolute top-0 end-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{isFa ? 'راهکار هوشمند نسل جدید نقد و بررسی' : 'Next-Gen Smart Review Platform'}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            {isFa ? (
              <>
                ثبت آسان‌تر نظرات مشتریان در گوگل <br />
                <span className="text-blue-600">تنها با یک لمس هوشمند</span>
              </>
            ) : (
              <>
                Collect More Google Reviews <br />
                <span className="text-blue-600">With One Simple Tap</span>
              </>
            )}
          </h1>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-2xl">
            {isFa
              ? 'کارت‌های هوشمند تپ‌ناو مجهز به فناوری NFC و کدهای QR اختصاصی هستند. بدون نیاز به نصب اپلیکیشن، مشتریان خود را مستقیماً به صفحه ثبت نظر گوگل، اینستاگرام یا منوی دیجیتال هدایت کنید.'
              : 'TapNow smart cards leverage certified NFC hardware and dynamic QR codes to route your customers directly to your Google Review page, Instagram, or digital menu with zero app installation.'}
          </p>

          {/* Key Value Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-semibold flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{isFa ? 'تراشه فوق سریع NTAG213' : 'Ultra-Fast NTAG213'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{isFa ? 'تغییر آنی لینک مقصد' : 'Cloud Redirection'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-semibold flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{isFa ? 'سازگار با ۱۰۰٪ گوشی‌ها' : 'Universal Support'}</span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-semibold flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{isFa ? 'افزایش امتیاز در گوگل' : 'Boost Google Rank'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Catalog Grid — EXACTLY 2 PRODUCTS */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              {isFa ? 'محصولات استاندارد تپ‌ناو' : 'TapNow Standard Products'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {isFa
                ? 'کارت‌های هوشمند سازمانی با طراحی یکپارچه سفید و آبی و کیفیت ساخت صنعتی'
                : 'Enterprise smart review cards in unified White + Blue finish with industrial durability'}
            </p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full self-start sm:self-auto">
            {isFa ? '۳ مدل فعال' : '3 Active Models'}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-96 rounded-3xl bg-white border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : isError || !data?.products?.length ? (
          <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-slate-500">
            {isFa ? 'خطا در بارگذاری محصولات کاتالوگ' : 'Failed to load catalog products'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {data.products.map((product) => {
              const isNfcQr = product.product_type === 'NFC_QR';
              return (
                <div
                  key={product.id}
                  className="rounded-3xl bg-white border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all duration-300 flex flex-col overflow-hidden group"
                >
                  {/* Physical Card Preview Container — Unified White + Blue Style */}
                  <div className="p-8 bg-gradient-to-b from-slate-50 to-blue-50/30 border-b border-slate-100 flex items-center justify-center relative">
                    {/* Badge */}
                    <div className="absolute top-4 start-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 border border-slate-200 text-[11px] font-bold text-slate-700 shadow-xs">
                      {product.product_type === 'NFC_QR' ? (
                        <>
                          <Radio className="w-3 h-3 text-blue-600" />
                          <span>NFC</span>
                          <span className="text-slate-300">+</span>
                          <QrCode className="w-3 h-3 text-blue-600" />
                          <span>QR</span>
                        </>
                      ) : product.product_type === 'QR_ONLY' ? (
                        <>
                          <QrCode className="w-3 h-3 text-blue-600" />
                          <span>فقط QR (اسکن)</span>
                        </>
                      ) : (
                        <>
                          <Radio className="w-3 h-3 text-blue-600" />
                          <span>فقط NFC (لمس مستقیم)</span>
                        </>
                      )}
                    </div>

                    {/* Interactive White + Blue Card Mockup */}
                    <div className="w-72 h-44 rounded-2xl bg-white border border-slate-200 shadow-md p-5 flex flex-col justify-between relative overflow-hidden transition-transform duration-300 group-hover:scale-[1.02]">
                      <div className="absolute -top-12 -end-12 w-32 h-32 bg-blue-600/10 rounded-full blur-xl pointer-events-none" />
                      
                      {/* Card Header Mockup */}
                      <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                            <Radio className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-black text-sm text-slate-900 tracking-tight">TapNow</span>
                            <span className="block text-[8px] font-bold text-blue-600">SMART CARD</span>
                          </div>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                          <Radio className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      {/* Card Center Message */}
                      <div className="text-center z-10">
                        <p className="text-xs font-bold text-slate-800">
                          {isNfcQr ? 'گوشی را نزدیک کنید یا QR را اسکن نمایید' : 'گوشی خود را به کارت نزدیک کنید'}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-0.5 font-medium">
                          {isNfcQr ? 'Instant Tap & Scan' : 'Touch & Redirect'}
                        </p>
                      </div>

                      {/* Card Footer Mockup */}
                      <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono z-10 pt-2 border-t border-slate-100">
                        <span>NTAG213 • WATERPROOF</span>
                        <div className="flex items-center gap-1 text-blue-600 font-bold">
                          <span>tapnow.ir</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-lg font-black text-slate-900">
                          {isFa ? product.title_fa : product.title_en}
                        </h3>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {isNfcQr ? 'پرفروش‌ترین' : 'طراحی مینیمال'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed">
                        {isFa ? product.description_fa : product.description_en}
                      </p>

                      {/* Feature Bullet Points */}
                      <div className="space-y-2 pt-2">
                        {(isFa ? product.features_fa : product.features_en).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                            <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price & Action Button */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[11px] text-slate-400 block">{isFa ? 'قیمت هر عدد' : 'Unit Price'}</span>
                        <span className="text-2xl font-black text-slate-900">
                          {product.unit_price.toLocaleString('fa-IR')}{' '}
                          <span className="text-xs font-normal text-slate-500">{isFa ? 'تومان' : 'Toman'}</span>
                        </span>
                      </div>

                      <Button
                        variant="primary"
                        onClick={() => handleOpenConfigModal(product)}
                        icon={<ShoppingBag className="w-4 h-4" />}
                      >
                        {isFa ? 'سفارش و تنظیم' : 'Configure & Buy'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Trust & Benefits Section */}
      <section className="rounded-3xl bg-white border border-slate-200 p-8 sm:p-10 shadow-sm space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h3 className="text-xl font-black text-slate-900">
            {isFa ? 'چرا کسب‌وکارهای پیشرو تپ‌ناو را انتخاب می‌کنند؟' : 'Why Leading Businesses Choose TapNow'}
          </h3>
          <p className="text-xs text-slate-500">
            {isFa
              ? 'سخت‌افزار اختصاصی با پشتیبانی ابری و قابلیت مدیریت متمرکز لینک‌ها'
              : 'Dedicated hardware backed by real-time cloud redirection and centralized management'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              {isFa ? 'عملکرد بدون تاخیر' : 'Zero Latency Experience'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isFa
                ? 'پاسخ‌دهی زیر ۲۰۰ میلی‌ثانیه برای هدایت مشتریان به صفحه ثبت نظر بدون اتلاف وقت.'
                : 'Sub-200ms response time ensures seamless redirection without waiting.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              {isFa ? 'لینک‌های ابری تغییرپذیر' : 'Dynamic Cloud Routing'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isFa
                ? 'هر زمان که بخواهید آدرس گوگل ریویو، اینستاگرام یا منوی خود را بدون تعویض فیزیکی کارت تغییر دهید.'
                : 'Update your review target link anytime from the portal without reprinting cards.'}
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">
              {isFa ? 'بدنه ضدآب و مقاوم PVC' : 'Industrial PVC Build'}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isFa
                ? 'کارت‌های پی‌وی‌سی چندلایه با روکش ضدخش UV، مناسب میز و پیشخوان رستوران‌ها و کافه‌ها.'
                : 'Multi-layer scratch-resistant PVC built for high-traffic restaurant and retail counters.'}
            </p>
          </div>
        </div>
      </section>

      {/* Clean Product Configuration Modal (Customization Hidden) */}
      <Modal
        isOpen={!!selectedProduct}
        onClose={handleCloseModal}
        title={
          selectedProduct
            ? isFa
              ? `تنظیم و افزودن ${selectedProduct.title_fa}`
              : `Configure ${selectedProduct.title_en}`
            : ''
        }
        subtitle={isFa ? 'تنظیم مقصد هدایت کارت و تعیین تعداد سفارش' : 'Select destination link and quantity'}
        maxWidth="lg"
      >
        {selectedProduct && (
          <div className="space-y-6">
            {/* Step 1: Destination Mode Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">
                {isFa ? 'نحوه اتصال و تنظیم لینک کارت' : 'Destination Configuration'}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDestinationConfigured(true)}
                  className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                    destinationConfigured
                      ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900">
                      {isFa ? 'تنظیم همین حالا' : 'Configure Now'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      {isFa ? 'پیشنهادی' : 'Recommended'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {isFa
                      ? 'کارت به صورت فعال و آماده استفاده با لینک نظرخواهی شما ارسال می‌شود.'
                      : 'Card is pre-programmed and ready to use immediately upon delivery.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setDestinationConfigured(false)}
                  className={`p-4 rounded-2xl border text-start transition-all cursor-pointer ${
                    !destinationConfigured
                      ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900">
                      {isFa ? 'تنظیم بعداً (کارت خام)' : 'Configure Later'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {isFa
                      ? 'کارت به صورت خام ارسال شده و بعداً از طریق پرتال فعال‌سازی تنظیم می‌شود.'
                      : 'Card arrives unprogrammed; activate and set link via portal after delivery.'}
                  </p>
                </button>
              </div>
            </div>

            {/* Destination URL Input */}
            {destinationConfigured && (
              <div className="space-y-4 p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
                    {isFa ? 'نوع مقصد' : 'Destination Type'}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'GOOGLE_REVIEW', label: isFa ? 'گوگل ریویو' : 'Google Review' },
                      { id: 'INSTAGRAM', label: isFa ? 'اینستاگرام' : 'Instagram' },
                      { id: 'WEBSITE', label: isFa ? 'وب‌سایت' : 'Website' },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setDestinationType(type.id)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          destinationType === type.id
                            ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Input
                  label={isFa ? 'آدرس کامل لینک مقصد (URL)' : 'Destination URL'}
                  placeholder={
                    destinationType === 'GOOGLE_REVIEW'
                      ? 'https://g.page/r/your-business/review'
                      : destinationType === 'INSTAGRAM'
                      ? 'https://instagram.com/your_page'
                      : 'https://yourwebsite.com'
                  }
                  value={destinationUrl}
                  onChange={(e) => {
                    setDestinationUrl(e.target.value);
                    if (urlError) setUrlError(null);
                  }}
                  error={urlError || undefined}
                  helperText={
                    isFa
                      ? 'آدرس باید با https:// شروع شود و مشتری پس از لمس کارت به آن هدایت می‌شود.'
                      : 'Must begin with https:// and will be the target customer URL.'
                  }
                />
              </div>
            )}

            {/* Quantity Stepper & Price Calculation */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700">{isFa ? 'تعداد کارت' : 'Quantity'}</span>
                <p className="text-xs text-slate-500">
                  {(selectedProduct.unit_price * quantity).toLocaleString('fa-IR')}{' '}
                  <span className="text-[10px]">{isFa ? 'تومان' : 'Toman'}</span>
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-bold text-slate-900 font-mono text-sm">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(100, q + 1))}
                  className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="ghost" onClick={handleCloseModal}>
                {isFa ? 'انصراف' : 'Cancel'}
              </Button>
              <Button
                variant="primary"
                onClick={handleAddToCart}
                icon={<ShoppingBag className="w-4 h-4" />}
              >
                {isFa ? 'افزودن به سبد خرید' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
