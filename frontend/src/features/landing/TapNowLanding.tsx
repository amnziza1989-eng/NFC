import React, { useEffect } from 'react';
import { TapNowNavbar } from './TapNowNavbar';
import { TapNowHero } from './TapNowHero';
import { TapNowGoogleReviews } from './TapNowGoogleReviews';
import { TapNowHowItWorks } from './TapNowHowItWorks';
import { TapNowKeyAdvantage } from './TapNowKeyAdvantage';
import { TapNowBenefits } from './TapNowBenefits';
import { TapNowProducts } from './TapNowProducts';
import { TapNowAnalytics } from './TapNowAnalytics';
import { TapNowWhyTapNow } from './TapNowWhyTapNow';
import { TapNowFAQ } from './TapNowFAQ';
import { TapNowFooter } from './TapNowFooter';

export const TapNowLanding: React.FC = () => {
  useEffect(() => {
    document.title = 'TapNow | کارت هوشمند تعامل و رشد کسب‌وکار — نظر آسان در گوگل';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-500 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Navigation Header */}
      <TapNowNavbar />

      <main>
        {/* 1. Hero Section */}
        <TapNowHero />

        {/* 2. Google Reviews Friction Reducer Use Case */}
        <TapNowGoogleReviews />

        {/* 3. How It Works (4 Simple Steps) */}
        <TapNowHowItWorks />

        {/* 4. Core Differentiator & Key Advantage (Dynamic Destination Routing) */}
        <TapNowKeyAdvantage />

        {/* 5. 6 Core Value Benefits */}
        <TapNowBenefits />

        {/* 6. Physical Smart Products (NFC & NFC+QR) */}
        <TapNowProducts />

        {/* 7. Credible Interaction Analytics */}
        <TapNowAnalytics />

        {/* 8. Why TapNow (Head-to-head with traditional printed cards) */}
        <TapNowWhyTapNow />

        {/* 9. Interactive Persian FAQ */}
        <TapNowFAQ />
      </main>

      {/* 10. Final CTA & Footer */}
      <TapNowFooter />
    </div>
  );
};
