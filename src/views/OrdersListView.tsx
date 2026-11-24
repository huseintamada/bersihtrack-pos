import {
  Archive,
  ArrowRight,
  Ban,
  Columns3,
  Eye,
  Printer,
  Search,
  ShieldCheck,
  Table2,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusIndicator';
import type { LaundryOrder, OrderStatus } from '../types/laundry';
import { formatDateTimeID, formatRupiah } from '../utils/formatters';

interface OrdersListViewProps {
  orders: LaundryOrder[];
  onChangeStatus: (order: LaundryOrder, nextStatus: OrderStatus) => void;
  onOpenReceipt: (order: LaundryOrder) => void;
  onOpenPickupVerification: (order: LaundryOrder) => void;
  onOpenPublicTracking: (invoiceNumber: string) => void;
}

const FILTER_OPTIONS: Array<'Semua' | OrderStatus> = [
  'Semua',
  'Diterima',
  'Dicuci',
  'Disetrika',
  'Siap Diambil',
  'Selesai',
];

const KANBAN_COLUMNS: OrderStatus[] = [
  'Diterima',
  'Dicuci',
  'Disetrika',
  'Siap Diambil',
  'Selesai',
];

function getNextStepStatus(current: OrderStatus): OrderStatus | null {
  switch (current) {
    case 'Diterima':
      return 'Dicuci';
    case 'Dicuci':
      return 'Disetrika';
    case 'Disetrika':
      return 'Siap Diambil';
    default:
      return null;
  }
}

export function OrdersListView({
  orders,
  onChangeStatus,
  onOpenReceipt,
  onOpenPickupVerification,
  onOpenPublicTracking,
}: OrdersListViewProps) {
  const [statusFilter, setStatusFilter] = useState<'Semua' | OrderStatus>('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const filteredOrders = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'Semua' || order.status === statusFilter;
      const matchesSearch =
        !q ||
        order.invoiceNumber.toLowerCase().includes(q) ||
        order.customer.name.toLowerCase().includes(q) ||
        order.customer.whatsapp.toLowerCase().includes(q) ||
        (order.rackLocation || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { Semua: orders.length };
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  return (
    <div className="space-y-5">
      {/* Filter & Search Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama Pelanggan, No. Invoice, WA, atau Rak..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>
        </div>

        {/* Segmented Status Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FILTER_OPTIONS.map((opt) => {
            const active = statusFilter === opt;
            const count = statusCounts[opt] || 0;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => setStatusFilter(opt)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                {opt}{' '}
                <span className={`font-mono ml-1 ${active ? 'text-slate-300' : 'text-slate-400'}`}>
                  ({count})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-base font-semibold text-slate-800">Tidak ada transaksi ditemukan</p>
          <p className="text-sm text-slate-500 mt-1">
            Ubah filter status atau kata kunci pencarian untuk melihat daftar cucian.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">Invoice & Tanggal</th>
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Layanan & Item</th>
                  <th className="py-3 px-4">Status & Lokasi Rak</th>
                  <th className="py-3 px-4 text-right">Tagihan</th>
                  <th className="py-3 px-4 text-right">Aksi Proses</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredOrders.map((order) => {
                  const nextStatus = getNextStepStatus(order.status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden shrink-0">
                            {order.initialPhotoBase64 ? (
                              <img
                                src={order.initialPhotoBase64}
                                alt={order.invoiceNumber}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div>
                            <p className="font-mono text-xs font-bold text-slate-900">
                              {order.invoiceNumber}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Masuk: {formatDateTimeID(order.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <p className="font-semibold text-slate-900">{order.customer.name}</p>
                        <p className="font-mono text-xs text-slate-500 mt-0.5">
                          {order.customer.whatsapp}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <p className="text-xs font-medium text-slate-800">
                          {order.serviceLines.map((s) => s.name).join(', ')}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono tabular-nums">
                          {order.totalGarmentPieces} potong ({order.garmentItems.map((g) => `${g.qty} ${g.label}`).slice(0, 3).join(', ')}
                          {order.garmentItems.length > 3 ? '...' : ''})
                        </p>
                      </td>

                      <td className="py-3.5 px-4 align-top space-y-1.5">
                        <OrderStatusBadge status={order.status} />
                        {order.rackLocation && (
                          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
                            <Archive className="w-3.5 h-3.5 shrink-0" />
                            <span>{order.rackLocation}</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right space-y-1">
                        <p className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {formatRupiah(order.totalAmount)}
                        </p>
                        <div className="flex justify-end">
                          <PaymentStatusBadge status={order.paymentStatus} />
                        </div>
                        {order.remainingAmount > 0 && (
                          <p className="text-[11px] font-mono text-rose-600 tabular-nums">
                            Sisa: {formatRupiah(order.remainingAmount)}
                          </p>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          {nextStatus && (
                            <button
                              type="button"
                              onClick={() => onChangeStatus(order, nextStatus)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium transition-colors whitespace-nowrap shrink-0"
                            >
                              <span>Ke {nextStatus}</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}

                          {order.status === 'Siap Diambil' && (
                            <button
                              type="button"
                              onClick={() => onOpenPickupVerification(order)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Verifikasi Ambil</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onOpenReceipt(order)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Lihat & Cetak Struk"
                            aria-label="Lihat dan cetak struk"
                          >
                            <Printer className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onOpenPublicTracking(order.invoiceNumber)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                            title="Preview Halaman Pelanggan"
                            aria-label="Preview halaman pelanggan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {order.status !== 'Selesai' && order.status !== 'Dibatalkan' && (
                            <button
                              type="button"
                              onClick={() => onChangeStatus(order, 'Dibatalkan')}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                              title="Batalkan Order"
                              aria-label="Batalkan order"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-start">
          {KANBAN_COLUMNS.map((colStatus) => {
            const colOrders = filteredOrders.filter((o) => o.status === colStatus);
            return (
              <div
                key={colStatus}
                className="bg-slate-100/80 border border-slate-200 rounded-2xl p-3 space-y-3"
              >
                <div className="flex items-center justify-between px-1">
                  <OrderStatusBadge status={colStatus} />
                  <span className="font-mono text-xs font-bold text-slate-600 tabular-nums">
                    {colOrders.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colOrders.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                      Kosong
                    </div>
                  ) : (
                    colOrders.map((order) => {
                      const nextStatus = getNextStepStatus(order.status);
                      return (
                        <div
                          key={order.id}
                          className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-mono text-[11px] font-bold text-blue-800">
                                {order.invoiceNumber}
                              </p>
                              <p className="text-sm font-semibold text-slate-900 mt-0.5">
                                {order.customer.name}
                              </p>
                            </div>
                            <PaymentStatusBadge status={order.paymentStatus} />
                          </div>

                          <div className="text-xs text-slate-600 flex items-center justify-between">
                            <span className="font-mono tabular-nums">
                              {order.totalGarmentPieces} potong
                            </span>
                            <span className="font-mono font-semibold text-slate-900 tabular-nums">
                              {formatRupiah(order.totalAmount)}
                            </span>
                          </div>

                          {order.rackLocation && (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                              <Archive className="w-3.5 h-3.5" />
                              <span>{order.rackLocation}</span>
                            </div>
                          )}

                          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                            {nextStatus && (
                              <button
                                type="button"
                                onClick={() => onChangeStatus(order, nextStatus)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium transition-colors whitespace-nowrap"
                              >
                                <span>{nextStatus}</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                            {order.status === 'Siap Diambil' && (
                              <button
                                type="button"
                                onClick={() => onOpenPickupVerification(order)}
                                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Serah Terima</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onOpenReceipt(order)}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                              title="Cetak Struk"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
