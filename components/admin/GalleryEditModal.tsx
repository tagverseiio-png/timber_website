"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { galleryItemSchema, type GalleryItemFormInput } from "@/lib/gallery/schema";
import {
  GALLERY_CATEGORIES,
  formatBytes,
  validateGalleryFile,
  type GalleryItem,
} from "@/lib/gallery/types";
import { updateGalleryPhoto } from "@/lib/gallery/service";

interface GalleryEditModalProps {
  item: GalleryItem;
  onClose: () => void;
  onSaved: (msg: string) => void;
  notify: (kind: "success" | "error", msg: string) => void;
}

/**
 * Edit modal for modifying gallery image metadata in Firestore and optionally
 * replacing the underlying photo in Firebase Storage.
 */
export function GalleryEditModal({
  item,
  onClose,
  onSaved,
  notify,
}: GalleryEditModalProps) {
  const [replacementFile, setReplacementFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(item.imageUrl);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GalleryItemFormInput>({
    resolver: zodResolver(galleryItemSchema),
    defaultValues: {
      title: item.title,
      description: item.description,
      category: item.category,
      orderIndex: item.orderIndex,
      isActive: item.isActive,
    },
  });

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    const err = validateGalleryFile(file);
    if (err) {
      notify("error", err);
      return;
    }
    if (previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl);
    }
    setReplacementFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onSubmit = async (raw: GalleryItemFormInput) => {
    const values = galleryItemSchema.parse(raw);
    try {
      if (replacementFile) setUploadPct(0);
      await updateGalleryPhoto(
        item.id,
        {
          title: values.title,
          description: values.description,
          category: values.category,
          orderIndex: values.orderIndex,
          isActive: values.isActive,
        },
        {
          newFile: replacementFile ?? undefined,
          previousStoragePath: item.storagePath,
          onProgress: (pct) => setUploadPct(pct),
        }
      );
      setUploadPct(null);
      onSaved("Gallery photo updated.");
      onClose();
    } catch (err: unknown) {
      setUploadPct(null);
      notify("error", err instanceof Error ? err.message : "Failed to update gallery photo.");
    }
  };

  const inputCls =
    "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood bg-white";
  const errCls = "text-xs text-red-600 mt-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif text-timber-darkwood">Edit Gallery Photo</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800 text-sm font-medium"
          >
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="flex flex-col sm:flex-row gap-4 items-start bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="relative w-full sm:w-40 h-32 rounded-md overflow-hidden border border-gray-200 bg-white shrink-0">
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt={item.title}
                  fill
                  unoptimized={previewUrl.startsWith("blob:") || previewUrl.startsWith("data:")}
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex-1 min-w-0 space-y-2 w-full">
              <div className="text-xs text-gray-500 space-y-0.5">
                <p className="truncate">
                  <span className="font-medium text-gray-700">File:</span> {replacementFile?.name || item.fileName || "Stored image"}
                </p>
                <p>
                  <span className="font-medium text-gray-700">Size:</span>{" "}
                  {formatBytes(replacementFile?.size ?? item.fileSize)}
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Replace Photo (optional · JPG/PNG/WebP, max 5 MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => handleFileChange(e.target.files?.[0])}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-timber-darkwood file:text-timber-beige hover:file:opacity-90"
                />
              </div>
              {uploadPct !== null && (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-timber-teal h-2 rounded-full transition-all duration-200"
                      style={{ width: `${uploadPct}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1">Uploading replacement… {uploadPct}%</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
              <input type="text" {...register("title")} className={inputCls} />
              {errors.title && <p className={errCls}>{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register("category")} className={inputCls}>
                {GALLERY_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              {errors.category && <p className={errCls}>{errors.category.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Caption</label>
            <textarea
              rows={3}
              {...register("description")}
              placeholder="Optional description shown alongside the photo…"
              className={`${inputCls} resize-none`}
            />
            {errors.description && <p className={errCls}>{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display order</label>
              <input
                type="number"
                min="0"
                step="1"
                {...register("orderIndex", { valueAsNumber: true })}
                className={inputCls}
              />
              {errors.orderIndex && <p className={errCls}>{errors.orderIndex.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pt-2 sm:pt-7">
              <input type="checkbox" {...register("isActive")} className="w-4 h-4" />
              Visible in gallery
            </label>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || uploadPct !== null}
              className="px-6 py-2 bg-timber-darkwood text-timber-beige rounded-md hover:opacity-90 transition font-medium disabled:opacity-50"
            >
              {isSubmitting ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

