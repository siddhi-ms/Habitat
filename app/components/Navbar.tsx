import { Leaf } from 'lucide-react';
import Link from 'next/link'; // 1. Import Link from next/link

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between px-8 py-5 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed w-full top-0 z-50">
      <div className="flex items-center gap-2">
        <Leaf className="text-emerald-600" size={28} />
        <span className="text-xl font-bold tracking-tight text-slate-800">Privthi</span>
      </div>
      <div className="flex items-center gap-8">
        <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
          <a href="#problem" className="hover:text-emerald-600">The Problem</a>
          <a href="#features" className="hover:text-emerald-600">Features</a>
        </div>
        
        {/* 2. Wrap your button in the Link component */}
        <Link href="/login">
          <button className="bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800 transition">
            Login
          </button>
        </Link>
      </div>
    </nav>
  );
}