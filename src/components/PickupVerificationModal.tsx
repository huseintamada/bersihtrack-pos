import {
  AlertCircle,
  Archive,
  Check,
  CheckCircle2,
  CreditCard,
  Image as ImageIcon,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { LaundryOrder, PaymentMethod } from '../types/laundry';
import { formatDateTimeID, formatRupiah } from '../utils/formatters';
import { OrderStatusBadge, PaymentStatusBadge } from './StatusIndicator';

interface PickupVerificationModalProps {
  order: LaundryOrder | null;
  onClose: () => void;
  onConfirmPickup: (params: {
    orderId: string;
    verifiedItemIds: string[];
    settleAmount: number;
    settleMethod: PaymentMethod;
    verificationNotes: string;
  }) => void;
}

export function PickupVerificationModal({
  order,
  onClose,
  onConfirmPickup,
}: PickupVerificationModalProps) {
  const [checkedIds, setCheckedIds] = useState<string[]>([]);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [settleMethod, setSettleMethod] = useState<PaymentMethod>('Tunai');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (order) {
      setCheckedIds([]);
      setPaymentConfirmed(order.remainingAmount === 0);
      setSettleMethod(order.paymentMethod || 'Tunai');
      setVerificationNotes('');
      setImgError(false);
    }
  }, [order]);

  if (!order) return null;

  const totalGarmentRows = order.garmentItems.length;
  const checkedCount = checkedIds.length;
  const allItemsChecked = totalGarmentRows > 0 && checkedCount === totalGarmentRows;
  const canConfirm = allItemsChecked && paymentConfirmed;

  const toggleItem = (id: string) => {
    setCheckedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleCheckAll = () => {
    if (allItemsChecked) {
      setCheckedIds([]);
    } else {
      setCheckedIds(order.garmentItems.map((g) => g.id));
    }
  };

  const handleSubmit = () => {
    if (!canConfirm) return;
    onConfirmPickup({
      orderId: order.id,
      verifiedItemIds: checkedIds,
      settleAmount: order.remainingAmount,
      settleMethod,
      verificationNotes,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 backdrop-blur-[1px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pickup-verify-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <div>
              <h3 id="pickup-verify-title" className="text-base font-semibold text-slate-900">
                Verifikasi Pengambilan & Double-Check Fisik
              </h3>
              <p className="text-xs text-slate-500">
                Pastikan bukti foto awal & jumlah potong fisik cocok sebelum serah terima.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Tutup modal verifikasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[76vh] overflow-y-auto space-y-5">
          {/* Header info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
            <div>
              <span className="block text-xs text-slate-500">No. Invoice</span>
              <span className="font-mono text-sm font-semibold text-slate-900">
                {order.invoiceNumber}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Pelanggan</span>
              <span className="text-sm font-semibold text-slate-900">{order.customer.name}</span>
              <span className="block text-xs text-slate-500 font-mono">
                {order.customer.whatsapp}
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-500">Lokasi Rak</span>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 mt-0.5">
                <Archive className="w-4 h-4" />
                {order.rackLocation || 'Belum ditetapkan'}
              </span>
            </div>
            <div className="flex flex-col items-start sm:items-end justify-center gap-1">
              <OrderStatusBadge status={order.status} />
              <span className="text-[11px] text-slate-500">
                Masuk: {formatDateTimeID(order.createdAt)}
              </span>
            </div>
          </div>

          {/* Side-by-side: Bukti Foto Awal vs Checklist Pakaian */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Bukti Foto Awal */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-900">
                  1. Bukti Foto Kondisi Awal
                </h4>
                <span className="text-xs text-slate-500">Referensi penerimaan</span>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-100 overflow-hidden">
                {order.initialPhotoBase64 && !imgError ? (
                  <img
                    src={order.initialPhotoBase64}
                    alt={`Bukti foto awal ${order.invoiceNumber}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="w-full h-64 object-cover"
                  />
                ) : (
                  <div className="w-full h-64 flex flex-col items-center justify-center text-slate-400 bg-slate-100 p-4 text-center">
                    <ImageIcon className="w-8 h-8 mb-2" />
                    <span className="text-xs">Foto bukti tidak tersedia</span>
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/70">
                <span className="block text-xs font-semibold text-amber-900 mb-1">
                  Catatan Kondisi Awal:
                </span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  {order.initialConditionNote || 'Tidak ada catatan kerusakan/noda khusus saat diterima.'}
                </p>
              </div>
            </div>

            {/* Right: Checklist Rincian Pakaian */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    2. Checklist Fisik Item ({checkedCount}/{totalGarmentRows} baris)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Total keseluruhan: <strong className="font-mono tabular-nums">{order.totalGarmentPieces}</strong> potong
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCheckAll}
                  className="text-xs font-medium text-blue-700 hover:text-blue-900 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
                >
                  {allItemsChecked ? 'Batal Semua' : 'Centang Semua'}
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden">
                {order.garmentItems.map((item) => {
                  const isChecked = checkedIds.includes(item.id);
                  return (
                    <label
                      key={item.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50/60' : 'bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600"
                        />
                        <span
                          className={`text-sm font-medium truncate ${
                            isChecked ? 'text-emerald-900' : 'text-slate-800'
                          }`}
                        >
                          {item.label}
                        </span>
                      </div>
                      <span className="font-mono text-sm font-semibold text-slate-900 tabular-nums shrink-0">
                        {item.qty} pcs
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Pelunasan Sisa Tagihan */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-900">
                      3. Status Pembayaran
                    </span>
                  </div>
                  <PaymentStatusBadge status={order.paymentStatus} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block">Total</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(order.totalAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sudah Dibayar</span>
                    <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                      {formatRupiah(order.paidAmount)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Sisa Tagihan</span>
                    <span
                      className={`font-mono font-bold tabular-nums ${
                        order.remainingAmount > 0 ? 'text-rose-700' : 'text-slate-900'
                      }`}
                    >
                      {formatRupiah(order.remainingAmount)}
                    </span>
                  </div>
                </div>

                {order.remainingAmount > 0 ? (
                  <div className="pt-2 border-t border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-slate-700">
                        Metode Pelunasan Sisa:
                      </span>
                      <div className="flex items-center gap-1">
                        {(['Tunai', 'QRIS', 'Transfer'] as PaymentMethod[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setSettleMethod(m)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors ${
                              settleMethod === m
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={paymentConfirmed}
                        onChange={(e) => setPaymentConfirmed(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                      />
                      <span className="text-xs font-medium text-slate-800 leading-snug">
                        Pelanggan telah melunasi sisa tagihan sebesar{' '}
                        <strong className="font-mono text-rose-700">
                          {formatRupiah(order.remainingAmount)}
                        </strong>{' '}
                        melalui {settleMethod}.
                      </span>
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 pt-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pembayaran sudah lunas, siap diserahterimakan.</span>
                  </div>
                )}
              </div>

              <div>
                <label
                  htmlFor="verify-notes"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  Catatan Serah Terima (Opsional)
                </label>
                <input
                  id="verify-notes"
                  type="text"
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Contoh: Diambil langsung oleh pelanggan, kondisi lengkap & wangi"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 text-xs">
            {!allItemsChecked ? (
              <span className="inline-flex items-center gap-1.5 text-amber-700 font-medium">
                <AlertCircle className="w-4 h-4" />
                Centang seluruh {totalGarmentRows} baris rincian pakaian terlebih dahulu.
              </span>
            ) : !paymentConfirmed ? (
              <span className="inline-flex items-center gap-1.5 text-rose-700 font-medium">
                <AlertCircle className="w-4 h-4" />
                Konfirmasi pelunasan sisa tagihan sebelum serah terima.
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-700 font-medium">
                <Check className="w-4 h-4" />
                Semua item fisik & pembayaran terverifikasi.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={!canConfirm}
              onClick={handleSubmit}
              className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                canConfirm
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Konfirmasi Serah Terima & Selesai</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
