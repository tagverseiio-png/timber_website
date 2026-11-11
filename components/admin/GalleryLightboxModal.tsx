"use client";

import Image from "next/image";
import { Pencil, X } from "lucide-react";
import { formatBytes, type GalleryItem } from "@/lib/gallery/types";

interface GalleryLightboxModalProps {
  item: GalleryItem;
  onClose: () => void;
  onEdit: (item: GalleryItem) => void;
}

/**
 * Full-size image preview modal for inspecting gallery photos in the admin dashboard.
 */
export function GalleryLightboxModal({
  item,
  onClose,
  onEdit,
}: GalleryLightboxModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative w-full h-[55vh] sm:h-[62vh] bg-gray-900">
          {item.imageUrl && (
            <Image
              src={item.imageUrl}
              alt={item.title}
              fill
              className="object-contain"
            />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close preview"
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-gray-100">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase tracking-wider">
                {item.category}
              </span>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  item.isActive
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {item.isActive ? "Live" : "Hidden"}
              </span>
              <span className="text-xs text-gray-500">
                Order #{item.orderIndex} · {formatBytes(item.fileSize)}
              </span>
            </div>
            <h3 className="text-xl font-serif text-timber-darkwood truncate">{item.title}</h3>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-timber-darkwood text-timber-beige rounded-md hover:opacity-90 transition text-sm font-medium"
            >
              <Pencil className="w-4 h-4" />
              Edit Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

