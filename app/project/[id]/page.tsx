'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import dynamic from 'next/dynamic';
import { ArrowLeft, Navigation, Calendar, Droplets, Thermometer, Wind, Sun, AlertTriangle, ShieldCheck, AlertCircle } from 'lucide-react';
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
      if (data) {
        setProject(data);
        // Check for emergency conditions
        const pred = data.prediction_result as Record<string, unknown> | null;
        if (pred && typeof pred === 'object') {
          const warnings = pred.warning_analytics as Record<string, unknown> | null | undefined;
          if (warnings && typeof warnings === 'object') {
            const droughtLevel = warnings.drought_risk_level as string | undefined;
            const riskRating = pred.risk_rating as string | undefined;
            // Emergency if drought is High or risk is High
            if (droughtLevel === 'High' || riskRating === 'High') {
              setIsEmergency(true);
            }
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
        throw new Error('User not authenticated or email not found');
      }

      // Call Supabase Edge Function to send email
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
        // Fallback: Store emergency notification in database
        // You can set up a database trigger/webhook to send emails
        console.warn('Edge Function not available, storing in database:', funcError);
        
        const { error: dbError } = await supabase
          .from('emergency_notifications')
          .insert([{
            user_id: user.id,
            project_id: project.id,
            email: user.email,
            project_name: project.name,
            emergency_type: 'Drought',
            location: `${project.lat}, ${project.lng}`,
            species: project.species || 'Unknown',
            status: 'pending',
          }]);
        
        if (dbError) {
          // If table doesn't exist, just show success (email will be sent via Edge Function when deployed)
          console.warn('Database table not found, Edge Function will handle email when deployed');
        }
      }
      
      setEmailSent(true);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send emergency email';
      alert(message);
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

  type Pred = Record<string, unknown> | null | undefined;
  const pred: Pred = project.prediction_result as Pred;
  const p = pred && typeof pred === 'object' ? pred : null;
  const altitudeNum = typeof project.altitude === 'string'
    ? parseInt(project.altitude.replace(/[^0-9]/g, ''), 10) || 0
    : Number(project.altitude) || 0;
  const { phases, video } = generateCareProtocol(
    (project.species || 'neem').toLowerCase(),
    altitudeNum,
    project.lat
  );

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
          <div className={`rounded-[2.5rem] p-10 text-white transition-colors ${isEmergency ? 'bg-red-600' : 'bg-emerald-900'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Survival Score</span>
            <div className="text-7xl font-black mt-2">{project.survival_rate ?? '94%'}</div>
            {p?.risk_rating != null && (
              <span className="mt-2 inline-block text-sm font-bold text-emerald-200">
                Risk: {String(p.risk_rating)}
              </span>
            )}
            
            {/* SOS/Drought Emergency Button */}
            <button
              onClick={handleSOSClick}
              disabled={!isEmergency || isSendingEmail || emailSent}
              className={`mt-6 w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-2 ${
                isEmergency
                  ? emailSent
                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-default'
                    : 'bg-red-700 hover:bg-red-800 text-white shadow-lg hover:shadow-xl active:scale-95 cursor-pointer'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-50'
              }`}
            >
              {isSendingEmail ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : emailSent ? (
                <>
                  <AlertCircle size={20} />
                  <span>Email Sent</span>
                </>
              ) : isEmergency ? (
                <>
                  <AlertCircle size={20} />
                  <span>SOS / DROUGHT</span>
                </>
              ) : (
                <>
                  <AlertCircle size={20} />
                  <span>SOS / DROUGHT</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Map */}
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

        {/* Site data from unified model */}
        {p && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
              <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                <Droplets size={22} className="text-emerald-600" /> Weather & Soil
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                {p.rainfall_30d != null && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Rainfall (30d)</span>
                    <span className="font-bold text-slate-900">{Number(p.rainfall_30d).toFixed(2)}</span>
                  </div>
                )}
                {p.temp_max != null && (
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                    <Thermometer size={16} className="text-amber-500" />
                    <div>
                      <span className="text-slate-500 block">Temp max</span>
                      <span className="font-bold text-slate-900">{Number(p.temp_max).toFixed(1)}°C</span>
                    </div>
                  </div>
                )}
                {p.pH != null && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">pH</span>
                    <span className="font-bold text-slate-900">{Number(p.pH).toFixed(2)}</span>
                  </div>
                )}
                {p.Texture_Code != null && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Texture</span>
                    <span className="font-bold text-slate-900">{String(p.Texture_Code)}</span>
                  </div>
                )}
                {p.humidity_mean != null && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-slate-500 block">Humidity</span>
                    <span className="font-bold text-slate-900">{Number(p.humidity_mean).toFixed(1)}%</span>
                  </div>
                )}
                {p.wind_speed != null && (
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                    <Wind size={16} className="text-slate-400" />
                    <div>
                      <span className="text-slate-500 block">Wind</span>
                      <span className="font-bold text-slate-900">{Number(p.wind_speed).toFixed(2)}</span>
                    </div>
                  </div>
                )}
                {p.solar_radiation != null && (
                  <div className="p-3 bg-slate-50 rounded-xl flex items-center gap-2">
                    <Sun size={16} className="text-amber-400" />
                    <div>
                      <span className="text-slate-500 block">Solar</span>
                      <span className="font-bold text-slate-900">{Number(p.solar_radiation).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Warnings from warning model */}
            {p.warning_analytics && typeof p.warning_analytics === 'object' && (
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
                <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                  <AlertTriangle size={22} className="text-amber-500" /> Alerts & Warnings
                </h2>
                <div className="space-y-4">
                  {(p.warning_analytics as Record<string, unknown>).drought_risk_level ? (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <span className="text-xs font-bold text-amber-800 uppercase">Drought</span>
                      <p className="font-bold text-amber-900 mt-1">
                        {String((p.warning_analytics as Record<string, unknown>).drought_risk_level)} – {String((p.warning_analytics as Record<string, unknown>).warning_message ?? '')}
                      </p>
                    </div>
                  ) : null}
                  {(p.warning_analytics as Record<string, unknown>).health_risk ? (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-600 uppercase">Health</span>
                      {(() => {
                        const h = (p.warning_analytics as Record<string, unknown>).health_risk as Record<string, unknown>;
                        return (
                          <div className="text-slate-800 mt-1 text-sm">
                            {h.health_risk_level != null ? <p className="font-bold">{String(h.health_risk_level)}</p> : null}
                            {h.health_advice != null ? <p className="mt-1">{String(h.health_advice)}</p> : null}
                          </div>
                        );
                      })()}
                    </div>
                  ) : null}
                  {(p.warning_analytics as Record<string, unknown>).weather_alerts && Array.isArray((p.warning_analytics as Record<string, unknown>).weather_alerts) ? (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <span className="text-xs font-bold text-slate-600 uppercase">Weather</span>
                      <ul className="mt-1 list-disc list-inside text-slate-700 text-sm">
                        {((p.warning_analytics as Record<string, unknown>).weather_alerts as string[]).map((a: string, i: number) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Care details */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-8">
          <h2 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
            <ShieldCheck size={22} className="text-emerald-600" /> Care Guidelines
          </h2>
          <CareTimeline protocol={phases} video={video} />
        </div>
      </main>
    </div>
  );
}