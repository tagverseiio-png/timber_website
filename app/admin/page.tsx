"use client";

// Never prerender the admin panel at build time: it requires runtime Firebase
// env vars and must not be statically cached (auth-gated).
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ref, set, push, onValue, remove, update, serverTimestamp } from "firebase/database";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { auth, database, storage } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { hasAdminClaim } from "@/lib/auth/admin";
import {
  productSchema,
  PRODUCT_CATEGORIES,
  type ProductFormInput,
} from "@/lib/products/schema";
import {
  toCatalogProduct,
  slugify,
  type CatalogProduct,
  type RawProductRow,
} from "@/lib/products/types";
import { formatPrice, rupeesToPaise, paiseToRupees } from "@/lib/money";
import Image from "next/image";
import { ALL_PRODUCTS } from "@/app/projects/reference/shop_data_backup";
import { BOUTIQUE_PRODUCTS } from "@/lib/products/boutique_seed";

const ADMIN_PAGE_SIZE = 12;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ---------------------------------------------------------------------------
// Minimal toast (no extra dependency)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Product create/edit modal (react-hook-form + zod).
// Edits rupees (human-friendly); saves canonical paise + slug + stock.
// ---------------------------------------------------------------------------
function ProductModal({
  initial,
  fallbackOrderIndex,
  onClose,
  onSaved,
  notify,
}: {
  initial: CatalogProduct | null; // null = create
  fallbackOrderIndex: number;
  onClose: () => void;
  onSaved: (msg: string) => void;
  notify: (kind: "success" | "error", msg: string) => void;
}) {
  const isNew = initial === null;
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  // Local preview state instead of RHF watch() (keeps React Compiler happy).
  const [preview, setPreview] = useState(initial?.images[0] ?? "");

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initial?.name ?? "",
      priceRupees: initial ? paiseToRupees(initial.pricePaise) : 0,
      compareAtRupees: initial?.compareAtPricePaise != null
        ? paiseToRupees(initial.compareAtPricePaise)
        : undefined,
      category: initial?.category ?? "",
      type: initial?.type ?? "",
      description: initial?.description ?? "",
      image: initial?.images[0] ?? "",
      stock: initial?.stock != null ? String(initial.stock) : "",
      orderIndex: initial?.orderIndex ?? fallbackOrderIndex,
      isActive: initial?.isActive ?? true,
    },
  });

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      notify("error", "Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      notify("error", "Image must be under 5 MB.");
      return;
    }
    // Storage path is namespaced per product so re-uploads don't collide.
    const key = initial?.id ?? `new_${Date.now()}`;
    const path = `products/${key}/${Date.now()}_${file.name}`;
    const task = uploadBytesResumable(storageRef(storage, path), file, {
      contentType: file.type,
    });
    setUploadPct(0);
    task.on(
      "state_changed",
      (snap) => setUploadPct(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        setUploadPct(null);
        notify("error", `Upload failed: ${err.message}`);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        setValue("image", url, { shouldValidate: true, shouldDirty: true });
        setPreview(url);
        setUploadPct(null);
        notify("success", "Image uploaded to Storage.");
      }
    );
  };

  const onSubmit = async (raw: ProductFormInput) => {
    // Apply zod defaults + re-validate — `values` is the clean output type.
    const values = productSchema.parse(raw);
    const stock = values.stock === "" ? null : parseInt(values.stock, 10);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      setError("stock", { message: "Whole units, or leave empty" });
      return;
    }
    // set() replaces the whole row: legacy v1 keys (title/price/image) are
    // dropped and the row becomes canonical on save (implicit migration).
    // Timestamps come from the Firebase server (multi-admin clock safety).
    const row = {
      name: values.name,
      slug: slugify(values.name),
      description: values.description,
      pricePaise: rupeesToPaise(values.priceRupees),
      ...(values.compareAtRupees != null
        ? { compareAtPricePaise: rupeesToPaise(values.compareAtRupees) }
        : {}),
      currency: "INR",
      stock,
      images: values.image ? [values.image] : [],
      category: values.category,
      type: values.type,
      orderIndex: values.orderIndex,
      isActive: values.isActive,
      updatedAt: serverTimestamp(),
      ...(!isNew && initial.createdAt != null ? { createdAt: initial.createdAt } : {}),
    };
    try {
      if (isNew) {
        await set(push(ref(database, "projects")), { ...row, createdAt: serverTimestamp() });
        onSaved("Product created.");
      } else {
        await set(ref(database, `projects/${initial.id}`), row);
        onSaved("Product updated.");
      }
      onClose();
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Save failed.");
    }
  };

  const inputCls =
    "w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood bg-white";
  const errCls = "text-xs text-red-600 mt-1";

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-serif text-timber-darkwood">
            {isNew ? "Add New Product" : "Edit Product"}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            ✕ Close
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <input type="text" {...register("name")} className={inputCls} />
              {errors.name && <p className={errCls}>{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
              <input type="number" step="0.01" min="0" {...register("priceRupees", { valueAsNumber: true })} className={inputCls} />
              {errors.priceRupees && <p className={errCls}>{errors.priceRupees.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Compare-at price (₹, optional)</label>
              <input type="number" step="0.01" min="0" {...register("compareAtRupees", { valueAsNumber: true })} className={inputCls} />
              {errors.compareAtRupees && <p className={errCls}>{errors.compareAtRupees.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock (units; empty = untracked)</label>
              <input type="text" inputMode="numeric" placeholder="e.g. 10" {...register("stock")} className={inputCls} />
              {errors.stock && <p className={errCls}>{errors.stock.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register("category")} className={inputCls}>
                <option value="" disabled>Select Category</option>
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              {errors.category && <p className={errCls}>{errors.category.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type (e.g. Living Room)</label>
              <input type="text" {...register("type")} className={inputCls} />
              {errors.type && <p className={errCls}>{errors.type.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea rows={3} {...register("description")} className={`${inputCls} resize-none`} />
            {errors.description && <p className={errCls}>{errors.description.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product image (JPG/PNG/WebP, max 5 MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFile(e.target.files?.[0])}
              className={inputCls}
            />
            {uploadPct !== null && (
              <p className="text-xs text-gray-600 mt-1" aria-live="polite">Uploading… {uploadPct}%</p>
            )}
            {preview && uploadPct === null && (
              <div className="mt-2 flex items-center gap-3">
                <div className="relative w-16 h-16 bg-gray-100 rounded border overflow-hidden">
                  <Image src={preview} alt="Preview" fill className="object-cover" unoptimized={preview.startsWith("data:")} />
                </div>
                <p className="text-xs text-green-600">Image ready to save (stored in Firebase Storage).</p>
              </div>
            )}
            {errors.image && <p className={errCls}>{errors.image.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Display order</label>
              <input type="number" min="0" step="1" {...register("orderIndex", { valueAsNumber: true })} className={inputCls} />
              {errors.orderIndex && <p className={errCls}>{errors.orderIndex.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 pt-6">
              <input type="checkbox" {...register("isActive")} className="w-4 h-4" />
              Visible on storefront
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
              {isSubmitting ? "Saving…" : isNew ? "Create Product" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin panel
// ---------------------------------------------------------------------------
export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogProduct | null>(null);
  const { toast, notify } = useToast();

  // Auth + admin-claim gate. The claim check is UX-only; database.rules.json
  // and storage.rules are the real enforcement.
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAdmin(null);
      if (!currentUser) {
        setProducts([]); // event handler, not an effect — clears stale rows on logout
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

  // Live product list — only subscribed for verified admins, and the
  // listener is always unsubscribed on cleanup. Rows are normalized through
  // the SAME adapter the storefront uses (admin === storefront, guaranteed).
  useEffect(() => {
    if (!user || !isAdmin) return;
    const projectsRef = ref(database, "projects");
    const unsubList = onValue(
      projectsRef,
      (snapshot) => {
        const data = snapshot.val() as Record<string, RawProductRow> | null;
        if (data) {
          const rows = Object.keys(data)
            .map((key) => toCatalogProduct(key, data[key] ?? {}))
            .sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name));
          setProducts(rows);
        } else {
          setProducts([]);
        }
        setListError(null);
      },
      (err) => setListError(err.message)
    );
    return () => unsubList();
  }, [user, isAdmin]);

  // Page resets live in the filter/search event handlers below; `safePage`
  // clamps the current page whenever the result set shrinks.
  const normalizeCategory = (cat: string) => cat?.toLowerCase().replace(/s$/, "") || "";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (!showInactive && !p.isActive) return false;
      if (selectedCategory !== "All" && normalizeCategory(p.category) !== normalizeCategory(selectedCategory)) return false;
      if (q && !`${p.name} ${p.description} ${p.category}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, selectedCategory, query, showInactive]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ADMIN_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * ADMIN_PAGE_SIZE, safePage * ADMIN_PAGE_SIZE);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      setLoginError(error instanceof Error ? error.message : "Login failed.");
    }
  };

  const pushSeeds = async () => {
    if (
      !window.confirm(
        "This OVERWRITES everything under /projects with the hardcoded backup (written as canonical v2 rows). Continue?"
      )
    )
      return;
    try {
      // Backup prices are rupees (the store prices in INR); they become
      // integer paise here — the only place this assumption is made.
      const projectsObject = ALL_PRODUCTS.reduce((acc: Record<string, unknown>, curr, index) => {
        const images = [curr.image, curr.hoverImage].filter(
          (u): u is string => typeof u === "string" && u.length > 0
        );
        acc[`project_${curr.id}`] = {
          name: curr.name,
          slug: slugify(curr.name),
          category: curr.category,
          pricePaise: rupeesToPaise(curr.price),
          currency: "INR",
          stock: null,
          description: `${curr.woodType} with ${curr.rating} star rating.`,
          images,
          type: curr.category,
          orderIndex: index,
          isActive: true,
          updatedAt: serverTimestamp(),
        };
        return acc;
      }, {});
      await set(ref(database, "projects"), projectsObject);
      notify("success", "Backup data pushed to the database.");
    } catch (error: unknown) {
      notify("error", error instanceof Error ? error.message : "Push failed.");
    }
  };

  const clearAllProducts = async () => {
    if (
      !window.confirm(
        "Are you sure you want to PERMANENTLY REMOVE ALL PRODUCTS from Firebase? This will delete all products from the database."
      )
    )
      return;
    try {
      await remove(ref(database, "projects"));
      setProducts([]);
      notify("success", "All products have been permanently deleted from Firebase.");
    } catch (error: unknown) {
      notify("error", error instanceof Error ? error.message : "Failed to clear products.");
    }
  };

  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; name: string } | null>(null);

  const uploadBoutiqueProducts = async () => {
    if (
      !window.confirm(
        "Upload all 16 boutique products with images to Firebase Storage & Database? This replaces /projects."
      )
    )
      return;
    try {
      const projectsObject: Record<string, unknown> = {};
      const total = BOUTIQUE_PRODUCTS.length;

      for (let i = 0; i < total; i++) {
        const curr = BOUTIQUE_PRODUCTS[i];
        setUploadProgress({ current: i + 1, total, name: curr.name });

        let imageUrl = curr.image;

        // Upload the local image to Firebase Storage
        try {
          const resp = await fetch(curr.image);
          if (resp.ok) {
            const blob = await resp.blob();
            const ext = curr.image.split(".").pop()?.toLowerCase() || "jpeg";
            const contentType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
            const path = `products/${curr.id}/${curr.slug}.${ext}`;
            const sRef = storageRef(storage, path);
            const task = uploadBytesResumable(sRef, blob, { contentType });

            // Wait for upload to complete
            await new Promise<void>((resolve, reject) => {
              task.on("state_changed", null, reject, () => resolve());
            });
            imageUrl = await getDownloadURL(task.snapshot.ref);
          }
        } catch (imgErr) {
          console.warn(`Image upload failed for ${curr.name}, using local path`, imgErr);
        }

        projectsObject[curr.id] = {
          name: curr.name,
          slug: curr.slug,
          category: curr.category,
          pricePaise: curr.pricePaise,
          currency: "INR",
          stock: curr.stock,
          description: curr.description,
          images: [imageUrl],
          type: curr.type,
          orderIndex: curr.orderIndex,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
      }

      await set(ref(database, "projects"), projectsObject);
      setUploadProgress(null);
      notify("success", `All ${total} boutique products uploaded with images to Firebase!`);
    } catch (error: unknown) {
      setUploadProgress(null);
      notify("error", error instanceof Error ? error.message : "Upload failed.");
    }
  };

  const softDelete = async (p: CatalogProduct) => {
    if (!window.confirm(`Hide "${p.name}" from the storefront? (soft delete — reversible)`)) return;
    try {
      await update(ref(database, `projects/${p.id}`), { isActive: false, updatedAt: serverTimestamp() });
      notify("success", "Product hidden (soft deleted).");
    } catch (error: unknown) {
      notify("error", error instanceof Error ? error.message : "Delete failed.");
    }
  };

  const restore = async (p: CatalogProduct) => {
    try {
      await update(ref(database, `projects/${p.id}`), { isActive: true, updatedAt: serverTimestamp() });
      notify("success", "Product restored.");
    } catch (error: unknown) {
      notify("error", error instanceof Error ? error.message : "Restore failed.");
    }
  };

  const hardDelete = async (p: CatalogProduct) => {
    if (!window.confirm(`PERMANENTLY delete "${p.name}"? This cannot be undone.`)) return;
    try {
      await remove(ref(database, `projects/${p.id}`));
      notify("success", "Product permanently deleted.");
    } catch (error: unknown) {
      notify("error", error instanceof Error ? error.message : "Delete failed.");
    }
  };

  if (authLoading) {
    return <div className="min-h-screen bg-timber-beige flex items-center justify-center font-serif">Loading Admin Panel...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-timber-beige flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-3xl font-serif text-timber-darkwood mb-2 text-center">Admin Portal</h1>
          <p className="text-gray-500 text-sm text-center mb-6">Sign in with an admin account</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
                required
              />
            </div>
            {loginError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{loginError}</p>}
            <button
              type="submit"
              className="w-full bg-timber-darkwood text-timber-beige py-2 rounded-md hover:opacity-90 transition font-medium"
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Signed in but no admin claim: deny (rules enforce this too — this is just the UI).
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-timber-beige flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
          <h1 className="text-2xl font-serif text-timber-darkwood mb-2">Access denied</h1>
          <p className="text-gray-500 text-sm mb-1">Signed in as {user.email}.</p>
          <p className="text-gray-500 text-sm mb-6">
            This account has no admin claim. Ask an existing admin to run
            <code className="block mt-2 text-xs bg-gray-100 p-2 rounded">node set-admin-claim.mjs {user.email}</code>
            on the payment VM, then sign in again.
          </p>
          <button
            onClick={() => signOut(auth)}
            className="px-6 py-2 bg-timber-darkwood text-timber-beige rounded-md hover:opacity-90 transition font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (isAdmin === null) {
    return <div className="min-h-screen bg-timber-beige flex items-center justify-center font-serif">Verifying admin access...</div>;
  }

  const allCategories = ["All", ...PRODUCT_CATEGORIES];

  return (
    <div className="min-h-screen bg-timber-beige pt-24 pb-12 px-6 relative">
      {modalOpen && (
        <ProductModal
          initial={editing}
          fallbackOrderIndex={products.length + 1}
          onClose={() => { setModalOpen(false); setEditing(null); }}
          onSaved={(msg) => notify("success", msg)}
          notify={notify}
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
        <div className="flex justify-between items-center mb-8 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="font-serif text-3xl text-timber-darkwood">Product Management</h1>
            <p className="text-gray-500 text-sm mt-1">Firebase Realtime Database · admin-only writes · prices in paise</p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">{user.email}</span>
            <button
              onClick={() => signOut(auth)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm mb-8 border-l-4 border-timber-darkwood">
          <h2 className="text-xl font-serif text-timber-darkwood mb-2">Database Management</h2>
          <p className="text-gray-600 mb-4 text-sm max-w-2xl">
            Manage product records under <code>/projects</code> in Firebase Realtime Database.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={uploadBoutiqueProducts}
              disabled={!!uploadProgress}
              className="px-6 py-2.5 bg-timber-teal text-white rounded-md hover:bg-timber-darkwood transition font-medium text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadProgress ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…` : "Upload 16 Products to Storage"}
            </button>
            <button
              onClick={clearAllProducts}
              disabled={!!uploadProgress}
              className="px-6 py-2.5 bg-red-700 text-white rounded-md hover:bg-red-800 transition font-medium text-sm disabled:opacity-50"
            >
              Delete All Products from Firebase
            </button>
            <button
              onClick={pushSeeds}
              disabled={!!uploadProgress}
              className="px-6 py-2.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-200 transition font-medium text-sm disabled:opacity-50"
            >
              Restore All Products from Backup
            </button>
          </div>
          {uploadProgress && (
            <div className="mt-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-timber-teal h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {uploadProgress.current}/{uploadProgress.total}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Uploading: <strong>{uploadProgress.name}</strong>
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-3 md:items-center">
          <input
            type="search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search name, description, category…"
            aria-label="Search products"
            className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-timber-darkwood"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700 whitespace-nowrap">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
              className="w-4 h-4"
            />
            Show hidden products
          </label>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          {allCategories.map((category) => (
            <button
              key={category}
              onClick={() => { setSelectedCategory(category); setPage(1); }}
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

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-xl font-serif text-timber-darkwood">
              Live Products ({filtered.length}{filtered.length !== products.length ? ` of ${products.length}` : ""})
            </h2>
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition text-sm font-medium"
            >
              + Add New Product
            </button>
          </div>

          {listError ? (
            <div className="p-12 text-center">
              <p className="text-red-600 font-medium mb-2">Couldn&apos;t load products</p>
              <p className="text-gray-500 text-sm">{listError}</p>
              <p className="text-gray-500 text-xs mt-2">If this persists after deploying database.rules.json, check the rules allow admin reads.</p>
            </div>
          ) : paged.length === 0 ? (
            <div className="p-12 text-center text-gray-500 italic">
              {products.length === 0 ? "No products yet — add your first one." : "No products match this filter."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Image</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Details</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Price</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Stock</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                    <th className="py-3 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paged.map((project) => (
                    <tr key={project.id} className={`hover:bg-gray-50/50 transition ${!project.isActive ? "opacity-60" : ""}`}>
                      <td className="py-4 px-6">
                        <div className="relative w-20 h-20 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                          {project.images[0] && (
                            <Image
                              src={project.images[0]}
                              alt={project.name}
                              fill
                              className="object-cover"
                              unoptimized={project.images[0].startsWith("data:")}
                            />
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{project.name}</div>
                        <div className="text-xs text-gray-500 mt-1 max-w-xs line-clamp-2">{project.description}</div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase tracking-wider">
                          {project.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">
                        {formatPrice(project.pricePaise, project.currency)}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {project.stock == null ? <span className="text-gray-400">—</span> : project.stock}
                      </td>
                      <td className="py-4 px-6">
                        {!project.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Hidden</span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Live</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => { setEditing(project); setModalOpen(true); }}
                          className="text-blue-600 hover:text-blue-900 text-sm font-medium mr-4"
                        >
                          Edit
                        </button>
                        {!project.isActive ? (
                          <button onClick={() => restore(project)} className="text-green-700 hover:text-green-900 text-sm font-medium mr-4">
                            Restore
                          </button>
                        ) : (
                          <button onClick={() => softDelete(project)} className="text-yellow-700 hover:text-yellow-900 text-sm font-medium mr-4">
                            Hide
                          </button>
                        )}
                        <button onClick={() => hardDelete(project)} className="text-red-600 hover:text-red-900 text-sm font-medium">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-center gap-3 text-sm">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="px-3 py-1 border rounded disabled:opacity-30"
              >
                Prev
              </button>
              <span aria-live="polite">Page {safePage} of {totalPages}</span>
              <button
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
