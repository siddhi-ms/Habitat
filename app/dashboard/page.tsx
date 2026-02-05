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
          <div className="h-64 flex flex-col items-center justify-center">
            <div className="relative">
              <Loader2 className="animate-spin text-emerald-600" size={40} />
              <div className="absolute inset-0 bg-emerald-400 blur-xl opacity-20 animate-pulse"></div>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white/50 border-2 border-dashed border-emerald-100 rounded-[3rem] p-24 text-center">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <FolderOpen className="text-emerald-100" size={40} />
            </div>
            <h3 className="text-xl font-bold text-emerald-900 mb-2">No active sites</h3>
            <p className="text-emerald-700/50 max-w-xs mx-auto">Begin your journey by deploying your first restoration node.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {projects.map((project) => (
              <Link key={project.id} href={`/project/${project.id}`} className="group">
                <div className="bg-white border border-emerald-50 rounded-[2.5rem] p-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(16,185,129,0.15)] hover:-translate-y-2 relative">
                  
                  <div className="flex justify-between items-start mb-10">
                    <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-500">
                      <TreeDeciduous size={24} />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50/50 rounded-full text-[10px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Live
                    </div>
                  </div>

                  <h3 className="text-2xl font-black text-emerald-950 mb-1 group-hover:text-emerald-600 transition-colors">
                    {project.name}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-emerald-800/40 text-[10px] font-black mb-10 uppercase tracking-widest">
                    <MapPin size={12} className="text-emerald-400" />
                    {project.lat.toFixed(2)} / {project.lng.toFixed(2)}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-emerald-50/60 items-end">
                    <div>
                      <p className="text-[10px] font-black text-emerald-900/20 uppercase tracking-[0.2em] mb-1">Species</p>
                      <p className="text-emerald-900/70 font-bold text-sm truncate">{project.species}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-emerald-900/20 uppercase tracking-[0.2em] mb-1">Vitality</p>
                      <p className="text-emerald-600 font-black text-2xl tracking-tighter">{project.survival_rate || '98'}%</p>
                    </div>
                  </div>

                  <div className="absolute bottom-6 right-8 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all">
                    <ChevronRight size={18} className="text-emerald-300" />
                  </div>
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