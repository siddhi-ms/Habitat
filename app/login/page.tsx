'use client';

import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Leaf, Mail, Lock, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

// Inside your AuthPage component, update handleAuth:

const handleAuth = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);
  setError(null);
  setMessage(null);

  try {
    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // This MUST match your Supabase Dashboard settings
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
      
      if (data.user && !data.session) {
        setMessage("Verification email sent! Please check your inbox (and spam).");
      } else {
        router.push('/dashboard');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push('/dashboard');
      router.refresh();
    }
  } catch (err: any) {
    setError(err.message || "An unexpected error occurred.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-[1000px] min-h-[600px] rounded-3xl shadow-2xl overflow-hidden flex flex-col lg:flex-row">
        
        {/* Left Side: Branding */}
        <div className="hidden lg:flex w-1/2 bg-emerald-900 relative p-12 flex-col justify-between text-white">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2041&auto=format&fit=crop")', backgroundSize: 'cover' }} />
          <Link href="/" className="relative z-10 flex items-center gap-2">
            <Leaf className="text-emerald-400" size={28} />
            <span className="text-xl font-bold">Privthi</span>
          </Link>
          <div className="relative z-10">
            <h2 className="text-4xl font-bold mb-4">{isSignUp ? "Join the Movement" : "Welcome Back"}</h2>
            <p className="text-emerald-100/70 italic">"Architecting long-term ecosystem survival through AI."</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="flex-1 p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-sm mx-auto w-full">
            <h1 className="text-3xl font-black text-slate-900 mb-2">{isSignUp ? "Register" : "Sign In"}</h1>
            
            {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</div>}
            {message && <div className="mb-4 text-sm text-emerald-600 bg-emerald-50 p-3 rounded-lg border border-emerald-100">{message}</div>}

            <form onSubmit={handleAuth} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                <div className="relative text-slate-900"> {/* Forces text child to be visible */}
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="email" 
                    required 
                    value={email}
                    placeholder="name@earth.org"
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-400"
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password</label>
                <div className="relative text-slate-900">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-slate-900 placeholder:text-slate-400"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <>{isSignUp ? "Create Account" : "Sign In"} <ArrowRight size={18} /></>}
              </button>
            </form>

            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="mt-6 w-full text-center text-sm font-semibold text-emerald-600 hover:underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "New here? Register your project"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}