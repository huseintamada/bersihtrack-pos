import { Archive, CheckCircle2, Image as ImageIcon, Search, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusIndicator';
import type { LaundryOrder } from '../types/laundry';
import { formatDateTimeID, formatRupiah } from '../utils/formatters';

interface PickupQueueViewProps {
  orders: LaundryOrder[];
  onOpenPickupVerification: (order: LaundryOrder) => void;
}

export function PickupQueueView({
  orders,
  onOpenPickupVerification,
}: PickupQueueViewProps) {
  const [search, setSearch] = useState('');
  const [showAllActive, setShowAllActive] = useState(false);

  const pickupCandidates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders
      .filter((o) => {
        if (o.status === 'Selesai' || o.status === 'Dibatalkan') return false;
        if (!showAllActive && o.status !== 'Siap Diambil') return false;
        if (!q) return true;
        return (
          o.invoiceNumber.toLowerCase().includes(q) ||
          o.customer.name.toLowerCase().includes(q) ||
          o.customer.whatsapp.toLowerCase().includes(q) ||
          (o.rackLocation || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.status === 'Siap Diambil' && b.status !== 'Siap Diambil') return -1;
        if (b.status === 'Siap Diambil' && a.status !== 'Siap Diambil') return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [orders, search, showAllActive]);

  const completedHistory = useMemo(() => {
    return orders.filter((o) => o.status === 'Selesai').slice(0, 5);
  }, [orders]);

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Scan / ketik No. Invoice, Nama, atau Kode Rak..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showAllActive}
            onChange={(e) => setShowAllActive(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
          />
          <span>Tampilkan juga order yang masih diproses (ambil lebih awal)</span>
        </label>
      </div>

      {/* Pickup Grid */}
      {pickupCandidates.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-semibold text-slate-800">
            Tidak ada cucian siap diambil yang cocok
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Ubah status cucian di Daftar Order menjadi &ldquo;Siap Diambil&rdquo; atau centang opsi tampilkan semua order aktif.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {pickupCandidates.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                {/* Top Photo Strip */}
                <div className="relative h-44 bg-slate-100 border-b border-slate-200">
                  {order.initialPhotoBase64 ? (
                    <img
                      src={order.initialPhotoBase64}
                      alt={`Foto bukti ${order.invoiceNumber}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-3.5 flex items-end justify-between text-white">
                    <div>
                      <p className="font-mono text-xs font-semibold text-slate-200">
                        {order.invoiceNumber}
                      </p>
                      <p className="text-base font-bold leading-tight">{order.customer.name}</p>
                    </div>
                    {order.rackLocation && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-600 text-white text-xs font-bold shadow-xs">
                        <Archive className="w-3.5 h-3.5" />
                        <span>{order.rackLocation}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <OrderStatusBadge status={order.status} />
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <div>
                      <span className="text-slate-500 block">Total Potong</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {order.totalGarmentPieces} pcs ({order.garmentItems.length} jenis)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-500 block">Sisa Tagihan</span>
                      <span
                        className={`font-mono font-bold tabular-nums ${
                          order.remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
                        }`}
                      >
                        {order.remainingAmount > 0 ? formatRupiah(order.remainingAmount) : 'Lunas'}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Rincian: </span>
                    {order.garmentItems.map((g) => `${g.qty} ${g.label}`).join(', ')}
                  </div>

                  {order.initialConditionNote && (
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2">
                      <strong>Catatan Awal:</strong> {order.initialConditionNote}
                    </p>
                  )}
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => onOpenPickupVerification(order)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verifikasi Foto & Serah Terima</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent Completed Handovers */}
      {completedHistory.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-semibold text-slate-900">
              Riwayat Serah Terima Terakhir (Terverifikasi)
            </h3>
          </div>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {completedHistory.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-xs bg-white"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-slate-900">{item.invoiceNumber}</span>
                  <span className="font-medium text-slate-800">{item.customer.name}</span>
                  <span className="text-slate-500 font-mono tabular-nums">
                    {item.totalGarmentPieces} potong
                  </span>
                </div>
                <div className="flex items-center gap-4 text-slate-500">
                  <span>Diambil: {formatDateTimeID(item.completedAt || item.updatedAt)}</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {formatRupiah(item.totalAmount)} (Lunas)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
