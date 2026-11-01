import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms and conditions governing the purchase of solid wood furniture from Timber, House of Exclusive.",
  alternates: { canonical: canonical("/terms") },
};

export default function TermsOfServicePage() {
  return (
    <main className="bg-timber-beige min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 md:p-14 shadow-sm text-timber-darkwood">
        <h1 className="font-serif text-3xl md:text-5xl mb-4">Terms of Service</h1>
        <p className="text-sm text-timber-muted mb-8">
          Last updated: November 2026 · Governed by the laws of India
        </p>

        <div className="space-y-8 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">1. Agreement to Terms</h2>
            <p className="text-timber-darkwood/80">
              These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you and{" "}
              <strong>Timber, House of Exclusive</strong> (&ldquo;Timber&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;). By accessing
              our website (timberteak.com) or purchasing products, you agree to be bound by these Terms and our related
              policies.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">2. Solid Wood Characteristics &amp; Handcrafting</h2>
            <p className="text-timber-darkwood/80 mb-3">
              Every Timber product is handcrafted from authentic solid wood (such as plantation teak, solid oak, or mahogany).
              As natural organic timber:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-timber-darkwood/80">
              <li>
                Natural grain variations, wood knots, slight mineral streaks, and subtle color gradations are intrinsic characteristics
                of solid wood, celebrating its authentic provenance. They are not defects.
              </li>
              <li>
                Because each piece is individually crafted and hand-finished by master carpenters, minute dimensional variations
                (within standard furniture manufacturing tolerances of &plusmn;1&ndash;2 cm) may occur.
              </li>
              <li>
                Solid wood breathes and responds naturally to ambient relative humidity and temperature. Minor seasonal expansion
                or contraction is normal for natural timber.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">3. Pricing &amp; Payments</h2>
            <ul className="list-disc pl-5 space-y-2 text-timber-darkwood/80">
              <li>All prices are quoted in Indian Rupees (INR, ₹) and include applicable Goods and Services Tax (GST).</li>
              <li>
                Shipping and freight costs are computed based on parcel weight, volumetric dimensions, and destination postal code,
                and are transparently itemized prior to payment checkout.
              </li>
              <li>
                Payments are processed securely via our payment partner Razorpay. An order is confirmed only upon successful
                payment authorization and receipt generation.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">4. Order Fulfillment &amp; Delivery</h2>
            <ul className="list-disc pl-5 space-y-2 text-timber-darkwood/80">
              <li>
                In-stock items are typically dispatched within 3–7 business days. Custom-built or made-to-order bespoke commissions
                require craft lead times as communicated during order confirmation.
              </li>
              <li>
                Deliveries are executed by specialized surface logistics carriers. Deliveries are typically scheduled to the
                ground-floor or doorstep accessible by standard elevator or stairwell.
              </li>
              <li>
                Customers are requested to inspect the exterior crating upon delivery. In the rare event of transit damage,
                the delivery receipt must be endorsed and our customer team notified within 48 hours.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">5. Intellectual Property</h2>
            <p className="text-timber-darkwood/80">
              All website content, photographs, furniture designs, brand marks, and digital assets are the intellectual
              property of Timber, House of Exclusive and protected under Indian copyright and trademark law. Unauthorized
              reproduction is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">6. Governing Law &amp; Jurisdiction</h2>
            <p className="text-timber-darkwood/80">
              These Terms and any purchase transactions are governed by the laws of the Republic of India. Any disputes
              arising out of or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent
              courts in Chennai, Tamil Nadu, India.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">7. Showroom &amp; Support Contact</h2>
            <div className="bg-timber-beige/40 p-5 rounded-lg border border-timber-darkwood/10 text-sm">
              <p><strong>Timber, House of Exclusive</strong></p>
              <p>7/1, Basement, Kodambakkam High Rd, Tirumurthy Nagar, Nungambakkam, Chennai 600034, India</p>
              <p>Phone: +91 99620 04546 / 044 2833 0440 · Email: viking@timberteak.com</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

