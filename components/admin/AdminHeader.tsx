"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Images, LogOut, Package, ShieldCheck } from "lucide-react";

interface AdminHeaderProps {
  title: string;
  subtitle: string;
  userEmail: string | null;
  onLogout: () => void;
}

const ADMIN_TABS = [
  { label: "Product Management", href: "/admin", icon: Package },
  { label: "Gallery Management", href: "/admin/gallery", icon: Images },
] as const;

/**
 * Shared admin header with section navigation between Product Management and
 * Gallery Management, matching the Executive Admin Console design.
 */
export function AdminHeader({ title, subtitle, userEmail, onLogout }: AdminHeaderProps) {
  const pathname = usePathname();

  return (
    <div className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 mb-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Image
              src="/images/logo-transparent.png"
              alt="Timber Logo"
              width={120}
              height={38}
              className="object-contain"
              priority
            />
            <span className="text-[11px] uppercase tracking-widest font-semibold px-2.5 py-1 bg-timber-teal/10 text-timber-teal rounded-full">
              {title}
            </span>
          </div>
          <p className="text-gray-500 text-xs mt-1">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition"
          >
            <span>View Storefront</span>
            <ExternalLink size={13} />
          </Link>

          {userEmail && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200/60 rounded-xl text-xs text-emerald-800">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span className="font-medium max-w-[170px] truncate">{userEmail}</span>
            </div>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition"
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <nav
        aria-label="Admin sections"
        className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-3"
      >
        {ADMIN_TABS.map(({ label, href, icon: Icon }) => {
          const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition ${
                isActive
                  ? "bg-timber-teal text-white shadow-xs"
                  : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
