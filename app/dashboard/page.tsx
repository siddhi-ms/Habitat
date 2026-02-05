'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import {
  Plus, TreeDeciduous, MapPin, Loader2, LogOut,
  FolderOpen, PlayCircle, Activity, ChevronRight, Leaf
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#F2F9F5] text-slate-900 font-sans selection:bg-emerald-200">

      {/* --- FLOATING NATURE ACCENTS --- */}
      <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden">
        <Leaf className="absolute -top-10 -left-10 text-emerald-200 rotate-45" size={300} />
        <Leaf className="absolute -bottom-20 -right-20 text-emerald-200 -rotate-12" size={400} />
      </div>

      {/* --- ELEGANT NAV --- */}
      <nav className="border-b border-emerald-100/50 bg-white/60 backdrop-blur-xl px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-600 p-2 rounded-xl shadow-lg shadow-emerald-100">
            <TreeDeciduous size={20} className="text-white" />
          </div>
          <span className="font-black text-xl tracking-tight text-emerald-900">Privthi</span>
        </div>

        <button
          onClick={handleSignOut}
          className="text-emerald-700/50 hover:text-rose-600 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2"
        >
          <LogOut size={14} /> Sign Out
        </button>
      </nav>

      <main className="max-w-7xl mx-auto p-8 md:p-16 relative z-10">

        {/* --- MINIMALIST HEADER --- */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-8">
          <div className="space-y-1">
            <h1 className="text-6xl font-black tracking-tighter text-emerald-950">
              Portfolio
            </h1>
            <p className="text-emerald-800/60 font-medium text-lg">
              Cultivating <span className="text-emerald-600 font-bold">{projects.length} sites</span> in your registry.
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <Link href="/simulation" className="flex-1 md:flex-none">
              <button className="w-full bg-white/80 text-emerald-900 border border-emerald-100 px-6 py-4 rounded-2xl font-bold text-sm hover:bg-white transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95">
                <PlayCircle size={18} className="text-emerald-600" /> Simulator
              </button>
            </Link>
            <Link href="/newproject" className="flex-1 md:flex-none">
              <button className="w-full bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold text-sm hover:bg-emerald-500 transition-all shadow-xl shadow-emerald-200 flex items-center justify-center gap-2 active:scale-95">
                <Plus size={18} /> New Project
              </button>
            </Link>
          </div>
        </header>

        {/* --- PROJECT GRID --- */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="font-medium animate-pulse">Syncing with database...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2rem] p-20 text-center">
            <FolderOpen className="mx-auto text-slate-200 mb-6" size={80} />
            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Active Projects</h3>
            <p className="text-slate-500 max-w-xs mx-auto">Click "New Project" to start tracking your first restoration site.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`}>
                <div className="group relative bg-white rounded-[2.5rem] border border-slate-200/60 p-8 shadow-sm hover:shadow-2xl hover:shadow-emerald-100 hover:-translate-y-2 transition-all duration-500 cursor-pointer h-full flex flex-col overflow-hidden">
                  {/* Glassmorphism Background Accent */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-100 transition-colors duration-500" />

                  <div className="flex justify-between items-start mb-8 relative z-10">
                    <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      <TreeDeciduous size={32} />
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`text-[10px] font-black tracking-widest px-4 py-1.5 rounded-full uppercase ${project.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                        {project.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-3xl font-black text-slate-900 mb-2 leading-tight group-hover:text-emerald-700 transition-colors">{project.name}</h3>

                    <p className="text-slate-500 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider mb-8">
                      <MapPin size={14} className="text-emerald-500" />
                      {project.lat.toFixed(4)}°N, {project.lng.toFixed(4)}°E
                    </p>
                  </div>

                  <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between items-center relative z-10">
                    <div className="flex flex-col">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Species</span>
                      <span className="text-slate-900 font-bold text-base">{project.species}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1 block">Survival</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-emerald-600 font-black text-3xl tabular-nums">
                          {project.survival_rate ? project.survival_rate.replace('%', '') : '100'}
                        </span>
                        <span className="text-emerald-600/60 font-black text-sm">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Progressive Hover Indicator */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* --- SOFT FOOTER --- */}
      <footer className="p-16 mt-12 text-center">
        <div className="inline-flex items-center gap-4 bg-white/40 px-6 py-2 rounded-full border border-emerald-100/50 backdrop-blur-sm shadow-sm">
          <span className="text-emerald-800/30 font-black text-[9px] uppercase tracking-[0.5em]">
            © Privthi Ecosystems MMXXVI
          </span>
        </div>
      </footer>
    </div>
  );
}