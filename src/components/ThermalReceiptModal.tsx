import { ExternalLink, Printer, QrCode, X } from 'lucide-react';
import { useState } from 'react';
import type { LaundryOrder, ShopProfile } from '../types/laundry';
import { formatDateTimeID, formatRupiah } from '../utils/formatters';
import { QrCodeSvg } from './QrCodeSvg';

interface ThermalReceiptModalProps {
  order: LaundryOrder | null;
  shopProfile: ShopProfile;
  onClose: () => void;
  onOpenPublicTracking: (invoiceNumber: string) => void;
}

export function ThermalReceiptModal({
  order,
  shopProfile,
  onClose,
  onOpenPublicTracking,
}: ThermalReceiptModalProps) {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>('80mm');

  if (!order) return null;

  const trackingUrl = `${window.location.origin}/?track=${encodeURIComponent(order.invoiceNumber)}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden my-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2.5">
            <Printer className="w-5 h-5 text-blue-700" />
            <h3 id="receipt-modal-title" className="text-base font-semibold text-slate-900">
              Preview Struk Thermal
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg">
              <button
                type="button"
                onClick={() => setPaperWidth('58mm')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  paperWidth === '58mm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kertas 58mm
              </button>
              <button
                type="button"
                onClick={() => setPaperWidth('80mm')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  paperWidth === '80mm'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Kertas 80mm
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              aria-label="Tutup modal struk"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-6 bg-slate-100 flex justify-center max-h-[68vh] overflow-y-auto">
          <div
            id="thermal-receipt-print-area"
            style={{ width: paperWidth === '58mm' ? '260px' : '340px' }}
            className="bg-white border border-slate-300 shadow-sm p-4 font-mono text-[11px] leading-relaxed text-slate-900"
          >
            <div className="text-center border-b border-dashed border-slate-400 pb-2.5 mb-2.5">
              <p className="font-bold text-sm uppercase tracking-tight">{shopProfile.name}</p>
              <p className="text-[10px] text-slate-700">{shopProfile.address}</p>
              <p className="text-[10px] text-slate-700">WA/Telp: {shopProfile.phone}</p>
            </div>

            <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2.5 mb-2.5">
              <div className="flex justify-between gap-2">
                <span>No. Inv</span>
                <span className="font-bold">{order.invoiceNumber}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Masuk</span>
                <span>{formatDateTimeID(order.createdAt)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Est. Selesai</span>
                <span>{formatDateTimeID(order.estimatedCompletion)}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Pelanggan</span>
                <span className="font-semibold text-right">{order.customer.name}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>WhatsApp</span>
                <span>{order.customer.whatsapp}</span>
              </div>
              {order.rackLocation && (
                <div className="flex justify-between gap-2">
                  <span>Lokasi Rak</span>
                  <span className="font-bold">{order.rackLocation}</span>
                </div>
              )}
            </div>

            <div className="border-b border-dashed border-slate-400 pb-2.5 mb-2.5">
              <p className="font-bold mb-1">LAYANAN:</p>
              {order.serviceLines.map((line) => (
                <div key={line.id} className="mb-1">
                  <div className="font-medium">{line.name}</div>
                  <div className="flex justify-between text-slate-700">
                    <span>
                      {line.qty} {line.unitLabel} x {formatRupiah(line.unitPrice)}
                    </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatRupiah(line.subtotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-b border-dashed border-slate-400 pb-2.5 mb-2.5">
              <div className="flex justify-between font-bold mb-1">
                <span>RINCIAN PAKAIAN:</span>
                <span className="tabular-nums">{order.totalGarmentPieces} Potong</span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                {order.garmentItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span className="truncate">{item.label}</span>
                    <span className="font-semibold tabular-nums">{item.qty}x</span>
                  </div>
                ))}
              </div>
              {order.initialConditionNote && (
                <div className="mt-2 p-1.5 bg-slate-100 border border-slate-300 text-[10px]">
                  <span className="font-bold block">Catatan Kondisi Awal:</span>
                  <span>{order.initialConditionNote}</span>
                </div>
              )}
            </div>

            <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2.5 mb-3">
              <div className="flex justify-between font-bold text-xs">
                <span>TOTAL TAGIHAN</span>
                <span className="tabular-nums">{formatRupiah(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Dibayar ({order.paymentMethod})</span>
                <span className="tabular-nums">{formatRupiah(order.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Sisa Tagihan</span>
                <span className="tabular-nums">{formatRupiah(order.remainingAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Status Bayar</span>
                <span className="font-bold uppercase">{order.paymentStatus}</span>
              </div>
            </div>

            <div className="flex flex-col items-center text-center space-y-1.5">
              <QrCodeSvg value={trackingUrl} size={paperWidth === '58mm' ? 84 : 104} />
              <p className="text-[10px] font-semibold">SCAN QR UNTUK CEK STATUS & FOTO</p>
              <p className="text-[9px] text-slate-600">
                Wajib bawa struk / tunjukkan invoice saat pengambilan. Komplain dilayani maks. 1x24 jam setelah serah terima.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-200 bg-white">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPublicTracking(order.invoiceNumber);
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
          >
            <QrCode className="w-4 h-4" />
            <span>Preview Halaman Pelanggan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-700 hover:bg-blue-800 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk ({paperWidth})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
