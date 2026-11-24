import type { AuditLogEntry, LaundryOrder, ShopProfile } from '../types/laundry';

export interface KiloanPackage {
  id: string;
  name: string;
  durationLabel: string;
  durationHours: number;
  pricePerKg: number;
  minKg: number;
}

export interface SatuanPackage {
  id: string;
  name: string;
  unitLabel: string;
  durationHours: number;
  unitPrice: number;
  defaultGarmentLabel: string;
}

export const KILOAN_PACKAGES: KiloanPackage[] = [
  {
    id: 'kiloan-reguler',
    name: 'Kiloan Reguler (3 Hari)',
    durationLabel: '3 Hari (72 Jam)',
    durationHours: 72,
    pricePerKg: 8000,
    minKg: 1,
  },
  {
    id: 'kiloan-ekspres',
    name: 'Kiloan Ekspres (1 Hari)',
    durationLabel: '1 Hari (24 Jam)',
    durationHours: 24,
    pricePerKg: 13000,
    minKg: 1,
  },
  {
    id: 'kiloan-kilat',
    name: 'Kiloan Kilat (6 Jam)',
    durationLabel: '6 Jam Selesai',
    durationHours: 6,
    pricePerKg: 20000,
    minKg: 1,
  },
];

export const SATUAN_PACKAGES: SatuanPackage[] = [
  {
    id: 'satuan-bedcover',
    name: 'Bedcover (Queen / King)',
    unitLabel: 'pcs',
    durationHours: 48,
    unitPrice: 30000,
    defaultGarmentLabel: 'Bedcover',
  },
  {
    id: 'satuan-jas',
    name: 'Jas / Blazer Dry Clean',
    unitLabel: 'stel',
    durationHours: 48,
    unitPrice: 28000,
    defaultGarmentLabel: 'Jas / Blazer',
  },
  {
    id: 'satuan-sepatu',
    name: 'Cuci Sepatu Deep Clean',
    unitLabel: 'pasang',
    durationHours: 48,
    unitPrice: 35000,
    defaultGarmentLabel: 'Sepatu',
  },
  {
    id: 'satuan-karpet',
    name: 'Karpet Tebal (Per Meter)',
    unitLabel: 'm²',
    durationHours: 72,
    unitPrice: 22000,
    defaultGarmentLabel: 'Karpet',
  },
  {
    id: 'satuan-jaket',
    name: 'Jaket Parka / Kulit / Tebal',
    unitLabel: 'pcs',
    durationHours: 48,
    unitPrice: 25000,
    defaultGarmentLabel: 'Jaket',
  },
];

export const COMMON_GARMENT_PRESETS: string[] = [
  'Kaos',
  'Kemeja',
  'Celana Panjang',
  'Celana Pendek',
  'Jaket',
  'Pakaian Dalam',
  'Kerudung/Jilbab',
  'Handuk',
];

export const SAMPLE_LAUNDRY_PHOTOS = [
  {
    id: 'sample-kiloan',
    label: 'Tumpukan Baju Kiloan (Counter)',
    url: '/src/assets/images/laundry_pile_kiloan_1795526802341.jpg',
  },
  {
    id: 'sample-kemeja',
    label: 'Kemeja Putih & Celana Bahan',
    url: '/src/assets/images/laundry_shirt_collar_1795526802081.jpg',
  },
  {
    id: 'sample-bedcover',
    label: 'Bedcover & Jaket Parka',
    url: '/src/assets/images/laundry_bedcover_jacket_1795526802659.jpg',
  },
];

export const DEFAULT_SHOP_PROFILE: ShopProfile = {
  name: 'BersihTrack Laundry & Care',
  address: 'Jl. Merdeka Raya No. 48, Bandung',
  phone: '0811-2233-4455',
  cashierName: 'Rina (Kasir Shift 1)',
};

