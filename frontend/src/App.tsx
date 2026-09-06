import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageProvider } from './i18n/LanguageContext';
import { AuthProvider } from './features/shop/context/AuthContext';
import { CartProvider } from './features/shop/context/CartContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardOverview } from './features/dashboard/DashboardOverview';
import { BusinessesView } from './features/businesses/BusinessesView';
import { DestinationsView } from './features/destinations/DestinationsView';
import { OrdersView } from './features/orders/OrdersView';
import { AdminShopOrdersView } from './features/dashboard/AdminShopOrdersView';
import { AdminShippingRulesView } from './features/dashboard/AdminShippingRulesView';
import { CardsView } from './features/cards/CardsView';
import { QCFulfillmentView } from './features/qc/QCFulfillmentView';

// Public Shop Components
import { ShopShell } from './features/shop/ShopShell';
import { ShopCatalog } from './features/shop/ShopCatalog';
import { CartView } from './features/shop/CartView';
import { CheckoutView } from './features/shop/CheckoutView';
import { MyOrdersView } from './features/shop/MyOrdersView';
import { OrderSuccessView } from './features/shop/OrderSuccessView';
import { OrderTrackView } from './features/shop/OrderTrackView';
import { CardActivationView } from './features/shop/CardActivationView';
import { AdminAuthView } from './features/admin/AdminAuthView';

// Public Landing Component
import { TapNowLanding } from './features/landing/TapNowLanding';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 1000 * 10, // 10 seconds
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Landing Page */}
                <Route path="/" element={<TapNowLanding />} />
                <Route path="/landing" element={<TapNowLanding />} />

                {/* Public Storefront Routes */}
                <Route path="/shop" element={<ShopShell />}>
                  <Route index element={<ShopCatalog />} />
                  <Route path="cart" element={<CartView />} />
                  <Route path="checkout" element={<CheckoutView />} />
                  <Route path="my-orders" element={<MyOrdersView />} />
                  <Route path="success" element={<OrderSuccessView />} />
                  <Route path="track" element={<OrderTrackView />} />
                </Route>

                {/* Public Card Activation Routes */}
                <Route path="/activate" element={<ShopShell />}>
                  <Route index element={<CardActivationView />} />
                  <Route path=":code" element={<CardActivationView />} />
                </Route>

                {/* Internal Admin Management Routes */}
                <Route element={<AppShell />}>
                  <Route path="/dashboard" element={<DashboardOverview />} />
                  <Route path="/auth" element={<AdminAuthView />} />
                  <Route path="/businesses" element={<BusinessesView />} />
                  <Route path="/destinations" element={<DestinationsView />} />
                  <Route path="/orders" element={<OrdersView />} />
                  <Route path="/shop-orders" element={<AdminShopOrdersView />} />
                  <Route path="/shop-orders/:orderNumber" element={<AdminShopOrdersView />} />
                  <Route path="/shipping-rules" element={<AdminShippingRulesView />} />
                  <Route path="/cards" element={<CardsView />} />
                  <Route path="/qc" element={<QCFulfillmentView />} />
                </Route>

                {/* Fallback Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </BrowserRouter>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};
