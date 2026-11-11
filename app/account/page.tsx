"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  getCustomerProfile,
  updateCustomerProfile,
  subscribeToCustomerOrders,
  signOutCustomer,
  type CustomerOrder,
} from "@/lib/auth/customerAuth";
import { formatPrice } from "@/lib/money";
import Link from "next/link";
import Image from "next/image";
import {
  Package,
  User as UserIcon,
  LogOut,
  MapPin,
  Truck,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertCircle,
  Save,
  ShoppingBag,
} from "lucide-react";

export default function CustomerAccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "profile">("orders");
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile Form state
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [pincode, setPincode] = useState("");

  useEffect(() => {
    let unsubOrders: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser || currentUser.isAnonymous) {
        router.replace("/account/login?redirect=/account");
        return;
      }

      setUser(currentUser);
      setName(currentUser.displayName || "");

      // Load Profile & Subscribe to live Orders
      try {
        const userProfile = await getCustomerProfile(currentUser.uid);
        if (userProfile) {
          if (userProfile.name) setName(userProfile.name);
          if (userProfile.phone) setPhone(userProfile.phone);
          if (userProfile.address) {
            setLine1(userProfile.address.line1 || "");
            setLine2(userProfile.address.line2 || "");
            setCity(userProfile.address.city || "");
            setState(userProfile.address.state || "");
            setPincode(userProfile.address.pincode || "");
          }
        }

        // Live real-time orders subscription
        unsubOrders?.();
        unsubOrders = subscribeToCustomerOrders(currentUser.uid, (liveOrders) => {
          setOrders(liveOrders);
          setLoading(false);
        });
      } catch (err) {
        console.error("Error loading account data:", err);
        setLoading(false);
      }
    });

    return () => {
      unsubAuth();
      unsubOrders?.();
    };
  }, [router]);

  const handleSignOut = async () => {
    await signOutCustomer();
    router.replace("/");
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await updateCustomerProfile(user.uid, {
        name: name.trim(),
        phone: phone.trim(),
        address: {
          line1: line1.trim(),
          line2: line2.trim(),
          city: city.trim(),
          state: state.trim(),
          pincode: pincode.trim(),
        },
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile changes.");
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusBadge = (status: CustomerOrder["status"]) => {
    switch (status) {
      case "paid":
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-full">Paid &amp; Confirmed</span>;
      case "processing":
        return <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-semibold rounded-full">Processing</span>;
      case "shipped":
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">Shipped</span>;
      case "out_for_delivery":
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">Out for Delivery</span>;
      case "delivered":
        return <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">Delivered</span>;
      case "cancelled":
        return <span className="px-3 py-1 bg-rose-100 text-rose-800 text-xs font-semibold rounded-full">Cancelled</span>;
      case "out_of_stock":
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">Out of Stock</span>;
      case "refunded":
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full">Refunded</span>;
      case "failed":
        return <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">Payment Failed</span>;
      case "pending":
      default:
        return <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">Payment Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-timber-beige flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-timber-teal border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="bg-timber-beige min-h-screen pt-24 pb-32 px-6 md:px-12">
      <div className="container mx-auto max-w-5xl">
        {/* Profile Card Header */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-timber-darkwood/10 mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-6">
          <div className="flex items-center gap-4">
            {user.photoURL ? (
              <Image
                src={user.photoURL}
                alt={name || "User"}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover shrink-0 border-2 border-timber-teal/20"
                unoptimized
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-timber-teal text-white flex items-center justify-center font-serif text-2xl font-bold shrink-0">
                {name ? name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl text-timber-darkwood font-bold">
                {name || "Customer"}
              </h1>
              <p className="text-timber-muted text-sm">{user.email}</p>
              {phone && <p className="text-timber-muted text-xs mt-0.5">{phone}</p>}
            </div>
          </div>

          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-timber-darkwood/20 text-timber-darkwood text-xs font-semibold uppercase tracking-wider hover:bg-timber-darkwood/5 transition self-start sm:self-auto"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 border-b border-timber-darkwood/10 mb-8">
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-4 px-4 font-serif text-base sm:text-lg flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "orders"
                ? "border-timber-teal text-timber-teal font-bold"
                : "border-transparent text-timber-muted hover:text-timber-darkwood"
            }`}
          >
            <Package size={18} />
            <span>My Orders &amp; Tracking</span>
            {orders.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-timber-teal/10 text-timber-teal font-sans font-bold">
                {orders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-4 px-4 font-serif text-base sm:text-lg flex items-center gap-2 border-b-2 transition-all ${
              activeTab === "profile"
                ? "border-timber-teal text-timber-teal font-bold"
                : "border-transparent text-timber-muted hover:text-timber-darkwood"
            }`}
          >
            <UserIcon size={18} />
            <span>Profile &amp; Addresses</span>
          </button>
        </div>

        {/* TAB 1: My Orders */}
        {activeTab === "orders" && (
          <div className="space-y-6">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-timber-darkwood/10">
                <div className="w-16 h-16 bg-timber-teal/10 text-timber-teal rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package size={28} />
                </div>
                <h2 className="font-serif text-2xl text-timber-darkwood mb-2">No orders placed yet</h2>
                <p className="text-timber-muted text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  When you purchase solid timber furniture through our storefront, your order tracking, live AWB, and receipts will appear right here.
                </p>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 px-8 py-3 bg-timber-darkwood text-timber-beige rounded-full text-xs font-semibold uppercase tracking-widest hover:bg-timber-teal transition"
                >
                  <ShoppingBag size={14} />
                  <span>Browse Collections</span>
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const awb = order.shiprocket?.awb;
                const courier = order.shiprocket?.courier || order.shiprocket?.courierName;
                const trackingUrl =
                  order.shiprocket?.trackingUrl ||
                  order.shiprocket?.tracking_url ||
                  (awb ? `https://shiprocket.co/tracking/${encodeURIComponent(awb.trim())}` : null);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-timber-darkwood/10"
                  >
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-timber-darkwood/10">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-serif text-lg font-bold text-timber-darkwood">
                            Order #{order.receipt || order.id.slice(0, 12)}
                          </span>
                          {getStatusBadge(order.status)}
                        </div>
                        <p className="text-xs text-timber-muted flex items-center gap-1.5">
                          <Clock size={12} />
                          <span>Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}</span>
                        </p>
                      </div>

                      <div className="text-left sm:text-right">
                        <span className="text-xs text-timber-muted block">Total Paid</span>
                        <span className="font-serif text-xl font-bold text-timber-darkwood">
                          {formatPrice(order.amountPaise)}
                        </span>
                      </div>
                    </div>

                    {/* Live Shipment Tracking Card */}
                    {awb ? (
                      <div className="my-6 p-4 sm:p-5 rounded-2xl bg-timber-beige/40 border border-timber-teal/20 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-timber-teal text-white flex items-center justify-center shrink-0">
                            <Truck size={18} />
                          </div>
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-timber-teal block">
                              Shipment in Transit
                            </span>
                            <p className="text-sm font-medium text-timber-darkwood">
                              {courier ? `${courier} · ` : ""}AWB: <span className="font-mono font-semibold">{awb}</span>
                            </p>
                          </div>
                        </div>

                        {trackingUrl && (
                          <a
                            href={trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-timber-teal text-white text-xs font-semibold uppercase tracking-wider rounded-full hover:bg-timber-darkwood transition shrink-0 shadow-sm"
                          >
                            <span>Track on Shiprocket</span>
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    ) : order.status === "cancelled" ? (
                      <div className="my-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 text-rose-600 mt-0.5" />
                        <div>
                          <p className="font-semibold">Order Cancelled</p>
                          <p className="text-rose-700 mt-0.5">
                            {order.adminNotes || "This order was cancelled. If you need any assistance or have questions, please reach out to our concierge."}
                          </p>
                        </div>
                      </div>
                    ) : order.status === "out_of_stock" ? (
                      <div className="my-4 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 text-amber-700 mt-0.5" />
                        <div>
                          <p className="font-semibold">Item Seasoning / Out of Stock</p>
                          <p className="text-amber-800 mt-0.5">
                            {order.adminNotes || "This piece is temporarily undergoing timber seasoning in our workshop. Our team is actively crafting your unit and will reach out with shipping details."}
                          </p>
                        </div>
                      </div>
                    ) : order.status === "refunded" ? (
                      <div className="my-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-900 text-xs flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="shrink-0 text-yellow-700 mt-0.5" />
                        <div>
                          <p className="font-semibold">Refund Processed</p>
                          <p className="text-yellow-800 mt-0.5">
                            {order.adminNotes || "A refund has been issued for this order. It will reflect back in your original payment account within 3-5 business days."}
                          </p>
                        </div>
                      </div>
                    ) : order.status === "failed" ? (
                      <div className="my-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
                        <AlertCircle size={16} className="shrink-0 text-red-600 mt-0.5" />
                        <div>
                          <p className="font-semibold">Payment Failed</p>
                          <p className="text-red-700 mt-0.5">
                            {order.adminNotes || "Payment for this order was not completed. If any funds were deducted, your issuing bank will automatically credit them back within 3-5 business days."}
                          </p>
                        </div>
                      </div>
                    ) : order.status === "paid" || order.status === "processing" ? (
                      <div className="my-4 p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2">
                        <Clock size={15} className="shrink-0 text-emerald-600" />
                        <span>Order confirmed. Our master craftsmen are preparing your solid wood furniture for crating and courier pickup.</span>
                      </div>
                    ) : null}

                    {/* Ordered Items */}
                    <div className="py-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-timber-muted mb-3">
                        Items in this Order
                      </h3>
                      <div className="divide-y divide-timber-darkwood/5">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="py-3 flex justify-between items-center text-sm">
                            <div>
                              <p className="font-medium text-timber-darkwood">{item.name}</p>
                              <p className="text-xs text-timber-muted">Qty: {item.qty}</p>
                            </div>
                            <span className="font-serif font-medium text-timber-darkwood">
                              {formatPrice(item.pricePaise * item.qty)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address */}
                    {order.address && (
                      <div className="pt-4 border-t border-timber-darkwood/10 text-xs text-timber-muted flex items-start gap-2">
                        <MapPin size={14} className="shrink-0 text-timber-teal mt-0.5" />
                        <span>
                          Delivering to: <strong className="text-timber-darkwood">{order.customer?.name}</strong>,{" "}
                          {order.address.line1}
                          {order.address.line2 ? `, ${order.address.line2}` : ""}, {order.address.city},{" "}
                          {order.address.state} - {order.address.pincode}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: Profile & Saved Address */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-sm border border-timber-darkwood/10">
            <h2 className="font-serif text-2xl text-timber-darkwood mb-2 font-bold">Personal Profile</h2>
            <p className="text-timber-muted text-sm mb-8">
              Update your contact details and default shipping address for faster checkout.
            </p>

            {saveSuccess && (
              <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Profile and shipping address updated successfully!</span>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle size={16} className="text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 text-timber-darkwood text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email || ""}
                    className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/10 bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 99620 04546"
                  className="w-full sm:w-1/2 px-4 py-3 rounded-xl border border-timber-darkwood/15 text-timber-darkwood text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal"
                />
              </div>

              <div className="pt-6 border-t border-timber-darkwood/10">
                <h3 className="font-serif text-lg text-timber-darkwood font-semibold mb-4">
                  Default Shipping Address
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-1.5">
                      House / Flat / Street Address
                    </label>
                    <input
                      type="text"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="e.g. 7/1, Kodambakkam High Rd"
                      className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 text-timber-darkwood text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-1.5">
                      Apartment, Landmark, Suite (Optional)
                    </label>
                    <input
                      type="text"
                      value={line2}
                      onChange={(e) => setLine2(e.target.value)}
                      placeholder="e.g. Near Kumarakom Restaurant, Tirumurthy Nagar"
                      className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 text-timber-darkwood text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-1.5">
                        City
                      </label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Chennai"
                        className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 text-timber-darkwood text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-1.5">
                        State
                      </label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="Tamil Nadu"
                        className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 text-timber-darkwood text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-1.5">
                        Postal PIN Code
                      </label>
                      <input
                        type="text"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="600034"
                        className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 text-timber-darkwood text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-8 py-3.5 bg-timber-teal text-white rounded-xl text-xs font-semibold uppercase tracking-widest hover:bg-timber-darkwood transition flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {savingProfile ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
