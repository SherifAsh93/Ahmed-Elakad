export async function compressImage(file: File, maxDim = 1600, quality = 0.82): Promise<File> {
  if (typeof window === "undefined" || !file.type.startsWith("image/")) return file;
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const needsResize = width > maxDim || height > maxDim;
        if (!needsResize && file.size < 600_000) { resolve(file); return; }
        if (needsResize) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) { resolve(file); return; }
            const name = file.name.replace(/\.[^.]+$/, ".jpg");
            resolve(new File([blob], name, { type: "image/jpeg", lastModified: Date.now() }));
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
