"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Images, Package, LogOut } from "lucide-react";

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
 * Gallery Management, matching the Timber admin dashboard design.
 */
export function AdminHeader({ title, subtitle, userEmail, onLogout }: AdminHeaderProps) {
  const pathname = usePathname();

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl text-timber-darkwood">{title}</h1>
          <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
        </div>
        <div className="flex items-center gap-4 self-start sm:self-auto">
          {userEmail && <span className="text-sm font-medium text-gray-700">{userEmail}</span>}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
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
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition ${
                isActive
                  ? "bg-timber-darkwood text-timber-beige shadow-sm"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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

