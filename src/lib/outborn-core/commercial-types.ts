export interface CoreBillingPreferences {
  billingEmail: string;
  financeContactEmail: string;
  invoiceCurrency: string;
  invoiceDelivery: 'email' | 'portal' | 'both';
  purchaseOrderRequired: boolean;
  purchaseOrderNumber: string;
  taxRegistrationNumber: string;
  renewalNoticeDays: number;
}

export interface CorePlan {
  id?: string;
  key?: string;
  name?: string;
}

export interface CorePrice {
  id?: string;
  key?: string;
  currency?: string;
  unitAmount?: number | null;
  billingInterval?: string | null;
  plan?: CorePlan;
}

export interface CoreSubscriptionItem {
  id?: string;
  quantity?: number;
  appkitApplicationId?: string | null;
  price?: CorePrice;
}

export interface CoreSubscription {
  id?: string;
  status?: string;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  items?: CoreSubscriptionItem[];
}

export interface CoreInvoice {
  id?: string;
  number?: string | null;
  status?: string;
  currency?: string;
  amountDue?: number;
  amountPaid?: number;
  hostedInvoiceUrl?: string | null;
  invoicePdf?: string | null;
  stripeCreatedAt?: string | null;
  createdAt?: string;
}

export interface CoreBillingSnapshot {
  id?: string;
  status?: string;
  billingEmail?: string | null;
  currency?: string;
  subscriptions?: CoreSubscription[];
  invoices?: CoreInvoice[];
}

export interface CoreEntitlement {
  key: string;
  type?: string;
  value?: boolean | number | string | null;
  booleanValue?: boolean | null;
  numberValue?: number | null;
  stringValue?: string | null;
  source?: string;
}

export interface CoreUsageMetric {
  key: string;
  unit: string;
  aggregation: string;
  value: number;
}

export interface HriveCommercialOverview {
  organizationId: string;
  organizationName?: string;
  organizationRole: string;
  billing: CoreBillingSnapshot | null;
  preferences: CoreBillingPreferences;
  entitlements: CoreEntitlement[];
  usage: CoreUsageMetric[];
}
