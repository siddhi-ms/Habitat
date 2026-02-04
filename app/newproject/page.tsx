"use client"; // <--- Add this at the very top!

import dynamic from 'next/dynamic';

// Now this will work because the parent is a Client Component
const MapPicker = dynamic(() => import('@/app/components/MapPicker'), { 
  ssr: false,
  loading: () => (
    <div className="h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-emerald-600 animate-pulse font-medium">
        Loading Satellite Interface...
      </div>
    </div>
  )
});

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="h-16 border-b border-gray-100 flex items-center px-8">
        <span className="text-[#00a86b] font-bold text-xl">Privthi</span>
      </nav>
      
      <MapPicker />
    </div>
  );
}