'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import dynamic from 'next/dynamic';
import { ArrowLeft, TreeDeciduous, Mountain, Navigation, ShieldCheck, Droplets, Calendar } from 'lucide-react';
import Link from 'next/link';

// 1. DYNAMIC IMPORTS - These are safe
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [geoLib, setGeoLib] = useState<any>(null); // State to store Leaflet library

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    // 2. LOAD LEAFLET ONLY ON CLIENT
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

      // Fix the marker icon issue inside the effect
      const DefaultIcon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
      });
      L.Marker.prototype.options.icon = DefaultIcon;
      
      setGeoLib(L);
    };

    const fetchDetails = async () => {
      const { data } = await supabase.from('projects').select('*').eq('id', id).single();
      if (data) setProject(data);
      setLoading(false);
    };

    initLeaflet();
    fetchDetails();
  }, [id, supabase]);

  if (loading || !project || !geoLib) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-emerald-800 italic animate-pulse">
        ESTABLISHING SECURE ECO-LINK...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="h-20 bg-white border-b border-slate-200 sticky top-0 z-[1000] px-8 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-slate-500 font-bold uppercase text-xs">
          <ArrowLeft size={18} /> Back
        </Link>
        <div className="font-black text-slate-900 uppercase italic text-2xl">Prithvi</div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <h1 className="text-6xl font-black text-slate-900 capitalize mb-6 tracking-tight">{project.name}</h1>
            <div className="flex gap-6 text-slate-400 font-bold text-sm uppercase">
               <span className="flex items-center gap-2"><Navigation size={16} /> {project.lat}, {project.lng}</span>
               <span className="flex items-center gap-2"><Calendar size={16} /> {new Date(project.created_at).getFullYear()}</span>
            </div>
          </div>
          <div className="bg-emerald-900 rounded-[2.5rem] p-10 text-white">
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Survival Score</span>
            <div className="text-7xl font-black mt-2">{project.survival_rate || '94%'}</div>
          </div>
        </div>

        {/* THE MAP SECTION */}
        <div className="lg:col-span-3 bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden relative" style={{ height: '550px' }}>
          <MapContainer 
            center={[project.lat, project.lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            <Marker position={[project.lat, project.lng]} />
          </MapContainer>
        </div>
      </main>
    </div>
  );
}