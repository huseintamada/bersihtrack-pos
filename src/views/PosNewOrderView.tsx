import {
  Calculator,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  Minus,
  Package,
  Plus,
  Receipt,
  Scale,
  Shirt,
  Trash2,
  User,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { EvidencePhotoCapture } from '../components/EvidencePhotoCapture';
import { QrCodeSvg } from '../components/QrCodeSvg';
import {
  COMMON_GARMENT_PRESETS,
  KILOAN_PACKAGES,
  SATUAN_PACKAGES,
} from '../data/catalog';
import type {
  GarmentItem,
  LaundryOrder,
  PaymentMethod,
  PaymentStatus,
  ServiceCategory,
  ServiceLine,
} from '../types/laundry';
import {
  formatDateTimeID,
  formatRupiah,
  generateInvoiceNumber,
  isSameLocalDay,
} from '../utils/formatters';

interface PosNewOrderViewProps {
  orders: LaundryOrder[];
  onCreateOrder: (
    orderInput: Omit<LaundryOrder, 'id' | 'createdAt' | 'updatedAt'>
  ) => LaundryOrder;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, desc?: string) => void;
  onViewOrderReceipt: (order: LaundryOrder) => void;
}

export function PosNewOrderView({
  orders,
  onCreateOrder,
  onNotify,
  onViewOrderReceipt,
}: PosNewOrderViewProps) {
  const nextInvoiceNumber = useMemo(
    () => generateInvoiceNumber(orders.map((o) => o.invoiceNumber)),
    [orders]
  );

  // KPIs
  const kpis = useMemo(() => {
    const todayOrders = orders.filter(
      (o) => o.status !== 'Dibatalkan' && isSameLocalDay(o.createdAt)
    );
    const revenueToday = orders.reduce((sum, o) => {
      if (o.status === 'Dibatalkan') return sum;
      const todayPays = o.paymentHistory
        .filter((p) => isSameLocalDay(p.timestamp))
        .reduce((pSum, p) => pSum + p.amount, 0);
      return sum + todayPays;
    }, 0);
    const inProcessCount = orders.filter((o) =>
      ['Diterima', 'Dicuci', 'Disetrika'].includes(o.status)
    ).length;
    const readyCount = orders.filter((o) => o.status === 'Siap Diambil').length;

    return {
      revenueToday,
      ordersTodayCount: todayOrders.length,
      inProcessCount,
      readyCount,
    };
  }, [orders]);

  // Customer State
  const [customerName, setCustomerName] = useState('');
  const [customerWa, setCustomerWa] = useState('');

  // Service State
  const [serviceCategory, setServiceCategory] = useState<ServiceCategory>('kiloan');
  const [selectedKiloanId, setSelectedKiloanId] = useState(KILOAN_PACKAGES[0].id);
  const [weightKg, setWeightKg] = useState<number>(3);
  const [satuanQuantities, setSatuanQuantities] = useState<Record<string, number>>({
    'satuan-bedcover': 1,
  });

  // Garment Items State (Anti-Komplain)
  const [garmentMap, setGarmentMap] = useState<Record<string, number>>({
    Kaos: 3,
    Kemeja: 2,
  });
  const [customGarmentName, setCustomGarmentName] = useState('');
  const [customGarmentQty, setCustomGarmentQty] = useState(1);

  // Evidence Photo & Condition Note
  const [initialPhoto, setInitialPhoto] = useState('');
  const [conditionNote, setConditionNote] = useState('');

  // Payment State
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Tunai');
  const [dpAmount, setDpAmount] = useState<number>(20000);

  // Calculated Service Lines & Totals
  const { serviceLines, totalAmount, estimatedCompletionIso } = useMemo(() => {
    const now = Date.now();
    if (serviceCategory === 'kiloan') {
      const pkg = KILOAN_PACKAGES.find((p) => p.id === selectedKiloanId) || KILOAN_PACKAGES[0];
      const safeWeight = Math.max(pkg.minKg, Number(weightKg) || pkg.minKg);
      const subtotal = Math.round(safeWeight * pkg.pricePerKg);
      const lines: ServiceLine[] = [
        {
          id: pkg.id,
          name: pkg.name,
          unitLabel: 'kg',
          qty: safeWeight,
          unitPrice: pkg.pricePerKg,
          subtotal,
        },
      ];
      return {
        serviceLines: lines,
        totalAmount: subtotal,
        estimatedCompletionIso: new Date(now + pkg.durationHours * 3600 * 1000).toISOString(),
      };
    } else {
      const lines: ServiceLine[] = [];
      let maxHours = 24;
      for (const pkg of SATUAN_PACKAGES) {
        const qty = satuanQuantities[pkg.id] || 0;
        if (qty > 0) {
          maxHours = Math.max(maxHours, pkg.durationHours);
          lines.push({
            id: pkg.id,
            name: pkg.name,
            unitLabel: pkg.unitLabel,
            qty,
            unitPrice: pkg.unitPrice,
            subtotal: qty * pkg.unitPrice,
          });
        }
      }
      const sum = lines.reduce((acc, l) => acc + l.subtotal, 0);
      return {
        serviceLines: lines,
        totalAmount: sum,
        estimatedCompletionIso: new Date(now + maxHours * 3600 * 1000).toISOString(),
      };
    }
  }, [serviceCategory, selectedKiloanId, weightKg, satuanQuantities]);

  const garmentItems: GarmentItem[] = useMemo(() => {
    return Object.entries(garmentMap)
      .filter(([, qty]) => qty > 0)
      .map(([label, qty], idx) => ({
        id: `item-${idx}-${label.toLowerCase().replace(/\s+/g, '-')}`,
        label,
        qty,
        verified: false,
      }));
  }, [garmentMap]);

  const totalGarmentPieces = useMemo(
    () => garmentItems.reduce((sum, item) => sum + item.qty, 0),
    [garmentItems]
  );

  const paidAmount = useMemo(() => {
    if (paymentStatus === 'Lunas') return totalAmount;
    if (paymentStatus === 'Bayar Nanti') return 0;
    return Math.min(totalAmount, Math.max(0, Number(dpAmount) || 0));
  }, [paymentStatus, totalAmount, dpAmount]);

  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  const adjustGarment = (label: string, delta: number) => {
    setGarmentMap((prev) => {
      const nextQty = Math.max(0, (prev[label] || 0) + delta);
      const copy = { ...prev };
      if (nextQty === 0) {
        delete copy[label];
      } else {
        copy[label] = nextQty;
      }
      return copy;
    });
  };

  const handleAddCustomGarment = () => {
    const clean = customGarmentName.trim();
    if (!clean) {
      onNotify('warning', 'Nama item kosong', 'Masukkan nama pakaian kustom terlebih dahulu.');
      return;
    }
    const qty = Math.max(1, Number(customGarmentQty) || 1);
    adjustGarment(clean, qty);
    setCustomGarmentName('');
    setCustomGarmentQty(1);
  };

  const adjustSatuanQty = (pkgId: string, defaultGarmentLabel: string, delta: number) => {
    setSatuanQuantities((prev) => {
      const current = prev[pkgId] || 0;
      const next = Math.max(0, current + delta);
      const copy = { ...prev };
      if (next === 0) {
        delete copy[pkgId];
      } else {
        copy[pkgId] = next;
      }
      return copy;
    });
    // Also sync garment count convenience when incrementing/decrementing satuan
    adjustGarment(defaultGarmentLabel, delta);
  };

  const resetForm = () => {
    setCustomerName('');
    setCustomerWa('');
    setServiceCategory('kiloan');
    setSelectedKiloanId(KILOAN_PACKAGES[0].id);
    setWeightKg(3);
    setSatuanQuantities({ 'satuan-bedcover': 1 });
    setGarmentMap({ Kaos: 3, Kemeja: 2 });
    setInitialPhoto('');
    setConditionNote('');
    setPaymentStatus('Lunas');
    setPaymentMethod('Tunai');
    setDpAmount(20000);
  };

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      onNotify('warning', 'Nama pelanggan wajib diisi', 'Lengkapi identitas pelanggan terlebih dahulu.');
      return;
    }
    if (!customerWa.trim() || customerWa.replace(/\D/g, '').length < 8) {
      onNotify('warning', 'No. WhatsApp tidak valid', 'Masukkan nomor WhatsApp aktif pelanggan.');
      return;
    }
    if (serviceLines.length === 0 || totalAmount <= 0) {
      onNotify('warning', 'Pilih layanan laundry', 'Pastikan minimal 1 layanan kiloan atau satuan terpilih.');
      return;
    }
    if (totalGarmentPieces === 0) {
      onNotify(
        'warning',
        'Rincian pakaian masih kosong',
        'Wajib isi minimal 1 potong pakaian untuk mencegah baju hilang/tertukar.'
      );
      return;
    }
    if (!initialPhoto) {
      onNotify(
        'warning',
        'Foto bukti awal belum diambil',
        'Ambil foto via kamera, upload foto, atau pilih foto contoh terlebih dahulu.'
      );
      return;
    }

    const nowIso = new Date().toISOString();
    const created = onCreateOrder({
      invoiceNumber: nextInvoiceNumber,
      estimatedCompletion: estimatedCompletionIso,
      customer: {
        name: customerName.trim(),
        whatsapp: customerWa.trim(),
      },
      serviceCategory,
      serviceLines,
      garmentItems,
      totalGarmentPieces,
      initialPhotoBase64: initialPhoto,
      initialConditionNote: conditionNote.trim(),
      status: 'Diterima',
      paymentStatus,
      paymentMethod,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentHistory:
        paidAmount > 0
          ? [
              {
                id: `pay-${Date.now().toString(36)}`,
                timestamp: nowIso,
                amount: paidAmount,
                method: paymentMethod,
                note:
                  paymentStatus === 'Lunas'
                    ? 'Pelunasan saat transaksi masuk'
                    : 'Pembayaran DP awal saat transaksi masuk',
              },
            ]
          : [],
    });

    onNotify(
      'success',
      `Transaksi ${created.invoiceNumber} tersimpan`,
      `${created.customer.name} · ${created.totalGarmentPieces} potong · ${formatRupiah(
        created.totalAmount
      )}`
    );
    resetForm();
    onViewOrderReceipt(created);
  };

  const qrTrackingPreviewUrl = `${window.location.origin}/?track=${encodeURIComponent(
    nextInvoiceNumber
  )}`;

  const customGarmentKeys = Object.keys(garmentMap).filter(
    (k) => !COMMON_GARMENT_PRESETS.includes(k)
  );

  return (
    <div className="space-y-6">
      {/* Top 4-Column Operational KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Omzet Masuk Hari Ini</span>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {formatRupiah(kpis.revenueToday)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Order Masuk Hari Ini</span>
          <p className="text-xl font-bold text-slate-900 font-mono tabular-nums mt-1">
            {kpis.ordersTodayCount} Transaksi
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Sedang Diproses</span>
          <p className="text-xl font-bold text-amber-700 font-mono tabular-nums mt-1">
            {kpis.inProcessCount} Cucian
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">Siap Diambil di Rak</span>
          <p className="text-xl font-bold text-emerald-700 font-mono tabular-nums mt-1">
            {kpis.readyCount} Order
          </p>
        </div>
      </div>

      {/* Main POS Transaction Builder */}
      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Form Sections (8 cols) */}
        <div className="xl:col-span-8 space-y-6">
          {/* 1. Data Pelanggan & Auto Invoice */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-blue-700" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    1. Data Pelanggan & Invoice Otomatis
                  </h2>
                  <p className="text-xs text-slate-500">
                    Nomor invoice dan QR Code tracking dibuat otomatis untuk setiap transaksi.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                <div className="text-right">
                  <span className="block text-[11px] text-slate-500">Nomor Invoice Baru</span>
                  <span className="font-mono text-sm font-bold text-blue-800">
                    {nextInvoiceNumber}
                  </span>
                </div>
                <QrCodeSvg value={qrTrackingPreviewUrl} size={46} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cust-name" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Nama Pelanggan <span className="text-rose-600">*</span>
                </label>
                <input
                  id="cust-name"
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Ibu Dewi Lestari"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                />
              </div>
              <div>
                <label htmlFor="cust-wa" className="block text-sm font-medium text-slate-800 mb-1.5">
                  Nomor WhatsApp <span className="text-rose-600">*</span>
                </label>
                <input
                  id="cust-wa"
                  type="tel"
                  value={customerWa}
                  onChange={(e) => setCustomerWa(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono"
                />
              </div>
            </div>
          </section>

          {/* 2. Layanan Fleksibel (Kiloan vs Satuan) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Scale className="w-5 h-5 text-blue-700" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    2. Pilih Layanan Laundry
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kalkulasi tarif dan estimasi tanggal selesai dihitung otomatis.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setServiceCategory('kiloan')}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    serviceCategory === 'kiloan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Laundry Kiloan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setServiceCategory('satuan');
                    if (Object.keys(satuanQuantities).length === 0) {
                      setSatuanQuantities({ 'satuan-bedcover': 1 });
                    }
                  }}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    serviceCategory === 'satuan'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Laundry Satuan
                </button>
              </div>
            </div>

            {serviceCategory === 'kiloan' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {KILOAN_PACKAGES.map((pkg) => {
                    const active = selectedKiloanId === pkg.id;
                    return (
                      <button
                        key={pkg.id}
                        type="button"
                        onClick={() => setSelectedKiloanId(pkg.id)}
                        className={`text-left p-4 rounded-xl border transition-colors ${
                          active
                            ? 'border-blue-700 bg-blue-50/70'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-slate-900">{pkg.name}</span>
                          {active && <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Estimasi: {pkg.durationLabel}</p>
                        <p className="text-base font-bold text-blue-800 font-mono tabular-nums mt-2">
                          {formatRupiah(pkg.pricePerKg)}
                          <span className="text-xs font-normal text-slate-500"> / kg</span>
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50">
                  <div>
                    <label
                      htmlFor="weight-input"
                      className="block text-sm font-medium text-slate-800"
                    >
                      Berat Timbangan (kg)
                    </label>
                    <span className="text-xs text-slate-500">
                      Minimal 1 kg · kelipatan 0.5 kg
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setWeightKg((w) => Math.max(1, Number((w - 0.5).toFixed(1))))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      aria-label="Kurangi berat"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      id="weight-input"
                      type="number"
                      min={1}
                      step={0.5}
                      value={weightKg}
                      onChange={(e) => setWeightKg(Math.max(1, parseFloat(e.target.value) || 1))}
                      className="w-24 text-center px-2 py-2 text-base font-mono font-bold border border-slate-300 rounded-lg bg-white tabular-nums"
                    />
                    <button
                      type="button"
                      onClick={() => setWeightKg((w) => Number((w + 0.5).toFixed(1)))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                      aria-label="Tambah berat"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                {SATUAN_PACKAGES.map((pkg) => {
                  const qty = satuanQuantities[pkg.id] || 0;
                  return (
                    <div
                      key={pkg.id}
                      className={`flex items-center justify-between gap-4 px-4 py-3 ${
                        qty > 0 ? 'bg-blue-50/40' : 'bg-white'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">{pkg.name}</p>
                        <p className="text-xs text-slate-500 font-mono tabular-nums">
                          {formatRupiah(pkg.unitPrice)} / {pkg.unitLabel} · Est. {pkg.durationHours} jam
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => adjustSatuanQty(pkg.id, pkg.defaultGarmentLabel, -1)}
                          disabled={qty === 0}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                          aria-label={`Kurangi ${pkg.name}`}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-8 text-center font-mono text-sm font-bold text-slate-900 tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => adjustSatuanQty(pkg.id, pkg.defaultGarmentLabel, 1)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          aria-label={`Tambah ${pkg.name}`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 3. Rincian Item Pakaian (Wajib - Anti Komplain) */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Shirt className="w-5 h-5 text-blue-700" />
                <div>
                  <h2 className="text-base font-semibold text-slate-900">
                    3. Rincian Jumlah Pakaian (Wajib Hitung di Depan Pelanggan)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kunci sistem anti-komplain untuk memastikan tidak ada pakaian tertukar atau kurang.
                  </p>
                </div>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold font-mono tabular-nums">
                Total: {totalGarmentPieces} Potong
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {COMMON_GARMENT_PRESETS.map((label) => {
                const qty = garmentMap[label] || 0;
                return (
                  <div
                    key={label}
                    className={`p-3 rounded-xl border transition-colors ${
                      qty > 0
                        ? 'border-blue-600 bg-blue-50/60'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-800 truncate mb-2">{label}</p>
                    <div className="flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => adjustGarment(label, -1)}
                        disabled={qty === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 disabled:opacity-40"
                        aria-label={`Kurangi ${label}`}
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => adjustGarment(label, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        aria-label={`Tambah ${label}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Garment Input */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <input
                type="text"
                value={customGarmentName}
                onChange={(e) => setCustomGarmentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomGarment();
                  }
                }}
                placeholder="Tambah item kustom (mis: Sprei, Mukena, Jas Hujan)"
                className="flex-1 min-w-[200px] px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              <input
                type="number"
                min={1}
                value={customGarmentQty}
                onChange={(e) => setCustomGarmentQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-20 px-3 py-2 text-sm font-mono font-semibold text-center border border-slate-300 rounded-lg"
              />
              <button
                type="button"
                onClick={handleAddCustomGarment}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>

            {/* Custom items list */}
            {customGarmentKeys.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {customGarmentKeys.map((key) => (
                  <div
                    key={key}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-medium text-blue-900"
                  >
                    <span>
                      {key}: <strong className="font-mono">{garmentMap[key]}x</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustGarment(key, -(garmentMap[key] || 0))}
                      className="text-blue-600 hover:text-rose-600"
                      aria-label={`Hapus ${key}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 4. Bukti Foto Awal & Catatan Kondisi */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <ClipboardList className="w-5 h-5 text-blue-700" />
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  4. Dokumentasi Bukti Foto & Catatan Kondisi Awal
                </h2>
                <p className="text-xs text-slate-500">
                  Foto otomatis dikompresi ringan dan muncul di struk verifikasi maupun halaman status pelanggan.
                </p>
              </div>
            </div>

            <EvidencePhotoCapture
              value={initialPhoto}
              onChange={setInitialPhoto}
              onNotify={onNotify}
            />

            <div>
              <label
                htmlFor="condition-note"
                className="block text-sm font-medium text-slate-800 mb-1.5"
              >
                Catatan Kondisi Awal (Noda / Cacat / Permintaan Khusus)
              </label>
              <textarea
                id="condition-note"
                rows={2}
                value={conditionNote}
                onChange={(e) => setConditionNote(e.target.value)}
                placeholder="Contoh: Kancing kemeja putih lepas 1, noda tinta di lengan kanan, bahan mudah luntur dipisah."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </section>
        </div>

        {/* Right Sticky Summary & Payment Column (4 cols) */}
        <aside className="xl:col-span-4 xl:sticky xl:top-6 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-semibold text-slate-900">Ringkasan & Pembayaran</h3>
              </div>
              <span className="font-mono text-xs font-semibold text-slate-500">
                {nextInvoiceNumber}
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Estimasi Selesai</span>
                <span className="font-medium text-slate-900 text-right">
                  {formatDateTimeID(estimatedCompletionIso)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Jumlah Pakaian</span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {totalGarmentPieces} Potong ({garmentItems.length} jenis)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                {serviceLines.length > 0 ? (
                  serviceLines.map((line) => (
                    <div key={line.id} className="flex justify-between text-xs text-slate-700">
                      <span className="truncate pr-2">
                        {line.name} ({line.qty} {line.unitLabel})
                      </span>
                      <span className="font-mono font-semibold text-slate-900 tabular-nums shrink-0">
                        {formatRupiah(line.subtotal)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-rose-600">Belum ada layanan dipilih.</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-medium text-slate-300">TOTAL TAGIHAN</span>
              <span className="text-2xl font-bold font-mono tabular-nums">
                {formatRupiah(totalAmount)}
              </span>
            </div>

            {/* Payment Status & Method */}
            <div className="space-y-3">
              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Status Pembayaran
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Lunas', 'DP', 'Bayar Nanti'] as PaymentStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setPaymentStatus(st)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-colors whitespace-nowrap ${
                        paymentStatus === st
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {paymentStatus === 'DP' && (
                <div>
                  <label htmlFor="dp-input" className="block text-xs font-medium text-slate-700 mb-1">
                    Nominal DP Diterima (Rp)
                  </label>
                  <input
                    id="dp-input"
                    type="number"
                    min={0}
                    max={totalAmount}
                    step={1000}
                    value={dpAmount}
                    onChange={(e) => setDpAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-lg tabular-nums"
                  />
                </div>
              )}

              <div>
                <span className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Metode Pembayaran
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Tunai', 'QRIS', 'Transfer'] as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg border transition-colors inline-flex items-center justify-center gap-1 ${
                        paymentMethod === method
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{method}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Dibayar Sekarang</span>
                  <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                    {formatRupiah(paidAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Sisa Saat Pengambilan</span>
                  <span className="font-mono font-semibold text-slate-900 tabular-nums">
                    {formatRupiah(remainingAmount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors shadow-xs"
              >
                <Receipt className="w-4 h-4" />
                <span>Simpan Transaksi & Cetak Struk</span>
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="w-full py-2 px-4 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Reset Form Kasir
              </button>
            </div>

            {/* Readiness check hint */}
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5 justify-center">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              <span>Data tersimpan lokal secara instan & siap dicetak</span>
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}
