import {
  Business,
  Destination,
  Order,
  OrderDetail,
  Card,
  DashboardOverview,
  BusinessAnalytics,
  CardAnalytics,
  CardProvisioning,
  CardInfo,
  CreateBusinessRequest,
  UpdateBusinessRequest,
  CreateDestinationRequest,
  UpdateDestinationRequest,
  CreateOrderRequest,
  UpdateOrderRequest,
  OrderCardGenerationResponse,
  OrderReconciliation,
  OrderQRLabels,
  CreateCardRequest,
  UpdateCardRequest,
  ShopCatalogResponse,
  ShopCheckoutRequest,
  ShopCheckoutResponse,
  ShopOrderTrackResponse,
  CardActivationVerifyResponse,
  CardActivationConfigureResponse,
  ShippingRuleResponse,
  ShippingQuoteResponse,
  ShippingRuleCreate,
  ShippingRuleUpdate,
  ShippingRuleBulkUpdate,
} from '../types/api';

export interface LinkedMethod {
  provider: 'PHONE' | 'EMAIL' | 'GOOGLE';
  provider_value: string;
  verified_at: string | null;
}

class ApiClient {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || '';
    this.apiKey = import.meta.env.VITE_API_KEY || localStorage.getItem('tapnow_api_key') || 'your-secure-api-key-here';
  }

  public setApiKey(key: string) {
    this.apiKey = key;
    localStorage.setItem('tapnow_api_key', key);
  }

  public getApiKey(): string {
    return this.apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const token = localStorage.getItem('tapnow_customer_token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-API-Key': this.apiKey,
      ...(options.headers as Record<string, string> || {}),
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          if (typeof errJson.detail === 'string') {
            errorMessage = errJson.detail;
          } else if (Array.isArray(errJson.detail)) {
            // FastAPI/Pydantic validation errors: pick the first error and make it human-readable
            const firstErr = errJson.detail[0];
            if (firstErr) {
              const field = firstErr.loc ? firstErr.loc.filter((l: any) => l !== 'body').join(' → ') : 'field';
              const msg = firstErr.msg || 'Invalid value';
              errorMessage = `خطای اعتبارسنجی: ${field} — ${msg}`;
            } else {
              errorMessage = 'خطا در اعتبارسنجی اطلاعات. لطفاً مقادیر وارد شده را بررسی کنید.';
            }
          } else {
            errorMessage = JSON.stringify(errJson.detail);
          }
        }
      } catch {
        // use default error message
      }

      if (response.status === 401 && (
        errorMessage.includes('Token has expired') ||
        errorMessage.includes('Invalid token') ||
        errorMessage.includes('Signature has expired') ||
        errorMessage.includes('Could not validate credentials')
      )) {
        localStorage.removeItem('tapnow_customer_token');
      }
      throw new Error(errorMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // Health
  public async getHealth(): Promise<{ status: string; service: string; version: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json();
  }

  // Dashboard
  public async getDashboardOverview(): Promise<DashboardOverview> {
    return this.request<DashboardOverview>('/api/v1/dashboard/overview');
  }

  // Businesses
  public async listBusinesses(params?: { search?: string; status?: string; skip?: number; limit?: number }): Promise<Business[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.skip !== undefined) query.append('skip', params.skip.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Business[]>(`/api/v1/businesses${qs}`);
  }

  public async getBusiness(id: string): Promise<Business> {
    return this.request<Business>(`/api/v1/businesses/${id}`);
  }

  public async createBusiness(data: CreateBusinessRequest): Promise<Business> {
    return this.request<Business>('/api/v1/businesses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateBusiness(id: string, data: UpdateBusinessRequest): Promise<Business> {
    return this.request<Business>(`/api/v1/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async getBusinessAnalytics(id: string, params?: { start_date?: string; end_date?: string }): Promise<BusinessAnalytics> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<BusinessAnalytics>(`/api/v1/businesses/${id}/analytics${qs}`);
  }

  // Destinations
  public async listDestinations(params?: { business_id?: string; status?: string; type?: string; skip?: number; limit?: number }): Promise<Destination[]> {
    const query = new URLSearchParams();
    if (params?.business_id) query.append('business_id', params.business_id);
    if (params?.status) query.append('status', params.status);
    if (params?.type) query.append('type', params.type);
    if (params?.skip !== undefined) query.append('skip', params.skip.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Destination[]>(`/api/v1/destinations${qs}`);
  }

  public async createDestination(data: CreateDestinationRequest): Promise<Destination> {
    const payload = {
      business_id: data.business_id,
      type: data.type || 'GOOGLE_REVIEW',
      source_url: data.source_url || data.url,
      url: data.url || data.source_url,
    };
    return this.request<Destination>('/api/v1/destinations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateDestination(id: string, data: UpdateDestinationRequest): Promise<Destination> {
    const payload: Record<string, any> = {};
    if (data.source_url || data.url) {
      payload.source_url = data.source_url || data.url;
      payload.url = data.url || data.source_url;
    }
    if (data.type) payload.type = data.type;
    if (data.status) payload.status = data.status;
    return this.request<Destination>(`/api/v1/destinations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async getDestination(id: string): Promise<Destination> {
    return this.request<Destination>(`/api/v1/destinations/${id}`, {
      method: 'GET'
    });
  }

  // --- Auth Admin APIs ---
  public async listIdentities(skip: number = 0, limit: number = 50): Promise<any[]> {
    return this.request<any[]>(`/api/v1/internal/auth/identities?skip=${skip}&limit=${limit}`);
  }

  public async listOtpSessions(skip: number = 0, limit: number = 50): Promise<any[]> {
    return this.request<any[]>(`/api/v1/internal/auth/otp-sessions?skip=${skip}&limit=${limit}`);
  }

  // Orders
  public async listOrders(params?: { search?: string; status?: string; business_id?: string; skip?: number; limit?: number }): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.status) query.append('status', params.status);
    if (params?.business_id) query.append('business_id', params.business_id);
    if (params?.skip !== undefined) query.append('skip', params.skip.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Order[]>(`/api/v1/orders${qs}`);
  }

  public async getOrder(id: string): Promise<OrderDetail> {
    return this.request<OrderDetail>(`/api/v1/orders/${id}`);
  }

  public async createOrder(data: CreateOrderRequest): Promise<Order> {
    return this.request<Order>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateOrder(id: string, data: UpdateOrderRequest): Promise<Order> {
    return this.request<Order>(`/api/v1/orders/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async generateOrderCards(id: string): Promise<OrderCardGenerationResponse> {
    return this.request<OrderCardGenerationResponse>(`/api/v1/orders/${id}/generate-cards`, {
      method: 'POST',
    });
  }

  public async listOrderCards(id: string): Promise<CardInfo[]> {
    return this.request<CardInfo[]>(`/api/v1/orders/${id}/cards`);
  }

  public async getOrderReconciliation(id: string): Promise<OrderReconciliation> {
    return this.request<OrderReconciliation>(`/api/v1/orders/${id}/reconciliation`);
  }

  public async getOrderQRLabels(id: string): Promise<OrderQRLabels> {
    return this.request<OrderQRLabels>(`/api/v1/orders/${id}/qr-labels`);
  }

  public async downloadOrderCSV(id: string, exportType: 'cards' | 'nfc' | 'qr'): Promise<void> {
    const url = `${this.baseUrl}/api/v1/orders/${id}/export/${exportType}.csv`;
    const response = await fetch(url, {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: Failed to export CSV`;
      try {
        const errJson = await response.json();
        if (errJson.detail) {
          errorMessage = typeof errJson.detail === 'string' ? errJson.detail : JSON.stringify(errJson.detail);
        }
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    
    // Extract filename from header or fallback
    const disposition = response.headers.get('Content-Disposition');
    let filename = `order_${id}_${exportType}.csv`;
    if (disposition && disposition.includes('filename=')) {
      const matches = /filename="?([^"]+)"?/.exec(disposition);
      if (matches && matches[1]) {
        filename = matches[1];
      }
    }
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }

  // Cards
  public async listCards(params?: { business_id?: string; destination_id?: string; order_id?: string; status?: string; code?: string; search?: string; skip?: number; limit?: number }): Promise<Card[]> {
    const query = new URLSearchParams();
    if (params?.business_id) query.append('business_id', params.business_id);
    if (params?.destination_id) query.append('destination_id', params.destination_id);
    if (params?.order_id) query.append('order_id', params.order_id);
    if (params?.status) query.append('status', params.status);
    if (params?.code) query.append('code', params.code);
    if (params?.search) query.append('search', params.search);
    if (params?.skip !== undefined) query.append('skip', params.skip.toString());
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<Card[]>(`/api/v1/cards${qs}`);
  }

  public async getCard(id: string): Promise<Card> {
    return this.request<Card>(`/api/v1/cards/${id}`);
  }

  public async createCard(data: CreateCardRequest): Promise<Card> {
    return this.request<Card>('/api/v1/cards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async updateCard(id: string, data: UpdateCardRequest): Promise<Card> {
    return this.request<Card>(`/api/v1/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  public async getCardInfo(id: string): Promise<CardInfo> {
    return this.request<CardInfo>(`/api/v1/cards/${id}/info`);
  }

  public async getCardProvisioning(id: string): Promise<CardProvisioning> {
    return this.request<CardProvisioning>(`/api/v1/cards/${id}/provisioning`);
  }

  public async getCardAnalytics(id: string, params?: { start_date?: string; end_date?: string }): Promise<CardAnalytics> {
    const query = new URLSearchParams();
    if (params?.start_date) query.append('start_date', params.start_date);
    if (params?.end_date) query.append('end_date', params.end_date);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<CardAnalytics>(`/api/v1/cards/${id}/analytics${qs}`);
  }

  // ── Public Shop ───────────────────────────────────────────────────
  public async getShopProducts(): Promise<ShopCatalogResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/public/shop/products`);
    if (!res.ok) {
      throw new Error(`Failed to load products: HTTP ${res.status}`);
    }
    return res.json();
  }

  public async checkoutShop(data: ShopCheckoutRequest): Promise<ShopCheckoutResponse> {
    // Uses this.request() so the Authorization: Bearer token header is included automatically.
    return this.request<ShopCheckoutResponse>('/api/v1/public/shop/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Shop Orders (Admin)
  public async getAdminShopOrders(params?: { status?: string, limit?: number }): Promise<ShopCheckoutResponse[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.limit !== undefined) query.append('limit', params.limit.toString());
    
    const qs = query.toString();
    const path = qs ? `/api/v1/shop-orders?${qs}` : '/api/v1/shop-orders';
    return this.request<ShopCheckoutResponse[]>(path);
  }

  public async shipShopOrder(
    shopOrderId: string,
    trackingCode?: string,
    forceResend?: boolean,
    courierPhone?: string
  ): Promise<ShopCheckoutResponse> {
    return this.request<ShopCheckoutResponse>(`/api/v1/shop-orders/${shopOrderId}/ship`, {
      method: 'PATCH',
      body: JSON.stringify({
        tracking_code: trackingCode || undefined,
        courier_phone: courierPhone || undefined,
        force_resend: forceResend || false
      })
    });
  }

  public async updateShopOrderItemLink(
    itemId: string,
    linkStatus: string,
    finalVerifiedUrl?: string | null
  ): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/v1/shop-order-items/${itemId}/link`, {
      method: 'PATCH',
      body: JSON.stringify({
        link_status: linkStatus,
        final_verified_url: finalVerifiedUrl || null
      })
    });
  }

  public async updateShopOrderItemProduction(
    itemId: string,
    productionStatus: string
  ): Promise<{ status: string }> {
    return this.request<{ status: string }>(`/api/v1/shop-order-items/${itemId}/production`, {
      method: 'PATCH',
      body: JSON.stringify({
        production_status: productionStatus
      })
    });
  }

  public async confirmShopOrderItemLink(
    itemId: string,
    finalVerifiedUrl: string
  ): Promise<{ status: string; item_id: string; final_verified_url: string; link_status: string; production_status: string }> {
    return this.request<{ status: string; item_id: string; final_verified_url: string; link_status: string; production_status: string }>(
      `/api/v1/shop-order-items/${itemId}/confirm-link`,
      {
        method: 'POST',
        body: JSON.stringify({
          final_verified_url: finalVerifiedUrl,
        }),
      }
    );
  }

  public async generateShopOrderItemCards(
    itemId: string
  ): Promise<{ status: string; generated_count: number; cards: any[] }> {
    return this.request<{ status: string; generated_count: number; cards: any[] }>(
      `/api/v1/shop-order-items/${itemId}/generate-cards`,
      {
        method: 'POST',
      }
    );
  }

  public async updateCardQC(
    cardId: string,
    qc: { qc_nfc_tested?: boolean; qc_qr_tested?: boolean; qc_destination_verified?: boolean }
  ): Promise<any> {
    return this.request<any>(`/api/v1/cards/${cardId}`, {
      method: 'PATCH',
      body: JSON.stringify(qc),
    });
  }

  public async getShopOrder(orderNumber: string): Promise<ShopCheckoutResponse> {
    return this.request<ShopCheckoutResponse>(`/api/v1/public/shop/orders/${orderNumber}`);
  }

  public async getMyOrders(): Promise<ShopCheckoutResponse[]> {
    return this.request<ShopCheckoutResponse[]>('/api/v1/public/shop/my-orders');
  }

  // Auth
  public async requestOtp(provider: 'PHONE' | 'EMAIL' | 'GOOGLE', providerValue: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/v1/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ provider, provider_value: providerValue }),
    });
  }

  public async verifyOtp(provider: 'PHONE' | 'EMAIL' | 'GOOGLE', providerValue: string, code: string): Promise<{ access_token: string, customer_id: string, name?: string }> {
    return this.request<{ access_token: string, customer_id: string, name?: string }>('/api/v1/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ provider, provider_value: providerValue, code }),
    });
  }

  public async mockGoogleLogin(email: string, name?: string): Promise<{ access_token: string, customer_id: string, name?: string }> {
    return this.request<{ access_token: string, customer_id: string, name?: string }>('/api/v1/auth/mock-google-login', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  public async getLinkedMethods(): Promise<LinkedMethod[]> {
    return this.request<LinkedMethod[]>('/api/v1/auth/methods');
  }

  public async requestProviderLink(provider: 'PHONE' | 'EMAIL', providerValue: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/v1/auth/link-provider/request', {
      method: 'POST',
      body: JSON.stringify({ provider, provider_value: providerValue }),
    });
  }

  public async verifyProviderLink(provider: 'PHONE' | 'EMAIL' | 'GOOGLE', providerValue: string, code?: string): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/v1/auth/link-provider/verify', {
      method: 'POST',
      body: JSON.stringify({ provider, provider_value: providerValue, code }),
    });
  }

  public async trackShopOrder(orderNumber: string, verificationContact: string): Promise<ShopOrderTrackResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/public/shop/orders/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        order_number: orderNumber,
        verification_contact: verificationContact,
      }),
    });

    if (!res.ok) {
      let errorMessage = 'اطلاعات وارد شده با مشخصات سفارش مطابقت ندارد.';
      try {
        const errJson = await res.json();
        if (errJson.detail && typeof errJson.detail === 'string') {
          errorMessage = errJson.detail;
        }
      } catch {
        // fallback
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  public async uploadShopLogo(file: File): Promise<{ logo_url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${this.baseUrl}/api/v1/public/shop/upload-logo`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      let errorMessage = 'خطا در بارگذاری لوگو';
      try {
        const errJson = await res.json();
        if (errJson.detail && typeof errJson.detail === 'string') {
          errorMessage = errJson.detail;
        }
      } catch {
        // fallback
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  public async verifyCardActivation(
    cardCode: string,
    orderNumber: string,
    verificationContact: string
  ): Promise<CardActivationVerifyResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/public/activation/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        card_code: cardCode,
        order_number: orderNumber,
        verification_contact: verificationContact,
      }),
    });

    if (!res.ok) {
      let errorMessage = 'اطلاعات فعال‌سازی کارت معتبر نمی‌باشد.';
      try {
        const errJson = await res.json();
        if (errJson.detail && typeof errJson.detail === 'string') {
          errorMessage = errJson.detail;
        }
      } catch {
        // fallback
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  public async configureCardActivation(
    activationToken: string,
    destinationType: string,
    destinationUrl: string
  ): Promise<CardActivationConfigureResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/public/activation/configure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activation_token: activationToken,
        destination_type: destinationType,
        destination_url: destinationUrl,
      }),
    });

    if (!res.ok) {
      let errorMessage = 'خطا در تنظیم آدرس مقصد کارت.';
      try {
        const errJson = await res.json();
        if (errJson.detail && typeof errJson.detail === 'string') {
          errorMessage = errJson.detail;
        }
      } catch {
        // fallback
      }
      throw new Error(errorMessage);
    }

    return res.json();
  }

  // ── Shipping Rules ───────────────────────────────────────────────

  public async getShippingRules(): Promise<ShippingRuleResponse[]> {
    const res = await fetch(`${this.baseUrl}/api/v1/public/shop/shipping-rules`);
    if (!res.ok) throw new Error('Failed to fetch shipping rules');
    return res.json();
  }

  public async getShippingQuote(province: string, shippingMethod: string = 'POST'): Promise<ShippingQuoteResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/public/shop/shipping-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ province, shipping_method: shippingMethod }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'خطا در محاسبه هزینه ارسال');
    }
    return res.json();
  }

  public async getAdminShippingRules(): Promise<ShippingRuleResponse[]> {
    return this.request<ShippingRuleResponse[]>('/api/v1/shop/shipping-rules');
  }

  public async updateAdminShippingRule(ruleId: string, data: ShippingRuleUpdate): Promise<ShippingRuleResponse> {
    return this.request<ShippingRuleResponse>(`/api/v1/shop/shipping-rules/${ruleId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async createAdminShippingRule(data: ShippingRuleCreate): Promise<ShippingRuleResponse> {
    return this.request<ShippingRuleResponse>('/api/v1/shop/shipping-rules', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async bulkUpdateAdminShippingRules(data: ShippingRuleBulkUpdate): Promise<ShippingRuleResponse[]> {
    return this.request<ShippingRuleResponse[]>('/api/v1/shop/shipping-rules/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const api = new ApiClient();

