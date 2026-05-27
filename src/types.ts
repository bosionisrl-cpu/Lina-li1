export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  sku: string;
  category: string;
  stock: number;
  sales: number;
  status: 'Active' | 'Draft' | 'Archived';
  image: string;
  image_status?: string; // e.g. "Raw", "Background Removed", "Resized to 1080x1080", "Studio Custom Search", "Promo Banner"
}

export interface Order {
  order_id: string;
  customer_id: string;
  status: 'Delivered' | 'Shipped' | 'Processing' | 'Delayed' | 'Refunded';
  amount: number;
  date: string;
  estimated_delivery?: string;
  delivered_date?: string;
  city: string;
}

export interface Review {
  review_id: string;
  order_id: string;
  customer_id: string;
  score: number;
  text: string;
  date: string;
  product_category: string;
}

export interface MarketingCampaign {
  id: string;
  product_name: string;
  channel: 'TikTok Ad' | 'SEO Backlink' | 'EDM Newsletter' | 'Instagram Social';
  tone: string;
  content: string;
  status: 'Draft' | 'Ready' | 'Sent';
}

export interface StoreTheme {
  themeStyle: 'apple' | 'nordic' | 'cyber' | 'sunset' | string;
  primaryColor: string;
  bannerTitle: string;
  bannerSubtitle: string;
  layoutConfig: 'grid' | 'hero_banner' | 'split' | string;
  bannerImage: string;
}

export interface Customer {
  id: string;
  email: string;
  ordersCount: number;
  totalSpent: number;
  city: string;
  segment: 'High Value' | 'Active' | 'At Risk' | 'Dormant';
  lastOrderDate: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'Enterprise' | 'Growth' | 'Free';
  aiUsage: number;      // tokens
  gmv: number;          // dollar amount
  orderCount: number;
  runtimeStatus: 'Healthy' | 'Suspended' | 'Degraded';
  riskStatus: 'Safe' | 'Warning' | 'High Risk';
  lastActivity: string;
}

export interface AIRuntimeTask {
  id: string;
  tenantId: string;
  command: string;
  status: 'Running' | 'Completed' | 'Failed' | 'Queued';
  latency: number;      // ms
  tokenUsage: number;
  provider: string;
  timestamp: string;
  logs: string[];
}

export interface PlatformEvent {
  id: string;
  tenantId: string;
  tenantName: string;
  type: 'AI_PRODUCT_CREATED' | 'AI_THEME_UPDATED' | 'AI_MARKETING_GENERATED' | 'TENANT_SUSPENDED' | 'TENANT_ACTIVATED' | 'RATE_LIMIT_TRIGGERED' | 'GOVERNANCE_OVERRIDE';
  message: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'critical';
}

export interface PresetTemplate {
  id: string;
  title: string;
  language: string;
  description: string;
  code: string;
}

