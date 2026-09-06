export type EntityStatus = 'ACTIVE' | 'DISABLED';
export type EventType = 'NFC' | 'QR';

export type ProductType = 'NFC_ONLY' | 'NFC_QR' | 'QR_ONLY' | 'RAW_CARD';

export type OrderStatus =
  | 'CREATED'
  | 'CARDS_GENERATED'
  | 'PROVISIONING'
  | 'QC_PENDING'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Business {
  id: string;
  name: string;
  logo_url: string | null;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  business_id: string;
  type: string;
  url: string;
  source_url?: string;
  status: EntityStatus;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  business_id: string;
  destination_id: string;
  product_type: ProductType;
  physical_template: string;
  quantity: number;
  cards_generated_count: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
}

export interface OrderDetail extends Order {
  business_name: string;
  destination_url: string;
  destination_type: string;
}

export interface Card {
  id: string;
  business_id: string;
  destination_id: string;
  order_id?: string | null;
  code: string;
  status: EntityStatus;
  qc_nfc_tested: boolean;
  qc_qr_tested: boolean;
  qc_destination_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface CardEvent {
  id: string;
  card_id: string;
  type: EventType;
  user_agent: string | null;
  created_at: string;
}

export interface DashboardOverview {
  total_businesses: number;
  active_businesses: number;
  total_cards: number;
  active_cards: number;
  total_events: number;
  nfc_events: number;
  qr_events: number;
}

export interface BusinessAnalytics {
  total: number;
  nfc: number;
  qr: number;
  total_cards: number;
  active_cards: number;
  recent: CardEvent[];
}

export interface CardAnalytics {
  total: number;
  nfc: number;
  qr: number;
  recent: CardEvent[];
}

export interface CardProvisioning {
  card_id: string;
  card_code: string;
  status: EntityStatus;
  nfc_url: string;
  qr_url: string;
  qr_image_url: string;
  business: Business;
  destination: Destination;
  qc_nfc_tested: boolean;
  qc_qr_tested: boolean;
  qc_destination_verified: boolean;
}

export interface CardInfo {
  id: string;
  code: string;
  status: EntityStatus;
  business_name: string;
  destination_url: string;
  destination_type: string;
  destination_status: string;
  nfc_url: string;
  qr_url: string;
  order_id?: string | null;
  created_at: string;
  recent_events: CardEvent[];
  qc_nfc_tested?: boolean;
  qc_qr_tested?: boolean;
  qc_destination_verified?: boolean;
}

export interface CreateBusinessRequest {
  name: string;
  logo_url?: string | null;
}

export interface UpdateBusinessRequest {
  name?: string;
  logo_url?: string | null;
  status?: EntityStatus;
}

export interface CreateDestinationRequest {
  business_id: string;
  type?: string;
  url?: string;
  source_url?: string;
}

export interface UpdateDestinationRequest {
  url?: string;
  source_url?: string;
  type?: string;
  status?: EntityStatus;
}

export interface CreateOrderRequest {
  business_id: string;
  destination_id: string;
  product_type: ProductType;
  quantity: number;
}

export interface UpdateOrderRequest {
  status: OrderStatus;
}

export interface OrderCardGenerationResponse {
  order_id: string;
  order_number: string;
  product_type: ProductType;
  physical_template: string;
  requested_quantity: number;
  generated_count: number;
  status: OrderStatus;
  cards: Card[];
}

export interface OrderReconciliation {
  order_id: string;
  order_number: string;
  product_type: ProductType;
  physical_template: string;
  ordered_quantity: number;
  cards_generated_count: number;
  missing_cards_count: number;
  is_nfc_only: boolean;
  qc_nfc_passed_count: number;
  qc_qr_passed_count: number;
  qc_destination_verified_count: number;
  all_qc_passed_count: number;
  is_ready_for_delivery: boolean;
  blocking_reasons: string[];
}

export interface QRLabelItem {
  card_id: string;
  card_code: string;
  qr_url: string;
  qr_image_url: string;
  sequence_number: number;
  order_number: string;
  business_name: string;
}

export interface OrderQRLabels {
  order_id: string;
  order_number: string;
  business_name: string;
  product_type: string;
  total_labels: number;
  labels: QRLabelItem[];
}

export interface CreateCardRequest {
  business_id: string;
  destination_id: string;
  order_id?: string | null;
}

export interface UpdateCardRequest {
  status?: EntityStatus;
  destination_id?: string;
  qc_nfc_tested?: boolean;
  qc_qr_tested?: boolean;
  qc_destination_verified?: boolean;
}

// ── Shop Interfaces ────────────────────────────────────────────────

export interface ShopProduct {
  id: string;
  title_fa: string;
  title_en: string;
  product_type: ProductType;
  physical_template: string;
  unit_price: number;
  currency: string;
  description_fa: string;
  description_en: string;
  features_fa: string[];
  features_en: string[];
  is_available: boolean;
  supported_destination_types: string[];
}

export interface ShopCatalogResponse {
  products: ShopProduct[];
}

export interface ShopCartItemInput {
  product_type: ProductType;
  product_title: string;
  unit_price: number;
  quantity: number;
  destination_configured: boolean;
  destination_type: string;
  destination_url?: string | null;
  customization_logo_url?: string | null;
  customization_color?: string | null;
  customization_template?: string | null;
}

export type ShippingMethod = 'POST' | 'COURIER';
export type NotificationStatus = 'NOT_SENT' | 'PENDING' | 'SENT' | 'FAILED';

export interface ShopCustomerInput {
  name: string;
  email: string;
  phone: string;
  company_name?: string | null;
}

export interface ShopShippingInput {
  address: string;
  city: string;
  province?: string | null;
  postal_code: string;
  notes?: string | null;
  shipping_method?: ShippingMethod;
}

export interface ShopCheckoutRequest {
  customer: ShopCustomerInput;
  shipping: ShopShippingInput;
  items: ShopCartItemInput[];
  idempotency_key?: string | null;
}

export interface CardItemResponse {
  id: string;
  code: string;
  status: string;
  nfc_url: string;
  qr_url: string;
  qr_image_url: string;
  qc_nfc_tested: boolean;
  qc_qr_tested: boolean;
  qc_destination_verified: boolean;
  created_at: string;
}

export interface ShopOrderItemResponse {
  id: string;
  product_type: ProductType;
  product_title: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  destination_type: string;
  customer_submitted_url?: string | null;
  final_verified_url?: string | null;
  link_status: string;
  production_status: 'NOT_PRODUCED' | 'PROVISIONING' | 'QC_PENDING' | 'COMPLETED';
  destination_configured: boolean;
  customization_logo_url?: string | null;
  customization_color?: string | null;
  customization_template?: string | null;
  fulfillment_order_number?: string | null;
  fulfillment_order_id?: string | null;
  internal_nfc_url?: string | null;
  internal_qr_url?: string | null;
  qr_image_url?: string | null;
  is_nfc_required?: boolean;
  is_qr_required?: boolean;
  cards?: CardItemResponse[];
  cards_count?: number;
  cards_completed_count?: number;
}

export interface ShopCheckoutResponse {
  shop_order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  company_name?: string | null;
  shipping_address: string;
  shipping_city: string;
  shipping_province?: string | null;
  shipping_postal_code: string;
  shipping_notes?: string;
  shipping_method?: ShippingMethod;
  shipping_tracking_code?: string | null;
  shipped_at?: string | null;
  shipping_notification_status?: NotificationStatus;
  shipping_notification_sent_at?: string | null;
  shipping_notification_error?: string | null;
  shipping_notification_provider_ref?: string | null;
  shipping_cost?: number;
  total_amount: number;
  payment_status: string;
  payment_reference: string;
  status: string;
  fulfillment_status: 'AWAITING_PRODUCTION' | 'PENDING' | 'PARTIALLY_COMPLETED' | 'READY_TO_SHIP' | 'SHIPPED' | 'COMPLETED';
  ready_to_ship: boolean;
  blocking_reasons: string[];
  created_at: string;
  items: ShopOrderItemResponse[];
  fulfillment_order_numbers: string[];
}

export interface ShippingRuleResponse {
  id: string;
  province: string;
  postal_price: number;
  courier_available: boolean;
  courier_price: number;
  active: boolean;
}

export interface ShippingRuleCreate {
  province: string;
  postal_price: number;
  courier_available?: boolean;
  courier_price?: number;
  active?: boolean;
}

export interface ShippingRuleUpdate {
  postal_price: number;
  courier_available: boolean;
  courier_price: number;
  active?: boolean;
}

export interface ShippingRuleBulkUpdate {
  rule_ids: string[];
  postal_price?: number;
  price_adjustment_amount?: number;
  price_adjustment_percentage?: number;
  courier_available?: boolean;
  courier_price?: number;
  active?: boolean;
}


export interface ShippingQuoteRequest {
  province: string;
  shipping_method: string;
}

export interface ShippingQuoteResponse {
  province: string;
  shipping_method: string;
  shipping_cost: number;
  postal_price: number;
  courier_available: boolean;
  courier_price: number;
}


export interface ShopOrderTrackTimelineItem {
  step: number;
  title_fa: string;
  title_en: string;
  description_fa: string;
  description_en: string;
  is_completed: boolean;
  is_current: boolean;
  timestamp?: string | null;
}

export interface ShopOrderTrackItem {
  product_title: string;
  product_type: string;
  quantity: number;
  destination_configured: boolean;
  destination_type: string;
  customization_color?: string | null;
  customization_template?: string | null;
  fulfillment_status: string;
  card_codes: string[];
}

export interface ShopOrderTrackResponse {
  shop_order_number: string;
  status: string;
  payment_status: string;
  created_at: string;
  shipping_city: string;
  shipping_address_masked: string;
  customer_name_masked: string;
  shipping_method?: ShippingMethod;
  shipping_tracking_code?: string | null;
  items: ShopOrderTrackItem[];
  timeline: ShopOrderTrackTimelineItem[];
}

export interface CardActivationVerifyRequest {
  card_code: string;
  order_number: string;
  verification_contact: string;
}

export interface CardActivationVerifyResponse {
  activation_token: string;
  card_code: string;
  business_name: string;
  product_title: string;
  current_destination_type: string;
  expires_in_seconds: number;
}

export interface CardActivationConfigureRequest {
  activation_token: string;
  destination_type: string;
  destination_url: string;
}

export interface CardActivationConfigureResponse {
  status: string;
  card_code: string;
  destination_type: string;
  destination_url: string;
  message: string;
  is_perfect_link?: boolean;
}


