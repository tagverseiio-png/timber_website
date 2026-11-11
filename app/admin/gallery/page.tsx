"use client";

// Never prerender the admin panel at build time: it requires runtime Firebase
// env vars and must not be statically cached (auth-gated).
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { Eye, EyeOff, Maximize2, Pencil, Trash2 } from "lucide-react";
import { auth } from "@/lib/firebase";
import { hasAdminClaim } from "@/lib/auth/admin";
import {
  GALLERY_CATEGORIES,
  formatBytes,
  type GalleryItem,
} from "@/lib/gallery/types";
import {
  deleteGalleryPhoto,
  setGalleryPhotoVisibility,
  subscribeGalleryPhotos,
} from "@/lib/gallery/service";
import { AdminHeader } from "@/components/admin/AdminHeader";
import {
  AdminAccessDeniedCard,
  AdminLoginCard,
} from "@/components/admin/AdminAuthScreen";
import { GalleryUploadPanel } from "@/components/admin/GalleryUploadPanel";
import { GalleryEditModal } from "@/components/admin/GalleryEditModal";
import { GalleryLightboxModal } from "@/components/admin/GalleryLightboxModal";

const GALLERY_PAGE_SIZE = 12;

interface Toast {
  kind: "success" | "error";
  msg: string;
}

function useToast() {
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const notify = (kind: Toast["kind"], msg: string) => setToast({ kind, msg });
  return { toast, notify };
}

