/**
 * Client-side helpers to convert website image URLs or File/Blob objects into
 * Base64 data URIs that fit safely inside Cloud Firestore's 1 MiB document limit.
 */

/** Max Base64 string length (~750 KB) to keep the full Firestore doc safely under 1 MiB. */
const MAX_FIRESTORE_BASE64_CHARS = 750_000;

export interface Base64ConversionResult {
  dataUrl: string;
  byteSize: number;
  contentType: string;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Failed to read image blob."));
    reader.readAsDataURL(blob);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to decode image for Base64 compression."));
    img.src = src;
  });
}

function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(",");
  if (commaIdx === -1) return dataUrl.length;
  const base64Length = dataUrl.length - commaIdx - 1;
  return Math.floor((base64Length * 3) / 4);
}

/**
 * Downscale/compress an oversized image on an offscreen canvas so its Base64
 * data URI fits comfortably within Firestore's 1 MiB document limit.
 */
async function compressDataUrlForFirestore(rawDataUrl: string): Promise<Base64ConversionResult> {
  const img = await loadImageElement(rawDataUrl);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context unavailable.");
  }

  const maxDimensions = [1400, 1100, 850];
  const qualities = [0.82, 0.72, 0.6];

  for (const maxDim of maxDimensions) {
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
    canvas.width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
    canvas.height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    for (const quality of qualities) {
      const compressed = canvas.toDataURL("image/jpeg", quality);
      if (compressed.length <= MAX_FIRESTORE_BASE64_CHARS) {
        return {
          dataUrl: compressed,
          byteSize: estimateDataUrlBytes(compressed),
          contentType: "image/jpeg",
        };
      }
    }
  }

  const fallback = canvas.toDataURL("image/jpeg", 0.5);
  return {
    dataUrl: fallback,
    byteSize: estimateDataUrlBytes(fallback),
    contentType: "image/jpeg",
  };
}

/**
 * Fetch a website image (e.g. `/images/sofa.JPG`) and convert it to a Base64
 * data URL ready to store in Firestore.
 */
export async function fetchImageUrlToBase64(imagePath: string): Promise<Base64ConversionResult> {
  const response = await fetch(encodeURI(imagePath));
  if (!response.ok) {
    throw new Error(`Failed to load "${imagePath}" (${response.status})`);
  }

  const blob = await response.blob();
  const rawDataUrl = await blobToDataUrl(blob);

  if (rawDataUrl.length <= MAX_FIRESTORE_BASE64_CHARS) {
    return {
      dataUrl: rawDataUrl,
      byteSize: blob.size || estimateDataUrlBytes(rawDataUrl),
      contentType: blob.type || "image/jpeg",
    };
  }

  return compressDataUrlForFirestore(rawDataUrl);
}

