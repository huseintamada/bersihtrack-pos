import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QrCodeSvgProps {
  value: string;
  size?: number;
  className?: string;
}

export function QrCodeSvg({ value, size = 96, className = '' }: QrCodeSvgProps) {
  const [svgMarkup, setSvgMarkup] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toString(value, {
      type: 'svg',
      margin: 1,
      width: size,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((svg) => {
        if (!cancelled) {
          setSvgMarkup(svg);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSvgMarkup('');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!svgMarkup) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex items-center justify-center border border-slate-200 bg-white text-[10px] font-mono text-slate-400 ${className}`}
      >
        QR
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 bg-white p-1 border border-slate-200 rounded-md [&>svg]:w-full [&>svg]:h-full ${className}`}
      dangerouslySetInnerHTML={{ __html: svgMarkup }}
      aria-label={`QR Code untuk ${value}`}
    />
  );
}