export default function AdminGalleryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showHidden, setShowHidden] = useState(true);
  const [page, setPage] = useState(1);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  const { toast, notify } = useToast();

  // Auth + admin-claim gate (mirrors /admin Product Management).
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAdmin(null);
      if (!currentUser) {
        setItems([]);
        setSelectedIds([]);
      } else {
        try {
          setIsAdmin(await hasAdminClaim(currentUser));
        } catch {
          setIsAdmin(false);
        }
      }
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  // Live Firestore gallery subscription for verified admins.
  useEffect(() => {
    if (!user || !isAdmin) return;
    const unsubscribe = subscribeGalleryPhotos(
      (rows) => {
        setItems(rows);
        setListError(null);
      },
      (errMessage) => setListError(errMessage)
    );
    return () => unsubscribe();
  }, [user, isAdmin]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!showHidden && !item.isActive) return false;
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      if (
        q &&
        !`${item.title} ${item.description} ${item.category} ${item.fileName}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [items, showHidden, selectedCategory, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / GALLERY_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (safePage - 1) * GALLERY_PAGE_SIZE,
    safePage * GALLERY_PAGE_SIZE
  );

  const nextOrderIndex = useMemo(
    () =>
      items.reduce((max, item) => Math.max(max, item.orderIndex), -1) + 1,
    [items]
  );

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllOnPage = () => {
    const pageIds = paged.map((item) => item.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleVisibility = async (item: GalleryItem) => {
    try {
      await setGalleryPhotoVisibility(item.id, !item.isActive);
      notify("success", item.isActive ? "Photo hidden from gallery." : "Photo restored to gallery.");
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Failed to update visibility.");
    }
  };

  const handleDelete = async (item: GalleryItem) => {
    if (
      !window.confirm(
        `PERMANENTLY delete "${item.title}" from Firestore and Firebase Storage? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await deleteGalleryPhoto(item);
      setSelectedIds((prev) => prev.filter((id) => id !== item.id));
      notify("success", "Gallery photo deleted.");
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const runBulkVisibility = async (isActive: boolean) => {
    if (selectedIds.length === 0) return;
    setBulkBusy(true);
    try {
      await Promise.all(
        selectedIds.map((id) => setGalleryPhotoVisibility(id, isActive))
      );
      notify(
        "success",
        `${selectedIds.length} photo(s) ${isActive ? "shown" : "hidden"}.`
      );
      setSelectedIds([]);
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Bulk update failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `PERMANENTLY delete ${selectedIds.length} selected photo(s) from Firestore and Firebase Storage?`
      )
    ) {
      return;
    }
    setBulkBusy(true);
    try {
      const targets = items.filter((item) => selectedIds.includes(item.id));
      await Promise.all(targets.map((item) => deleteGalleryPhoto(item)));
      notify("success", `Deleted ${targets.length} gallery photo(s).`);
      setSelectedIds([]);
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Bulk delete failed.");
    } finally {
      setBulkBusy(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-timber-beige flex items-center justify-center font-serif">
        Loading Gallery Management...
      </div>
    );
  }

  if (!user) return <AdminLoginCard />;
  if (isAdmin === false) return <AdminAccessDeniedCard user={user} />;
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-timber-beige flex items-center justify-center font-serif">
        Verifying admin access...
      </div>
    );
  }

  const allCategories = ["All", ...GALLERY_CATEGORIES];
  const allOnPageSelected =
    paged.length > 0 && paged.every((item) => selectedIds.includes(item.id));

  return (
    <div className="min-h-screen bg-timber-beige pt-24 pb-12 px-4 sm:px-6 relative">
      {editingItem && (
        <GalleryEditModal
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={(msg) => notify("success", msg)}
          notify={notify}
        />
      )}

      {previewItem && (
        <GalleryLightboxModal
          item={previewItem}
          onClose={() => setPreviewItem(null)}
          onEdit={(item) => setEditingItem(item)}
        />
      )}

      {toast && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-md shadow-lg text-sm font-medium text-white ${
            toast.kind === "success" ? "bg-green-700" : "bg-red-700"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <AdminHeader
          title="Gallery Management"
          subtitle="Firebase Storage + Cloud Firestore · multi-photo upload · responsive gallery management"
          userEmail={user.email}
          onLogout={() => signOut(auth)}
        />

        <GalleryUploadPanel nextOrderIndex={nextOrderIndex} notify={notify} />

        {/* Search & filter bar */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-3 md:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search title, caption, category, or filename…"
            aria-label="Search gallery photos"
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showHidden}
              onChange={(e) => {
                setShowHidden(e.target.checked);
                setPage(1);
              }}
              className="w-4 h-4"
            />
            Show hidden photos
          </label>
        </div>

        {/* Category pills */}
        <div className="mb-6 flex flex-wrap gap-3">
          {allCategories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => {
                setSelectedCategory(category);
                setPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                selectedCategory === category
                  ? "bg-[#1f4a47] text-white border-[#1f4a47]"
                  : "bg-transparent text-gray-700 border-gray-300 hover:border-gray-400"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery grid container */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-serif text-timber-darkwood">
                Gallery Photos ({filtered.length}
                {filtered.length !== items.length ? ` of ${items.length}` : ""})
              </h2>
              {paged.length > 0 && (
                <button
                  type="button"
                  onClick={selectAllOnPage}
                  className="text-xs px-3 py-1 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  {allOnPageSelected ? "Unselect Page" : "Select Page"}
                </button>
              )}
            </div>

            {selectedIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-gray-600 mr-1">
                  {selectedIds.length} selected:
                </span>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => runBulkVisibility(true)}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-xs font-medium disabled:opacity-50"
                >
                  Show
                </button>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => runBulkVisibility(false)}
                  className="px-3 py-1.5 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition text-xs font-medium disabled:opacity-50"
                >
                  Hide
                </button>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={runBulkDelete}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition text-xs font-medium disabled:opacity-50"
                >
                  Delete
                </button>
                <button
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => setSelectedIds([])}
                  className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition text-xs font-medium"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {listError ? (
            <div className="p-12 text-center">
              <p className="text-red-600 font-medium mb-2">Couldn&apos;t load gallery photos</p>
              <p className="text-gray-500 text-sm">{listError}</p>
              <p className="text-gray-500 text-xs mt-2">
                Ensure Firestore is enabled and firestore.rules allow admin reads on /gallery.
              </p>
            </div>
          ) : paged.length === 0 ? (
            <div className="p-12 text-center text-gray-500 italic">
              {items.length === 0
                ? "No gallery photos yet — upload your first batch above."
                : "No gallery photos match this filter."}
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {paged.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <article
                    key={item.id}
                    className={`group rounded-lg border transition overflow-hidden flex flex-col bg-white ${
                      isSelected
                        ? "border-timber-teal ring-2 ring-timber-teal/30"
                        : "border-gray-200 hover:shadow-md"
                    } ${!item.isActive ? "opacity-70" : ""}`}
                  >
                    <div className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
                      {item.imageUrl && (
                        <Image
                          src={item.imageUrl}
                          alt={item.title}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      )}

                      <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                        <label
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-white/90 shadow-sm cursor-pointer hover:bg-white"
                          title="Select photo"
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelect(item.id)}
                            aria-label={`Select ${item.title}`}
                            className="w-4 h-4 accent-timber-teal"
                          />
                        </label>

                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${
                            item.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.isActive ? "Live" : "Hidden"}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        aria-label={`Preview ${item.title}`}
                        className="absolute bottom-2.5 right-2.5 p-2 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 focus:opacity-100 transition hover:bg-black/80"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-800 uppercase tracking-wider truncate">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-gray-500 whitespace-nowrap">
                          #{item.orderIndex} · {formatBytes(item.fileSize)}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg text-timber-darkwood truncate" title={item.title}>
                        {item.title}
                      </h3>

                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 min-h-[2rem]">
                        {item.description || "No description"}
                      </p>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingItem(item)}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-900 text-xs font-medium"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleVisibility(item)}
                          className={`inline-flex items-center gap-1 text-xs font-medium ${
                            item.isActive
                              ? "text-yellow-700 hover:text-yellow-900"
                              : "text-green-700 hover:text-green-900"
                          }`}
                        >
                          {item.isActive ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              Hide
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              Restore
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item)}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-900 text-xs font-medium"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-3 text-sm">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1 border rounded disabled:opacity-30"
              >
                Prev
              </button>
              <span aria-live="polite">
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

