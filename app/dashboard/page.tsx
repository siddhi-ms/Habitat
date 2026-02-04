'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Plus, TreeDeciduous, MapPin, Loader2, LogOut, FolderOpen, Check, X, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Feedback States
  const [feedbackStatus, setFeedbackStatus] = useState<'initial' | 'negative' | 'submitted'>('initial');
  const [feedbackText, setFeedbackText] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const submitFeedback = async (isAccurate: boolean) => {
    if (isAccurate) {
      // Logic to save positive feedback to Supabase if desired
      setFeedbackStatus('submitted');
    } else {
      setFeedbackStatus('negative');
    }
  };

  const handleDetailedFeedback = async () => {
    // Logic to save feedbackText to Supabase
    console.log("Feedback submitted:", feedbackText);
    setFeedbackStatus('submitted');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <nav className="bg-white border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
          <TreeDeciduous /> <span>Privthi</span>
        </div>
        <button 
          onClick={handleSignOut}
          className="text-slate-500 hover:text-red-600 flex items-center gap-2 text-sm font-semibold transition"
        >
          <LogOut size={18} /> Sign Out
        </button>
      </nav>

      <main className="max-w-6xl mx-auto p-8 flex-grow">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Ecosystem Portfolio</h1>
            <p className="text-slate-500 mt-2 font-medium">Monitoring {projects.length} active restoration sites.</p>
          </div>
          
          <Link href="/newproject">
            <button className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-emerald-700 transition shadow-xl shadow-emerald-100">
              <Plus size={22} /> New Project
            </button>
          </Link>
        </header>

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
              <div key={project.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600">
                    <TreeDeciduous size={28} />
                  </div>
                  <span className="text-[10px] font-black tracking-widest px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full uppercase">
                    {project.status}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-1">{project.name}</h3>
                <p className="text-slate-500 flex items-center gap-1.5 text-sm font-medium mb-8">
                  <MapPin size={16} className="text-emerald-500" /> {project.location}
                </p>
                <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Survival Probability</span>
                  <span className="text-emerald-600 font-black text-2xl">{project.survival_rate}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* --- FEEDBACK SYSTEM --- */}
      <footer className="mt-auto p-8">
        <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          {feedbackStatus === 'initial' && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-600 font-semibold text-sm">Is this data accurate for your region?</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => submitFeedback(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition"
                >
                  <Check size={18} /> Yes
                </button>
                <button 
                  onClick={() => submitFeedback(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl font-bold hover:bg-red-100 transition"
                >
                  <X size={18} /> No
                </button>
              </div>
            </div>
          )}

          {feedbackStatus === 'negative' && (
            <div className="space-y-4">
              <p className="text-slate-600 font-semibold text-sm">What information is incorrect?</p>
              <div className="relative">
                <input 
                  type="text"
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  placeholder="e.g. Soil type is different, Rainfall is higher..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
                <button 
                  onClick={handleDetailedFeedback}
                  className="absolute right-2 top-2 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          )}

          {feedbackStatus === 'submitted' && (
            <div className="text-center animate-in fade-in duration-500">
              <p className="text-emerald-600 font-bold">Thank you! Your feedback helps improve Privthi's accuracy.</p>
              <button 
                onClick={() => setFeedbackStatus('initial')}
                className="text-[10px] uppercase tracking-widest font-black text-slate-400 mt-2 hover:text-slate-600"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}