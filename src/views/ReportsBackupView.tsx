import {
  Activity,
  Download,
  RotateCcw,
  Save,
  Search,
  Store,
  Upload,
  Wallet,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import type { AuditLogEntry, LaundryOrder, ShopProfile } from '../types/laundry';
import { formatDateTimeID, formatRupiah, isSameLocalDay } from '../utils/formatters';

interface ReportsBackupViewProps {
  orders: LaundryOrder[];
  auditLogs: AuditLogEntry[];
  shopProfile: ShopProfile;
  onSaveShopProfile: (profile: ShopProfile) => void;
  onExportBackup: () => void;
  onImportBackup: (rawJson: string) => void;
  onResetDemoData: () => void;
}

export function ReportsBackupView({
  orders,
  auditLogs,
  shopProfile,
  onSaveShopProfile,
  onExportBackup,
  onImportBackup,
  onResetDemoData,
}: ReportsBackupViewProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [profileForm, setProfileForm] = useState<ShopProfile>(shopProfile);
  const [logSearch, setLogSearch] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const summary = useMemo(() => {
    let cashToday = 0;
    let qrisToday = 0;
    let transferToday = 0;
    let totalOrdersToday = 0;
    let activeOrders = 0;
    let totalPiecesActive = 0;
    let unpaidReceivables = 0;

    for (const order of orders) {
      if (order.status === 'Dibatalkan') continue;

      if (isSameLocalDay(order.createdAt)) {
        totalOrdersToday += 1;
      }

      if (order.status !== 'Selesai') {
        activeOrders += 1;
        totalPiecesActive += order.totalGarmentPieces;
      }

      unpaidReceivables += order.remainingAmount;

      for (const pay of order.paymentHistory) {
        if (isSameLocalDay(pay.timestamp)) {
          if (pay.method === 'Tunai') cashToday += pay.amount;
          else if (pay.method === 'QRIS') qrisToday += pay.amount;
          else if (pay.method === 'Transfer') transferToday += pay.amount;
        }
      }
    }

    const totalRevenueToday = cashToday + qrisToday + transferToday;
    const nonCashToday = qrisToday + transferToday;

    return {
      cashToday,
      qrisToday,
      transferToday,
      nonCashToday,
      totalRevenueToday,
      totalOrdersToday,
      activeOrders,
      totalPiecesActive,
      unpaidReceivables,
    };
  }, [orders]);

  const filteredLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter(
      (log) =>
        log.invoiceNumber.toLowerCase().includes(q) ||
        log.detail.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q)
    );
  }, [auditLogs, logSearch]);

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImportBackup(String(reader.result || ''));
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveShopProfile(profileForm);
  };

  return (
    <div className="space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Omzet Hari Ini</span>
            <Wallet className="w-4 h-4 text-blue-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-2">
            {formatRupiah(summary.totalRevenueToday)}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            {summary.totalOrdersToday} order masuk hari ini
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <span className="text-xs text-slate-500 block">Tunai vs Non-Tunai (Hari Ini)</span>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Tunai</span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                {formatRupiah(summary.cashToday)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Non-Tunai (QRIS/TF)</span>
              <span className="font-mono font-bold text-blue-700 tabular-nums">
                {formatRupiah(summary.nonCashToday)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <span className="text-xs text-slate-500 block">Cucian Masih Diproses</span>
          <p className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-2">
            {summary.activeOrders} Order
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono tabular-nums">
            Total {summary.totalPiecesActive} potong pakaian aktif
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <span className="text-xs text-slate-500 block">Piutang Belum Lunas</span>
          <p className="text-2xl font-bold text-rose-700 font-mono tabular-nums mt-2">
            {formatRupiah(summary.unpaidReceivables)}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Ditagih otomatis saat verifikasi pengambilan
          </p>
        </div>
      </div>

      {/* Backup & Shop Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Local JSON Backup & Restore */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-semibold text-slate-900">
              Backup & Restore Data Lokal (.json)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Cadangkan seluruh data transaksi, log aktivitas, dan bukti foto Base64 ke komputer atau flashdisk secara berkala.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onExportBackup}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export Backup (.json)</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-sm font-semibold transition-colors"
            >
              <Upload className="w-4 h-4" />
              <span>Import Restore (.json)</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Total data tersimpan lokal:{' '}
              <strong className="font-mono text-slate-800">{orders.length}</strong> transaksi ·{' '}
              <strong className="font-mono text-slate-800">{auditLogs.length}</strong> log
            </div>

            {!confirmReset ? (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-700 hover:text-rose-900"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset ke Data Demo Awal</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-rose-700">Yakin reset semua data?</span>
                <button
                  type="button"
                  onClick={() => {
                    onResetDemoData();
                    setConfirmReset(false);
                  }}
                  className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
                >
                  Ya, Reset
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="px-2.5 py-1 rounded-md border border-slate-300 text-xs text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Outlet Profile Settings */}
        <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Store className="w-5 h-5 text-blue-700" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Identitas Outlet & Kasir (Struk Thermal)
              </h3>
              <p className="text-xs text-slate-500">
                Informasi ini dicetak di bagian atas struk dan dicatat di log audit.
              </p>
            </div>
          </div>

          <form onSubmit={handleProfileSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Nama Outlet</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nama Kasir Shift
                </label>
                <input
                  type="text"
                  value={profileForm.cashierName}
                  onChange={(e) => setProfileForm((p) => ({ ...p, cashierName: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Alamat Outlet</label>
                <input
                  type="text"
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((p) => ({ ...p, address: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  No. WhatsApp Outlet
                </label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Pengaturan Outlet</span>
              </button>
            </div>
          </form>
        </section>
      </div>

      {/* Audit Log Activity Table */}
      <section className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-blue-700" />
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Audit Log Aktivitas Penting
              </h3>
              <p className="text-xs text-slate-500">
                Rekam jejak perubahan status, penempatan rak, verifikasi serah terima, dan pembatalan.
              </p>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={logSearch}
              onChange={(e) => setLogSearch(e.target.value)}
              placeholder="Filter log invoice / detail..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Waktu</th>
                <th className="py-2.5 px-4">Invoice</th>
                <th className="py-2.5 px-4">Aksi</th>
                <th className="py-2.5 px-4">Keterangan</th>
                <th className="py-2.5 px-4">Kasir / Aktor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    Tidak ada aktivitas log yang cocok.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-mono text-slate-500 whitespace-nowrap tabular-nums">
                      {formatDateTimeID(log.timestamp)}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {log.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-blue-800 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{log.detail}</td>
                    <td className="py-2.5 px-4 text-slate-600 whitespace-nowrap">{log.actor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
