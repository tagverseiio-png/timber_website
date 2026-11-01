import type { Metadata } from "next";
import { canonical } from "@/lib/seo";
import Link from "next/link";
import { Leaf, TreePine, ShieldCheck, HeartHandshake } from "lucide-react";

export const metadata: Metadata = {
  title: "Sustainability & Responsible Sourcing",
  description: "Our commitment to legally certified plantation timber, zero MDF, and heirloom furniture built for generations.",
  alternates: { canonical: canonical("/sustainability") },
};

export default function SustainabilityPage() {
  const pillars = [
    {
      icon: TreePine,
      title: "100% Plantation Timber",
      desc: "We exclusively harvest and source from regulated government plantations and certified community forests, ensuring zero deforestation of old-growth rainforests.",
    },
    {
      icon: ShieldCheck,
      title: "Zero MDF or Particle Board",
      desc: "Unlike fast-furniture made of toxic synthetic glues and compressed sawdust that lands in landfills within years, our pieces are 100% authentic solid wood.",
    },
    {
      icon: HeartHandshake,
      title: "Generational Longevity",
      desc: "The greenest product is the one that lasts for centuries. Our mortise-and-tenon craftsmanship ensures our furniture is handed down across generations.",
    },
    {
      icon: Leaf,
      title: "Natural Oils & Low-VOC Finishes",
      desc: "We use non-toxic wood sealers, natural teak oils, and low-VOC lacquers to preserve the wood's breathability while safeguarding indoor air quality.",
    },
  ];

  return (
    <main className="bg-timber-beige min-h-screen py-16 md:py-24 px-6 md:px-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-xs uppercase tracking-widest text-timber-teal font-semibold mb-2 block">
            Ethical Craftsmanship
          </span>
          <h1 className="font-serif text-4xl md:text-6xl text-timber-darkwood mb-4">
            Rooted in Responsibility
          </h1>
          <p className="text-timber-muted max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
            Crafting solid wood furniture isn&apos;t just about timeless aesthetics — it&apos;s a lifelong pledge
            to respect the earth that grew the tree.
          </p>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {pillars.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.title}
                className="bg-white/80 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 shadow-sm flex flex-col gap-4"
              >
                <div className="w-12 h-12 bg-timber-teal text-timber-beige rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={24} />
                </div>
                <h2 className="font-serif text-2xl text-timber-darkwood">{p.title}</h2>
                <p className="text-timber-darkwood/80 text-sm md:text-base leading-relaxed">{p.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Story Section */}
        <div className="bg-white/80 backdrop-blur-sm border border-timber-darkwood/10 rounded-2xl p-8 md:p-12 shadow-sm text-timber-darkwood mb-12">
          <h2 className="font-serif text-2xl md:text-3xl mb-4">Why Solid Wood is Inherently Sustainable</h2>
          <div className="space-y-4 text-timber-darkwood/80 text-sm md:text-base leading-relaxed">
            <p>
              Modern mass production relies heavily on cheap disposable materials — MDF, particle boards, and plastic veneers.
              These materials break easily, cannot be sanded or refinished, and end up in landfills where synthetic binders
              slowly emit toxins.
            </p>
            <p>
              Real solid timber, on the other hand, acts as a natural carbon sink. The carbon absorbed by the tree during its
              decades of growth remains locked safely inside your dining table or bedframe for a century.
            </p>
            <p>
              When a solid teak table incurs a scratch or dent, it is easily sanded, oiled, and restored to pristine glory.
              By choosing solid wood, you reject the disposable &ldquo;fast-furniture&rdquo; culture in favor of true permanence.
            </p>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center">
          <Link
            href="/shop"
            className="inline-block px-8 py-3.5 bg-timber-darkwood text-timber-beige rounded-md hover:opacity-90 transition font-medium text-sm tracking-wide"
          >
            Explore Handcrafted Collections
          </Link>
        </div>
      </div>
    </main>
  );
}

