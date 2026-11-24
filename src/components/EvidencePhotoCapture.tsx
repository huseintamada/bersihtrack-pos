import { Camera, Check, Image as ImageIcon, RefreshCw, Upload, VideoOff, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SAMPLE_LAUNDRY_PHOTOS } from '../data/catalog';
import { compressFileToBase64, compressMediaToBase64, compressUrlToBase64 } from '../utils/imageUtils';

interface EvidencePhotoCaptureProps {
  value: string;
  onChange: (base64OrUrl: string) => void;
  onNotify: (type: 'success' | 'info' | 'warning' | 'error', title: string, desc?: string) => void;
}

export function EvidencePhotoCapture({
  value,
  onChange,
  onNotify,
}: EvidencePhotoCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showSamples, setShowSamples] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleOpenCamera = async () => {
    setCameraError(null);
    setShowSamples(false);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = 'Perangkat/browser ini tidak mendukung akses kamera langsung. Gunakan Upload Foto atau Foto Contoh.';
      setCameraError(msg);
      onNotify('warning', 'Kamera tidak tersedia', msg);
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;
      setIsCameraOpen(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      const msg = 'Izin kamera ditolak atau perangkat kamera tidak ditemukan. Gunakan Upload Foto atau Foto Contoh.';
      setCameraError(msg);
      onNotify('warning', 'Kamera gagal dibuka', msg);
    }
  };

  const handleCaptureSnapshot = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      onNotify('warning', 'Kamera belum siap', 'Tunggu sejenak hingga gambar kamera muncul.');
      return;
    }

    try {
      const compressed = compressMediaToBase64(
        video,
        video.videoWidth,
        video.videoHeight,
        800,
        0.72
      );
      onChange(compressed);
      stopCamera();
      onNotify('success', 'Foto bukti berhasil dijepret', 'Gambar telah dikompresi otomatis.');
    } catch {
      onNotify('error', 'Gagal memproses foto', 'Silakan coba jepret ulang atau upload file.');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const compressed = await compressFileToBase64(file, 800, 0.72);
      onChange(compressed);
      stopCamera();
      setShowSamples(false);
      setCameraError(null);
      onNotify('success', 'Foto berhasil diupload', `File "${file.name}" siap disimpan.`);
    } catch {
      onNotify('error', 'Gagal membaca gambar', 'Pastikan file berformat JPG, PNG, atau WebP.');
    } finally {
      setIsProcessing(false);
      e.target.value = '';
    }
  };

  const handleSelectSample = async (sampleUrl: string, label: string) => {
    setIsProcessing(true);
    try {
      const compressed = await compressUrlToBase64(sampleUrl, 800, 0.75);
      onChange(compressed);
      setShowSamples(false);
      stopCamera();
      setCameraError(null);
      onNotify('info', 'Foto contoh dipilih', label);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">
          Bukti Foto Kondisi Awal <span className="text-rose-600">*</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {!isCameraOpen ? (
            <button
              type="button"
              onClick={handleOpenCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Buka Kamera</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={stopCamera}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tutup Kamera</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Foto</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSamples((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors whitespace-nowrap shrink-0"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Gunakan Foto Contoh</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      {cameraError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg border border-amber-200 bg-amber-50 text-xs text-amber-800">
          <VideoOff className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <span>{cameraError}</span>
        </div>
      )}

      {showSamples && (
        <div className="p-3 rounded-xl border border-blue-200 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-700">
              Pilih foto simulasi penerimaan cucian di counter:
            </p>
            <button
              type="button"
              onClick={() => setShowSamples(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Tutup
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {SAMPLE_LAUNDRY_PHOTOS.map((sample) => (
              <button
                key={sample.id}
                type="button"
                onClick={() => handleSelectSample(sample.url, sample.label)}
                className="group text-left rounded-lg border border-slate-200 bg-white overflow-hidden hover:border-blue-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
              >
                <div className="aspect-4/3 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={sample.url}
                    alt={sample.label}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <p className="p-2 text-xs font-medium text-slate-700 truncate">{sample.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {isCameraOpen ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-950">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full max-h-72 object-cover"
          />
          <div className="p-3 bg-slate-900/90 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-200">
              Arahkan kamera ke tumpukan baju atau titik noda/cacat awal.
            </span>
            <button
              type="button"
              onClick={handleCaptureSnapshot}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
            >
              <Camera className="w-4 h-4" />
              <span>Jepret Foto Bukti</span>
            </button>
          </div>
        </div>
      ) : value ? (
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
          <img
            src={value}
            alt="Bukti kondisi awal pakaian"
            referrerPolicy="no-referrer"
            className="w-full max-h-64 object-cover"
          />
          <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-t border-slate-200">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700">
              <Check className="w-3.5 h-3.5" />
              Foto bukti awal siap dilampirkan
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleOpenCamera}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Foto Ulang</span>
              </button>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs font-medium text-rose-600 hover:text-rose-800"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
          <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-700">
            Belum ada foto bukti kondisi awal
          </p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Wajib ambil foto tumpukan pakaian/noda sebelum dicuci untuk mencegah komplain atau salah klaim.
          </p>
        </div>
      )}
    </div>
  );
}
