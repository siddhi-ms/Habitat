'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import dynamic from 'next/dynamic';
import { ArrowLeft, Navigation, Calendar, Droplets, Thermometer, Wind, Sun, AlertTriangle, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { generateCareProtocol } from '@/app/utils/ragEngine';
import CareTimeline from '@/app/components/CareTimeline';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [geoLib, setGeoLib] = useState<any>(null);
  const [isEmergency, setIsEmergency] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    const initLeaflet = async () => {
      const L = (await import('leaflet')).default;
      await import('leaflet/dist/leaflet.css');

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
      if (data) {
        setProject(data);
        const pred = data.prediction_result as Record<string, any> | null;
        if (pred && typeof pred === 'object') {
          const warnings = pred.warning_analytics;
          const droughtLevel = warnings?.drought_risk_level;
          const riskRating = pred.risk_rating;
          if (droughtLevel === 'High' || riskRating === 'High') {
            setIsEmergency(true);
          }
        }
      }
      setLoading(false);
    };

    initLeaflet();
    fetchDetails();
  }, [id, supabase]);

  const handleSOSClick = async () => {
    if (!isEmergency || isSendingEmail || emailSent || !project) return;

    setIsSendingEmail(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !user.email) {
        throw new Error('User not authenticated');
      }

      const { error: funcError } = await supabase.functions.invoke('send-emergency-email', {
        body: {
          email: user.email,
          projectName: project.name,
          projectId: project.id,
          emergencyType: 'Drought',
          location: `${project.lat}, ${project.lng}`,
          species: project.species || 'Unknown',
        },
      });

      if (funcError) {
        await supabase.from('emergency_notifications').insert([{
          user_id: user.id,
          project_id: project.id,
          email: user.email,
          project_name: project.name,
          emergency_type: 'Drought',
          location: `${project.lat}, ${project.lng}`,
          species: project.species || 'Unknown',
          status: 'pending',
        }]);
      }

      setEmailSent(true);
    } catch (err: any) {
      alert(err.message || 'Failed to send SOS');
    } finally {
      setIsSendingEmail(false);
    }
  };

  if (loading || !project || !geoLib) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-emerald-800 italic animate-pulse">
        ESTABLISHING SECURE ECO-LINK...
      </div>
    );
  }

  const p = project.prediction_result as any;
  const altitudeNum = typeof project.altitude === 'string'
    ? parseInt(project.altitude.replace(/[^0-9]/g, ''), 10) || 0
    : Number(project.altitude) || 0;

  const { phases, video } = generateCareProtocol(
    (project.species || 'neem').toLowerCase(),
    altitudeNum,
    project.lat
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      <nav className="fixed left-0 top-0 bottom-0 w-1.5 bg-emerald-600/10 z-[2000] hidden lg:block" />

      <header className="h-24 bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-[1000] px-12 flex items-center justify-between">
        <Link href="/dashboard" className="group flex items-center gap-3 text-slate-400 hover:text-emerald-600 transition-all duration-300">
          <div className="bg-slate-50 group-hover:bg-emerald-50 p-2 rounded-xl transition-colors">
            <ArrowLeft size={20} />
          </div>
          <span className="font-bold uppercase tracking-[0.2em] text-[10px]">Dashboard</span>
        </Link>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Status</div>
            <div className="text-sm font-bold text-emerald-600 mt-1">Active Monitoring</div>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2" />
          <div className="font-black text-slate-900 uppercase italic tracking-tighter text-3xl">Prithvi</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 lg:p-12 space-y-10">
        <section className="relative">
          <div className="grid lg:grid-cols-3 gap-8 items-stretch">
            <div className="lg:col-span-2 bg-white p-12 lg:p-16 rounded-[3.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:bg-emerald-100 transition-colors duration-700" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <span className="px-4 py-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-200">
                    Restoration Node
                  </span>
                  <span className="text-slate-300 font-light">/</span>
                  <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">{project.species}</span>
                </div>

                <h1 className="text-7xl lg:text-8xl font-black text-slate-900 capitalize mb-10 tracking-tight leading-[0.9]">
                  {project.name}
                </h1>

                <div className="flex flex-wrap gap-8 text-slate-500 font-bold text-xs uppercase tracking-widest">
                  <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                    <Navigation size={18} className="text-emerald-500" />
                    <span>{project.lat.toFixed(5)}°N, {project.lng.toFixed(5)}°E</span>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100">
                    <Calendar size={18} className="text-emerald-500" />
                    <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={`relative rounded-[3.5rem] p-12 flex flex-col justify-between overflow-hidden shadow-2xl transition-all duration-500 ${isEmergency ? 'bg-red-600 shadow-red-200' : 'bg-slate-900 shadow-slate-200'}`}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white/50">Vitality Index</span>
                  <ShieldCheck size={24} className="text-emerald-400" />
                </div>
                <div className="flex items-baseline gap-2">
                  <div className="text-8xl font-black text-white leading-none tracking-tighter">
                    {project.survival_rate ? project.survival_rate.replace('%', '') : '94'}
                  </div>
                  <span className="text-2xl font-black text-white/40">%</span>
                </div>

                {p?.risk_score != null && (
                  <div className="mt-8 space-y-2">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-white/60">
                      <span>Environmental Risk</span>
                      <span>{Number(p.risk_score).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${isEmergency ? 'bg-red-300' : 'bg-emerald-400'}`}
                        style={{ width: `${p.risk_score}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="relative z-10 pt-10">
                <button
                  onClick={handleSOSClick}
                  disabled={!isEmergency || isSendingEmail || emailSent}
                  className={`w-full py-6 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 ${isEmergency
                      ? emailSent
                        ? 'bg-emerald-500 text-white cursor-default'
                        : 'bg-white text-red-600 shadow-2xl hover:scale-[1.02] active:scale-95'
                      : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
                    }`}
                >
                  {isSendingEmail ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : emailSent ? (
                    <ShieldCheck size={20} />
                  ) : (
                    <AlertCircle size={20} />
                  )}
                  <span>{emailSent ? 'Assistance Notified' : 'Emergency SOS'}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="grid lg:grid-cols-5 gap-10">
          <div className="lg:col-span-3 h-[600px] bg-white rounded-[3.5rem] border border-slate-200/60 shadow-sm overflow-hidden relative group">
            <MapContainer
              center={[project.lat, project.lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
              scrollWheelZoom={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              <Marker position={[project.lat, project.lng]} />
            </MapContainer>
          </div>

          <div className="lg:col-span-2 flex flex-col gap-10">
            {p && (
              <div className="bg-white rounded-[3.5rem] border border-slate-200/60 shadow-sm p-12 flex flex-col h-full overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 text-emerald-100 group-hover:text-emerald-200 transition-colors">
                  <Droplets size={120} strokeWidth={1} />
                </div>

                <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4 relative z-10 tracking-tight">
                  <span className="w-2 h-8 bg-emerald-50 rounded-full" />
                  Site Analysis
                </h2>

                <div className="grid grid-cols-2 gap-x-8 gap-y-10 relative z-10">
                  <MetricBox label="Rainfall (30d)" value={`${Number(p.rainfall_30d || 0).toFixed(1)}mm`} icon={<Droplets className="text-blue-500" />} />
                  <MetricBox label="Peak Temp" value={`${Number(p.temp_max || 0).toFixed(1)}°C`} icon={<Thermometer className="text-orange-500" />} />
                  <MetricBox label="Soil pH" value={Number(p.pH || 0).toFixed(1)} icon={<ShieldCheck className="text-emerald-500" />} />
                  <MetricBox label="Texture" value={String(p.Texture_Code || "Unknown")} icon={<Navigation className="text-indigo-500" />} />
                  <MetricBox label="Solar Flux" value={`${Number(p.solar_radiation || 0).toFixed(1)}`} icon={<Sun className="text-amber-500" />} />
                  <MetricBox label="Nitrogen" value={`${(Number(p.Nitrogen_pct || 0) * 100).toFixed(2)}%`} icon={<Wind className="text-emerald-400" />} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-1 bg-white rounded-[3.5rem] border border-slate-200/60 shadow-sm p-10">
            <h2 className="text-2xl font-black text-slate-900 mb-8 flex items-center gap-3 tracking-tight">
              <AlertTriangle size={24} className="text-amber-500" />
              ML Insights
            </h2>

            <div className="space-y-6">
              {p?.warning_analytics && (
                <>
                  {p.warning_analytics.drought_risk_level && (
                    <div className="p-6 bg-amber-50 border border-amber-200 rounded-[2rem] group hover:bg-amber-100 transition-colors">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Hydraulic Stress</span>
                        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                      </div>
                      <p className="font-extrabold text-amber-950 text-xl leading-tight">
                        {String(p.warning_analytics.drought_risk_level)} Potential
                      </p>
                      <p className="text-xs font-bold text-amber-700/70 mt-3 leading-relaxed">
                        {String(p.warning_analytics.warning_message || "Atmospheric deficit detected.")}
                      </p>
                    </div>
                  )}

                  {p.warning_analytics.health_risk && (
                    <div className="p-6 bg-slate-50 border border-slate-100 rounded-[2rem]">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Pathogen Readiness</span>
                      <p className="font-black text-slate-900 text-lg">
                        {String(p.warning_analytics.health_risk.health_risk_level)}
                      </p>
                      <p className="text-xs font-bold text-slate-500 mt-2 italic">
                        "{String(p.warning_analytics.health_risk.health_advice)}"
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-[3.5rem] border border-slate-200/60 shadow-sm p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-12 text-slate-50 pointer-events-none">
              <ShieldCheck size={200} strokeWidth={0.5} />
            </div>

            <div className="relative z-10">
              <h2 className="text-3xl font-black text-slate-900 mb-10 flex items-center gap-4 tracking-tight">
                <span className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={28} className="text-emerald-600" />
                </span>
                Regenerative Protocol
              </h2>

              <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100">
                <CareTimeline protocol={phases} video={video} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-20 text-center border-t border-slate-100">
        <div className="font-black text-slate-200 uppercase tracking-[0.5em] text-sm">Prithvi Ecosystem Intelligence</div>
      </footer>
    </div>
  );
}

function MetricBox({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 group/metric">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 group-hover/metric:bg-emerald-50 group-hover/metric:border-emerald-100 transition-all duration-300">
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      </div>
      <div className="text-3xl font-black text-slate-900 tabular-nums pl-11 group-hover/metric:text-emerald-700 transition-colors">
        {value}
      </div>
    </div>
  );
}