export function createInitialSeedData(): {
  orders: LaundryOrder[];
  auditLogs: AuditLogEntry[];
} {
  const now = new Date();
  const todayStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;

  const hoursAgo = (h: number) =>
    new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
  const hoursAhead = (h: number) =>
    new Date(now.getTime() + h * 60 * 60 * 1000).toISOString();

  const orders: LaundryOrder[] = [
    {
      id: 'ord-seed-001',
      invoiceNumber: `INV-${todayStr}-001`,
      createdAt: hoursAgo(26),
      updatedAt: hoursAgo(1),
      estimatedCompletion: hoursAhead(2),
      customer: {
        name: 'Budi Santoso',
        whatsapp: '081234567890',
      },
      serviceCategory: 'kiloan',
      serviceLines: [
        {
          id: 'srv-1',
          name: 'Kiloan Reguler (3 Hari)',
          unitLabel: 'kg',
          qty: 4.5,
          unitPrice: 8000,
          subtotal: 36000,
        },
      ],
      garmentItems: [
        { id: 'g-1', label: 'Kaos', qty: 6, verified: false },
        { id: 'g-2', label: 'Kemeja', qty: 3, verified: false },
        { id: 'g-3', label: 'Celana Panjang', qty: 2, verified: false },
        { id: 'g-4', label: 'Pakaian Dalam', qty: 3, verified: false },
      ],
      totalGarmentPieces: 14,
      initialPhotoBase64: SAMPLE_LAUNDRY_PHOTOS[0].url,
      initialConditionNote:
        'Kaos abu-abu ada noda pudar di bagian bawah; resleting celana jeans aman.',
      status: 'Siap Diambil',
      rackLocation: 'Rak A-2',
      paymentStatus: 'DP',
      paymentMethod: 'Tunai',
      totalAmount: 36000,
      paidAmount: 20000,
      remainingAmount: 16000,
      paymentHistory: [
        {
          id: 'pay-seed-1',
          timestamp: hoursAgo(26),
          amount: 20000,
          method: 'Tunai',
          note: 'Pembayaran DP awal saat drop-off',
        },
      ],
    },
    {
      id: 'ord-seed-002',
      invoiceNumber: `INV-${todayStr}-002`,
      createdAt: hoursAgo(8),
      updatedAt: hoursAgo(2),
      estimatedCompletion: hoursAhead(16),
      customer: {
        name: 'Siti Rahmawati',
        whatsapp: '085698765432',
      },
      serviceCategory: 'kiloan',
      serviceLines: [
        {
          id: 'srv-2',
          name: 'Kiloan Ekspres (1 Hari)',
          unitLabel: 'kg',
          qty: 2.5,
          unitPrice: 13000,
          subtotal: 32500,
        },
      ],
      garmentItems: [
        { id: 'g-5', label: 'Kemeja', qty: 3, verified: false },
        { id: 'g-6', label: 'Celana Panjang', qty: 2, verified: false },
        { id: 'g-7', label: 'Kerudung/Jilbab', qty: 2, verified: false },
      ],
      totalGarmentPieces: 7,
      initialPhotoBase64: SAMPLE_LAUNDRY_PHOTOS[1].url,
      initialConditionNote:
        'Kemeja putih kancing manset kanan agak longgar, harap disetrika suhu sedang.',
      status: 'Disetrika',
      paymentStatus: 'Lunas',
      paymentMethod: 'QRIS',
      totalAmount: 32500,
      paidAmount: 32500,
      remainingAmount: 0,
      paymentHistory: [
        {
          id: 'pay-seed-2',
          timestamp: hoursAgo(8),
          amount: 32500,
          method: 'QRIS',
          note: 'Pelunasan QRIS saat transaksi masuk',
        },
      ],
    },
    {
      id: 'ord-seed-003',
      invoiceNumber: `INV-${todayStr}-003`,
      createdAt: hoursAgo(2),
      updatedAt: hoursAgo(2),
      estimatedCompletion: hoursAhead(46),
      customer: {
        name: 'Andi Wijaya',
        whatsapp: '081322446688',
      },
      serviceCategory: 'satuan',
      serviceLines: [
        {
          id: 'srv-3a',
          name: 'Bedcover (Queen / King)',
          unitLabel: 'pcs',
          qty: 1,
          unitPrice: 30000,
          subtotal: 30000,
        },
        {
          id: 'srv-3b',
          name: 'Jaket Parka / Kulit / Tebal',
          unitLabel: 'pcs',
          qty: 1,
          unitPrice: 25000,
          subtotal: 25000,
        },
      ],
      garmentItems: [
        { id: 'g-8', label: 'Bedcover', qty: 1, verified: false },
        { id: 'g-9', label: 'Jaket', qty: 1, verified: false },
      ],
      totalGarmentPieces: 2,
      initialPhotoBase64: SAMPLE_LAUNDRY_PHOTOS[2].url,
      initialConditionNote:
        'Bulu hood jaket parka dilepas terpisah saat pencucian; bedcover krem tidak luntur.',
      status: 'Diterima',
      paymentStatus: 'Bayar Nanti',
      paymentMethod: 'Transfer',
      totalAmount: 55000,
      paidAmount: 0,
      remainingAmount: 55000,
      paymentHistory: [],
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'log-seed-1',
      timestamp: hoursAgo(26),
      invoiceNumber: orders[0].invoiceNumber,
      action: 'ORDER_CREATED',
      detail: 'Order baru Budi Santoso (14 potong, DP Rp 20.000 Tunai) dengan foto bukti awal.',
      actor: DEFAULT_SHOP_PROFILE.cashierName,
    },
    {
      id: 'log-seed-2',
      timestamp: hoursAgo(8),
      invoiceNumber: orders[1].invoiceNumber,
      action: 'ORDER_CREATED',
      detail: 'Order baru Siti Rahmawati (7 potong, Lunas Rp 32.500 QRIS) dengan foto bukti awal.',
      actor: DEFAULT_SHOP_PROFILE.cashierName,
    },
    {
      id: 'log-seed-3',
      timestamp: hoursAgo(2),
      invoiceNumber: orders[1].invoiceNumber,
      action: 'STATUS_CHANGED',
      detail: 'Status diubah dari Dicuci menjadi Disetrika.',
      actor: DEFAULT_SHOP_PROFILE.cashierName,
    },
    {
      id: 'log-seed-4',
      timestamp: hoursAgo(2),
      invoiceNumber: orders[2].invoiceNumber,
      action: 'ORDER_CREATED',
      detail: 'Order satuan baru Andi Wijaya (2 item, Bayar Nanti Rp 55.000).',
      actor: DEFAULT_SHOP_PROFILE.cashierName,
    },
    {
      id: 'log-seed-5',
      timestamp: hoursAgo(1),
      invoiceNumber: orders[0].invoiceNumber,
      action: 'RACK_ASSIGNED',
      detail: 'Status Siap Diambil — ditempatkan di Rak A-2.',
      actor: DEFAULT_SHOP_PROFILE.cashierName,
    },
  ];

  return { orders, auditLogs };
}
