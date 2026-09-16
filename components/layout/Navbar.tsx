"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Menu, X, Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import Image from "next/image";

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Categories", href: "/categories" },
    { name: "Projects", href: "/projects" },
    { name: "About", href: "/about" },
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
        <div className="flex items-center space-x-5 text-timber-darkwood">
          <button aria-label="Search" className="hover:text-timber-teal transition-colors interactive">
            <Search size={20} strokeWidth={1.5} />
          </button>
          <Link href="/wishlist" aria-label="Wishlist" className="hover:text-timber-teal transition-colors interactive hidden sm:block">
            <Heart size={20} strokeWidth={1.5} />
          </Link>
          <button aria-label="Cart" className="hover:text-timber-teal transition-colors relative interactive">
            <ShoppingBag size={20} strokeWidth={1.5} />
            <span className="absolute -top-1 -right-1.5 bg-timber-teal text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              0
            </span>
          </button>
          
          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden ml-2" 
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
          </nav>
        </div>
      )}
    </header>
  );
}
