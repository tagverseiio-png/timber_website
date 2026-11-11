import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Link from "next/link";
import { Sparkles, Sun, Droplets, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Wood Care Guide",
  description: "Comprehensive care and maintenance guide for solid teak and hardwood furniture.",
  alternates: { canonical: canonical("/care") },
};

export default function WoodCarePage() {
  const tips = [
    {
      icon: Sparkles,
      title: "Daily Dusting & Cleaning",
      tips: [
        "Dust regularly using a dry, lint-free microfiber cloth following the natural grain pattern.",
        "For spills, blot immediately with a soft, slightly damp cloth. Never leave standing liquid on wood surfaces.",
        "Avoid using all-purpose chemical kitchen sprays, bleach, or ammonia, which erode protective oil sealants.",
      ],
    },
    {
      icon: Sun,
      title: "Sunlight & Climate Control",
      tips: [
        "Position solid wood pieces away from prolonged direct harsh sunlight to avoid uneven natural oxidation.",
        "Keep away from direct heat sources like radiators or room blowers, which dry out wood fibers.",
        "Maintain reasonable indoor ambient humidity (40–60%) to prevent seasonal wood shrinkage.",
      ],
    },
    {
      icon: Droplets,
      title: "Oiling & Reconditioning",
      tips: [
        "Apply authentic pure teak oil or natural beeswax furniture paste once every 6 to 12 months.",
        "Rub a small amount onto a clean cloth, apply thinly along the grain, let penetrate for 20 minutes, then buff lightly.",
        "Periodic oiling nourishes the natural wood oils and revitalizes the rich, warm organic luster.",
      ],
    },
    {
      icon: ShieldAlert,
      title: "Protection Against Everyday Wear",
      tips: [
        "Always use felt-backed coasters under beverage glasses and hot pads under boiling culinary pots.",
        "Use felt pads under the feet of table decor, lamps, and heavy vases to avoid contact scratches.",
        "Minor surface scuffs can easily be polished away with fine steel wool (#0000) followed by a touch of teak oil.",
      ],
    },
  ];

  return (
    <main className="bg-timber-beige min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-timber-teal font-semibold mb-2 block">
            Preserving Heirloom Quality
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-timber-darkwood mb-4">
            Solid Wood Care Guide
          </h1>
          <p className="text-timber-muted max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Real solid timber matures gracefully with age, developing an irreplaceable patina.
            With gentle care, your pieces will look stunning for lifetimes to come.
          </p>
        </div>

        {/* Tips Grid */}
        <div className="space-y-8 mb-16">
          {tips.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white/80 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start"
              >
                <div className="w-12 h-12 bg-timber-teal text-timber-beige rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="font-serif text-2xl text-timber-darkwood mb-4">{card.title}</h2>
                  <ul className="space-y-2 text-timber-darkwood/80 text-sm md:text-base">
                    {card.tips.map((tip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-timber-teal font-bold select-none">&bull;</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Banner */}
        <div className="bg-timber-darkwood text-timber-beige rounded-2xl p-8 md:p-12 text-center shadow-lg">
          <h2 className="font-serif text-2xl md:text-3xl mb-3">Need Restoration Advice?</h2>
          <p className="text-timber-beige/80 max-w-lg mx-auto text-sm md:text-base mb-6 leading-relaxed">
            Have questions about caring for a specific timber piece or antique restoration? Our master craftsmen are always
            happy to guide you.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-3.5 bg-timber-beige text-timber-darkwood rounded-md hover:bg-white transition font-medium text-sm tracking-wide"
          >
            Contact Our Workshop
          </Link>
        </div>
      </div>
    </main>
  );
}

