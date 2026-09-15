import Link from "next/link";
import { ArrowRight, Globe, MessageCircle, Hash } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-timber-teal text-timber-beige pt-20 pb-10">
      <div className="container mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="font-serif text-3xl tracking-wide font-bold mb-6 block text-white">
              TIMBER.
            </Link>
            <p className="text-timber-beige/80 mb-6 text-sm leading-relaxed">
              Crafted by nature. Designed for life. We create premium timber furniture that transforms houses into homes, built to last generations.
            </p>
            <div className="flex space-x-4">
              <a href="#" aria-label="Instagram" className="w-10 h-10 rounded-full border border-timber-beige/20 flex items-center justify-center hover:bg-timber-beige hover:text-timber-teal transition-all interactive">
                <Globe size={18} />
              </a>
              <a href="#" aria-label="Facebook" className="w-10 h-10 rounded-full border border-timber-beige/20 flex items-center justify-center hover:bg-timber-beige hover:text-timber-teal transition-all interactive">
                <MessageCircle size={18} />
              </a>
              <a href="#" aria-label="Twitter" className="w-10 h-10 rounded-full border border-timber-beige/20 flex items-center justify-center hover:bg-timber-beige hover:text-timber-teal transition-all interactive">
                <Hash size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg text-white mb-6">Shop</h4>
            <ul className="space-y-3 text-sm text-timber-beige/80">
              <li><Link href="/categories/tables" className="hover:text-white transition-colors interactive">Dining Tables</Link></li>
              <li><Link href="/categories/chairs" className="hover:text-white transition-colors interactive">Chairs & Seating</Link></li>
              <li><Link href="/categories/beds" className="hover:text-white transition-colors interactive">Bedroom Furniture</Link></li>
              <li><Link href="/categories/cabinets" className="hover:text-white transition-colors interactive">Storage & Cabinets</Link></li>
              <li><Link href="/categories/outdoor" className="hover:text-white transition-colors interactive">Outdoor Wood</Link></li>
              <li><Link href="/shop" className="hover:text-white transition-colors interactive">View All Products</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-serif text-lg text-white mb-6">Company</h4>
            <ul className="space-y-3 text-sm text-timber-beige/80">
              <li><Link href="/about" className="hover:text-white transition-colors interactive">Our Story</Link></li>
              <li><Link href="/projects" className="hover:text-white transition-colors interactive">Projects & Gallery</Link></li>
              <li><Link href="/sustainability" className="hover:text-white transition-colors interactive">Sustainability</Link></li>
              <li><Link href="/care" className="hover:text-white transition-colors interactive">Wood Care Guide</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors interactive">Contact Us</Link></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-serif text-lg text-white mb-6">Join Our Newsletter</h4>
            <p className="text-timber-beige/80 mb-4 text-sm">
              Subscribe for early access to new collections and exclusive offers.
            </p>
            <form className="flex border-b border-timber-beige/30 pb-2 relative group">
              <input 
                type="email" 
                placeholder="Email Address" 
                className="bg-transparent border-none outline-none text-white placeholder-timber-beige/50 w-full text-sm"
                required
              />
              <button type="submit" aria-label="Subscribe" className="text-white group-hover:text-timber-beige transition-colors interactive">
                <ArrowRight size={20} />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-timber-beige/10 flex flex-col md:flex-row justify-between items-center text-xs text-timber-beige/60">
          <p>&copy; {new Date().getFullYear()} Timber Furniture Co. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-white transition-colors interactive">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white transition-colors interactive">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
