"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Menu, X, Heart, User as UserIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.count());
  const wishlistCount = useWishlistStore((s) => s.count());

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      // Don't treat anonymous guests as signed-in customer accounts
      if (currentUser && !currentUser.isAnonymous) {
        setUser(currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Gallery", href: "/projects" },
    { name: "Shop", href: "/shop" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ease-in-out ${
        isScrolled ? "bg-timber-beige/95 backdrop-blur-md shadow-sm py-4" : "bg-transparent py-6"
      }`}
    >
      <div className="container mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image 
            src="/images/logo-transparent.png" 
            alt="Timber Logo" 
            width={140} 
            height={50} 
            className="object-contain" 
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-sm tracking-wide uppercase transition-colors hover:text-timber-teal ${
                pathname === link.href ? "text-timber-teal font-medium" : "text-timber-darkwood/80"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Icons */}
        <div className="flex items-center space-x-3 sm:space-x-4 text-timber-darkwood">
          <Link href="/shop" aria-label="Search Catalog" className="hover:text-timber-teal transition-colors interactive p-1">
            <Search size={20} strokeWidth={1.5} />
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist" aria-label="Wishlist" className="hover:text-timber-teal transition-colors relative interactive hidden sm:block p-1">
            <Heart size={20} strokeWidth={1.5} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-timber-teal text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            )}
          </Link>

          {/* Customer Profile / Sign In Pill */}
          <Link
            href={user ? "/account" : "/account/login"}
            aria-label={user ? "My Profile & Orders" : "Sign In with Google"}
            title={user ? `Profile & Orders (${user.displayName || user.email})` : "Sign In with Google"}
            className="hover:text-timber-teal hover:border-timber-teal border border-timber-darkwood/20 rounded-full px-3 py-1.5 transition-all interactive flex items-center gap-2 bg-timber-beige/50 backdrop-blur-xs"
          >
            <div className="relative flex items-center justify-center">
              {user?.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || "Profile"}
                  width={20}
                  height={20}
                  className="w-5 h-5 rounded-full object-cover border border-timber-darkwood/20"
                  unoptimized
                />
              ) : (
                <UserIcon size={16} strokeWidth={1.75} />
              )}
              {user && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-600 ring-1 ring-white" />
              )}
            </div>
            <span className="text-xs font-semibold tracking-wide uppercase">
              {user ? (user.displayName?.split(" ")[0] || "Profile") : "Sign In"}
            </span>
          </Link>

          {/* Cart */}
          <Link href="/cart" aria-label="Cart" className="hover:text-timber-teal transition-colors relative interactive p-1">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1.5 bg-timber-teal text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden ml-1 p-1" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-timber-beige border-t border-timber-darkwood/10 p-6 shadow-lg">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg tracking-wide text-timber-darkwood border-b border-timber-darkwood/5 pb-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            <Link
              href="/wishlist"
              className="text-lg tracking-wide text-timber-darkwood border-b border-timber-darkwood/5 pb-2 flex justify-between items-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              <span>Wishlist</span>
              {wishlistCount > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 bg-timber-teal text-white rounded-full">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              href={user ? "/account" : "/account/login"}
              className="text-lg tracking-wide text-timber-teal font-semibold pb-2 flex items-center gap-2.5"
              onClick={() => setMobileMenuOpen(false)}
            >
              <UserIcon size={20} />
              <span>{user ? `Profile & Orders (${user.displayName?.split(" ")[0] || "Account"})` : "Sign In with Google (Profile / Orders)"}</span>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
