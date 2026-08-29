/**
 * Photos are stored as data-URLs directly in the bake session, which lives in
 * localStorage — there's no backend for this app. localStorage typically caps out
 * around 5-10MB total, and a straight-from-camera photo can be several MB on its
 * own, so every photo is downscaled and re-compressed to JPEG before it's stored.
 * A handful of loaf photos this way costs tens of KB each rather than megabytes.
 */
const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.72;

export function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not available'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image'));
    };
    img.src = objectUrl;
  });
}
