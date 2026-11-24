import type { OrderStatus, PaymentStatus } from '../types/laundry';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

export function formatDateTimeID(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatDateShortID(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function isSameLocalDay(isoString: string, referenceDate = new Date()): boolean {
  const d = new Date(isoString);
  return (
    d.getFullYear() === referenceDate.getFullYear() &&
    d.getMonth() === referenceDate.getMonth() &&
    d.getDate() === referenceDate.getDate()
  );
}

export function generateInvoiceNumber(existingInvoices: string[]): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const prefix = `INV-${datePart}-`;

  let maxSeq = 0;
  for (const inv of existingInvoices) {
    if (inv.startsWith(prefix)) {
      const seqStr = inv.slice(prefix.length);
      const seqNum = parseInt(seqStr, 10);
      if (!Number.isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  }
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function normalizeWhatsAppNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    return `62${digits.slice(1)}`;
  }
  if (digits.startsWith('62')) {
    return digits;
  }
  return digits;
}

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  'Diterima',
  'Dicuci',
  'Disetrika',
  'Siap Diambil',
  'Selesai',
];

export function getStatusStyle(status: OrderStatus): {
  bg: string;
  text: string;
  border: string;
  stepIndex: number;
} {
  switch (status) {
    case 'Diterima':
      return {
        bg: 'bg-slate-100',
        text: 'text-slate-700',
        border: 'border-slate-200',
        stepIndex: 0,
      };
    case 'Dicuci':
      return {
        bg: 'bg-sky-50',
        text: 'text-sky-700',
        border: 'border-sky-200',
        stepIndex: 1,
      };
    case 'Disetrika':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
        stepIndex: 2,
      };
    case 'Siap Diambil':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        stepIndex: 3,
      };
    case 'Selesai':
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-200',
        stepIndex: 4,
      };
    case 'Dibatalkan':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
        stepIndex: -1,
      };
  }
}

export function getPaymentStatusStyle(status: PaymentStatus): {
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'Lunas':
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
      };
    case 'DP':
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-200',
      };
    case 'Bayar Nanti':
      return {
        bg: 'bg-rose-50',
        text: 'text-rose-700',
        border: 'border-rose-200',
      };
  }
}
