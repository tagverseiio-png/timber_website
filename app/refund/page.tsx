import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Refund, Return & Shipping Policy",
  description: "Shipping timelines, order cancellation, returns, and refund policy for Timber furniture.",
  alternates: { canonical: canonical("/refund") },
};

export default function RefundPolicyPage() {
  return (
    <main className="bg-timber-beige min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 md:p-14 shadow-sm text-timber-darkwood">
        <h1 className="font-serif text-3xl md:text-5xl mb-4">Refund, Return &amp; Shipping Policy</h1>
        <p className="text-sm text-timber-muted mb-8">
          Clear, transparent policies for handcrafted solid wood furniture · Last updated: November 2026
        </p>

        <div className="space-y-8 leading-relaxed text-sm md:text-base">
          {/* Shipping Policy */}
          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">1. Shipping &amp; Delivery</h2>
            <div className="space-y-3 text-timber-darkwood/80">
              <p>
                Because solid timber furniture is heavy and precious, we ship via specialized surface logistics partners
                (including Shiprocket surface courier networks) with custom multi-layer wood crating and bubble protection.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Dispatch Timeline:</strong> Ready-to-ship catalog items are dispatched within <strong>3 to 7 business days</strong>.
                  Custom commissions have bespoke production lead times as agreed in writing.
                </li>
                <li>
                  <strong>Transit Time:</strong> Deliveries within South India typically take <strong>3 to 5 business days</strong>;
                  other pan-India metros take <strong>5 to 9 business days</strong> after dispatch.
                </li>
                <li>
                  <strong>Tracking:</strong> Once dispatched, a live tracking link with the Air Waybill (AWB) number
                  and assigned courier name is sent to your registered email and mobile number.
                </li>
                <li>
                  <strong>Shipping Charges:</strong> Freight costs are computed at checkout based on actual parcel weight
                  and destination PIN code, using pre-negotiated direct surface courier rates.
                </li>
              </ul>
            </div>
          </section>

          {/* Cancellation Policy */}
          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">2. Order Cancellations</h2>
            <div className="space-y-3 text-timber-darkwood/80">
              <p>
                You may request an order cancellation within <strong>24 hours of placing the order</strong>, or anytime
                prior to the order being crated and assigned an Air Waybill (AWB) for dispatch.
              </p>
              <p>
                To request cancellation, email <a href="mailto:viking@timberteak.com" className="underline font-medium">viking@timberteak.com</a> or
                call +91 99620 04546 with your Order ID.
              </p>
              <p>
                Once an order has been picked up by the logistics carrier, it cannot be canceled in transit.
              </p>
            </div>
          </section>

          {/* Returns & Replacements */}
          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">3. Transit Damage &amp; Returns</h2>
            <div className="space-y-3 text-timber-darkwood/80">
              <p>
                Every solid wood furniture unit is thoroughly inspected and packaged with rigorous quality standards before
                leaving our workshop. We honor replacements or refunds under the following conditions:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Transit Damage:</strong> If the packaging arrives visibly compromised, please photograph the damage
                  and make a note on the delivery receipt with the courier. Notify us within <strong>48 hours of delivery</strong> with
                  photos or unboxing video.
                </li>
                <li>
                  <strong>Manufacturing Defect or Incorrect Item:</strong> If the received piece has a structural manufacturing defect
                  or does not match the ordered specifications, we will arrange a reverse pickup and provide a replacement or full refund.
                </li>
                <li>
                  <strong>Non-Returnable Items:</strong> Made-to-order bespoke furniture custom-built to customer dimensions or custom
                  stain specifications cannot be returned unless damaged during transit.
                </li>
              </ul>
            </div>
          </section>

          {/* Refund Process */}
          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">4. Refund Method &amp; Timeline</h2>
            <div className="space-y-3 text-timber-darkwood/80">
              <p>
                Upon receipt and verification of the returned item at our Chennai facility (or upon approval of a pre-dispatch
                cancellation), refunds are initiated directly through our payment partner Razorpay.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong>Original Payment Mode:</strong> Refunds are credited strictly to the original bank account, debit/credit
                  card, or UPI ID used during checkout.
                </li>
                <li>
                  <strong>Timeline:</strong> Once processed by our team, funds typically reflect in your bank account
                  within <strong>5 to 7 business days</strong>, depending on your card issuer / bank cycle.
                </li>
              </ul>
            </div>
          </section>

          {/* Contact Support */}
          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">5. Support &amp; Assistance</h2>
            <div className="bg-timber-beige/40 p-5 rounded-lg border border-timber-darkwood/10 text-sm">
              <p><strong>Timber, House of Exclusive — Customer Support</strong></p>
              <p>7/1, Basement, Kodambakkam High Rd, Tirumurthy Nagar, Nungambakkam, Chennai 600034</p>
              <p>Email: <a href="mailto:viking@timberteak.com" className="underline font-medium">viking@timberteak.com</a></p>
              <p>Phone: +91 99620 04546 / 044 2833 0440 (Monday–Saturday 10 AM – 8:30 PM IST)</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

