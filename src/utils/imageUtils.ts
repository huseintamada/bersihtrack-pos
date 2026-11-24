/**
 * Compress an HTMLImageElement or HTMLVideoElement frame via offscreen HTML5 Canvas
 * to a lightweight Base64 JPEG DataURL suitable for localStorage persistence.
 */
export function compressMediaToBase64(
  source: HTMLVideoElement | HTMLImageElement,
  sourceWidth: number,
  sourceHeight: number,
  maxWidth = 800,
  quality = 0.72
): string {
  const safeWidth = Math.max(1, sourceWidth);
  const safeHeight = Math.max(1, sourceHeight);
  const scale = safeWidth > maxWidth ? maxWidth / safeWidth : 1;
  const targetWidth = Math.round(safeWidth * scale);
  const targetHeight = Math.round(safeHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context tidak tersedia di browser.');
  }
  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  return canvas.toDataURL('image/jpeg', quality);
}

export function compressFileToBase64(file: File, maxWidth = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Format gambar tidak valid.'));
      img.onload = () => {
        try {
          const compressed = compressMediaToBase64(
            img,
            img.naturalWidth || img.width,
            img.naturalHeight || img.height,
            maxWidth,
            quality
          );
          resolve(compressed);
        } catch (err) {
          reject(err);
        }
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function compressUrlToBase64(url: string, maxWidth = 800, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const compressed = compressMediaToBase64(
          img,
          img.naturalWidth || img.width,
          img.naturalHeight || img.height,
          maxWidth,
          quality
        );
        resolve(compressed);
      } catch {
        resolve(url);
      }
    };
    img.onerror = () => resolve(url);
    img.src = url;
  });
}
