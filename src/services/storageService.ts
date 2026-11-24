import { createInitialSeedData, DEFAULT_SHOP_PROFILE } from '../data/catalog';
import type {
  AuditLogEntry,
  BackupPayload,
  LaundryOrder,
  OrderStatus,
  PaymentMethod,
  ShopProfile,
} from '../types/laundry';

const STORAGE_KEYS = {
  ORDERS: 'bersihtrack_orders_v1',
  AUDIT_LOGS: 'bersihtrack_audit_logs_v1',
  SHOP_PROFILE: 'bersihtrack_shop_profile_v1',
  INITIALIZED: 'bersihtrack_initialized_v1',
} as const;

function makeId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Local-First Storage Service
 * Clean abstraction layer over localStorage designed for effortless migration
 * to REST API / MySQL backend endpoints when moving online.
 */
class StorageService {
  private ensureInitialized(): void {
    const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
    if (!initialized) {
      const { orders, auditLogs } = createInitialSeedData();
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
      localStorage.setItem(STORAGE_KEYS.SHOP_PROFILE, JSON.stringify(DEFAULT_SHOP_PROFILE));
      localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
    }
  }

  getShopProfile(): ShopProfile {
    this.ensureInitialized();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SHOP_PROFILE);
      return raw ? { ...DEFAULT_SHOP_PROFILE, ...JSON.parse(raw) } : DEFAULT_SHOP_PROFILE;
    } catch {
      return DEFAULT_SHOP_PROFILE;
    }
  }

  saveShopProfile(profile: ShopProfile): ShopProfile {
    localStorage.setItem(STORAGE_KEYS.SHOP_PROFILE, JSON.stringify(profile));
    return profile;
  }

  getOrders(): LaundryOrder[] {
    this.ensureInitialized();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
      const parsed = raw ? (JSON.parse(raw) as LaundryOrder[]) : [];
      return parsed.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch {
      return [];
    }
  }

  getOrderByInvoice(invoiceNumber: string): LaundryOrder | undefined {
    const normalized = invoiceNumber.trim().toUpperCase();
    return this.getOrders().find((o) => o.invoiceNumber.toUpperCase() === normalized);
  }

  getAuditLogs(): AuditLogEntry[] {
    this.ensureInitialized();
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      const parsed = raw ? (JSON.parse(raw) as AuditLogEntry[]) : [];
      return parsed.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    } catch {
      return [];
    }
  }

  private saveOrders(orders: LaundryOrder[]): void {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }

  private appendAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: makeId('log'),
      timestamp: new Date().toISOString(),
      ...entry,
    };
    const updated = [newEntry, ...logs].slice(0, 500);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(updated));
    return newEntry;
  }

  createOrder(
    orderInput: Omit<LaundryOrder, 'id' | 'createdAt' | 'updatedAt'>
  ): LaundryOrder {
    const orders = this.getOrders();
    const now = new Date().toISOString();
    const profile = this.getShopProfile();

    const newOrder: LaundryOrder = {
      ...orderInput,
      id: makeId('ord'),
      createdAt: now,
      updatedAt: now,
    };

    this.saveOrders([newOrder, ...orders]);

    this.appendAuditLog({
      invoiceNumber: newOrder.invoiceNumber,
      action: 'ORDER_CREATED',
      detail: `Transaksi baru ${newOrder.customer.name} (${newOrder.totalGarmentPieces} potong, ${newOrder.paymentStatus} Rp ${newOrder.paidAmount.toLocaleString('id-ID')}/${newOrder.totalAmount.toLocaleString('id-ID')}).`,
      actor: profile.cashierName,
    });

    return newOrder;
  }

  updateOrderStatus(
    orderId: string,
    nextStatus: OrderStatus,
    options?: { rackLocation?: string; reason?: string }
  ): LaundryOrder | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) return null;

    const current = orders[idx];
    const now = new Date().toISOString();
    const profile = this.getShopProfile();

    const updatedOrder: LaundryOrder = {
      ...current,
      status: nextStatus,
      updatedAt: now,
      rackLocation:
        options?.rackLocation !== undefined
          ? options.rackLocation.trim()
          : current.rackLocation,
      completedAt: nextStatus === 'Selesai' ? now : current.completedAt,
    };

    const nextOrders = [...orders];
    nextOrders[idx] = updatedOrder;
    this.saveOrders(nextOrders);

    if (nextStatus === 'Dibatalkan') {
      this.appendAuditLog({
        invoiceNumber: current.invoiceNumber,
        action: 'ORDER_CANCELLED',
        detail: `Order dibatalkan${options?.reason ? `: ${options.reason}` : '.'}`,
        actor: profile.cashierName,
      });
    } else if (nextStatus === 'Siap Diambil' && updatedOrder.rackLocation) {
      this.appendAuditLog({
        invoiceNumber: current.invoiceNumber,
        action: 'RACK_ASSIGNED',
        detail: `Status diubah ke Siap Diambil dan ditempatkan di ${updatedOrder.rackLocation}.`,
        actor: profile.cashierName,
      });
    } else {
      this.appendAuditLog({
        invoiceNumber: current.invoiceNumber,
        action: 'STATUS_CHANGED',
        detail: `Status diubah dari ${current.status} menjadi ${nextStatus}.`,
        actor: profile.cashierName,
      });
    }

    return updatedOrder;
  }

  completePickupVerification(params: {
    orderId: string;
    verifiedItemIds: string[];
    settleAmount: number;
    settleMethod: PaymentMethod;
    verificationNotes?: string;
  }): LaundryOrder | null {
    const orders = this.getOrders();
    const idx = orders.findIndex((o) => o.id === params.orderId);
    if (idx === -1) return null;

    const current = orders[idx];
    const now = new Date().toISOString();
    const profile = this.getShopProfile();

    const updatedGarments = current.garmentItems.map((item) => ({
      ...item,
      verified: params.verifiedItemIds.includes(item.id),
    }));

    const additionalPay = Math.max(0, params.settleAmount);
    const newPaidAmount = Math.min(current.totalAmount, current.paidAmount + additionalPay);
    const newRemaining = Math.max(0, current.totalAmount - newPaidAmount);

    const nextPaymentHistory = [...current.paymentHistory];
    if (additionalPay > 0) {
      nextPaymentHistory.push({
        id: makeId('pay'),
        timestamp: now,
        amount: additionalPay,
        method: params.settleMethod,
        note: 'Pelunasan saat serah terima pengambilan',
      });
    }

    const updatedOrder: LaundryOrder = {
      ...current,
      garmentItems: updatedGarments,
      status: 'Selesai',
      completedAt: now,
      updatedAt: now,
      paidAmount: newPaidAmount,
      remainingAmount: newRemaining,
      paymentStatus: newRemaining === 0 ? 'Lunas' : current.paymentStatus,
      paymentMethod: additionalPay > 0 ? params.settleMethod : current.paymentMethod,
      paymentHistory: nextPaymentHistory,
      verificationNotes: params.verificationNotes?.trim() || undefined,
      verifiedBy: profile.cashierName,
    };

    const nextOrders = [...orders];
    nextOrders[idx] = updatedOrder;
    this.saveOrders(nextOrders);

    this.appendAuditLog({
      invoiceNumber: current.invoiceNumber,
      action: 'PICKUP_VERIFIED',
      detail: `Verifikasi serah terima selesai (${updatedOrder.totalGarmentPieces} potong tercentang fisik${
        additionalPay > 0
          ? `, pelunasan Rp ${additionalPay.toLocaleString('id-ID')} via ${params.settleMethod}`
          : ''
      }).`,
      actor: profile.cashierName,
    });

    return updatedOrder;
  }

  exportBackupJson(): BackupPayload {
    const payload: BackupPayload = {
      schemaVersion: '1.0.0',
      exportedAt: new Date().toISOString(),
      shopProfile: this.getShopProfile(),
      orders: this.getOrders(),
      auditLogs: this.getAuditLogs(),
    };

    this.appendAuditLog({
      invoiceNumber: 'SISTEM',
      action: 'BACKUP_EXPORTED',
      detail: `Backup JSON diekspor (${payload.orders.length} transaksi, ${payload.auditLogs.length} log).`,
      actor: payload.shopProfile.cashierName,
    });

    return payload;
  }

  importBackupJson(rawJson: string): { ordersCount: number; logsCount: number } {
    const parsed = JSON.parse(rawJson) as Partial<BackupPayload>;
    if (!parsed || !Array.isArray(parsed.orders)) {
      throw new Error('Struktur file backup JSON tidak valid (properti orders tidak ditemukan).');
    }

    const validOrders = parsed.orders;
    const validLogs = Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [];
    const profile = parsed.shopProfile
      ? { ...DEFAULT_SHOP_PROFILE, ...parsed.shopProfile }
      : this.getShopProfile();

    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(validOrders));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(validLogs));
    localStorage.setItem(STORAGE_KEYS.SHOP_PROFILE, JSON.stringify(profile));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    this.appendAuditLog({
      invoiceNumber: 'SISTEM',
      action: 'BACKUP_IMPORTED',
      detail: `Restore backup JSON berhasil (${validOrders.length} transaksi dipulihkan).`,
      actor: profile.cashierName,
    });

    return {
      ordersCount: validOrders.length,
      logsCount: validLogs.length,
    };
  }

  resetToDemoData(): void {
    const { orders, auditLogs } = createInitialSeedData();
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(auditLogs));
    localStorage.setItem(STORAGE_KEYS.SHOP_PROFILE, JSON.stringify(DEFAULT_SHOP_PROFILE));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

export const storageService = new StorageService();
