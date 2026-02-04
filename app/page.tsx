import Navbar from '@/app/components/Navbar';
import { Activity, Globe, Database, ShieldCheck } from 'lucide-react';
import Link from 'next/link'; // 1. Import the Link component

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section with Background Image */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image Container */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: 'url("https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=2013&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay for Opacity/Readability */}
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto text-center px-8">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wide text-emerald-400 uppercase bg-emerald-950/50 border border-emerald-500/30 rounded-full backdrop-blur-md">
            Ecosystem Resilience Platform
          </span>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight">
            Stop Planting Trees. <br />
            <span className="text-emerald-400">Start Growing Forests.</span>
          </h1>
          <p className="text-lg text-slate-200 max-w-2xl mx-auto mb-10 leading-relaxed">
            Millions of saplings die due to static planning. Our AI integrates satellite 
            imagery with ground-level soil data to ensure decadal survival.
          </p>

          {/* Main CTA Linked to Login */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/app/login"> {/* 2. Wrap the button in a Link */}
              <button className="group flex items-center gap-3 bg-emerald-600 text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-900/20">
                <Activity size={22} className="group-hover:scale-110 transition-transform" />
                Live Dashboard
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 bg-slate-50 relative z-10">
        <div className="max-w-7xl mx-auto px-8">
          <div className="grid md:grid-cols-3 gap-10">
            <FeatureCard 
              icon={<Globe size={28} />}
              title="Strategic Site Matching"
              desc="Uses Sentinel-2 imagery to match native species to specific micro-climates and current soil profiles."
            />
            <FeatureCard 
              icon={<Database size={28} />}
              title="Soil Intelligence"
              desc="Monitors pH, nutrient depletion, and moisture levels to adapt care strategies in real-time."
            />
            <FeatureCard 
              icon={<ShieldCheck size={28} />}
              title="Predictive Risk"
              desc="Three-week early warning system for drought, disease, and extreme heat patterns."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-8 bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition-colors shadow-sm">
      <div className="text-emerald-600 mb-6 bg-emerald-50 w-fit p-3 rounded-xl">{icon}</div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}