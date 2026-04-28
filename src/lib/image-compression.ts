import imageCompression from "browser-image-compression";

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  initialQuality: 1,
};

export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 1024 * 1024) return file;

  try {
    const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
    return new File([compressed], file.name, { type: file.type });
  } catch {
    return file;
  }
}
