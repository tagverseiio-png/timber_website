import type { Metadata } from "next";
import { canonical } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy and data practices for Timber, House of Exclusive.",
  alternates: { canonical: canonical("/privacy") },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="bg-timber-beige min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto bg-white/80 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 md:p-14 shadow-sm text-timber-darkwood">
        <h1 className="font-serif text-3xl md:text-5xl mb-4">Privacy Policy</h1>
        <p className="text-sm text-timber-muted mb-8">
          Last updated: November 2026 · Compliant with the Information Technology Act 2000 &amp; DPDP Guidelines
        </p>

        <div className="space-y-8 leading-relaxed text-sm md:text-base">
          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">1. Introduction</h2>
            <p className="text-timber-darkwood/80">
              Timber, House of Exclusive (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates the website{" "}
              <strong>timberteak.com</strong>. We respect your privacy and are committed to protecting the personal data
              you share with us. This Privacy Policy describes how we collect, use, store, and disclose your personal
              information when you visit our showroom or order handcrafted furniture through our online storefront.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">2. Information We Collect</h2>
            <p className="text-timber-darkwood/80 mb-3">We collect information strictly necessary to fulfill your orders and inquiries:</p>
            <ul className="list-disc pl-5 space-y-2 text-timber-darkwood/80">
              <li>
                <strong>Contact Information:</strong> Name, phone number, email address, and delivery/billing address.
              </li>
              <li>
                <strong>Order &amp; Transaction Details:</strong> Products purchased, parcel dimensions/weight, order amounts, and payment status.
              </li>
              <li>
                <strong>Customer Inquiries:</strong> Inquiries submitted through our contact form, custom commission briefs, and email correspondence.
              </li>
              <li>
                <strong>Device &amp; Usage Information:</strong> Anonymized interaction logs and device screen width strictly for responsive layout rendering.
              </li>
            </ul>
            <p className="text-timber-darkwood/80 mt-3 font-medium">
              We do NOT store credit card numbers, CVVs, or net banking credentials on our servers. All digital payments
              are securely processed by RBI-licensed payment aggregators (Razorpay).
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-2 text-timber-darkwood/80">
              <li>Processing and confirming your furniture orders.</li>
              <li>Coordinating door-step delivery and surface logistics via certified shipping partners (e.g. Shiprocket).</li>
              <li>Sending automated order receipts, shipping notifications, and tracking numbers.</li>
              <li>Responding to custom woodwork inquiries, showroom appointment requests, and after-sales support.</li>
              <li>Preventing fraudulent orders and complying with statutory tax obligations (GST).</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">4. Third-Party Service Providers</h2>
            <p className="text-timber-darkwood/80 mb-3">
              We share data with trusted third parties strictly to deliver our services:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-timber-darkwood/80">
              <li>
                <strong>Payment Processing:</strong> Razorpay Software Private Limited processes payments in compliance with PCI-DSS standards.
              </li>
              <li>
                <strong>Shipping &amp; Logistics:</strong> Shiprocket (BigFoot Retail Solutions Pvt. Ltd.) receives delivery addresses and contact numbers to manage parcel transit.
              </li>
              <li>
                <strong>Database &amp; Hosting:</strong> Google Cloud / Firebase provides secure real-time data storage adhering to ISO 27001 standards.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">5. Cookies and Tracking</h2>
            <p className="text-timber-darkwood/80">
              We do not use invasive tracking pixels, cross-site profiling, or third-party advertising cookies. We only
              use essential local storage and session cookies necessary to maintain your shopping cart state and guest authentication.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">6. Your Rights</h2>
            <p className="text-timber-darkwood/80 mb-3">
              Under applicable Indian data privacy regulations, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-timber-darkwood/80">
              <li>Request access to the personal data we hold about you.</li>
              <li>Request correction of inaccurate or outdated information.</li>
              <li>Request deletion of your data, subject to statutory record-retention requirements for GST tax compliance.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-xl md:text-2xl mb-3 text-timber-darkwood">7. Grievance Officer &amp; Contact</h2>
            <p className="text-timber-darkwood/80 mb-3">
              In accordance with the Information Technology Act 2000 and the Consumer Protection (E-Commerce) Rules 2020,
              the details of the Grievance Officer are provided below:
            </p>
            <div className="bg-timber-beige/40 p-5 rounded-lg border border-timber-darkwood/10 text-sm">
              <p><strong>Grievance Officer:</strong> V. Saravanan / Customer Support</p>
              <p><strong>Entity Name:</strong> Timber, House of Exclusive</p>
              <p>
                <strong>Address:</strong> 7/1, Basement, Kodambakkam High Rd, below Kumarakom Restaurant,
                Tirumurthy Nagar, Nungambakkam, Chennai, Tamil Nadu 600034, India
              </p>
              <p><strong>Email:</strong> <a href="mailto:viking@timberteak.com" className="underline font-medium">viking@timberteak.com</a></p>
              <p><strong>Phone:</strong> +91 99620 04546 / 044 2833 0440</p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

