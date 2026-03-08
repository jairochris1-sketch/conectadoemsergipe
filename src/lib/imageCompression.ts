const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const TARGET_SIZE_BYTES = 1 * 1024 * 1024; // compress to ~1MB
const MAX_DIMENSION = 1200;

export const validateAndCompressImage = (file: File): Promise<{ blob: Blob; preview: string }> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_SIZE_BYTES) {
      reject(new Error("FILE_TOO_LARGE"));
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Scale down if needed
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Determine quality based on file size
      let quality = file.size > TARGET_SIZE_BYTES ? 0.6 : 0.8;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error("COMPRESSION_FAILED"));
            return;
          }
          const preview = canvas.toDataURL("image/jpeg", quality);
          resolve({ blob, preview });
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("INVALID_IMAGE"));
    };

    img.src = url;
  });
};
