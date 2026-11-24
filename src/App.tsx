import {
  BarChart3,
  ClipboardList,
  Globe,
  Menu,
  PlusCircle,
  ShieldCheck,
  ShoppingBag,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { PickupVerificationModal } from './components/PickupVerificationModal';
import { RackLocationModal } from './components/RackLocationModal';
import { ThermalReceiptModal } from './components/ThermalReceiptModal';
import { ToastContainer } from './components/ToastContainer';
import { storageService } from './services/storageService';
import type {
  ActiveTab,
  AuditLogEntry,
  LaundryOrder,
  OrderStatus,
  PaymentMethod,
  ShopProfile,
  ToastMessage,
} from './types/laundry';
import { OrdersListView } from './views/OrdersListView';
import { PickupQueueView } from './views/PickupQueueView';
import { PosNewOrderView } from './views/PosNewOrderView';
import { PublicTrackingView } from './views/PublicTrackingView';
import { ReportsBackupView } from './views/ReportsBackupView';

const NAV_ITEMS: Array<{
  id: ActiveTab;
  label: string;
  shortLabel: string;
  icon: typeof ShoppingBag;
}> = [
  {
    id: 'pos',
    label: 'Kasir Baru (POS)',
    shortLabel: 'Kasir POS',
    icon: ShoppingBag,
  },
  {
    id: 'orders',
    label: 'Daftar Order & Rak',
    shortLabel: 'Daftar Order',
    icon: ClipboardList,
  },
  {
    id: 'pickup',
    label: 'Pengambilan & Verifikasi',
    shortLabel: 'Pengambilan',
    icon: ShieldCheck,
  },
  {
    id: 'public-track',
    label: 'Cek Status Publik',
    shortLabel: 'Cek Publik',
    icon: Globe,
  },
  {
    id: 'reports',
    label: 'Laporan & Backup',
    shortLabel: 'Laporan',
    icon: BarChart3,
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pos');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [orders, setOrders] = useState<LaundryOrder[]>(() => storageService.getOrders());
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    storageService.getAuditLogs()
  );
  const [shopProfile, setShopProfile] = useState<ShopProfile>(() =>
    storageService.getShopProfile()
  );

  // Modals State
  const [receiptOrder, setReceiptOrder] = useState<LaundryOrder | null>(null);
  const [rackModalOrder, setRackModalOrder] = useState<LaundryOrder | null>(null);
  const [pickupModalOrder, setPickupModalOrder] = useState<LaundryOrder | null>(null);
  const [cancelTargetOrder, setCancelTargetOrder] = useState<LaundryOrder | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // Public Tracking prefilled invoice
  const [trackingInvoice, setTrackingInvoice] = useState<string>('');

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const notify = useCallback(
    (type: ToastMessage['type'], title: string, description?: string) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev, { id, type, title, description }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const refreshFromStorage = useCallback(() => {
    setOrders(storageService.getOrders());
    setAuditLogs(storageService.getAuditLogs());
    setShopProfile(storageService.getShopProfile());
  }, []);

  // Support deep link ?track=INV-... when QR scanned directly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track');
    if (trackParam) {
      setTrackingInvoice(trackParam);
      setActiveTab('public-track');
    }
  }, []);

  const handleCreateOrder = (
    orderInput: Omit<LaundryOrder, 'id' | 'createdAt' | 'updatedAt'>
  ): LaundryOrder => {
    const created = storageService.createOrder(orderInput);
    refreshFromStorage();
    return created;
  };

  const handleChangeStatus = (order: LaundryOrder, nextStatus: OrderStatus) => {
    if (nextStatus === 'Siap Diambil') {
      setRackModalOrder(order);
      return;
    }
    if (nextStatus === 'Dibatalkan') {
      setCancelTargetOrder(order);
      setCancelReason('');
      return;
    }

    const updated = storageService.updateOrderStatus(order.id, nextStatus);
    if (updated) {
      refreshFromStorage();
      notify(
        'info',
        `Status ${updated.invoiceNumber} diperbarui`,
        `${updated.customer.name} sekarang berstatus "${nextStatus}".`
      );
    }
  };

  const handleConfirmRackLocation = (orderId: string, rackLocation: string) => {
    const updated = storageService.updateOrderStatus(orderId, 'Siap Diambil', {
      rackLocation,
    });
    setRackModalOrder(null);
    if (updated) {
      refreshFromStorage();
      notify(
        'success',
        `Cucian siap diambil di ${rackLocation}`,
        `${updated.invoiceNumber} (${updated.customer.name}) siap diserahkan.`
      );
    }
  };

  const handleConfirmPickup = (params: {
    orderId: string;
    verifiedItemIds: string[];
    settleAmount: number;
    settleMethod: PaymentMethod;
    verificationNotes: string;
  }) => {
    const updated = storageService.completePickupVerification(params);
    setPickupModalOrder(null);
    if (updated) {
      refreshFromStorage();
      notify(
        'success',
        `Verifikasi & Serah Terima Selesai`,
        `${updated.invoiceNumber} (${updated.totalGarmentPieces} potong) telah diterima pelanggan.`
      );
    }
  };

  const handleConfirmCancelOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelTargetOrder) return;
    const updated = storageService.updateOrderStatus(cancelTargetOrder.id, 'Dibatalkan', {
      reason: cancelReason.trim() || 'Dibatalkan oleh kasir',
    });
    setCancelTargetOrder(null);
    setCancelReason('');
    if (updated) {
      refreshFromStorage();
      notify(
        'warning',
        `Order ${updated.invoiceNumber} dibatalkan`,
        'Perubahan dicatat ke dalam Audit Log.'
      );
    }
  };

  const handleOpenPublicTracking = (invoiceNumber: string) => {
    setTrackingInvoice(invoiceNumber);
    setActiveTab('public-track');
    setMobileNavOpen(false);
  };

  const handleSaveShopProfile = (profile: ShopProfile) => {
    storageService.saveShopProfile(profile);
    refreshFromStorage();
    notify('success', 'Pengaturan outlet disimpan', `Outlet: ${profile.name}`);
  };

  const handleExportBackup = () => {
    const payload = storageService.exportBackupJson();
    refreshFromStorage();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    a.href = url;
    a.download = `bersihtrack-backup-${dateStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify(
      'success',
      'Backup JSON berhasil diunduh',
      `${payload.orders.length} transaksi dicadangkan ke file lokal.`
    );
  };

  const handleImportBackup = (rawJson: string) => {
    try {
      const result = storageService.importBackupJson(rawJson);
      refreshFromStorage();
      notify(
        'success',
        'Restore data berhasil',
        `${result.ordersCount} transaksi dan ${result.logsCount} log dipulihkan.`
      );
    } catch (err) {
      notify(
        'error',
        'Gagal mengimpor backup',
        err instanceof Error ? err.message : 'Pastikan file JSON valid.'
      );
    }
  };

  const handleResetDemoData = () => {
    storageService.resetToDemoData();
    refreshFromStorage();
    notify(
      'info',
      'Data demo dipulihkan',
      '3 transaksi contoh beserta foto bukti awal telah dimuat ulang.'
    );
  };

  const readyToPickupCount = orders.filter((o) => o.status === 'Siap Diambil').length;
  const activeOrdersCount = orders.filter((o) =>
    ['Diterima', 'Dicuci', 'Disetrika', 'Siap Diambil'].includes(o.status)
  ).length;

  const activeNavMeta = NAV_ITEMS.find((item) => item.id === activeTab) || NAV_ITEMS[0];

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900">
      {/* Desktop Sidebar (260px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-slate-900 text-slate-100 border-r border-slate-800">
        <div className="px-5 py-5 border-b border-slate-800">
          <span className="font-display text-lg font-bold tracking-tight text-white block whitespace-nowrap">
            BersihTrack POS
          </span>
          <span className="text-xs text-slate-400 block mt-0.5 truncate">
            {shopProfile.name}
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Navigasi Utama">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            const countLabel =
              item.id === 'pickup' && readyToPickupCount > 0
                ? readyToPickupCount
                : item.id === 'orders' && activeOrdersCount > 0
                  ? activeOrdersCount
                  : null;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                  active
                    ? 'bg-blue-700 text-white'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {countLabel !== null && (
                  <span
                    className={`font-mono text-xs tabular-nums ${
                      active ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {countLabel}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-1">
          <p className="font-medium text-slate-200 truncate">{shopProfile.cashierName}</p>
          <p className="truncate">{shopProfile.phone}</p>
        </div>
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-50 w-72 max-w-[85vw] bg-slate-900 text-slate-100 flex flex-col h-full">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <span className="font-display text-lg font-bold text-white">BersihTrack POS</span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors text-left ${
                      active
                        ? 'bg-blue-700 text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Clean Contextual Top Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {activeNavMeta.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeTab !== 'pos' && (
              <button
                type="button"
                onClick={() => setActiveTab('pos')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Transaksi Baru</span>
              </button>
            )}
            {activeTab === 'pos' && readyToPickupCount > 0 && (
              <button
                type="button"
                onClick={() => setActiveTab('pickup')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{readyToPickupCount} Siap Diambil</span>
              </button>
            )}
          </div>
        </header>

        {/* Quick Mobile Tab Bar (visible on small/tablet screens for 1-tap switching) */}
        <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center gap-1 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {item.shortLabel}
              </button>
            );
          })}
        </div>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {activeTab === 'pos' && (
            <PosNewOrderView
              orders={orders}
              onCreateOrder={handleCreateOrder}
              onNotify={notify}
              onViewOrderReceipt={(order) => setReceiptOrder(order)}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersListView
              orders={orders}
              onChangeStatus={handleChangeStatus}
              onOpenReceipt={(order) => setReceiptOrder(order)}
              onOpenPickupVerification={(order) => setPickupModalOrder(order)}
              onOpenPublicTracking={handleOpenPublicTracking}
            />
          )}

          {activeTab === 'pickup' && (
            <PickupQueueView
              orders={orders}
              onOpenPickupVerification={(order) => setPickupModalOrder(order)}
            />
          )}

          {activeTab === 'public-track' && (
            <PublicTrackingView
              orders={orders}
              shopProfile={shopProfile}
              initialInvoice={trackingInvoice}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsBackupView
              orders={orders}
              auditLogs={auditLogs}
              shopProfile={shopProfile}
              onSaveShopProfile={handleSaveShopProfile}
              onExportBackup={handleExportBackup}
              onImportBackup={handleImportBackup}
              onResetDemoData={handleResetDemoData}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <ThermalReceiptModal
        order={receiptOrder}
        shopProfile={shopProfile}
        onClose={() => setReceiptOrder(null)}
        onOpenPublicTracking={handleOpenPublicTracking}
      />

      <RackLocationModal
        order={rackModalOrder}
        onClose={() => setRackModalOrder(null)}
        onConfirm={handleConfirmRackLocation}
      />

      <PickupVerificationModal
        order={pickupModalOrder}
        onClose={() => setPickupModalOrder(null)}
        onConfirmPickup={handleConfirmPickup}
      />

      {/* Cancel Order Confirmation Modal */}
      {cancelTargetOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Batalkan Order {cancelTargetOrder.invoiceNumber}?
              </h3>
              <button
                type="button"
                onClick={() => setCancelTargetOrder(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmCancelOrder} className="p-5 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Transaksi milik <strong>{cancelTargetOrder.customer.name}</strong> akan ditandai
                sebagai <strong>Dibatalkan</strong> dan tercatat di Audit Log.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Alasan Pembatalan
                </label>
                <input
                  type="text"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Contoh: Pelanggan membatalkan sebelum dicuci"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCancelTargetOrder(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white"
                >
                  Ya, Batalkan Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
