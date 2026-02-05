"use client";
import { Youtube, ExternalLink } from 'lucide-react';

interface Step {
  month: number;
  task: string;
  details: string;
}

export default function CareTimeline({ protocol, video }: { protocol: Step[], video: string }) {
  return (
    <div className="flex flex-col gap-6">
      {/* 🔴 THE VIDEO SECTION */}
      {video ? (
        <a 
          href={video} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-between p-5 bg-red-600 text-white rounded-2xl hover:bg-red-700 transition-all shadow-lg group"
        >
          <div className="flex items-center gap-4">
            <Youtube size={28} />
            <div>
              <p className="font-bold uppercase tracking-tight text-sm">Expert Video Guide</p>
              <p className="text-xs opacity-80 font-medium">Watch scientific propagation tutorial</p>
            </div>
          </div>
          <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
        </a>
      ) : (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold">
          ⚠ No video found. Check if the species name matches your JSON keys.
        </div>
      )}

      {/* 🟢 THE GUIDELINES SECTION */}
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <h3 className="text-xl font-bold mb-8">Care Guidelines</h3>
        <div className="relative border-l-2 border-emerald-100 ml-4 space-y-10">
          {protocol.map((step, i) => (
            <div key={i} className="relative pl-10">
              <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm" />
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded">
                Month {step.month}
              </span>
              <h4 className="text-lg font-bold text-slate-800 mt-1">{step.task}</h4>
              <p className="text-slate-600 mt-2 leading-relaxed text-sm">{step.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}