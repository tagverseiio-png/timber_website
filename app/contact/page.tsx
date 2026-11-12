"use client";

import { useState, FormEvent } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  Send,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  ArrowDown,
} from "lucide-react";
import { auth, database } from "@/lib/firebase";
import { signInAnonymously } from "firebase/auth";
import { ref, push, serverTimestamp } from "firebase/database";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What types of timber products and wooden furniture does Timber offer?",
    answer:
      "We offer a curated range of premium timber products and solid wood furniture, crafted to combine quality craftsmanship, long-lasting durability, and timeless design. From living room pieces to custom wooden furniture, our collection is designed to elevate any interior space. Browse our gallery to explore the full range.",
  },
  {
    question: "How can I enquire about a specific timber furniture product?",
    answer:
      "You can reach us directly through the contact form on this page or via our listed contact details. Simply share the timber product you’re interested in along with any questions, and our team will respond with all the information you need.",
  },
  {
    question: "Does Timber offer customised or made-to-order wooden furniture?",
    answer:
      "Yes, custom timber furniture options can be discussed with our team. Whether you have a specific design, preferred wood type, dimensions, or finish in mind, get in touch and we’ll help you explore what’s possible for your space.",
  },
  {
    question: "How do I choose the right type of timber for my furniture?",
    answer:
      "Choosing the right timber depends on several factors, including your interior style, how the piece will be used, your preferred finish, and your budget. Our team is happy to guide you through the available timber options to help you make the best decision for your home or project.",
  },
  {
    question: "Can I request product dimensions, materials, and specifications?",
    answer:
      "Absolutely. You can enquire about the full specifications of any timber product — including dimensions, wood species, material details, and available finishes — through our contact page. We’re happy to provide all the information you need before making a decision.",
  },
  {
    question: "What wood finishes are available for timber furniture?",
    answer:
      "The right finish can significantly enhance the appearance, texture, and longevity of timber furniture. We offer a variety of wood finish options to suit different aesthetics and functional needs. Contact our team to discuss the finish options available for your selected piece.",
  },
  {
    question: "How do I get a price quotation for timber furniture or products?",
    answer:
      "To receive a price quote, simply share your product requirements, preferred timber type, finish, and quantity through our contact form. Our team will get back to you with detailed pricing and quotation information tailored to your needs.",
  },
  {
    question: "Does Timber accept bulk or large-scale timber furniture orders?",
    answer:
      "Yes, we welcome bulk purchases and large-scale timber requirements for both residential and commercial projects. Please contact our team with the product details, specifications, and required quantity to discuss the best available arrangements.",
  },
  {
    question: "Does Timber provide delivery for furniture and timber products?",
    answer:
      "Delivery availability, charges, and lead times vary depending on the product type and delivery location. Please reach out to our team through the contact page to confirm delivery options and timelines specific to your order.",
  },
  {
    question: "How do I care for and maintain solid timber furniture?",
    answer:
      "To keep your timber furniture looking its best, wipe surfaces regularly with a clean, dry cloth, avoid prolonged exposure to direct sunlight and moisture, and use suitable wood-care or conditioning products periodically. Proper care helps preserve the natural beauty and structural integrity of solid wood furniture for years to come.",
  },
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Bespoke Furniture Commission",
    message: "",
  });
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openFaqs, setOpenFaqs] = useState<number[]>([0]); // First item open initially

  const toggleFaq = (idx: number) => {
    setOpenFaqs((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const allOpen = openFaqs.length === FAQS.length;
  const toggleAllFaqs = () => {
    if (allOpen) {
      setOpenFaqs([]);
    } else {
      setOpenFaqs(FAQS.map((_, i) => i));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Honeypot spam check: if filled, quietly drop without saving
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Require anonymous authentication at minimum to gate bot flood
      const user = auth.currentUser ?? (await signInAnonymously(auth)).user;

      const name = formData.name.trim();
      const email = formData.email.trim();
      const phone = formData.phone.trim();
      const message = formData.message.trim();

      if (name.length < 2) {
        throw new Error("Please enter your full name.");
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error("Please enter a valid email address.");
      }
      if (message.length < 10) {
        throw new Error("Please provide a message with at least 10 characters.");
      }

      await push(ref(database, "inquiries"), {
        name,
        email,
        phone,
        subject: formData.subject,
        message,
        status: "new",
        createdAt: serverTimestamp(),
        uid: user.uid,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send your inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-timber-beige min-h-screen pt-24 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        <ScrollReveal className="text-center mb-12">
          <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">Contact</h1>
        </ScrollReveal>

        {/* Map */}
        <ScrollReveal delay={0.1} className="mb-16">
          <div className="w-full h-[400px] md:h-[480px] overflow-hidden rounded-sm shadow-sm">
            <iframe
              title="Timber House of Exclusive Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d248768.70358116963!2d80.0149666524906!3d13.034971763297335!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a52666a0c771f05%3A0x2f7a673ddd8032e2!2sTimber%20House%20Of%20Exclusive!5e0!3m2!1sen!2sca!4v1753383335648!5m2!1sen!2sca"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </ScrollReveal>

        {/* Address / Timings / Get In Touch / Email */}
        <div className="flex flex-col lg:flex-row gap-16 justify-between">
          {/* Left: Address + Timings */}
          <div className="lg:w-1/2 flex flex-col gap-10">
            <ScrollReveal delay={0.2} direction="right">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-timber-teal text-white rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-timber-darkwood mb-2">Address</h3>
                  <p className="text-timber-muted leading-relaxed">
                    7/1, Basement, Timber House of Exclusive, Kodambakkam High Rd<br />
                    below Kumarakom the Restaurant, Tirumurthy Nagar<br />
                    Nungambakkam, Chennai, Tamil Nadu 600034, India
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3} direction="right">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-timber-teal text-white rounded-full flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-timber-darkwood mb-2">Timings</h3>
                  <p className="text-timber-muted leading-relaxed">
                    Monday–Saturday: 10 AM to 8:30 PM<br />
                    Sunday: 10:30 AM to 6 PM<br />
                    Please call before visiting on public holidays.
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Right: Get In Touch */}
          <div className="lg:w-1/2 flex flex-col gap-10">
            <ScrollReveal delay={0.2} direction="left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-timber-teal text-white rounded-full flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-timber-darkwood mb-2">Get In Touch</h3>
                  <p className="text-timber-muted leading-relaxed">
                    Telephone: 044 2833 0440<br />
                    Mobile: +91 99620 04546
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3} direction="left">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-timber-teal text-white rounded-full flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-timber-darkwood mb-2">Email</h3>
                  <p className="text-timber-muted leading-relaxed">
                    <a href="mailto:viking@timberteak.com" className="hover:text-timber-teal transition-colors">
                      viking@timberteak.com
                    </a>
                  </p>
                  <p className="text-timber-muted mt-2 font-medium">Parking Available</p>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Frequently Asked Questions (FAQ) Section - Placed below the contact context and above the inquiry form */}
        <ScrollReveal delay={0.2} direction="up" className="mt-24 lg:mt-32">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-timber-teal/10 text-timber-teal text-xs uppercase tracking-widest font-semibold mb-3">
                <HelpCircle size={14} />
                Got Questions?
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-timber-darkwood mb-3">
                Frequently Asked Questions
              </h2>
              <p className="text-timber-muted text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                Everything you need to know about our handcrafted solid wood furniture, bespoke custom commissions, timber selection, finishes, and order delivery.
              </p>
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={toggleAllFaqs}
                  className="text-xs uppercase tracking-wider font-semibold text-timber-teal hover:text-timber-darkwood transition-colors underline underline-offset-4"
                >
                  {allOpen ? "Collapse All Questions" : "Expand All Questions"}
                </button>
                <span className="text-timber-muted/40">•</span>
                <a
                  href="#inquiry-form"
                  className="inline-flex items-center gap-1 text-xs uppercase tracking-wider font-semibold text-timber-muted hover:text-timber-darkwood transition-colors"
                >
                  Jump to Inquiry Form <ArrowDown size={12} />
                </a>
              </div>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, index) => {
                const isOpen = openFaqs.includes(index);
                const itemNumber = (index + 1).toString().padStart(2, "0");
                return (
                  <div
                    key={faq.question}
                    className="border border-timber-darkwood/10 rounded-2xl bg-white/70 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-timber-darkwood/25 shadow-xs"
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(index)}
                      aria-expanded={isOpen}
                      className="w-full text-left p-6 sm:p-7 flex items-start justify-between gap-4 transition-colors hover:bg-timber-darkwood/5 cursor-pointer"
                    >
                      <div className="flex items-start gap-4 sm:gap-5">
                        <span className="shrink-0 w-8 h-8 rounded-full bg-timber-teal/10 text-timber-teal text-xs font-bold flex items-center justify-center font-mono mt-0.5">
                          {itemNumber}
                        </span>
                        <h3 className="font-serif text-base sm:text-lg text-timber-darkwood font-medium leading-snug">
                          {faq.question}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 w-7 h-7 rounded-full bg-timber-darkwood/5 text-timber-darkwood flex items-center justify-center transition-transform duration-300 mt-0.5 ${
                          isOpen ? "rotate-180 bg-timber-teal text-white" : ""
                        }`}
                      >
                        <ChevronDown size={16} />
                      </span>
                    </button>
                    {isOpen && (
                      <div className="px-6 sm:px-7 pb-6 sm:pb-7 pt-1 border-t border-timber-darkwood/5 text-timber-muted text-sm sm:text-base leading-relaxed pl-16 sm:pl-20">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Inquiry Form */}
        <ScrollReveal delay={0.2} direction="up" className="mt-20 lg:mt-28">
          <div
            id="inquiry-form"
            className="scroll-mt-28 max-w-3xl mx-auto bg-white/70 backdrop-blur-sm border border-timber-darkwood/10 rounded-3xl p-8 sm:p-12 shadow-sm"
          >
            <div className="text-center mb-8">
              <span className="text-xs uppercase tracking-widest text-timber-teal font-medium mb-2 block">
                Get in Touch
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-timber-darkwood mb-3">
                Send an Inquiry
              </h2>
              <p className="text-timber-muted text-sm md:text-base max-w-lg mx-auto leading-relaxed">
                Have a question about custom woodwork, showroom visits, or order inquiries? Leave us a message and our team will get back to you promptly.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-10 px-4">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-serif text-2xl text-timber-darkwood mb-2">Inquiry Received</h3>
                <p className="text-timber-muted text-sm max-w-md mx-auto mb-6 leading-relaxed">
                  Thank you, <span className="font-medium text-timber-darkwood">{formData.name}</span>. We have received your message and will get back to you within 24 hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({
                      name: "",
                      email: "",
                      phone: "",
                      subject: "Bespoke Furniture Commission",
                      message: "",
                    });
                  }}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-timber-darkwood/20 text-timber-darkwood text-sm font-medium hover:bg-timber-darkwood/5 transition-colors"
                >
                  Send another inquiry
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Anti-spam honeypot - invisible to real humans */}
                <input
                  type="text"
                  name="website"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  className="hidden"
                  aria-hidden="true"
                />

                {error && (
                  <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="inquiry-name" className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-2">
                      Full Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="inquiry-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Jane Doe"
                      className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 bg-white/70 text-timber-darkwood placeholder:text-timber-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="inquiry-email" className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-2">
                      Email Address <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="inquiry-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="e.g. jane@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 bg-white/70 text-timber-darkwood placeholder:text-timber-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal focus:bg-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="inquiry-phone" className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-2">
                      Phone Number
                    </label>
                    <input
                      id="inquiry-phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="e.g. +91 99620 04546"
                      className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 bg-white/70 text-timber-darkwood placeholder:text-timber-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal focus:bg-white transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="inquiry-subject" className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-2">
                      Inquiry Type
                    </label>
                    <select
                      id="inquiry-subject"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 bg-white/70 text-timber-darkwood text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal focus:bg-white transition"
                    >
                      <option value="Bespoke Furniture Commission">Bespoke Furniture Commission</option>
                      <option value="Product Details & Sizing">Product Details & Sizing</option>
                      <option value="Showroom Visit">Showroom Visit</option>
                      <option value="Order & Delivery Status">Order & Delivery Status</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="inquiry-message" className="block text-xs uppercase tracking-wider text-timber-darkwood font-medium mb-2">
                    Message <span className="text-rose-600">*</span>
                  </label>
                  <textarea
                    id="inquiry-message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us about your requirements, dimensions, preferred timber species, or any questions..."
                    className="w-full px-4 py-3 rounded-xl border border-timber-darkwood/15 bg-white/70 text-timber-darkwood placeholder:text-timber-muted/50 text-sm focus:outline-none focus:ring-2 focus:ring-timber-teal/30 focus:border-timber-teal focus:bg-white transition resize-y"
                  />
                </div>

                <div className="flex items-center justify-end pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 bg-timber-teal text-white text-xs font-semibold uppercase tracking-widest rounded-full hover:bg-timber-darkwood transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>Submit Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}