import {
  Archive,
  Check,
  Clock,
  Globe,
  Image as ImageIcon,
  MessageCircle,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { QrCodeSvg } from '../components/QrCodeSvg';
import { OrderStatusBadge, PaymentStatusBadge } from '../components/StatusIndicator';
import type { LaundryOrder, ShopProfile } from '../types/laundry';
import {
  formatDateTimeID,
  formatRupiah,
  normalizeWhatsAppNumber,
  ORDER_STATUS_FLOW,
} from '../utils/formatters';

interface PublicTrackingViewProps {
  orders: LaundryOrder[];
  shopProfile: ShopProfile;
  initialInvoice?: string;
}

export function PublicTrackingView({
  orders,
  shopProfile,
  initialInvoice = '',
}: PublicTrackingViewProps) {
  const [invoiceInput, setInvoiceInput] = useState(
    initialInvoice || orders[0]?.invoiceNumber || ''
  );
  const [activeInvoice, setActiveInvoice] = useState(
    initialInvoice || orders[0]?.invoiceNumber || ''
  );
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (initialInvoice) {
      setInvoiceInput(initialInvoice);
      setActiveInvoice(initialInvoice);
      setImgError(false);
    }
  }, [initialInvoice]);

  const matchedOrder = orders.find(
    (o) => o.invoiceNumber.toUpperCase() === activeInvoice.trim().toUpperCase()
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveInvoice(invoiceInput.trim());
    setImgError(false);
  };

  const currentStepIdx = matchedOrder
    ? ORDER_STATUS_FLOW.indexOf(matchedOrder.status)
    : -1;

  const simulatedDomainUrl = matchedOrder
    ? `https://status.bersihtrack.id/cek/${matchedOrder.invoiceNumber}`
    : 'https://status.bersihtrack.id/cek';

  return (
    <div className="space-y-6">
      {/* Simulation Banner & Invoice Lookup */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Globe className="w-5 h-5 text-blue-700" />
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Preview Halaman Pelanggan (Simulasi Domain & Scan QR)
              </h2>
              <p className="text-xs text-slate-500">
                Tampilan publik yang dilihat pelanggan saat memindai QR Code pada struk thermal.
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 font-mono text-xs text-slate-600 truncate max-w-full">
            {simulatedDomainUrl}
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={invoiceInput}
              onChange={(e) => setInvoiceInput(e.target.value)}
              placeholder="Masukkan Nomor Invoice (contoh: INV-20261124-001)"
              className="w-full pl-10 pr-4 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors whitespace-nowrap shrink-0"
          >
            Lacak Cucian
          </button>
        </form>

        {/* Quick demo invoice chips */}
        {orders.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Pilih cepat invoice:</span>
            {orders.slice(0, 5).map((ord) => (
              <button
                key={ord.id}
                type="button"
                onClick={() => {
                  setInvoiceInput(ord.invoiceNumber);
                  setActiveInvoice(ord.invoiceNumber);
                  setImgError(false);
                }}
                className={`px-2.5 py-1 rounded-md border font-mono transition-colors ${
                  matchedOrder?.invoiceNumber === ord.invoiceNumber
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {ord.invoiceNumber} ({ord.status})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Customer Portal Preview Frame */}
      {!matchedOrder ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <p className="text-base font-semibold text-slate-800">
            Nomor Invoice &ldquo;{activeInvoice || '-'}&rdquo; tidak ditemukan
          </p>
          <p className="text-sm text-slate-500 mt-1">
            Periksa kembali kode invoice pada struk atau pilih salah satu invoice di atas.
          </p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          {/* Customer Portal Header */}
          <div className="bg-slate-900 text-white p-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-300 font-medium">{shopProfile.name}</p>
              <h3 className="text-xl font-bold mt-0.5 font-mono">{matchedOrder.invoiceNumber}</h3>
              <p className="text-xs text-slate-300 mt-1">
                Pelanggan: <strong className="text-white">{matchedOrder.customer.name}</strong> · Masuk:{' '}
                {formatDateTimeID(matchedOrder.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <OrderStatusBadge status={matchedOrder.status} />
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Progress Stepper */}
            {matchedOrder.status === 'Dibatalkan' ? (
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50 text-sm text-rose-800 font-medium">
                Transaksi ini telah dibatalkan. Hubungi outlet untuk informasi lebih lanjut.
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800">Progres Pengerjaan Cucian</span>
                  <span className="text-slate-500 inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Estimasi Selesai: {formatDateTimeID(matchedOrder.estimatedCompletion)}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {ORDER_STATUS_FLOW.map((step, index) => {
                    const isCompleted = index <= currentStepIdx;
                    const isCurrent = index === currentStepIdx;
                    return (
                      <div key={step} className="space-y-1.5">
                        <div
                          className={`h-2 rounded-full transition-colors ${
                            isCompleted ? 'bg-blue-700' : 'bg-slate-200'
                          }`}
                        />
                        <div className="flex items-center gap-1">
                          {isCompleted && (
                            <Check className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                          )}
                          <span
                            className={`text-[11px] sm:text-xs truncate ${
                              isCurrent
                                ? 'font-bold text-blue-800'
                                : isCompleted
                                  ? 'font-medium text-slate-800'
                                  : 'text-slate-400'
                            }`}
                          >
                            {step}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Ready & Rack Highlight */}
            {matchedOrder.rackLocation && (
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Archive className="w-6 h-6 text-emerald-700 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      Cucian Tersimpan di {matchedOrder.rackLocation}
                    </p>
                    <p className="text-xs text-emerald-700">
                      {matchedOrder.status === 'Siap Diambil'
                        ? 'Cucian Anda sudah selesai, wangi, dan siap diambil di counter.'
                        : 'Lokasi penyimpanan terverifikasi di rak outlet.'}
                    </p>
                  </div>
                </div>
                {matchedOrder.status === 'Selesai' && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800">
                    <ShieldCheck className="w-4 h-4" />
                    Sudah Diserahterimakan
                  </span>
                )}
              </div>
            )}

            {/* Two Column Detail: Rincian Item + Foto Bukti Awal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h4 className="text-sm font-semibold text-slate-900">
                      Rincian Item Pakaian Anda
                    </h4>
                    <span className="font-mono text-xs font-bold text-blue-800 tabular-nums">
                      Total {matchedOrder.totalGarmentPieces} Potong
                    </span>
                  </div>
                  <div className="divide-y divide-slate-100 text-sm">
                    {matchedOrder.garmentItems.map((g) => (
                      <div key={g.id} className="flex justify-between py-2">
                        <span className="text-slate-700">{g.label}</span>
                        <span className="font-mono font-semibold text-slate-900 tabular-nums">
                          {g.qty} pcs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">Rincian Pembayaran</span>
                    <PaymentStatusBadge status={matchedOrder.paymentStatus} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Total Tagihan</span>
                    <span className="font-mono font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(matchedOrder.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>Sudah Dibayar ({matchedOrder.paymentMethod})</span>
                    <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                      {formatRupiah(matchedOrder.paidAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-bold pt-1 border-t border-slate-100">
                    <span className="text-slate-800">Sisa Pembayaran</span>
                    <span
                      className={`font-mono tabular-nums ${
                        matchedOrder.remainingAmount > 0 ? 'text-rose-700' : 'text-emerald-700'
                      }`}
                    >
                      {formatRupiah(matchedOrder.remainingAmount)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-800">
                      Foto Bukti Kondisi Awal
                    </span>
                    <span className="text-[11px] text-slate-500">Diambil saat drop-off</span>
                  </div>
                  {matchedOrder.initialPhotoBase64 && !imgError ? (
                    <img
                      src={matchedOrder.initialPhotoBase64}
                      alt={`Foto bukti ${matchedOrder.invoiceNumber}`}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="w-full h-56 object-cover"
                    />
                  ) : (
                    <div className="h-56 flex flex-col items-center justify-center bg-slate-100 text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs">Foto tidak tersedia</span>
                    </div>
                  )}
                  <div className="p-3.5 bg-white border-t border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900 block mb-0.5">Catatan Kondisi Awal:</strong>
                    {matchedOrder.initialConditionNote ||
                      'Tidak ada cacat/noda khusus yang dicatat saat penerimaan.'}
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-slate-900">Butuh bantuan outlet?</p>
                    <p className="text-[11px] text-slate-500">
                      {shopProfile.address} · {shopProfile.phone}
                    </p>
                    <a
                      href={`https://wa.me/${normalizeWhatsAppNumber(
                        shopProfile.phone
                      )}?text=${encodeURIComponent(
                        `Halo ${shopProfile.name}, saya ingin menanyakan status cucian dengan invoice ${matchedOrder.invoiceNumber}.`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 mt-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Hubungi Kasir via WhatsApp</span>
                    </a>
                  </div>
                  <QrCodeSvg value={simulatedDomainUrl} size={68} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
