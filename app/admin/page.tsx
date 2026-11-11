"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ref,
  set,
  push,
  onValue,
  remove,
  update,
  serverTimestamp,
  query,
  orderByChild,
  limitToLast,
} from "firebase/database";
import { auth, database } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import { hasAdminClaim, isAuthorizedAdminEmail } from "@/lib/auth/admin";
import { env } from "@/lib/env";
import { postToPaymentApi } from "@/lib/razorpay";
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
import Link from "next/link";
import { ALL_PRODUCTS } from "@/app/projects/reference/shop_data_backup";
import { BOUTIQUE_PRODUCTS } from "@/lib/products/boutique_seed";
import {
  ShoppingBag,
  Package,
  Images,
  MessageSquare,
  Settings,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Plus,
  Search,
  AlertTriangle,
  RotateCcw,
  UploadCloud,
  Trash2,
  Edit3,
  Truck,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Save,
} from "lucide-react";

const ADMIN_PAGE_SIZE = 12;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ---------------------------------------------------------------------------
// Base64 helper – converts a File or Blob to a data URI string
// ---------------------------------------------------------------------------
function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

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
      weightGrams: initial?.weightGrams != null ? String(initial.weightGrams) : "",
      lengthCm: initial?.lengthCm != null ? String(initial.lengthCm) : "",
      widthCm: initial?.widthCm != null ? String(initial.widthCm) : "",
      heightCm: initial?.heightCm != null ? String(initial.heightCm) : "",
      orderIndex: initial?.orderIndex ?? fallbackOrderIndex,
      isActive: initial?.isActive ?? true,
    },
  });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) {
      notify("error", "Only JPG, PNG or WebP images are allowed.");
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      notify("error", "Image must be under 5 MB.");
      return;
    }
    setUploadPct(0);
    try {
      setUploadPct(50);
      const base64 = await fileToBase64(file);
      setValue("image", base64, { shouldValidate: true, shouldDirty: true });
      setPreview(base64);
      setUploadPct(null);
      notify("success", "Image converted — it will be saved with the product.");
    } catch (err) {
      setUploadPct(null);
      notify("error", err instanceof Error ? err.message : "Image conversion failed.");
    }
  };

  const onSubmit = async (raw: ProductFormInput) => {
    // Apply zod defaults + re-validate — `values` is the clean output type.
    const values = productSchema.parse(raw);
    const stock = values.stock === "" ? null : parseInt(values.stock, 10);
    if (stock !== null && (!Number.isInteger(stock) || stock < 0)) {
      setError("stock", { message: "Whole units, or leave empty" });
      return;
    }
    // Parcel spec: blank = unset (VM falls back to its default weight).
    const parcel = (v: string) => {
      const n = parseInt(v, 10);
      return Number.isInteger(n) && n > 0 ? n : null;
    };
    const parcelSpec = {
      weightGrams: parcel(values.weightGrams),
      lengthCm: parcel(values.lengthCm),
      widthCm: parcel(values.widthCm),
      heightCm: parcel(values.heightCm),
    };
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
      // Omitted when unset — keeps the stored shape minimal.
      ...(parcelSpec.weightGrams != null ? { weightGrams: parcelSpec.weightGrams } : {}),
      ...(parcelSpec.lengthCm != null ? { lengthCm: parcelSpec.lengthCm } : {}),
      ...(parcelSpec.widthCm != null ? { widthCm: parcelSpec.widthCm } : {}),
      ...(parcelSpec.heightCm != null ? { heightCm: parcelSpec.heightCm } : {}),
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

          <div className="pt-2 border-t border-gray-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Shipping parcel (Shiprocket)</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weight (g) *</label>
                <input type="text" inputMode="numeric" placeholder="e.g. 2500" {...register("weightGrams")} className={inputCls} />
                {errors.weightGrams && <p className={errCls}>{errors.weightGrams.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Length (cm)</label>
                <input type="text" inputMode="numeric" placeholder="e.g. 90" {...register("lengthCm")} className={inputCls} />
                {errors.lengthCm && <p className={errCls}>{errors.lengthCm.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Width (cm)</label>
                <input type="text" inputMode="numeric" placeholder="e.g. 60" {...register("widthCm")} className={inputCls} />
                {errors.widthCm && <p className={errCls}>{errors.widthCm.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                <input type="text" inputMode="numeric" placeholder="e.g. 40" {...register("heightCm")} className={inputCls} />
                {errors.heightCm && <p className={errCls}>{errors.heightCm.message}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Weight is required to ship. If left empty here, the VM default weight (SHIPROCKET_DEFAULT_WEIGHT_G) is used.
            </p>
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
                <p className="text-xs text-green-600">Image ready to save (stored as base64).</p>
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
// Orders Management Module: Full CRUD, Search, Filter, Direct Status Updates,
// Shiprocket Tracking Links, Manual Order Creation, and optional API dispatch.
// ---------------------------------------------------------------------------
interface OrderRow {
  id: string;
  status: string;
  amountPaise: number;
  currency: string;
  receipt?: string;
  userId?: string;
  adminNotes?: string;
  items?: { id?: string; name: string; qty: number; pricePaise: number }[];
  customer?: { name?: string; email?: string; phone?: string };
  address?: { line1?: string; line2?: string; city?: string; state?: string; pincode?: string };
  shiprocket?: {
    orderId?: string | number;
    shipmentId?: string | number;
    awb?: string;
    courierName?: string;
    courier?: string;
    trackingUrl?: string;
    tracking_url?: string;
    state?: string;
    createdAt?: number;
  };
  createdAt?: number;
  updatedAt?: number;
}

const AVAILABLE_ORDER_STATUSES: { id: string; label: string; badgeCls: string }[] = [
  { id: "paid", label: "Paid & Confirmed", badgeCls: "bg-emerald-100 text-emerald-800 border-emerald-300" },
  { id: "processing", label: "In Production / Packing", badgeCls: "bg-blue-100 text-blue-800 border-blue-300" },
  { id: "shipped", label: "Shipped / In Transit", badgeCls: "bg-indigo-100 text-indigo-800 border-indigo-300" },
  { id: "out_for_delivery", label: "Out for Delivery", badgeCls: "bg-purple-100 text-purple-800 border-purple-300" },
  { id: "delivered", label: "Delivered", badgeCls: "bg-green-100 text-green-800 border-green-300" },
  { id: "out_of_stock", label: "Out of Stock / Seasoning", badgeCls: "bg-amber-100 text-amber-800 border-amber-300" },
  { id: "cancelled", label: "Cancelled", badgeCls: "bg-rose-100 text-rose-800 border-rose-300" },
  { id: "refunded", label: "Refunded", badgeCls: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  { id: "pending", label: "Pending Payment", badgeCls: "bg-gray-100 text-gray-700 border-gray-300" },
  { id: "failed", label: "Payment Failed", badgeCls: "bg-red-100 text-red-700 border-red-300" },
];

function statusLabel(s: string): string {
  const match = AVAILABLE_ORDER_STATUSES.find((st) => st.id === s);
  return match ? match.label : s.replace(/_/g, " ").toUpperCase();
}

function getOrderBadgeCls(s: string): string {
  const match = AVAILABLE_ORDER_STATUSES.find((st) => st.id === s);
  return match ? match.badgeCls : "bg-gray-100 text-gray-700 border-gray-200";
}

function getOrderTrackingUrl(o: OrderRow): string | null {
  const awb = (o.shiprocket?.awb ?? "").trim();
  if (o.shiprocket?.trackingUrl?.trim()) return o.shiprocket.trackingUrl.trim();
  if (o.shiprocket?.tracking_url?.trim()) return o.shiprocket.tracking_url.trim();
  if (awb) return `https://shiprocket.co/tracking/${encodeURIComponent(awb)}`;
  return null;
}

function OrdersSection({
  notify,
  user,
  onCountsChange,
}: {
  notify: (kind: "success" | "error", msg: string) => void;
  user: User | null;
  onCountsChange?: (total: number, paid: number) => void;
}) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  // Edit Order Modal State
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  // Shiprocket Diagnostics State
  interface ShiprocketStatusData {
    configured: boolean;
    authenticated?: boolean;
    email?: string;
    configuredPickupLocation?: string | null;
    detectedPickupLocations?: Array<{
      location: string;
      address: string;
      phone: string;
      isPrimary: boolean;
    }>;
    ready?: boolean;
    error?: string;
    message?: string;
    pickupError?: string | null;
  }
  const [checkingShiprocket, setCheckingShiprocket] = useState(false);
  const [shiprocketStatusResult, setShiprocketStatusResult] = useState<ShiprocketStatusData | null>(null);
  const [showShiprocketModal, setShowShiprocketModal] = useState(false);

  const checkShiprocketConnection = async () => {
    if (!user) return;
    setCheckingShiprocket(true);
    setShowShiprocketModal(true);
    setShiprocketStatusResult(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch("/api/payment/shipping/status", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      setShiprocketStatusResult(data);
    } catch (err) {
      setShiprocketStatusResult({
        configured: false,
        authenticated: false,
        error: err instanceof Error ? err.message : "Network error contacting payment backend",
      });
    } finally {
      setCheckingShiprocket(false);
    }
  };

  // Create Manual Order Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    id: "",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    status: "paid",
    items: [{ name: "Solid Teak Dining Chair", qty: 1, priceRupees: 18500 }],
    courier: "",
    awb: "",
    adminNotes: "",
  });

  // 1. Full Database Subscription (No 50 Limit)
  useEffect(() => {
    if (!user) return;
    const ordersRef = ref(database, "orders");
    const unsub = onValue(
      ordersRef,
      (snap) => {
        const data = (snap.val() ?? {}) as Record<string, Omit<OrderRow, "id">>;
        const rows = Object.entries(data)
          .map(([id, o]) => ({ id, ...o }) as OrderRow)
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setOrders(rows);
        setListError(null);
        onCountsChange?.(rows.length, rows.filter((r) => r.status === "paid").length);
      },
      (err) => setListError(err.message)
    );
    return () => unsub();
  }, [user, onCountsChange]);

  // Compute status counts for filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      const st = o.status || "pending";
      counts[st] = (counts[st] || 0) + 1;
    }
    return counts;
  }, [orders]);

  // Filtered orders based on search query & status filter
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && (o.status || "pending") !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchId = o.id.toLowerCase().includes(q) || (o.receipt || "").toLowerCase().includes(q);
      const matchCustomer =
        (o.customer?.name || "").toLowerCase().includes(q) ||
        (o.customer?.email || "").toLowerCase().includes(q) ||
        (o.customer?.phone || "").toLowerCase().includes(q);
      const matchAwb =
        (o.shiprocket?.awb || "").toLowerCase().includes(q) ||
        (o.shiprocket?.courierName || "").toLowerCase().includes(q) ||
        (o.shiprocket?.courier || "").toLowerCase().includes(q);
      const matchAddress =
        (o.address?.city || "").toLowerCase().includes(q) ||
        (o.address?.state || "").toLowerCase().includes(q) ||
        (o.address?.pincode || "").toLowerCase().includes(q);
      const matchNotes = (o.adminNotes || "").toLowerCase().includes(q);
      return matchId || matchCustomer || matchAwb || matchAddress || matchNotes;
    });
  }, [orders, statusFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginatedOrders = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, safePage, pageSize]);

  // 2. Direct Frontend Quick Status Update (Firebase direct write)
  const handleQuickStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await update(ref(database, `orders/${orderId}`), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });
      notify("success", `Order ${orderId.slice(0, 10)} marked as ${statusLabel(newStatus)}.`);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to update status.");
    }
  };

  // 3. Delete Order (Delete option)
  const handleDeleteOrder = async (orderId: string) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete order "${orderId}"?\n\nThis will remove it from the database.`
      )
    ) {
      return;
    }
    try {
      await remove(ref(database, `orders/${orderId}`));
      notify("success", `Order ${orderId} deleted.`);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to delete order.");
    }
  };

  // 4. Save Edited Order Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    setSavingEdit(true);
    try {
      const awbTrimmed = editingOrder.shiprocket?.awb?.trim() || "";
      const courierTrimmed =
        editingOrder.shiprocket?.courierName?.trim() ||
        editingOrder.shiprocket?.courier?.trim() ||
        "";
      const customTrackingUrl = editingOrder.shiprocket?.trackingUrl?.trim();
      const effectiveTrackingUrl =
        customTrackingUrl || (awbTrimmed ? `https://shiprocket.co/tracking/${encodeURIComponent(awbTrimmed)}` : "");

      const updates: Record<string, unknown> = {
        status: editingOrder.status,
        updatedAt: serverTimestamp(),
        adminNotes: editingOrder.adminNotes || "",
        amountPaise: Number(editingOrder.amountPaise) || 0,
        customer: {
          name: editingOrder.customer?.name?.trim() || "",
          email: editingOrder.customer?.email?.trim() || "",
          phone: editingOrder.customer?.phone?.trim() || "",
        },
        address: {
          line1: editingOrder.address?.line1?.trim() || "",
          line2: editingOrder.address?.line2?.trim() || "",
          city: editingOrder.address?.city?.trim() || "",
          state: editingOrder.address?.state?.trim() || "",
          pincode: editingOrder.address?.pincode?.trim() || "",
        },
        shiprocket: {
          ...editingOrder.shiprocket,
          awb: awbTrimmed,
          courierName: courierTrimmed,
          courier: courierTrimmed,
          trackingUrl: effectiveTrackingUrl,
          tracking_url: effectiveTrackingUrl,
        },
      };

      await update(ref(database, `orders/${editingOrder.id}`), updates);
      notify("success", `Order ${editingOrder.id} updated successfully.`);
      setEditingOrder(null);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to save order.");
    } finally {
      setSavingEdit(false);
    }
  };

  // 5. Create Manual / Custom Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrder.customerName.trim()) {
      notify("error", "Customer name is required.");
      return;
    }
    setCreatingOrder(true);
    try {
      const fallbackId = "ord_man_" + Math.random().toString(36).substring(2, 9);
      const orderId = newOrder.id.trim() || fallbackId;
      const totalAmountPaise = newOrder.items.reduce(
        (sum, it) => sum + (Number(it.priceRupees) || 0) * 100 * (Number(it.qty) || 1),
        0
      );

      const awbTrimmed = newOrder.awb.trim();
      const courierTrimmed = newOrder.courier.trim();
      const trackingUrl = awbTrimmed ? `https://shiprocket.co/tracking/${encodeURIComponent(awbTrimmed)}` : "";

      const orderData: Record<string, unknown> = {
        id: orderId,
        status: newOrder.status,
        amountPaise: totalAmountPaise,
        currency: "INR",
        customer: {
          name: newOrder.customerName.trim(),
          email: newOrder.customerEmail.trim(),
          phone: newOrder.customerPhone.trim(),
        },
        address: {
          line1: newOrder.addressLine1.trim(),
          line2: newOrder.addressLine2.trim(),
          city: newOrder.city.trim(),
          state: newOrder.state.trim(),
          pincode: newOrder.pincode.trim(),
        },
        items: newOrder.items.map((it) => ({
          name: it.name.trim() || "Bespoke Timber Furniture",
          qty: Number(it.qty) || 1,
          pricePaise: (Number(it.priceRupees) || 0) * 100,
        })),
        shiprocket: awbTrimmed || courierTrimmed
          ? {
              awb: awbTrimmed,
              courierName: courierTrimmed,
              courier: courierTrimmed,
              trackingUrl: trackingUrl,
              tracking_url: trackingUrl,
            }
          : {},
        adminNotes: newOrder.adminNotes.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await set(ref(database, `orders/${orderId}`), orderData);
      notify("success", `Manual order ${orderId} created successfully.`);
      setIsCreateOpen(false);
      setNewOrder({
        id: "",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        status: "paid",
        items: [{ name: "Solid Teak Dining Chair", qty: 1, priceRupees: 18500 }],
        courier: "",
        awb: "",
        adminNotes: "",
      });
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Failed to create order.");
    } finally {
      setCreatingOrder(false);
    }
  };

  /** Optional automated fulfillment via Payment VM */
  const approveAndShip = async (o: OrderRow) => {
    if (
      !window.confirm(
        `Send order ${o.id} to Shiprocket via Payment API?\n${o.customer?.name ?? ""} → ${o.address?.city ?? ""}, ${
          o.address?.pincode ?? ""
        }\nThis assigns a courier and AWB automatically.`
      )
    )
      return;
    if (!user) return;
    setActingOn(o.id);
    try {
      const idToken = await user.getIdToken();
      const result = await postToPaymentApi<{ ok: boolean; already?: boolean; awb?: string; courier?: string }>(
        "/fulfill",
        { orderId: o.id },
        idToken
      );
      notify(
        "success",
        result.already
          ? "Order was already sent to Shiprocket."
          : `Shipment created${result.awb ? ` — AWB ${result.awb} (${result.courier})` : " — AWB pending"}.`
      );
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Fulfillment failed.");
    } finally {
      setActingOn(null);
    }
  };

  /** Optional automated refund via Razorpay VM */
  const refund = async (o: OrderRow) => {
    if (!window.confirm(`Initiate gateway refund for order ${o.id} via Payment API?`)) return;
    if (!user) return;
    setActingOn(o.id);
    try {
      const idToken = await user.getIdToken();
      const result = await postToPaymentApi<{ ok: boolean; already?: boolean; refundId?: string }>(
        "/refund",
        { orderId: o.id },
        idToken
      );
      notify("success", result.already ? "Order was already refunded." : `Refund created (${result.refundId}).`);
    } catch (err) {
      notify("error", err instanceof Error ? err.message : "Refund failed.");
    } finally {
      setActingOn(null);
    }
  };

  const fmtDate = (ms?: number) =>
    ms ? new Date(ms).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden space-y-6">
      {/* Top Action & Summary Bar */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif font-bold text-timber-darkwood">Customer Orders &amp; Fulfillment</h2>
            <span className="px-2.5 py-0.5 bg-timber-teal/10 text-timber-teal text-xs font-semibold rounded-full">
              {orders.length} Total Orders
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">
            Complete CRUD control: directly update statuses (cancel, out of stock, refund), edit shipping addresses, and manage live Shiprocket tracking links.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={checkShiprocketConnection}
            disabled={checkingShiprocket}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:border-timber-teal hover:text-timber-teal rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-2xs disabled:opacity-50"
            title="Inspect Shiprocket credentials, authentication, and pickup warehouse addresses"
          >
            <Truck size={15} className="text-timber-teal" />
            <span>{checkingShiprocket ? "Checking…" : "Shiprocket Status"}</span>
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-5 py-2.5 bg-timber-darkwood text-timber-beige hover:bg-timber-teal rounded-xl text-xs font-semibold uppercase tracking-wider transition flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
          >
            <Plus size={15} />
            <span>+ Create Manual Order</span>
          </button>
        </div>
      </div>

      {/* Search Bar & Status Filter Pills */}
      <div className="px-6 space-y-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Order ID, customer name, phone, email, AWB number, city..."
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-timber-teal/20 focus:border-timber-teal transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
            >
              Clear
            </button>
          )}
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-gray-400 mr-1 flex items-center gap-1">
            <Filter size={12} />
            <span>Filter:</span>
          </span>

          <button
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "all"
                ? "bg-timber-darkwood text-white shadow-2xs"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <span>All</span>
            <span className="px-1.5 py-0.2 bg-black/20 rounded-full text-[10px]">{statusCounts.all || 0}</span>
          </button>

          {AVAILABLE_ORDER_STATUSES.map((st) => {
            const count = statusCounts[st.id] || 0;
            if (count === 0 && !["paid", "processing", "shipped", "out_of_stock", "cancelled"].includes(st.id)) {
              return null;
            }
            return (
              <button
                key={st.id}
                onClick={() => {
                  setStatusFilter(st.id);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  statusFilter === st.id
                    ? "bg-timber-teal text-white shadow-2xs"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span>{st.label}</span>
                {count > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                      statusFilter === st.id ? "bg-black/20 text-white" : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders Table */}
      {listError ? (
        <div className="p-8 text-center text-red-600 bg-red-50/50 m-6 rounded-xl border border-red-200">
          <p className="font-semibold mb-1">Couldn&apos;t load orders</p>
          <p className="text-xs text-red-500">{listError}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="p-16 text-center text-gray-500 italic">
          {searchQuery || statusFilter !== "all"
            ? "No orders match your search or filter criteria."
            : "No customer orders recorded yet."}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-y border-gray-100">
              <tr>
                <th className="py-3.5 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Order &amp; Date</th>
                <th className="py-3.5 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                <th className="py-3.5 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Shipping Address</th>
                <th className="py-3.5 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                <th className="py-3.5 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Status (Quick Change)</th>
                <th className="py-3.5 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider">Shiprocket Tracking</th>
                <th className="py-3.5 px-6 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedOrders.map((o) => {
                const trackingUrl = getOrderTrackingUrl(o);
                return (
                  <tr key={o.id} className="hover:bg-gray-50/60 transition align-top">
                    {/* Order & Date */}
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs font-bold text-timber-darkwood break-all">
                        {o.receipt || o.id}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
                        <Clock size={11} />
                        <span>{fmtDate(o.createdAt)}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-2 space-y-0.5">
                        {(o.items ?? []).map((i, idx) => (
                          <div key={idx} className="font-medium">
                            {i.name} <span className="text-timber-teal">×{i.qty}</span>
                          </div>
                        ))}
                      </div>
                      {o.adminNotes && (
                        <div className="mt-2 p-2 bg-amber-50/80 border border-amber-200/60 rounded-md text-[11px] text-amber-900 leading-snug">
                          <strong>Note:</strong> {o.adminNotes}
                        </div>
                      )}
                    </td>

                    {/* Customer */}
                    <td className="py-4 px-6 text-sm text-gray-900">
                      <div className="font-medium text-timber-darkwood">{o.customer?.name || "Anonymous Customer"}</div>
                      <div className="text-xs text-gray-500 font-mono mt-0.5">{o.customer?.phone || "—"}</div>
                      {o.customer?.email && (
                        <div className="text-xs text-gray-500 mt-0.5 break-all">{o.customer.email}</div>
                      )}
                    </td>

                    {/* Shipping Address */}
                    <td className="py-4 px-6 text-xs text-gray-700 max-w-xs leading-relaxed">
                      {[o.address?.line1, o.address?.line2, o.address?.city, o.address?.state, o.address?.pincode]
                        .filter(Boolean)
                        .join(", ") || <span className="text-gray-400 italic">No address provided</span>}
                    </td>

                    {/* Amount */}
                    <td className="py-4 px-6 font-semibold text-timber-darkwood whitespace-nowrap text-sm">
                      {formatPrice(o.amountPaise, o.currency ?? "INR")}
                    </td>

                    {/* Status with Direct Frontend Selector */}
                    <td className="py-4 px-6 space-y-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border whitespace-nowrap ${getOrderBadgeCls(
                          o.status
                        )}`}
                      >
                        {statusLabel(o.status ?? "pending")}
                      </span>

                      {/* Direct Quick Changer */}
                      <div>
                        <select
                          value={o.status || "pending"}
                          onChange={(e) => handleQuickStatusChange(o.id, e.target.value)}
                          className="text-xs font-semibold rounded-lg border border-gray-200 bg-white py-1 px-2 text-timber-darkwood focus:ring-1 focus:ring-timber-teal focus:border-timber-teal cursor-pointer shadow-2xs block w-full"
                          title="Change status directly in database (cancel, out of stock, refund, shipped)"
                        >
                          {AVAILABLE_ORDER_STATUSES.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>

                    {/* Shiprocket Tracking Link & Courier */}
                    <td className="py-4 px-6 text-xs text-gray-700">
                      {o.shiprocket?.awb ? (
                        <div className="space-y-1.5">
                          <div className="font-semibold text-timber-darkwood flex items-center gap-1.5">
                            <Truck size={14} className="text-timber-teal shrink-0" />
                            <span>{o.shiprocket.courierName || o.shiprocket.courier || "Shiprocket Courier"}</span>
                          </div>
                          <div className="font-mono text-[11px] text-gray-600">
                            AWB: <span className="font-bold">{o.shiprocket.awb}</span>
                          </div>
                          {trackingUrl && (
                            <div>
                              <a
                                href={trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-timber-teal/10 hover:bg-timber-teal text-timber-teal hover:text-white rounded-lg text-[11px] font-semibold transition"
                                title="Open live Shiprocket tracking"
                              >
                                <span>Track on Shiprocket</span>
                                <ExternalLink size={11} />
                              </a>
                            </div>
                          )}
                          {o.shiprocket.state && (
                            <div className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                              Carrier: {statusLabel(o.shiprocket.state)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <span className="text-gray-400 italic block text-xs">No AWB assigned</span>
                          <button
                            onClick={() => setEditingOrder(o)}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-timber-teal hover:text-timber-darkwood transition cursor-pointer"
                          >
                            <Plus size={11} />
                            <span>Add AWB / Courier</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Actions: Edit, Delete, Optional automated API */}
                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Edit order modal */}
                        <button
                          onClick={() => setEditingOrder(o)}
                          className="p-2 text-timber-darkwood hover:text-timber-teal hover:bg-timber-teal/10 rounded-lg transition cursor-pointer"
                          title="Edit order details, address, tracking, notes"
                        >
                          <Edit3 size={15} />
                        </button>

                        {/* Optional automated Shiprocket dispatch */}
                        {env.paymentApiUrl && o.status === "paid" && (
                          <button
                            onClick={() => approveAndShip(o)}
                            disabled={actingOn === o.id}
                            className="text-white bg-timber-teal hover:bg-timber-darkwood px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer shadow-2xs"
                            title="Auto-dispatch via Payment VM to Shiprocket"
                          >
                            {actingOn === o.id ? "Shipping…" : "Shiprocket API"}
                          </button>
                        )}

                        {/* Optional automated Razorpay refund */}
                        {env.paymentApiUrl && ["paid", "processing", "shipped"].includes(o.status) && (
                          <button
                            onClick={() => refund(o)}
                            disabled={actingOn === o.id}
                            className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition disabled:opacity-50 cursor-pointer"
                            title="Initiate gateway refund via Razorpay VM"
                          >
                            {actingOn === o.id ? "Refunding…" : "Gateway Refund"}
                          </button>
                        )}

                        {/* Delete order */}
                        <button
                          onClick={() => handleDeleteOrder(o.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="Permanently delete order"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <div>
            Showing {(safePage - 1) * pageSize + 1} to{" "}
            {Math.min(safePage * pageSize, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-3 py-1.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <span className="font-semibold text-timber-darkwood px-2">
              Page {safePage} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-3 py-1.5 border border-gray-200 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* MODAL 1: Edit Order Details & Shiprocket Tracking */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-timber-darkwood">Edit Order Details</h3>
                <p className="text-xs font-mono text-gray-500 mt-0.5">{editingOrder.id}</p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-6">
              {/* Status & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Order Status
                  </label>
                  <select
                    value={editingOrder.status}
                    onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-timber-darkwood focus:ring-2 focus:ring-timber-teal/20 focus:border-timber-teal"
                  >
                    {AVAILABLE_ORDER_STATUSES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Amount (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={paiseToRupees(editingOrder.amountPaise)}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        amountPaise: rupeesToPaise(Number(e.target.value) || 0),
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-timber-darkwood focus:ring-2 focus:ring-timber-teal/20 focus:border-timber-teal"
                  />
                </div>
              </div>

              {/* Shiprocket Tracking Card */}
              <div className="p-4 bg-timber-beige/30 rounded-xl border border-timber-teal/20 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck size={16} className="text-timber-teal" />
                    <span className="text-xs font-bold uppercase tracking-wider text-timber-teal">
                      Shiprocket Courier &amp; Live Tracking
                    </span>
                  </div>
                  {editingOrder.shiprocket?.awb && (
                    <a
                      href={
                        editingOrder.shiprocket.trackingUrl ||
                        `https://shiprocket.co/tracking/${encodeURIComponent(editingOrder.shiprocket.awb.trim())}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-timber-teal hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Preview Tracking Link</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Courier Partner</label>
                    <input
                      type="text"
                      placeholder="e.g. Blue Dart, Delhivery, DTDC, FedEx"
                      value={editingOrder.shiprocket?.courierName || editingOrder.shiprocket?.courier || ""}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          shiprocket: {
                            ...editingOrder.shiprocket,
                            courierName: e.target.value,
                            courier: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-800"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">AWB Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 141123456789"
                      value={editingOrder.shiprocket?.awb || ""}
                      onChange={(e) => {
                        const awbVal = e.target.value;
                        setEditingOrder({
                          ...editingOrder,
                          shiprocket: {
                            ...editingOrder.shiprocket,
                            awb: awbVal,
                            trackingUrl: awbVal ? `https://shiprocket.co/tracking/${encodeURIComponent(awbVal.trim())}` : "",
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Custom Tracking URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://shiprocket.co/tracking/..."
                    value={editingOrder.shiprocket?.trackingUrl || ""}
                    onChange={(e) =>
                      setEditingOrder({
                        ...editingOrder,
                        shiprocket: {
                          ...editingOrder.shiprocket,
                          trackingUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-mono text-gray-800"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Auto-defaults to <code>https://shiprocket.co/tracking/[AWB]</code> when AWB is provided.
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Customer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Name</label>
                    <input
                      type="text"
                      value={editingOrder.customer?.name || ""}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          customer: { ...editingOrder.customer, name: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone</label>
                    <input
                      type="text"
                      value={editingOrder.customer?.phone || ""}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          customer: { ...editingOrder.customer, phone: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      value={editingOrder.customer?.email || ""}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          customer: { ...editingOrder.customer, email: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Shipping Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      value={editingOrder.address?.line1 || ""}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          address: { ...editingOrder.address, line1: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">City</label>
                    <input
                      type="text"
                      value={editingOrder.address?.city || ""}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          address: { ...editingOrder.address, city: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">State</label>
                    <input
                      type="text"
                      value={editingOrder.address?.state || ""}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          address: { ...editingOrder.address, state: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pincode</label>
                    <input
                      type="text"
                      value={editingOrder.address?.pincode || ""}
                      onChange={(e) =>
                        setEditingOrder({
                          ...editingOrder,
                          address: { ...editingOrder.address, pincode: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Admin & Customer Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Order &amp; Workshop Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Seasoning wood batch #4, customer requested dispatch after 10th, or refund explanation..."
                  value={editingOrder.adminNotes || ""}
                  onChange={(e) => setEditingOrder({ ...editingOrder, adminNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-timber-teal/20 focus:border-timber-teal"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-timber-teal text-white rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-timber-darkwood transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Save size={14} />
                  <span>{savingEdit ? "Saving Changes…" : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Create Manual Order */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div>
                <h3 className="font-serif text-xl font-bold text-timber-darkwood">Create Manual Order</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Record an offline, showroom, phone, or custom furniture order.
                </p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-6">
              {/* Order ID & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Order ID (Leave blank to auto-generate)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ord_custom_1024"
                    value={newOrder.id}
                    onChange={(e) => setNewOrder({ ...newOrder, id: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Initial Status
                  </label>
                  <select
                    value={newOrder.status}
                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-timber-darkwood"
                  >
                    {AVAILABLE_ORDER_STATUSES.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Customer Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={newOrder.customerName}
                      onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      placeholder="e.g. 9876543210"
                      value={newOrder.customerPhone}
                      onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="customer@example.com"
                      value={newOrder.customerEmail}
                      onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Shipping Address</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs text-gray-500 mb-1">Address Line 1</label>
                    <input
                      type="text"
                      placeholder="House / Street / Apartment"
                      value={newOrder.addressLine1}
                      onChange={(e) => setNewOrder({ ...newOrder, addressLine1: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">City</label>
                    <input
                      type="text"
                      placeholder="e.g. Chennai"
                      value={newOrder.city}
                      onChange={(e) => setNewOrder({ ...newOrder, city: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">State</label>
                    <input
                      type="text"
                      placeholder="e.g. Tamil Nadu"
                      value={newOrder.state}
                      onChange={(e) => setNewOrder({ ...newOrder, state: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Pincode</label>
                    <input
                      type="text"
                      placeholder="e.g. 600001"
                      value={newOrder.pincode}
                      onChange={(e) => setNewOrder({ ...newOrder, pincode: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Items in Order */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Ordered Items</h4>
                  <button
                    type="button"
                    onClick={() =>
                      setNewOrder({
                        ...newOrder,
                        items: [...newOrder.items, { name: "", qty: 1, priceRupees: 0 }],
                      })
                    }
                    className="text-xs text-timber-teal hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus size={12} />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {newOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                      <input
                        type="text"
                        placeholder="Item name / Furniture model"
                        value={item.name}
                        onChange={(e) => {
                          const updated = [...newOrder.items];
                          updated[idx].name = e.target.value;
                          setNewOrder({ ...newOrder, items: updated });
                        }}
                        className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm"
                      />
                      <div className="w-20">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.qty}
                          onChange={(e) => {
                            const updated = [...newOrder.items];
                            updated[idx].qty = Math.max(1, parseInt(e.target.value) || 1);
                            setNewOrder({ ...newOrder, items: updated });
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-center"
                        />
                      </div>
                      <div className="w-28">
                        <input
                          type="number"
                          placeholder="Price (₹)"
                          value={item.priceRupees || ""}
                          onChange={(e) => {
                            const updated = [...newOrder.items];
                            updated[idx].priceRupees = Number(e.target.value) || 0;
                            setNewOrder({ ...newOrder, items: updated });
                          }}
                          className="w-full px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-right"
                        />
                      </div>
                      {newOrder.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewOrder({
                              ...newOrder,
                              items: newOrder.items.filter((_, i) => i !== idx),
                            });
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded-md"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="text-right text-sm font-semibold text-timber-darkwood pt-1">
                  Total Order Amount: ₹
                  {newOrder.items
                    .reduce((sum, it) => sum + (Number(it.priceRupees) || 0) * (Number(it.qty) || 1), 0)
                    .toLocaleString("en-IN")}
                </div>
              </div>

              {/* Optional Shiprocket Courier & AWB */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Courier Partner (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Blue Dart, Delhivery"
                    value={newOrder.courier}
                    onChange={(e) => setNewOrder({ ...newOrder, courier: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    AWB Tracking Number (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 141123456789"
                    value={newOrder.awb}
                    onChange={(e) => setNewOrder({ ...newOrder, awb: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Order &amp; Workshop Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Custom teak stain, offline advance paid via cash, delivery expected by 15th..."
                  value={newOrder.adminNotes}
                  onChange={(e) => setNewOrder({ ...newOrder, adminNotes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-gray-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-6 py-2.5 bg-timber-darkwood text-timber-beige rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-timber-teal transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  <Plus size={14} />
                  <span>{creatingOrder ? "Creating Order…" : "Create Order"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Shiprocket Connection Diagnostics */}
      {showShiprocketModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 my-8">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-timber-teal/10 flex items-center justify-center text-timber-teal">
                  <Truck size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-timber-darkwood">Shiprocket Integration Status</h3>
                  <p className="text-xs text-gray-500 mt-0.5">Automated fulfillment &amp; courier dispatch pipeline</p>
                </div>
              </div>
              <button
                onClick={() => setShowShiprocketModal(false)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {checkingShiprocket ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-8 h-8 border-3 border-timber-teal border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-gray-600 font-medium">Checking Shiprocket credentials &amp; pickup endpoints…</p>
              </div>
            ) : shiprocketStatusResult ? (
              <div className="space-y-5">
                {/* 1. Account Auth Status */}
                <div className="p-4 rounded-xl border flex items-start gap-3 bg-gray-50/70">
                  <div className="mt-0.5 shrink-0">
                    {shiprocketStatusResult.authenticated ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
                    ) : (
                      <AlertTriangle size={18} className="text-amber-600" />
                    )}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Shiprocket Account Auth:</span>
                      {shiprocketStatusResult.authenticated ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-semibold">Active &amp; Connected</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md font-semibold">Not Connected</span>
                      )}
                    </div>
                    {shiprocketStatusResult.email && (
                      <p className="text-gray-600 font-mono">Account Email: {shiprocketStatusResult.email}</p>
                    )}
                    {shiprocketStatusResult.error && (
                      <p className="text-red-700 bg-red-50 p-2 rounded border border-red-200 mt-1">{shiprocketStatusResult.error}</p>
                    )}
                    {shiprocketStatusResult.message && (
                      <p className="text-amber-800 mt-1">{shiprocketStatusResult.message}</p>
                    )}
                  </div>
                </div>

                {/* 2. Pickup Warehouse Address */}
                <div className="p-4 rounded-xl border flex items-start gap-3 bg-gray-50/70">
                  <div className="mt-0.5 shrink-0">
                    {shiprocketStatusResult.detectedPickupLocations && shiprocketStatusResult.detectedPickupLocations.length > 0 ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">✓</span>
                    ) : (
                      <AlertTriangle size={18} className="text-amber-600" />
                    )}
                  </div>
                  <div className="space-y-1.5 text-xs w-full">
                    <span className="font-semibold text-gray-900">Registered Pickup Warehouse:</span>
                    {shiprocketStatusResult.detectedPickupLocations && shiprocketStatusResult.detectedPickupLocations.length > 0 ? (
                      <div className="space-y-2 bg-white p-2.5 rounded-lg border border-gray-200">
                        {shiprocketStatusResult.detectedPickupLocations.map((loc, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs border-b border-gray-100 last:border-b-0 pb-1.5 last:pb-0">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-timber-darkwood font-mono">{loc.location}</span>
                                {loc.isPrimary && <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">Primary</span>}
                              </div>
                              <p className="text-gray-500 mt-0.5">{loc.address}</p>
                            </div>
                            <span className="text-gray-400 font-mono text-[11px] shrink-0 ml-2">{loc.phone}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-amber-50 p-3 rounded-lg border border-amber-200 text-amber-900 space-y-1">
                        <p className="font-medium">No pickup address registered in Shiprocket!</p>
                        <p className="text-[11px] leading-relaxed">
                          Shiprocket requires at least one pickup location before couriers can collect orders. Log in to <a href="https://app.shiprocket.in" target="_blank" rel="noopener noreferrer" className="underline font-semibold">app.shiprocket.in</a>, navigate to <b>Settings → Pickup Addresses</b>, and add your workshop address.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Action Summary & Checklist */}
                <div className="p-4 rounded-xl bg-timber-teal/5 border border-timber-teal/20 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-timber-darkwood uppercase tracking-wider text-[11px]">Dispatch Readiness Checklist</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                      shiprocketStatusResult.ready ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {shiprocketStatusResult.ready ? "READY FOR DISPATCH" : "ACTION REQUIRED"}
                    </span>
                  </div>
                  <ul className="space-y-1.5 text-gray-600">
                    <li className="flex items-center gap-2">
                      <span className={shiprocketStatusResult.authenticated ? "text-emerald-600 font-bold" : "text-gray-400 font-bold"}>
                        {shiprocketStatusResult.authenticated ? "✓" : "○"}
                      </span>
                      Shiprocket Account Credentials (email &amp; password verified)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className={shiprocketStatusResult.detectedPickupLocations?.length ? "text-emerald-600 font-bold" : "text-gray-400 font-bold"}>
                        {shiprocketStatusResult.detectedPickupLocations?.length ? "✓" : "○"}
                      </span>
                      Warehouse Pickup Location (configured on Shiprocket)
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-600 font-bold">ℹ</span>
                      Shiprocket Wallet Balance (ensure ₹200+ recharge in Shiprocket panel to generate AWB)
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setShowShiprocketModal(false)}
                    className="px-5 py-2.5 bg-timber-darkwood text-timber-beige hover:bg-timber-teal rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inquiries section (contact form submissions from /contact)
// ---------------------------------------------------------------------------
interface InquiryRow {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: "new" | "handled";
  createdAt?: number;
}

function InquiriesSection({
  notify,
  user,
  onCountsChange,
}: {
  notify: (kind: "success" | "error", msg: string) => void;
  user: User | null;
  onCountsChange?: (total: number, newCount: number) => void;
}) {
  const [inquiries, setInquiries] = useState<InquiryRow[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const inquiriesQuery = query(
      ref(database, "inquiries"),
      orderByChild("createdAt"),
      limitToLast(50)
    );
    const unsub = onValue(
      inquiriesQuery,
      (snap) => {
        const data = (snap.val() ?? {}) as Record<string, Omit<InquiryRow, "id">>;
        const rows = Object.entries(data)
          .map(([id, inq]) => ({ id, ...inq }) as InquiryRow)
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
        setInquiries(rows);
        setListError(null);
        onCountsChange?.(rows.length, rows.filter((r) => r.status === "new").length);
      },
      (err) => setListError(err.message)
    );
    return () => unsub();
  }, [user, onCountsChange]);

  const toggleStatus = async (inq: InquiryRow) => {
    setActingOn(inq.id);
    const nextStatus = inq.status === "handled" ? "new" : "handled";
    try {
      await update(ref(database, `inquiries/${inq.id}`), { status: nextStatus });
      notify("success", `Inquiry marked as ${nextStatus}.`);
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setActingOn(null);
    }
  };

  const deleteInquiry = async (inq: InquiryRow) => {
    if (!window.confirm(`Delete inquiry from ${inq.name}?`)) return;
    setActingOn(inq.id);
    try {
      await remove(ref(database, `inquiries/${inq.id}`));
      notify("success", "Inquiry deleted.");
    } catch (err: unknown) {
      notify("error", err instanceof Error ? err.message : "Failed to delete inquiry.");
    } finally {
      setActingOn(null);
    }
  };

  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-serif text-timber-darkwood">Customer Inquiries</h2>
            {newCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                {newCount} new
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm mt-1">
            Messages submitted via the contact form on timberteak.com/contact.
          </p>
        </div>
      </div>

      {listError ? (
        <div className="p-6">
          <p className="text-red-600 font-medium mb-1">Couldn&apos;t load inquiries</p>
          <p className="text-gray-500 text-sm">{listError}</p>
        </div>
      ) : inquiries.length === 0 ? (
        <div className="p-12 text-center text-gray-500 italic">No inquiries received yet.</div>
      ) : (
        <div className="divide-y divide-gray-100">
          {inquiries.map((inq) => (
            <div key={inq.id} className="p-6 hover:bg-gray-50/50 transition-colors">
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-timber-darkwood text-base">{inq.name}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        inq.status === "handled"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {inq.status === "handled" ? "HANDLED" : "NEW"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {inq.createdAt ? new Date(inq.createdAt).toLocaleString("en-IN") : ""}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-4 text-xs text-gray-500 mt-1">
                    <a href={`mailto:${inq.email}`} className="text-timber-teal hover:underline font-medium">
                      {inq.email}
                    </a>
                    {inq.phone && (
                      <a href={`tel:${inq.phone}`} className="hover:underline">
                        {inq.phone}
                      </a>
                    )}
                    <span className="text-gray-600 font-medium bg-gray-100 px-2 py-0.5 rounded">
                      {inq.subject}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => toggleStatus(inq)}
                    disabled={actingOn === inq.id}
                    className="text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-700 hover:bg-gray-100 transition disabled:opacity-50"
                  >
                    {inq.status === "handled" ? "Mark New" : "Mark Handled"}
                  </button>
                  <button
                    onClick={() => deleteInquiry(inq)}
                    disabled={actingOn === inq.id}
                    className="text-xs px-3 py-1.5 rounded border border-red-200 text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <div className="text-sm text-gray-700 bg-gray-50/80 p-3.5 rounded-md border border-gray-100 whitespace-pre-wrap leading-relaxed">
                {inq.message}
              </div>
            </div>
          ))}
        </div>
      )}
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

  const [activeTab, setActiveTab] = useState<"orders" | "products" | "inquiries" | "maintenance">("orders");
  const [ordersStats, setOrdersStats] = useState({ total: 0, paid: 0 });
  const [inquiriesStats, setInquiriesStats] = useState({ total: 0, newCount: 0 });

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
    let cleanEmail = email.trim();
    if (!cleanEmail) return;

    // Browser/DNS specifications do not permit underscores (_) in domain names.
    // Transparently normalize @timber_ts.com / @timber_TS.com -> @timber-ts.com
    if (cleanEmail.toLowerCase().includes("@timber_ts.com")) {
      cleanEmail = cleanEmail.replace(/@timber_ts\.com/i, "@timber-ts.com");
    }

    try {
      await signInWithEmailAndPassword(auth, cleanEmail, password);
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string };
      // If user does not exist yet in Firebase Auth, and is an authorized admin, auto-create
      if (
        (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") &&
        isAuthorizedAdminEmail(cleanEmail)
      ) {
        try {
          await createUserWithEmailAndPassword(auth, cleanEmail, password);
          return;
        } catch (createErr: unknown) {
          const cErr = createErr as { code?: string; message?: string };
          if (cErr.code === "auth/email-already-in-use") {
            setLoginError("Invalid password for this admin account.");
          } else {
            setLoginError(cErr.message || "Login failed. Check your password.");
          }
          return;
        }
      }
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
        "Upload all 16 boutique products with base64 images to Firebase Database? This replaces /projects."
      )
    )
      return;
    try {
      const projectsObject: Record<string, unknown> = {};
      const total = BOUTIQUE_PRODUCTS.length;

      for (let i = 0; i < total; i++) {
        const curr = BOUTIQUE_PRODUCTS[i];
        setUploadProgress({ current: i + 1, total, name: curr.name });

        let imageData = curr.image;

        // Convert the local image to base64 data URI
        try {
          const resp = await fetch(curr.image);
          if (resp.ok) {
            const blob = await resp.blob();
            imageData = await fileToBase64(blob as File);
          }
        } catch (imgErr) {
          console.warn(`Image conversion failed for ${curr.name}, using local path`, imgErr);
        }

        projectsObject[curr.id] = {
          name: curr.name,
          slug: curr.slug,
          category: curr.category,
          pricePaise: curr.pricePaise,
          currency: "INR",
          stock: curr.stock,
          description: curr.description,
          images: [imageData],
          type: curr.type,
          orderIndex: curr.orderIndex,
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
      }

      await set(ref(database, "projects"), projectsObject);
      setUploadProgress(null);
      notify("success", `All ${total} boutique products uploaded as base64 to Firebase!`);
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
          <form onSubmit={handleLogin} noValidate className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
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

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Executive Header Bar */}
        <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo-transparent.png"
                alt="Timber Logo"
                width={120}
                height={38}
                className="object-contain"
                priority
              />
              <span className="text-[11px] uppercase tracking-widest font-semibold px-2.5 py-1 bg-timber-teal/10 text-timber-teal rounded-full">
                Admin Console
              </span>
            </div>
            <p className="text-gray-500 text-xs mt-1">
              Store operations, customer orders, live Shiprocket tracking &amp; catalog management
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <Link
              href="/admin/gallery"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-timber-teal bg-timber-teal/10 hover:bg-timber-teal/20 border border-timber-teal/20 rounded-xl transition"
            >
              <Images size={13} />
              <span>Gallery Management</span>
            </Link>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
            >
              <span>View Storefront</span>
              <ExternalLink size={13} />
            </Link>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-xs text-emerald-800">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="font-medium max-w-[170px] truncate">{user.email}</span>
            </div>

            <button
              onClick={() => signOut(auth)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab("orders")}
            className={`p-5 rounded-2xl bg-white border text-left transition-all hover:shadow-md cursor-pointer ${
              activeTab === "orders" ? "border-timber-teal ring-2 ring-timber-teal/20" : "border-gray-100 shadow-xs"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Orders &amp; Shipments</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center">
                <ShoppingBag size={16} />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-timber-darkwood">{ordersStats.total}</div>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
              {ordersStats.paid > 0 ? (
                <span className="text-amber-700 font-semibold">{ordersStats.paid} pending shipment</span>
              ) : (
                <span>All orders processed</span>
              )}
            </p>
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`p-5 rounded-2xl bg-white border text-left transition-all hover:shadow-md cursor-pointer ${
              activeTab === "products" ? "border-timber-teal ring-2 ring-timber-teal/20" : "border-gray-100 shadow-xs"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Catalog Products</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100/70 text-amber-800 flex items-center justify-center">
                <Package size={16} />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-timber-darkwood">{products.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {products.filter((p) => p.isActive).length} live on storefront
            </p>
          </button>

          <button
            onClick={() => setActiveTab("inquiries")}
            className={`p-5 rounded-2xl bg-white border text-left transition-all hover:shadow-md cursor-pointer ${
              activeTab === "inquiries" ? "border-timber-teal ring-2 ring-timber-teal/20" : "border-gray-100 shadow-xs"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer Messages</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100/70 text-blue-800 flex items-center justify-center">
                <MessageSquare size={16} />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-timber-darkwood">{inquiriesStats.total}</div>
            <p className="text-xs text-gray-500 mt-1">
              {inquiriesStats.newCount > 0 ? (
                <span className="text-emerald-700 font-semibold">{inquiriesStats.newCount} new messages</span>
              ) : (
                <span>All inquiries handled</span>
              )}
            </p>
          </button>

          <button
            onClick={() => setActiveTab("maintenance")}
            className={`p-5 rounded-2xl bg-white border text-left transition-all hover:shadow-md cursor-pointer ${
              activeTab === "maintenance" ? "border-timber-teal ring-2 ring-timber-teal/20" : "border-gray-100 shadow-xs"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">System &amp; Database</span>
              <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                <Settings size={16} />
              </div>
            </div>
            <div className="text-2xl font-serif font-bold text-timber-darkwood">Live</div>
            <p className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>RTDB &amp; Storage Connected</span>
            </p>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-timber-darkwood/10 space-x-1 sm:space-x-3 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3.5 px-4 font-serif text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "orders"
                ? "border-timber-teal text-timber-teal font-bold"
                : "border-transparent text-gray-500 hover:text-timber-darkwood"
            }`}
          >
            <ShoppingBag size={16} />
            <span>Orders &amp; Shipments</span>
            {ordersStats.total > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-timber-teal/10 text-timber-teal">
                {ordersStats.total}
              </span>
            )}
            {ordersStats.paid > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500" title="Orders pending approval" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("products")}
            className={`pb-3.5 px-4 font-serif text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "products"
                ? "border-timber-teal text-timber-teal font-bold"
                : "border-transparent text-gray-500 hover:text-timber-darkwood"
            }`}
          >
            <Package size={16} />
            <span>Product Catalog</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-gray-100 text-gray-700">
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("inquiries")}
            className={`pb-3.5 px-4 font-serif text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "inquiries"
                ? "border-timber-teal text-timber-teal font-bold"
                : "border-transparent text-gray-500 hover:text-timber-darkwood"
            }`}
          >
            <MessageSquare size={16} />
            <span>Customer Inquiries</span>
            {inquiriesStats.newCount > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-sans font-bold bg-emerald-100 text-emerald-800">
                {inquiriesStats.newCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("maintenance")}
            className={`pb-3.5 px-4 font-serif text-sm sm:text-base flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "maintenance"
                ? "border-timber-teal text-timber-teal font-bold"
                : "border-transparent text-gray-500 hover:text-timber-darkwood"
            }`}
          >
            <Settings size={16} />
            <span>System &amp; Maintenance</span>
          </button>
        </div>

        {/* TAB 1: Orders & Fulfillment */}
        {activeTab === "orders" && (
          <OrdersSection
            notify={notify}
            user={user}
            onCountsChange={(total, paid) => setOrdersStats({ total, paid })}
          />
        )}

        {/* TAB 2: Product Catalog */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-gray-100 flex flex-col md:flex-row gap-3 md:items-center justify-between">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Search products by title, description or category…"
                  aria-label="Search products"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 whitespace-nowrap cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showInactive}
                    onChange={(e) => { setShowInactive(e.target.checked); setPage(1); }}
                    className="w-4 h-4 rounded text-timber-teal focus:ring-timber-teal"
                  />
                  <span>Show hidden products</span>
                </label>

                <Link
                  href="/admin/gallery"
                  className="px-4 py-2.5 bg-white text-timber-teal border border-timber-teal/30 rounded-xl hover:bg-timber-teal/5 transition text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0"
                >
                  <Images size={15} />
                  <span>Gallery Management</span>
                </Link>

                <button
                  onClick={() => { setEditing(null); setModalOpen(true); }}
                  className="px-4 py-2.5 bg-timber-teal text-white rounded-xl hover:bg-timber-darkwood transition text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {allCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => { setSelectedCategory(category); setPage(1); }}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    selectedCategory === category
                      ? "bg-timber-teal text-white shadow-xs font-semibold"
                      : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-serif font-bold text-timber-darkwood">
                  Products ({filtered.length}{filtered.length !== products.length ? ` of ${products.length}` : ""})
                </h2>
                <span className="text-xs text-gray-500">
                  Showing page {safePage} of {totalPages}
                </span>
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
                    <thead className="bg-gray-50/80">
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
                            <div className="relative w-16 h-16 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
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
                            <div className="font-semibold text-gray-900 text-sm">{project.name}</div>
                            <div className="text-xs text-gray-500 mt-1 max-w-xs line-clamp-2">{project.description}</div>
                          </td>
                          <td className="py-4 px-6">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 uppercase tracking-wider">
                              {project.category}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-semibold text-gray-900 text-sm">
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
                          <td className="py-4 px-6 text-right whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => { setEditing(project); setModalOpen(true); }}
                              className="text-timber-teal hover:underline mr-4 cursor-pointer"
                            >
                              Edit
                            </button>
                            {!project.isActive ? (
                              <button onClick={() => restore(project)} className="text-green-700 hover:underline mr-4 cursor-pointer">
                                Restore
                              </button>
                            ) : (
                              <button onClick={() => softDelete(project)} className="text-amber-700 hover:underline mr-4 cursor-pointer">
                                Hide
                              </button>
                            )}
                            <button onClick={() => hardDelete(project)} className="text-red-600 hover:underline cursor-pointer">
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
                    className="px-3 py-1 border rounded disabled:opacity-30 cursor-pointer"
                  >
                    Prev
                  </button>
                  <span aria-live="polite">Page {safePage} of {totalPages}</span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="px-3 py-1 border rounded disabled:opacity-30 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Inquiries */}
        {activeTab === "inquiries" && (
          <InquiriesSection
            notify={notify}
            user={user}
            onCountsChange={(total, newCount) => setInquiriesStats({ total, newCount })}
          />
        )}

        {/* TAB 4: Maintenance & Developer Operations */}
        {activeTab === "maintenance" && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-xs border border-gray-100 space-y-6">
            <div>
              <h2 className="text-xl font-serif font-bold text-timber-darkwood mb-2">
                System &amp; Database Maintenance
              </h2>
              <p className="text-gray-600 text-sm max-w-2xl leading-relaxed">
                These utilities directly interact with the live Firebase Realtime Database under <code>/projects</code>.
                Use these tools only when seeding initial catalog data or restoring snapshots.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold">Caution when modifying database seed states:</p>
                <p>
                  Bulk upload will add product rows. Deleting all products will remove all catalog items from the customer storefront.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={uploadBoutiqueProducts}
                disabled={!!uploadProgress}
                className="px-6 py-3 bg-timber-teal text-white rounded-xl hover:bg-timber-darkwood transition font-semibold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs"
              >
                <UploadCloud size={16} />
                <span>{uploadProgress ? `Converting ${uploadProgress.current}/${uploadProgress.total}…` : "Upload 16 Products (base64)"}</span>
              </button>

              <button
                onClick={pushSeeds}
                disabled={!!uploadProgress}
                className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-xl hover:bg-gray-200 transition font-semibold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw size={16} />
                <span>Restore Products from Backup</span>
              </button>

              <button
                onClick={clearAllProducts}
                disabled={!!uploadProgress}
                className="px-6 py-3 bg-red-700 text-white rounded-xl hover:bg-red-800 transition font-semibold text-xs uppercase tracking-wider flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Trash2 size={16} />
                <span>Delete All Products from Firebase</span>
              </button>
            </div>

            {uploadProgress && (
              <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200">
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
        )}
      </div>
    </div>
  );
}
