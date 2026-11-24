import { Archive, X } from 'lucide-react';
import { useState } from 'react';
import type { LaundryOrder } from '../types/laundry';

interface RackLocationModalProps {
  order: LaundryOrder | null;
  onClose: () => void;
  onConfirm: (orderId: string, rackLocation: string) => void;
}

const RACK_PRESETS = [
  'Rak A-1',
  'Rak A-2',
  'Rak A-3',
  'Rak B-1',
  'Rak B-2',
  'Gantungan G-1',
  'Gantungan G-2',
  'Loker Khusus 1',
];

export function RackLocationModal({ order, onClose, onConfirm }: RackLocationModalProps) {
  const [rack, setRack] = useState(order?.rackLocation || 'Rak A-1');
  const [error, setError] = useState('');

  if (!order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = rack.trim();
    if (!cleaned) {
      setError('Kode lokasi rak wajib diisi agar cucian tidak tertukar.');
      return;
    }
    onConfirm(order.id, cleaned);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-[1px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rack-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-blue-700" />
            <h3 id="rack-modal-title" className="text-base font-semibold text-slate-900">
              Tetapkan Lokasi Rak Penyimpanan
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Tutup modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Invoice</span>
              <span className="font-mono font-semibold text-slate-900">{order.invoiceNumber}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Pelanggan</span>
              <span className="font-medium text-slate-900">{order.customer.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Total Item</span>
              <span className="font-mono font-medium text-slate-900 tabular-nums">
                {order.totalGarmentPieces} potong
              </span>
            </div>
          </div>

          <div>
            <label htmlFor="rack-input" className="block text-sm font-medium text-slate-800 mb-1.5">
              Kode Lokasi Rak / Gantungan
            </label>
            <input
              id="rack-input"
              type="text"
              value={rack}
              onChange={(e) => {
                setRack(e.target.value);
                setError('');
              }}
              placeholder="Contoh: Rak A-1 atau Gantungan B-2"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-medium"
              autoFocus
            />
            {error && <p className="text-xs text-rose-600 mt-1.5">{error}</p>}
          </div>

          <div>
            <span className="block text-xs font-medium text-slate-500 mb-2">
              Pilih cepat kode rak tersedia:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {RACK_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setRack(preset);
                    setError('');
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    rack === preset
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              Simpan & Set Siap Diambil
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
