export type Language = 'fa' | 'en';

export interface TranslationSchema {
  appName: string;
  appTagline: string;
  nav: {
    dashboard: string;
    businesses: string;
    destinations: string;
    orders: string;
    cards: string;
    qc: string;
    settings: string;
  };
  header: {
    searchPlaceholder: string;
    systemHealthy: string;
    systemChecking: string;
    systemOffline: string;
    roleSuperAdmin: string;
    operator: string;
  };
  dashboard: {
    overviewTitle: string;
    overviewSubtitle: string;
    totalEvents: string;
    nfcEvents: string;
    qrEvents: string;
    totalCards: string;
    activeCards: string;
    totalBusinesses: string;
    activeBusinesses: string;
    quickActions: string;
    newBusiness: string;
    newDestination: string;
    newOrder: string;
    issueCard: string;
    openQC: string;
    recentLiveStream: string;
    noEvents: string;
    tapRatio: string;
  };
  businesses: {
    title: string;
    subtitle: string;
    createBtn: string;
    searchPlaceholder: string;
    allStatuses: string;
    name: string;
    logo: string;
    status: string;
    cardsCount: string;
    createdAt: string;
    actions: string;
    empty: string;
    analyticsTab: string;
    detailsTab: string;
    editDrawerTitle: string;
    editDrawerSubtitle: string;
  };
  destinations: {
    title: string;
    subtitle: string;
    createBtn: string;
    searchPlaceholder: string;
    businessName: string;
    type: string;
    url: string;
    status: string;
    actions: string;
    empty: string;
    editDrawerTitle: string;
    editDrawerSubtitle: string;
    openTarget: string;
  };
  orders: {
    title: string;
    subtitle: string;
    createBtn: string;
    searchPlaceholder: string;
    allStatuses: string;
    allProducts: string;
    orderNumber: string;
    business: string;
    destination: string;
    productType: string;
    physicalTemplate: string;
    quantity: string;
    generatedCards: string;
    status: string;
    createdAt: string;
    actions: string;
    empty: string;
    nfcOnly: string;
    nfcQr: string;
    nfcOnlyDesc: string;
    nfcQrDesc: string;
    generateCardsBtn: string;
    generateCardsSuccess: string;
    alreadyGenerated: string;
    noQrOnCard: string;
    detailDrawerTitle: string;
    detailDrawerSubtitle: string;
    cardsListHeading: string;
    statusCreated: string;
    statusGenerated: string;
    statusProvisioning: string;
    statusQcPending: string;
    statusCompleted: string;
    statusCancelled: string;
    reconciliationTitle: string;
    deliveryReadiness: string;
    readyForDelivery: string;
    notReady: string;
    blockingReasons: string;
    orderedVsGenerated: string;
    nfcQcProgress: string;
    qrQcProgress: string;
    destQcProgress: string;
    allQcPassed: string;
    qrNotApplicableNfcOnly: string;
    exportSectionTitle: string;
    exportCardsTitle: string;
    exportCardsDesc: string;
    exportCardsBtn: string;
    exportNfcTitle: string;
    exportNfcDesc: string;
    exportNfcBtn: string;
    exportQrTitle: string;
    exportQrDesc: string;
    exportQrBtn: string;
    exportQrDisabledNfcOnly: string;
    viewQrSheetBtn: string;
    qrSheetTitle: string;
    qrSheetSubtitle: string;
    printSheetBtn: string;
    closeSheet: string;
    labelSequence: string;
    labelCardCode: string;
  };
  cards: {
    title: string;
    subtitle: string;
    createBtn: string;
    searchPlaceholder: string;
    code: string;
    business: string;
    destination: string;
    status: string;
    qcStatus: string;
    actions: string;
    empty: string;
    inspectorTitle: string;
    nfcLink: string;
    qrLink: string;
    copySuccess: string;
    changeDestination: string;
    disableCard: string;
    enableCard: string;
    analyticsTab: string;
    hardwareTab: string;
  };
  qc: {
    title: string;
    subtitle: string;
    stationHeading: string;
    selectCard: string;
    nfcTested: string;
    qrTested: string;
    destinationVerified: string;
    qcPassed: string;
    qcPending: string;
    nfcUrlBadge: string;
    qrCodeBadge: string;
    downloadQR: string;
    markPassed: string;
  };
  analytics: {
    title: string;
    totalInteractions: string;
    nfcShare: string;
    qrShare: string;
    distributionChart: string;
    eventTimeline: string;
    recentEvents: string;
    noDataPeriod: string;
    dateFilter: string;
    presetAll: string;
    presetToday: string;
    preset7Days: string;
    preset30Days: string;
    presetCustom: string;
    startDate: string;
    endDate: string;
    invalidRange: string;
    applyFilter: string;
    resetFilter: string;
  };
  common: {
    active: string;
    disabled: string;
    save: string;
    cancel: string;
    edit: string;
    delete: string;
    copy: string;
    loading: string;
    error: string;
    retry: string;
    success: string;
    qcPassed: string;
    qcIncomplete: string;
    untested: string;
    viewDetails: string;
    close: string;
  };
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  fa: {
    appName: 'تپ‌ناو',
    appTagline: 'مدیریت و هدایت هوشمند کارت‌های NFC و QR',
    nav: {
      dashboard: 'داشبورد',
      businesses: 'کسب‌وکارها',
      destinations: 'مقاصد و لینک‌ها',
      orders: 'سفارش‌ها و صدور',
      cards: 'کارت‌های فیزیکی',
      qc: 'کنترل کیفیت و صدور',
      settings: 'تنظیمات',
    },
    header: {
      searchPlaceholder: 'جستجوی کارت (کد ۸ رقمی) یا کسب‌وکار...',
      systemHealthy: 'سامانه متصل و آماده',
      systemChecking: 'بررسی وضعیت...',
      systemOffline: 'عدم ارتباط با سرور',
      roleSuperAdmin: 'مدیر ارشد سامانه',
      operator: 'اپراتور صدور',
    },
    dashboard: {
      overviewTitle: 'نمای کلی پلتفرم',
      overviewSubtitle: 'آمار کل تعاملات، وضعیت سخت‌افزارها و کسب‌وکارهای فعال',
      totalEvents: 'کل تعاملات',
      nfcEvents: 'تپ‌های NFC',
      qrEvents: 'اسکن‌های QR',
      totalCards: 'کل کارت‌های صادرشده',
      activeCards: 'کارت‌های فعال',
      totalBusinesses: 'کسب‌وکارهای عضو',
      activeBusinesses: 'کسب‌وکارهای فعال',
      quickActions: 'عملیات سریع',
      newBusiness: 'ثبت کسب‌وکار جدید',
      newDestination: 'تعریف مقصد جدید',
      newOrder: 'ثبت سفارش مشتری',
      issueCard: 'صدور کارت فیزیکی',
      openQC: 'میز کار کنترل کیفیت (QC)',
      recentLiveStream: 'جریان زنده تعاملات اخیر',
      noEvents: 'هنوز تعاملی ثبت نشده است',
      tapRatio: 'نسبت تعامل NFC به QR',
    },
    businesses: {
      title: 'مدیریت کسب‌وکارها',
      subtitle: 'لیست، جستجو و پیکربندی کسب‌وکارهای ثبت‌شده در سامانه',
      createBtn: 'کسب‌وکار جدید',
      searchPlaceholder: 'جستجوی نام کسب‌وکار...',
      allStatuses: 'همه وضعیت‌ها',
      name: 'نام کسب‌وکار',
      logo: 'لوگو',
      status: 'وضعیت',
      cardsCount: 'تعداد کارت‌ها',
      createdAt: 'تاریخ ثبت',
      actions: 'عملیات',
      empty: 'هیچ کسب‌وکاری ثبت نشده است',
      analyticsTab: 'آمار و تحلیل',
      detailsTab: 'ویرایش مشخصات',
      editDrawerTitle: 'شناسنامه و آمار کسب‌وکار',
      editDrawerSubtitle: 'مشاهده آمار تعاملات و ویرایش مشخصات کسب‌وکار',
    },
    destinations: {
      title: 'مدیریت مقاصد و لینک‌ها',
      subtitle: 'پیکربندی لینک‌های ثبت نظر گوگل، اینستاگرام و وب‌سایت',
      createBtn: 'مقصد جدید',
      searchPlaceholder: 'جستجو در مقاصد...',
      businessName: 'کسب‌وکار مرتبط',
      type: 'نوع مقصد',
      url: 'آدرس لینک هدایت',
      status: 'وضعیت',
      actions: 'عملیات',
      empty: 'هیچ مقصدی تعریف نشده است',
      editDrawerTitle: 'ویرایش لینک مقصد',
      editDrawerSubtitle: 'تنظیم مجدد آدرس مقصد بدون نیاز به تعویض کارت فیزیکی',
      openTarget: 'تست باز کردن لینک',
    },
    orders: {
      title: 'مدیریت سفارش‌ها و صدور هویت دیجیتال',
      subtitle: 'تولید کارت‌های دیجیتال پس از خرید مشتری و رهگیری قالب‌های فیزیکی',
      createBtn: 'ثبت سفارش مشتری',
      searchPlaceholder: 'جستجو با شماره سفارش (مثلاً ORD-)...',
      allStatuses: 'همه وضعیت‌ها',
      allProducts: 'همه محصولات',
      orderNumber: 'شماره سفارش',
      business: 'کسب‌وکار',
      destination: 'مقصد هدایت',
      productType: 'نوع کارت فیزیکی',
      physicalTemplate: 'قالب فیزیکی',
      quantity: 'تعداد سفارش',
      generatedCards: 'کارت‌های تولیدشده',
      status: 'وضعیت سفارش',
      createdAt: 'تاریخ ثبت',
      actions: 'عملیات',
      empty: 'هیچ سفارشی یافت نشد',
      nfcOnly: 'کارت NFC خالص (بدون QR)',
      nfcQr: 'کارت دوگانه NFC + QR',
      nfcOnlyDesc: 'قالب آماده و چاپ‌شده کارخانه‌ای فقط با چیپ NFC، بدون چاپ کد QR روی کارت',
      nfcQrDesc: 'قالب آماده کارخانه‌ای دارای فضای اختصاصی برای کد تصویری QR پویا',
      generateCardsBtn: 'تولید هویت دیجیتال کارت‌ها',
      generateCardsSuccess: 'کارت‌های این سفارش با موفقیت در دیتابیس تولید شدند',
      alreadyGenerated: 'کارت‌های این سفارش قبلاً تولید شده‌اند (محافظت در برابر تکرار)',
      noQrOnCard: 'محصول NFC خالص: چاپ QR روی کارت فیزیکی وجود ندارد',
      detailDrawerTitle: 'شناسنامه و میزکار صدور سفارش',
      detailDrawerSubtitle: 'مشاهده جزئیات سفارش، انکود NFC و رهگیری وضعیت QC',
      cardsListHeading: 'کارت‌های دیجیتال تولیدشده برای این سفارش',
      statusCreated: 'سفارش ثبت شد',
      statusGenerated: 'کارت‌ها تولید شد',
      statusProvisioning: 'در حال انکود NFC',
      statusQcPending: 'در انتظار تست QC',
      statusCompleted: 'تکمیل و ارسال شد',
      statusCancelled: 'لغو شده',
      reconciliationTitle: 'سنجش بسته‌بندی و بررسی نهایی تحویل سفارش',
      deliveryReadiness: 'وضعیت تحویل نهایی',
      readyForDelivery: 'آماده تحویل و ارسال',
      notReady: 'نیازمند تکمیل مراحل',
      blockingReasons: 'موارد مانع تحویل (اقدام فوری):',
      orderedVsGenerated: 'تولید کارت‌های دیجیتال',
      nfcQcProgress: 'تست فیزیکی چیپ NFC',
      qrQcProgress: 'تست فیزیکی کد QR',
      destQcProgress: 'تایید صفحه مقصد',
      allQcPassed: 'تایید کامل QC',
      qrNotApplicableNfcOnly: 'محصول NFC خالص (عدم نیاز به تست و چاپ QR)',
      exportSectionTitle: 'خروجی‌های دسته‌ای و فایل‌های انکود سخت‌افزاری',
      exportCardsTitle: 'گزارش جامع سفارش',
      exportCardsDesc: 'فایل CSV حاوی رکورد کامل کارت‌ها، شامل کد، نام کسب‌وکار، نوع محصول و لینک‌های هدایت نهایی. مناسب برای بایگانی و گزارش‌گیری عمومی.',
      exportCardsBtn: 'دانلود گزارش جامع',
      exportNfcTitle: 'فایل انکود سخت‌افزاری NFC',
      exportNfcDesc: 'خروجی اختصاصی ماشین‌های انکودر NFC (شامل Card Code و NFC Write URL) جهت برنامه‌ریزی دسته‌ای چیپ‌های فیزیکی.',
      exportNfcBtn: 'دانلود فایل ماشین انکود',
      exportQrTitle: 'فایل چاپ اطلاعات متغیر QR',
      exportQrDesc: 'دیتاست اختصاصی جهت وارد کردن به سیستم‌های چاپ اطلاعات متغیر (VDP). شامل لینک تصویر QR و کدهای متناظر.',
      exportQrBtn: 'دانلود فایل چاپ متغیر',
      exportQrDisabledNfcOnly: 'خروجی QR برای این محصول وجود ندارد (NFC Only)',
      viewQrSheetBtn: 'برگه چاپ لیبل‌های QR',
      qrSheetTitle: 'برگه استاندارد چاپ لیبل‌های QR',
      qrSheetSubtitle: 'چیدمان استاندارد و آماده چاپ در مرورگر با تفکیک دقیق کد هر کارت',
      printSheetBtn: 'چاپ برگه لیبل‌ها (Browser Print)',
      closeSheet: 'بستن برگه',
      labelSequence: 'ردیف',
      labelCardCode: 'کد کارت',
    },
    cards: {
      title: 'مدیریت کارت‌های فیزیکی',
      subtitle: 'موجودی سخت‌افزار، کدهای یکتا و نگاشت به مقاصد فعال',
      createBtn: 'صدور تکی کارت',
      searchPlaceholder: 'جستجو با کد ۸ رقمی (مثلاً a3f7k9m2)...',
      code: 'کد کارت',
      business: 'کسب‌وکار',
      destination: 'مقصد فعال',
      status: 'وضعیت کارت',
      qcStatus: 'وضعیت QC',
      actions: 'عملیات',
      empty: 'کارتی یافت نشد',
      inspectorTitle: 'شناسنامه و بازرسی کارت',
      nfcLink: 'لینک تپ NFC',
      qrLink: 'لینک اسکن QR',
      copySuccess: 'کپی شد!',
      changeDestination: 'تغییر مقصد',
      disableCard: 'غیرفعال‌سازی',
      enableCard: 'فعال‌سازی',
      analyticsTab: 'آمار تعاملات',
      hardwareTab: 'اطلاعات سخت‌افزار',
    },
    qc: {
      title: 'میز کار کنترل کیفیت و صدور سخت‌افزار',
      subtitle: 'آزمایش فیزیکی چیپ‌های NFC، اسکن کدهای QR و تایید نهایی قبل از ارسال',
      stationHeading: 'آماده‌سازی و بسته‌بندی کارت',
      selectCard: 'انتخاب کارت جهت آزمایش',
      nfcTested: 'تست فیزیکی NFC انجام شد',
      qrTested: 'تست فیزیکی QR انجام شد',
      destinationVerified: 'تایید صفحه بازخورد مقصد',
      qcPassed: 'تایید کامل و آماده تحویل',
      qcPending: 'نیازمند آزمایش فیزیکی',
      nfcUrlBadge: 'آدرس چیپ NFC',
      qrCodeBadge: 'کد تصویری QR',
      downloadQR: 'دانلود تصویر باکیفیت QR',
      markPassed: 'ثبت تایید نهایی QC',
    },
    analytics: {
      title: 'تحلیل داده‌های تعامل',
      totalInteractions: 'مجموع تعاملات',
      nfcShare: 'سهم تپ NFC',
      qrShare: 'سهم اسکن QR',
      distributionChart: 'نمودار توزیع NFC و QR',
      eventTimeline: 'رویدادهای اخیر',
      recentEvents: 'جریان رویدادهای زنده',
      noDataPeriod: 'در این بازه زمانی هیچ تعاملی ثبت نشده است',
      dateFilter: 'فیلتر بازه زمانی',
      presetAll: 'همه زمان‌ها',
      presetToday: 'امروز',
      preset7Days: '۷ روز گذشته',
      preset30Days: '۳۰ روز گذشته',
      presetCustom: 'بازه دلخواه',
      startDate: 'از تاریخ',
      endDate: 'تا تاریخ',
      invalidRange: 'تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد',
      applyFilter: 'اعمال فیلتر',
      resetFilter: 'حذف فیلتر',
    },
    common: {
      active: 'فعال',
      disabled: 'غیرفعال',
      save: 'ذخیره تغییرات',
      cancel: 'انصراف',
      edit: 'ویرایش',
      delete: 'حذف',
      copy: 'کپی',
      loading: 'در حال بارگذاری...',
      error: 'خطا در برقراری ارتباط',
      retry: 'تلاش مجدد',
      success: 'عملیات با موفقیت انجام شد',
      qcPassed: 'تایید QC',
      qcIncomplete: 'QC ناقص',
      untested: 'آزمایش نشده',
      viewDetails: 'مشاهده و ویرایش',
      close: 'بستن',
    },
  },
  en: {
    appName: 'TapNow',
    appTagline: 'Smart NFC & QR Review Redirect Platform',
    nav: {
      dashboard: 'Dashboard',
      businesses: 'Businesses',
      destinations: 'Destinations',
      orders: 'Orders & Provisioning',
      cards: 'Physical Cards',
      qc: 'QC & Fulfillment',
      settings: 'Settings',
    },
    header: {
      searchPlaceholder: 'Search card code (8-chars) or business...',
      systemHealthy: 'System Operational',
      systemChecking: 'Checking status...',
      systemOffline: 'Server Disconnected',
      roleSuperAdmin: 'Platform Super Admin',
      operator: 'Fulfillment Operator',
    },
    dashboard: {
      overviewTitle: 'Platform Overview',
      overviewSubtitle: 'Total interactions, hardware telemetry, and active business metrics',
      totalEvents: 'Total Events',
      nfcEvents: 'NFC Taps',
      qrEvents: 'QR Scans',
      totalCards: 'Total Issued Cards',
      activeCards: 'Active Cards',
      totalBusinesses: 'Total Businesses',
      activeBusinesses: 'Active Businesses',
      quickActions: 'Quick Actions',
      newBusiness: 'New Business',
      newDestination: 'New Destination',
      newOrder: 'New Customer Order',
      issueCard: 'Issue Single Card',
      openQC: 'Open QC Station',
      recentLiveStream: 'Recent Live Interactions',
      noEvents: 'No interaction events logged yet',
      tapRatio: 'NFC to QR Tap Ratio',
    },
    businesses: {
      title: 'Business Management',
      subtitle: 'List, search, and configure registered businesses',
      createBtn: 'New Business',
      searchPlaceholder: 'Search by business name...',
      allStatuses: 'All Statuses',
      name: 'Business Name',
      logo: 'Logo',
      status: 'Status',
      cardsCount: 'Cards',
      createdAt: 'Created At',
      actions: 'Actions',
      empty: 'No businesses found',
      analyticsTab: 'Analytics',
      detailsTab: 'Edit Details',
      editDrawerTitle: 'Business Details & Analytics',
      editDrawerSubtitle: 'View real-time interaction metrics and update business settings',
    },
    destinations: {
      title: 'Destination Management',
      subtitle: 'Configure Google Review, Instagram, and web redirection targets',
      createBtn: 'New Destination',
      searchPlaceholder: 'Search destinations...',
      businessName: 'Linked Business',
      type: 'Destination Type',
      url: 'Target URL',
      status: 'Status',
      actions: 'Actions',
      empty: 'No destinations configured',
      editDrawerTitle: 'Edit Destination Link',
      editDrawerSubtitle: 'Dynamically update the target URL without replacing physical cards',
      openTarget: 'Test Open Target URL',
    },
    orders: {
      title: 'Order & Digital Provisioning Management',
      subtitle: 'Post-sale card generation, batch provisioning, and physical template tracking',
      createBtn: 'New Customer Order',
      searchPlaceholder: 'Search by order number (e.g., ORD-)...',
      allStatuses: 'All Statuses',
      allProducts: 'All Product Types',
      orderNumber: 'Order Number',
      business: 'Business',
      destination: 'Target Destination',
      productType: 'Card Product',
      physicalTemplate: 'Physical Template',
      quantity: 'Quantity',
      generatedCards: 'Generated Cards',
      status: 'Order Status',
      createdAt: 'Created At',
      actions: 'Actions',
      empty: 'No orders found',
      nfcOnly: 'NFC Only (No QR)',
      nfcQr: 'Hybrid NFC + QR',
      nfcOnlyDesc: 'Mass-produced blank physical card with NFC chip only; no QR printed on card',
      nfcQrDesc: 'Mass-produced blank physical card with NFC chip and dedicated dynamic QR code space',
      generateCardsBtn: 'Generate Digital Cards',
      generateCardsSuccess: 'Digital card identities created successfully',
      alreadyGenerated: 'Cards for this order are already generated (idempotency protected)',
      noQrOnCard: 'NFC Only Product: No QR printing required on card',
      detailDrawerTitle: 'Order Provisioning Workbench',
      detailDrawerSubtitle: 'View order details, write NFC chips, and track QC fulfillment',
      cardsListHeading: 'Digital Cards Generated for this Order',
      statusCreated: 'Order Created',
      statusGenerated: 'Cards Generated',
      statusProvisioning: 'Encoding NFC',
      statusQcPending: 'QC Pending',
      statusCompleted: 'Completed & Shipped',
      statusCancelled: 'Cancelled',
      reconciliationTitle: 'Packaging Reconciliation & Delivery Readiness',
      deliveryReadiness: 'Delivery Readiness',
      readyForDelivery: 'Ready for Delivery & Shipment',
      notReady: 'Not Ready for Delivery',
      blockingReasons: 'Fulfillment Blockers (Action Required):',
      orderedVsGenerated: 'Digital Cards Generated',
      nfcQcProgress: 'NFC Chip QC Tested',
      qrQcProgress: 'QR Code QC Tested',
      destQcProgress: 'Destination URL Verified',
      allQcPassed: 'All QC Passed',
      qrNotApplicableNfcOnly: 'NFC Only Product (QR Testing & Printing N/A)',
      exportSectionTitle: 'Batch Exports & Hardware Encoding Files',
      exportCardsTitle: 'General Order Report',
      exportCardsDesc: 'Full CSV record including Card Code, Business, Product Type, and Redirect URLs. Ideal for archiving and general reporting.',
      exportCardsBtn: 'Download General CSV',
      exportNfcTitle: 'NFC Hardware Encoding File',
      exportNfcDesc: 'Dedicated dataset for NFC encoder machines (contains Card Code and NFC Write URL) for batch programming physical chips.',
      exportNfcBtn: 'Download NFC Encoding CSV',
      exportQrTitle: 'Printable QR Variable Data',
      exportQrDesc: 'Dedicated dataset for Variable Data Printing (VDP) systems. Contains QR Image Links and corresponding codes.',
      exportQrBtn: 'Download QR VDP CSV',
      exportQrDisabledNfcOnly: 'No QR output for this product (NFC Only)',
      viewQrSheetBtn: 'Print QR Label Sheet',
      qrSheetTitle: 'QR Code Label Print Sheet',
      qrSheetSubtitle: 'Hardware-neutral printable sheet layout with unambiguous 1:1 card mapping',
      printSheetBtn: 'Print Label Sheet',
      closeSheet: 'Close Sheet',
      labelSequence: 'Seq #',
      labelCardCode: 'Card Code',
    },
    cards: {
      title: 'Physical Card Management',
      subtitle: 'Hardware card inventory, unique codes, and target mappings',
      createBtn: 'Issue Single Card',
      searchPlaceholder: 'Search by card code (e.g., a3f7k9m2)...',
      code: 'Card Code',
      business: 'Business',
      destination: 'Active Destination',
      status: 'Card Status',
      qcStatus: 'QC Status',
      actions: 'Actions',
      empty: 'No cards found',
      inspectorTitle: 'Card Inspector & Telemetry',
      nfcLink: 'NFC Tap URL',
      qrLink: 'QR Scan URL',
      copySuccess: 'Copied!',
      changeDestination: 'Change Target',
      disableCard: 'Disable Card',
      enableCard: 'Enable Card',
      analyticsTab: 'Analytics',
      hardwareTab: 'Hardware Info',
    },
    qc: {
      title: 'Quality Control & Fulfillment Station',
      subtitle: 'Hardware chip encoding, QR scan verification, and pre-shipment testing',
      stationHeading: 'Card Fulfillment Workbench',
      selectCard: 'Select Card to Inspect',
      nfcTested: 'NFC Tap Test Passed',
      qrTested: 'QR Scan Test Passed',
      destinationVerified: 'Destination Redirect Verified',
      qcPassed: 'QC Passed & Ready',
      qcPending: 'Testing Pending',
      nfcUrlBadge: 'NFC Chip URL',
      qrCodeBadge: 'Visual QR Code',
      downloadQR: 'Download High-Res QR',
      markPassed: 'Mark QC Verified',
    },
    analytics: {
      title: 'Interaction Analytics',
      totalInteractions: 'Total Interactions',
      nfcShare: 'NFC Tap Share',
      qrShare: 'QR Scan Share',
      distributionChart: 'NFC vs QR Distribution',
      eventTimeline: 'Recent Activity',
      recentEvents: 'Live Event Stream',
      noDataPeriod: 'No interaction data available for this time range',
      dateFilter: 'Date Range Filter',
      presetAll: 'All Time',
      presetToday: 'Today',
      preset7Days: 'Last 7 Days',
      preset30Days: 'Last 30 Days',
      presetCustom: 'Custom Range',
      startDate: 'Start Date',
      endDate: 'End Date',
      invalidRange: 'End date cannot be earlier than start date',
      applyFilter: 'Apply Filter',
      resetFilter: 'Reset Filter',
    },
    common: {
      active: 'ACTIVE',
      disabled: 'DISABLED',
      save: 'Save Changes',
      cancel: 'Cancel',
      edit: 'Edit',
      delete: 'Delete',
      copy: 'Copy',
      loading: 'Loading...',
      error: 'Connection error',
      retry: 'Retry',
      success: 'Operation completed successfully',
      qcPassed: 'QC Passed',
      qcIncomplete: 'QC Incomplete',
      untested: 'Untested',
      viewDetails: 'View & Edit',
      close: 'Close',
    },
  },
};
