import {
  CheckCheck,
  Clock,
  Flame,
  PackageCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';
import type { OrderStatus, PaymentStatus } from '../types/laundry';
import { getPaymentStatusStyle, getStatusStyle } from '../utils/formatters';

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const style = getStatusStyle(status);

  const Icon =
    status === 'Diterima'
      ? Clock
      : status === 'Dicuci'
        ? Sparkles
        : status === 'Disetrika'
          ? Flame
          : status === 'Siap Diambil'
            ? PackageCheck
            : status === 'Selesai'
              ? CheckCheck
              : XCircle;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
      <span>{status}</span>
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const style = getPaymentStatusStyle(status);
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-xs font-medium whitespace-nowrap shrink-0 ${style.bg} ${style.text} ${style.border}`}
    >
      {status}
    </span>
  );
}
