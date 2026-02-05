"use client";
import { useSearchParams } from 'next/navigation';
import { generateCareProtocol } from '@/app/utils/ragEngine';
import CareTimeline from '@/app/components/CareTimeline';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function CareGuidelinesPage() {
  const searchParams = useSearchParams();
  
  const species = searchParams.get('species') || 'neem';
  const lat = parseFloat(searchParams.get('lat') || '0');
  const alt = parseInt(searchParams.get('alt') || '0');

  // Destructure the object to get 'phases' and 'video'
  const { phases, video } = generateCareProtocol(species, alt, lat);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-20">
        <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-emerald-600 transition-colors">
          <ChevronLeft size={18} /> BACK TO DASHBOARD
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto mt-12 px-6">
        <header className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 capitalize mb-2">{species} Roadmap</h1>
          <p className="text-slate-500 font-medium">Custom localized data for your restoration site.</p>
        </header>

        {/* This component displays the Video AND the Guidelines */}
        <CareTimeline protocol={phases} video={video} />
      </main>
    </div>
  );
}