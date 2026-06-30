import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import L from "leaflet";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Sparkles,
  ShieldAlert,
  MapPin,
  ListFilter,
  CheckCircle,
  AlertTriangle,
  Users,
  AlertCircle,
  TrendingUp,
  Sliders,
  Mail,
  Trash2,
  Clock,
  ShieldCheck,
  Settings
} from "lucide-react";
import { Complaint, UserProfile } from "../types";
import { getSLAStatus } from "../utils";

interface AdminDashboardProps {
  user: UserProfile;
  complaints: Complaint[];
  onRefreshComplaints: () => void;
  onUpdateComplaintStatus: (id: string, status: any, desc?: string) => Promise<void>;
  onDeleteComplaint: (id: string) => void;
  deadlines: Record<string, number>;
  onUpdateDeadlines: (updatedDeadlines: Record<string, number>) => Promise<void>;
}

export default function AdminDashboard({
  user,
  complaints,
  onRefreshComplaints,
  onUpdateComplaintStatus,
  onDeleteComplaint,
  deadlines,
  onUpdateDeadlines
}: AdminDashboardProps) {
  const [filterCategory, setFilterCategory] = useState("All");
  const [activeAdminTab, setActiveAdminTab] = useState<"operations" | "sla">("operations");
  const [localDeadlines, setLocalDeadlines] = useState<Record<string, number>>(deadlines);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (deadlines && Object.keys(deadlines).length > 0) {
      setLocalDeadlines(deadlines);
    }
  }, [deadlines]);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  // Category counts for Recharts charts
  const getCategoryChartData = () => {
    const dataMap: Record<string, number> = {};
    complaints.forEach((c) => {
      dataMap[c.category] = (dataMap[c.category] || 0) + 1;
    });

    return Object.entries(dataMap).map(([name, count]) => ({
      name: name.slice(0, 12),
      count
    }));
  };

  const getStatusChartData = () => {
    const resolved = complaints.filter((c) => c.status === "Resolved").length;
    const pending = complaints.length - resolved;
    return [
      { name: "Resolved Issues", value: resolved, color: "#10b981" }, // emerald-500
      { name: "Active Pending", value: pending, color: "#f59e0b" } // amber-500
    ];
  };

  // Initialize Admin Map showing all city-wide coordinates
  useEffect(() => {
    if (activeAdminTab !== "operations") {
      return;
    }

    if (mapContainerRef.current && !mapRef.current) {
      const mapInstance = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([23.2599, 77.4126], 12); // center on city

      // Standard Day and Land view (OpenStreetMap standard layer similar to Google Maps)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance);

      mapRef.current = mapInstance;
    }

    // Overlay complaint scatter pins with red/green colors depending on resolution state
    if (mapRef.current) {
      // Clear old pins
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      const filtered = filterCategory === "All"
        ? complaints
        : complaints.filter((c) => c.category === filterCategory);

      filtered.forEach((c) => {
        const isResolved = c.status === "Resolved";
        const isRedStatus = ["Registered", "Dispatched", "In Progress"].includes(c.status) || !isResolved;

        // Strict marker color token mapping
        const pinBgColor = isResolved ? "bg-green-600 border-green-400" : "bg-red-600 border-red-400";
        const pinSymbol = isResolved ? "✓" : "⚠️";

        // Create colored divicon
        const markerIcon = L.divIcon({
          className: `p-1.5 rounded-full border-2 shadow flex items-center justify-center transition-all ${pinBgColor} text-white ${
            isRedStatus ? "animate-pulse" : ""
          }`,
          html: pinSymbol,
          iconSize: [22, 22],
          iconAnchor: [11, 11]
        });

        const formattedDate = new Date(c.createdAt).toLocaleString();

        const pin = L.marker([c.location.latitude, c.location.longitude], {
          icon: markerIcon
        })
          .addTo(mapRef.current!)
          .bindPopup(`
            <div class="text-slate-800 p-1 font-sans min-w-[200px]">
              <div class="flex items-center justify-between border-b border-slate-100 pb-1.5 mb-1.5">
                <strong class="text-teal-600 font-mono text-xs font-bold">${c.id}</strong>
                <span class="px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  isResolved ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }">${c.status}</span>
              </div>
              <strong class="text-slate-900 text-sm font-semibold block leading-snug mb-1">${c.title}</strong>
              <p class="text-slate-500 text-[10px] m-0 mb-1"><strong>Category:</strong> ${c.category}</p>
              <p class="text-slate-600 text-[10px] m-0 mb-1.5 italic">${c.description || "No description provided."}</p>
              <p class="text-slate-400 text-[9px] m-0"><strong>Reported:</strong> ${formattedDate}</p>
              <p class="text-slate-400 text-[9px] m-0 mt-0.5"><strong>Address:</strong> ${c.location.address || "Bhopal, MP"}</p>
            </div>
          `);

        markersRef.current.push(pin);
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [complaints, filterCategory, activeAdminTab]);

  return (
    <div className="space-y-6 text-left">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/10 pb-5 gap-4">
        <div>
          <span className="text-[10px] bg-purple-500/10 text-purple-400 font-mono font-bold px-3 py-1 rounded border border-purple-500/20 uppercase tracking-widest">
            ADMINISTRATIVE COMMAND CENTRE
          </span>
          <h1 className="text-3xl md:text-4xl font-black font-display tracking-tighter text-white mt-2 uppercase leading-none">
            CITY CIVIC OPERATION PANEL
          </h1>
          <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mt-1.5">
            AUDIT GEMINI ROUTING CLASSIFIERS • ANALYZE STRUCTURAL BREAKDOWN RISKS • VERIFY FRAUD ALERTS
          </p>
        </div>

        <div className="flex items-center gap-4 bg-purple-500/5 border border-purple-500/15 px-5 py-3 rounded-2xl shadow-xl shadow-purple-500/5">
          <Users className="w-6 h-6 text-purple-400" />
          <div>
            <span className="text-[9px] font-bold font-mono text-slate-500 block uppercase tracking-widest">GOVERNED DEPARTMENTS</span>
            <span className="text-xl font-black font-mono text-purple-300">5 SERVICES ACTIVE</span>
          </div>
        </div>
      </div>

      {/* ADMIN LEVEL TAB SWAPPER */}
      <div className="flex border-b border-white/5 gap-2 pb-0.5">
        <button
          onClick={() => setActiveAdminTab("operations")}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeAdminTab === "operations"
              ? "border-teal-500 text-teal-400 bg-teal-500/5"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          Operations Center
        </button>
        <button
          onClick={() => setActiveAdminTab("sla")}
          className={`px-4 py-2 text-xs font-mono font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${
            activeAdminTab === "sla"
              ? "border-purple-500 text-purple-400 bg-purple-500/5"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          SLA & Category Config
        </button>
      </div>

      {activeAdminTab === "sla" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-6 border border-purple-500/15 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-white/5 pb-4 gap-2">
            <div>
              <h2 className="text-lg font-black font-display text-white uppercase flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-400" /> Resolution SLA Configurator
              </h2>
              <p className="text-slate-400 text-xs">Configure different predefined resolution deadlines for each distinct civic issue category.</p>
            </div>
            <button
              onClick={async () => {
                setIsSaving(true);
                await onUpdateDeadlines(localDeadlines);
                setIsSaving(false);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 4000);
              }}
              className="bg-purple-500 hover:bg-purple-400 text-slate-950 font-mono font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-purple-500/10 flex items-center gap-1.5 self-start sm:self-center"
            >
              {isSaving ? "Saving Config..." : "Save SLA Policies"}
            </button>
          </div>

          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono font-bold flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              SLA POLICIES COMMITTED SUCCESSFULLY. INTERNAL ALGORITHMS AND OFFICER SCHEDULERS RE-OPTIMIZED.
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {Object.entries(localDeadlines).map(([catName, rawValue]) => {
              const hoursValue = rawValue as number;
              // map category to an icon/color representation
              let icon = "📋";
              let badgeColor = "from-teal-500/10 to-emerald-500/10";
              if (catName === "Waste Management") { icon = "🗑️"; badgeColor = "from-amber-500/5 to-orange-500/5 border-amber-500/20"; }
              else if (catName === "Potholes") { icon = "🕳️"; badgeColor = "from-stone-500/5 to-neutral-500/5 border-stone-500/20"; }
              else if (catName === "Broken Streetlights") { icon = "💡"; badgeColor = "from-yellow-500/5 to-amber-500/5 border-yellow-500/20"; }
              else if (catName === "Sanitation Related") { icon = "🧹"; badgeColor = "from-emerald-500/5 to-teal-500/5 border-emerald-500/20"; }
              else if (catName === "Road Related") { icon = "🛣️"; badgeColor = "from-blue-500/5 to-indigo-500/5 border-blue-500/20"; }
              else if (catName === "Damaged Bridges") { icon = "🌉"; badgeColor = "from-indigo-500/5 to-violet-500/5 border-indigo-500/20"; }
              else if (catName === "Blocked Drains") { icon = "🌧️"; badgeColor = "from-sky-500/5 to-blue-500/5 border-sky-500/20"; }
              else if (catName === "Uncovered Manholes") { icon = "🕳️"; badgeColor = "from-red-500/5 to-rose-500/5 border-red-500/20"; }
              else if (catName === "Water Leakage") { icon = "💧"; badgeColor = "from-cyan-500/5 to-blue-500/5 border-cyan-500/20"; }

              return (
                <div key={catName} className={`p-4 rounded-xl border bg-gradient-to-br ${badgeColor} flex flex-col justify-between space-y-4 shadow-sm`}>
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono uppercase">{catName}</h4>
                      <p className="text-[10px] text-slate-400 mt-1">Default Resolution SLA Period</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">Resolution SLA:</span>
                      <strong className="text-purple-400 font-bold">
                        {hoursValue >= 24 ? `${hoursValue / 24} Day(s)` : `${hoursValue} Hour(s)`}
                      </strong>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="240"
                        step={hoursValue >= 24 ? "24" : "1"}
                        value={hoursValue}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          setLocalDeadlines(prev => ({
                            ...prev,
                            [catName]: val
                          }));
                        }}
                        className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                      />
                      <input
                        type="number"
                        min="1"
                        max="500"
                        value={hoursValue}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          setLocalDeadlines(prev => ({
                            ...prev,
                            [catName]: val
                          }));
                        }}
                        className="w-16 bg-slate-950 border border-white/5 rounded px-1.5 py-1 text-center font-mono text-purple-300 text-xxs font-bold"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      ) : (
        <>
          {/* AI PREDICTIVE STRUCTURAL PIPELINE WARNING BANNER */}
          <motion.div
            className="glass rounded-xl p-4 border border-rose-500/20 bg-gradient-to-r from-rose-950/25 to-slate-900/40 relative overflow-hidden flex items-start gap-3"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="p-1.5 bg-rose-500/10 rounded-lg text-rose-400 border border-rose-500/20">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-rose-400 font-mono uppercase tracking-wider">
                AI Predictive Spatial Hazard warning
              </h4>
              <p className="text-slate-200 text-xs leading-relaxed mt-1">
                Ward-3 (KR Market Road) demonstrated a high density risk index of <strong>84% pipeline structural failure</strong> this week, due to anomalous water leakage clustering and drainage complaints detected inside our neural network databases. Spanned dispatch crew is alerted.
              </p>
            </div>
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <ShieldAlert className="w-16 h-16 text-rose-500" />
            </div>
          </motion.div>
        </>
      )}

      {/* CORE STATS GRID / RECHARTS VISUALIZERS */}
      {activeAdminTab === "operations" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Category breakdown bar chart */}
        <div className="md:col-span-8 glass rounded-xl p-4 md:p-5 flex flex-col justify-between min-h-[260px]">
          <div>
            <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-400" /> City Complaint Distribution by Category
            </h4>
          </div>
          <div className="w-full h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={getCategoryChartData()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)", color: "#f8fafc" }}
                  itemStyle={{ color: "#2dd4bf" }}
                />
                <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status pie chart */}
        <div className="md:col-span-4 glass rounded-xl p-4 md:p-5 flex flex-col justify-between min-h-[260px]">
          <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider mb-2">
            Resolution Success Ratios
          </h4>
          <div className="w-full h-36 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getStatusChartData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={50}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {getStatusChartData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "rgba(255,255,255,0.1)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xxs font-mono text-slate-400 border-t border-white/5 pt-2">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Resolved</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Pending</div>
          </div>
        </div>
      </div>
      )}

      {/* MAP & AI COMPLAINT AUDIT LIST SPLIT (Col-12) */}
      {activeAdminTab === "operations" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* SCATTER PLOT REGIONAL CITY MAP */}
        <div className="lg:col-span-7 glass rounded-xl p-4 flex flex-col min-h-[400px]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div>
              <h4 className="text-sm font-bold text-white font-display">Regional Interactive Scatter Plot Map</h4>
              <p className="text-slate-400 text-xxs">Pending reports show as pulsing red markers; turns to green on database snap update</p>
            </div>

            {/* Category filter dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-2 py-1 rounded-lg">
              <ListFilter className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-transparent text-slate-300 text-xxs focus:outline-none focus:ring-0 border-none py-0.5 cursor-pointer font-mono"
              >
                <option value="All">All Categories</option>
                <option value="Waste Management">Waste Management</option>
                <option value="Potholes">Potholes</option>
                <option value="Broken Streetlights">Broken Streetlights</option>
                <option value="Sanitation Related">Sanitation Related</option>
                <option value="Water Leakage">Water Leakage</option>
              </select>
            </div>
          </div>

          <div ref={mapContainerRef} className="w-full h-[320px] lg:h-[400px] z-10" />
        </div>

        {/* AI ROUTING AUDIT & FRAUD MANAGEMENT HUB */}
        <div className="lg:col-span-5 glass rounded-xl p-4 space-y-4">
          <div className="border-b border-white/5 pb-2.5 flex items-center gap-1.5 text-xs font-mono font-bold text-teal-400">
            <Sliders className="w-4 h-4 text-teal-400" /> AI CLASSIFIER & VERIFICATION AUDIT TRAIL
          </div>

          <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {complaints.map((ticket) => (
              <div key={ticket.id} className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xxs font-mono">
                  <span className="text-teal-400 font-bold">{ticket.id}</span>
                  <span className={`px-2 py-0.2 rounded font-bold uppercase ${
                    ticket.status === "Resolved"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-red-500/10 text-red-400"
                  }`}>{ticket.status}</span>
                </div>

                <h5 className="text-slate-200 text-xs font-bold truncate">{ticket.title}</h5>

                {/* SLA Deadline Tracker */}
                {(() => {
                  const sla = getSLAStatus(ticket, deadlines);
                  return (
                    <div className={`p-2 rounded-lg border text-[10px] font-mono leading-tight space-y-1 ${sla.color}`}>
                      <div className="flex items-center justify-between font-bold">
                        <span>SLA Status:</span>
                        <span>{sla.label}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Target:</span>
                        <span>{sla.hours}h ({sla.deadlineFormatted})</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Remaining:</span>
                        <span>{sla.timeLeftFormatted}</span>
                      </div>
                      {ticket.escalated && (
                        <div className="text-[9px] text-rose-400 border-t border-rose-500/20 pt-1 flex items-center gap-1 uppercase font-bold animate-pulse">
                          <span>⚠️ Escalated to Joint Commissioner</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 gap-1 text-[10px] text-slate-400 font-mono bg-slate-950/60 p-2 rounded border border-white/5">
                  <div className="flex items-center justify-between">
                    <span>AI Route:</span>
                    <span className="text-slate-300 font-bold">{ticket.assignedDepartment || "Automatic Router"}</span>
                  </div>
                  {ticket.assignedOfficerName && (
                    <div className="flex items-center justify-between">
                      <span>Assigned Shift:</span>
                      <span className="text-slate-300 font-bold">{ticket.assignedOfficerName}</span>
                    </div>
                  )}
                  {ticket.verificationReason && (
                    <div className="text-xxs text-emerald-400 mt-1.5 border-t border-white/5 pt-1 italic truncate">
                      "Exif result: {ticket.verificationReason}"
                    </div>
                  )}
                </div>

                {/* Operations */}
                <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-white/5">
                  {ticket.status !== "Resolved" && (
                    <button
                      onClick={async () => {
                        await onUpdateComplaintStatus(ticket.id, "Resolved", "Force resolved via Administrative Audit Override protocol.");
                        onRefreshComplaints();
                      }}
                      className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 text-[9px] font-mono font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Override Resolve
                    </button>
                  )}
                  <button
                    onClick={() => onDeleteComplaint(ticket.id)}
                    className="bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20 text-[9px] font-mono font-bold px-2 py-1 rounded cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Spam
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
