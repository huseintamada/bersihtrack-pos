export type OrderStatus =
  | 'Diterima'
  | 'Dicuci'
  | 'Disetrika'
  | 'Siap Diambil'
  | 'Selesai'
  | 'Dibatalkan';

export type ServiceCategory = 'kiloan' | 'satuan';

export type PaymentStatus = 'Lunas' | 'DP' | 'Bayar Nanti';

export type PaymentMethod = 'Tunai' | 'QRIS' | 'Transfer';

export interface CustomerInfo {
  name: string;
  whatsapp: string;
}

export interface ServiceLine {
  id: string;
  name: string;
  unitLabel: string;
  qty: number;
  unitPrice: number;
  subtotal: number;
}

export interface GarmentItem {
  id: string;
  label: string;
  qty: number;
  verified: boolean;
}

export interface PaymentEntry {
  id: string;
  timestamp: string;
  amount: number;
  method: PaymentMethod;
  note: string;
}

export interface LaundryOrder {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  estimatedCompletion: string;
  completedAt?: string;
  customer: CustomerInfo;
  serviceCategory: ServiceCategory;
  serviceLines: ServiceLine[];
  garmentItems: GarmentItem[];
  totalGarmentPieces: number;
  initialPhotoBase64: string;
  initialConditionNote: string;
  status: OrderStatus;
  rackLocation?: string;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentHistory: PaymentEntry[];
  verificationNotes?: string;
  verifiedBy?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  invoiceNumber: string;
  action:
    | 'ORDER_CREATED'
    | 'STATUS_CHANGED'
    | 'RACK_ASSIGNED'
    | 'PAYMENT_UPDATED'
    | 'PICKUP_VERIFIED'
    | 'ORDER_CANCELLED'
    | 'BACKUP_EXPORTED'
    | 'BACKUP_IMPORTED';
  detail: string;
  actor: string;
}

export interface ShopProfile {
  name: string;
  address: string;
  phone: string;
  cashierName: string;
}

export interface BackupPayload {
  schemaVersion: string;
  exportedAt: string;
  shopProfile: ShopProfile;
  orders: LaundryOrder[];
  auditLogs: AuditLogEntry[];
}

export type ActiveTab =
  | 'pos'
  | 'orders'
  | 'pickup'
  | 'public-track'
  | 'reports';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
}
