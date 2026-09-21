"use client";

import { ScrollReveal } from "@/components/ui/ScrollReveal";
import { Mail, MapPin, Phone, Clock } from "lucide-react";

export default function ContactPage() {
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
      </div>
    </div>
  );
}