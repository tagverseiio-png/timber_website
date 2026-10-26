"use client";

import { useState, FormEvent } from "react";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Mail, MapPin, Phone, Clock, Send, CheckCircle2 } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "Bespoke Furniture Commission",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    // Simulate sending inquiry with smooth feedback
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
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

        {/* Address / Timings / Get In Touch */}
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

        {/* Inquiry Form */}
        <ScrollReveal delay={0.2} direction="up" className="mt-20 lg:mt-28">
          <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm border border-timber-darkwood/10 rounded-3xl p-8 sm:p-12 shadow-sm">
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