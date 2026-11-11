"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Upload, X, CheckCircle2, AlertCircle, ImagePlus } from "lucide-react";
import {
  GALLERY_CATEGORIES,
  titleFromFilename,
  formatBytes,
  validateGalleryFile,
} from "@/lib/gallery/types";
import { uploadGalleryPhoto } from "@/lib/gallery/service";

interface QueuedPhoto {
  localId: string;
  file: File;
  previewUrl: string;
  title: string;
  description: string;
  category: string;
  isActive: boolean;
  progress: number;
  status: "ready" | "uploading" | "done" | "error";
  errorMsg?: string;
}

interface GalleryUploadPanelProps {
  nextOrderIndex: number;
  notify: (kind: "success" | "error", msg: string) => void;
}

/**
 * Multi-photo drag-and-drop and file-picker uploader for Firebase Storage + Firestore.
 */
export function GalleryUploadPanel({ nextOrderIndex, notify }: GalleryUploadPanelProps) {
  const [queue, setQueue] = useState<QueuedPhoto[]>([]);
  const [defaultCategory, setDefaultCategory] = useState<string>(GALLERY_CATEGORIES[0]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const queueRef = useRef<QueuedPhoto[]>([]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  // Revoke object URLs on unmount to avoid leaking browser memory.
  useEffect(() => {
    return () => {
      queueRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const addFilesToQueue = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const accepted: QueuedPhoto[] = [];
    const rejectedMessages: string[] = [];

    for (const file of files) {
      const err = validateGalleryFile(file);
      if (err) {
        rejectedMessages.push(err);
        continue;
      }
      accepted.push({
        localId: `${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        title: titleFromFilename(file.name),
        description: "",
        category: defaultCategory,
        isActive: true,
        progress: 0,
        status: "ready",
      });
    }

    if (rejectedMessages.length > 0) {
      notify("error", rejectedMessages[0]);
    }
    if (accepted.length > 0) {
      setQueue((prev) => [...prev, ...accepted]);
    }
  };

  const removeQueuedItem = (localId: string) => {
    setQueue((prev) => {
      const target = prev.find((q) => q.localId === localId);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((q) => q.localId !== localId);
    });
  };

  const clearQueue = () => {
    queue.forEach((q) => URL.revokeObjectURL(q.previewUrl));
    setQueue([]);
  };

  const updateQueuedItem = (localId: string, patch: Partial<QueuedPhoto>) => {
    setQueue((prev) =>
      prev.map((item) => (item.localId === localId ? { ...item, ...patch } : item))
    );
  };

  const applyCategoryToAll = (category: string) => {
    setDefaultCategory(category);
    setQueue((prev) =>
      prev.map((item) => (item.status === "ready" || item.status === "error" ? { ...item, category } : item))
    );
  };

  const handleUploadAll = async () => {
    const pending = queue.filter((item) => item.status === "ready" || item.status === "error");
    if (pending.length === 0) return;

    setIsUploading(true);
    let successCount = 0;
    let failCount = 0;

    // Upload sequentially in predictable order so orderIndex stays clean.
    for (let i = 0; i < pending.length; i++) {
      const item = pending[i];
      updateQueuedItem(item.localId, { status: "uploading", progress: 0, errorMsg: undefined });

      try {
        await uploadGalleryPhoto(
          item.file,
          {
            title: item.title,
            description: item.description,
            category: item.category,
            orderIndex: nextOrderIndex + i,
            isActive: item.isActive,
          },
          (pct) => updateQueuedItem(item.localId, { progress: pct })
        );
        updateQueuedItem(item.localId, { status: "done", progress: 100 });
        successCount++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Upload failed.";
        updateQueuedItem(item.localId, { status: "error", errorMsg: message });
        failCount++;
      }
    }

    setIsUploading(false);

    if (successCount > 0 && failCount === 0) {
      notify("success", `Uploaded ${successCount} gallery ${successCount === 1 ? "photo" : "photos"}.`);
      // Clear completed items automatically so the panel is ready for the next batch.
      setQueue((prev) => {
        prev.filter((q) => q.status === "done").forEach((q) => URL.revokeObjectURL(q.previewUrl));
        return prev.filter((q) => q.status !== "done");
      });
    } else if (successCount > 0) {
      notify("error", `Uploaded ${successCount} photo(s); ${failCount} failed. Check errors below.`);
    } else {
      notify("error", "Upload failed. Verify Firebase Storage and Firestore rules/permissions.");
    }
  };

  const pendingCount = queue.filter((q) => q.status === "ready" || q.status === "error").length;

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border-l-4 border-timber-darkwood">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl font-serif text-timber-darkwood">Upload Gallery Photos</h2>
          <p className="text-gray-600 text-sm mt-1">
            Select or drag multiple images (JPG, PNG, WebP · max 5 MB each). Files are stored in
            Firebase Storage and details in Cloud Firestore.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <label htmlFor="default-gallery-category" className="text-xs font-medium text-gray-600 whitespace-nowrap">
            Default category:
          </label>
          <select
            id="default-gallery-category"
            value={defaultCategory}
            onChange={(e) => applyCategoryToAll(e.target.value)}
            disabled={isUploading}
            className="px-3 py-1.5 text-sm border rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
          >
            {GALLERY_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!isUploading && e.dataTransfer.files) {
            addFilesToQueue(e.dataTransfer.files);
          }
        }}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !isUploading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition cursor-pointer ${
          isDragging
            ? "border-timber-teal bg-timber-beige/60"
            : "border-gray-300 hover:border-timber-darkwood hover:bg-gray-50/70"
        } ${isUploading ? "opacity-60 cursor-not-allowed" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            if (e.target.files) addFilesToQueue(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
          aria-label="Choose multiple gallery photos"
        />
        <ImagePlus className="w-9 h-9 mx-auto text-timber-teal mb-2" />
        <p className="text-sm font-medium text-timber-darkwood">
          Click to choose multiple photos or drag and drop them here
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports JPG, PNG, and WebP up to 5 MB per photo
        </p>
      </div>

      {/* Staged upload queue */}
      {queue.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-sm font-medium text-gray-700">
              Selected Photos ({queue.length})
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={clearQueue}
                disabled={isUploading}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition text-sm font-medium disabled:opacity-50"
              >
                Clear Queue
              </button>
              <button
                type="button"
                onClick={handleUploadAll}
                disabled={isUploading || pendingCount === 0}
                className="inline-flex items-center gap-2 px-5 py-2 bg-timber-teal text-white rounded-md hover:bg-timber-darkwood transition text-sm font-medium disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                {isUploading
                  ? "Uploading…"
                  : `Upload ${pendingCount} ${pendingCount === 1 ? "Photo" : "Photos"}`}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {queue.map((item) => (
              <div
                key={item.localId}
                className="border border-gray-200 rounded-lg p-3 bg-gray-50/50 flex flex-col gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="relative w-20 h-20 rounded border border-gray-200 shrink-0 bg-white overflow-hidden">
                    <Image
                      src={item.previewUrl}
                      alt={item.title || item.file.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs text-gray-500 truncate" title={item.file.name}>
                        {item.file.name} · {formatBytes(item.file.size)}
                      </p>
                      {item.status !== "uploading" && (
                        <button
                          type="button"
                          onClick={() => removeQueuedItem(item.localId)}
                          aria-label={`Remove ${item.file.name}`}
                          className="text-gray-400 hover:text-red-600 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={item.title}
                      disabled={item.status === "uploading" || item.status === "done"}
                      onChange={(e) => updateQueuedItem(item.localId, { title: e.target.value })}
                      placeholder="Photo title"
                      aria-label="Photo title"
                      className="mt-1.5 w-full px-2.5 py-1 text-sm border rounded bg-white focus:outline-none focus:ring-1 focus:ring-timber-darkwood"
                    />

                    <select
                      value={item.category}
                      disabled={item.status === "uploading" || item.status === "done"}
                      onChange={(e) => updateQueuedItem(item.localId, { category: e.target.value })}
                      aria-label="Photo category"
                      className="mt-1.5 w-full px-2.5 py-1 text-xs border rounded bg-white focus:outline-none focus:ring-1 focus:ring-timber-darkwood"
                    >
                      {GALLERY_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <input
                  type="text"
                  value={item.description}
                  disabled={item.status === "uploading" || item.status === "done"}
                  onChange={(e) => updateQueuedItem(item.localId, { description: e.target.value })}
                  placeholder="Optional caption or project details…"
                  aria-label="Photo description"
                  className="w-full px-2.5 py-1.5 text-xs border rounded bg-white focus:outline-none focus:ring-1 focus:ring-timber-darkwood"
                />

                {item.status === "uploading" && (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-timber-teal h-2 rounded-full transition-all duration-200"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Uploading… {item.progress}%</p>
                  </div>
                )}

                {item.status === "done" && (
                  <p className="text-xs text-green-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Uploaded to Storage &amp; Firestore
                  </p>
                )}

                {item.status === "error" && (
                  <p className="text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{item.errorMsg || "Upload failed"}</span>
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
