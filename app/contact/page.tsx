"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Mail, MapPin, Phone } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="bg-timber-beige min-h-screen pt-24 pb-32">
      <div className="container mx-auto px-6 md:px-12">
        <ScrollReveal className="text-center mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-timber-darkwood mb-4">Get in Touch</h1>
          <p className="text-timber-muted max-w-2xl mx-auto">
            Whether you have a question about our collections or want to discuss a custom piece, our team is here to help.
          </p>
        </ScrollReveal>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Contact Info */}
          <div className="lg:w-1/3 flex flex-col gap-10">
            <ScrollReveal delay={0.1} direction="right">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-timber-teal text-white rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-timber-darkwood mb-2">Showroom</h3>
                  <p className="text-timber-muted leading-relaxed">
                    123 Craftsman Way<br />
                    Portland, OR 97204<br />
                    United States
                  </p>
                </div>
              </div>
            </ScrollReveal>
            
            <ScrollReveal delay={0.2} direction="right">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-timber-teal text-white rounded-full flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-timber-darkwood mb-2">Phone</h3>
                  <p className="text-timber-muted leading-relaxed">
                    +1 (555) 123-4567<br />
                    Mon - Fri, 9am - 6pm PST
                  </p>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3} direction="right">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-timber-teal text-white rounded-full flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-xl text-timber-darkwood mb-2">Email</h3>
                  <p className="text-timber-muted leading-relaxed">
                    hello@timberfurniture.com<br />
                    support@timberfurniture.com
                  </p>
                </div>
              </div>
            </ScrollReveal>
          </div>

          {/* Contact Form */}
          <div className="lg:w-2/3 bg-white p-8 md:p-12 shadow-sm rounded-sm">
            <ScrollReveal delay={0.2} direction="left">
              <form className="flex flex-col gap-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-timber-darkwood">First Name</label>
                    <input type="text" className="border border-timber-darkwood/20 p-3 outline-none focus:border-timber-teal transition-colors" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-timber-darkwood">Last Name</label>
                    <input type="text" className="border border-timber-darkwood/20 p-3 outline-none focus:border-timber-teal transition-colors" required />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-timber-darkwood">Email Address</label>
                  <input type="email" className="border border-timber-darkwood/20 p-3 outline-none focus:border-timber-teal transition-colors" required />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-timber-darkwood">Message</label>
                  <textarea rows={5} className="border border-timber-darkwood/20 p-3 outline-none focus:border-timber-teal transition-colors resize-none" required></textarea>
                </div>

                <button className="bg-timber-darkwood text-timber-beige py-4 uppercase tracking-widest text-sm font-medium hover:bg-timber-teal transition-colors interactive mt-2">
                  Send Message
                </button>
              </form>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </div>
  );
}
