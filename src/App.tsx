import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, Complaint } from "./types";
import Auth from "./components/Auth";
import CitizenDashboard from "./components/CitizenDashboard";
import OfficerDashboard from "./components/OfficerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import GameZone from "./components/GameZone";
import MitraChatbot from "./components/MitraChatbot";
import logoImg from "./assets/images/portal_logo_1782640442954.jpg";
import { Landmark, LogOut, ShieldAlert, Award, Bot, Sparkles, AlertCircle } from "lucide-react";
import { db } from "./lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [deadlines, setDeadlines] = useState<Record<string, number>>({});

  // Active view tab for Citizen (dashboard vs game zone)
  const [citizenSubView, setCitizenSubView] = useState<"dashboard" | "game">("dashboard");

  // Fetch all complaints from Express backend
  const fetchComplaints = async () => {
    setLoadingComplaints(true);
    try {
      const res = await fetch("/api/complaints");
      const data = await res.json();
      if (Array.isArray(data)) {
        setComplaints(data);
      }
    } catch (err) {
      console.error("Failed fetching complaints from server:", err);
    } finally {
      setLoadingComplaints(false);
    }
  };

  const fetchDeadlines = async () => {
    try {
      const res = await fetch("/api/deadlines");
      const data = await res.json();
      if (data && !data.error) {
        setDeadlines(data);
      }
    } catch (err) {
      console.error("Failed fetching deadlines:", err);
    }
  };

  const handleUpdateDeadlines = async (updatedDeadlines: Record<string, number>) => {
    try {
      const res = await fetch("/api/deadlines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadlines: updatedDeadlines })
      });
      const data = await res.json();
      if (data && data.success) {
        setDeadlines(data.deadlines);
      }
    } catch (err) {
      console.error("Failed updating deadlines:", err);
    }
  };

  // Sync state on mount with dedicated Firestore real-time listener logic (onSnapshot)
  useEffect(() => {
    setLoadingComplaints(true);
    fetchDeadlines();

    // Listen to real-time complaints collection in Firestore
    const unsubscribeComplaints = onSnapshot(
      collection(db, "complaints"),
      (snapshot) => {
        const list: Complaint[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as Complaint);
        });
        // Sort by createdAt descending (newest first)
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setComplaints(list);
        setLoadingComplaints(false);
      },
      (err) => {
        console.error("Firestore subscription error:", err);
        setLoadingComplaints(false);
        // Fallback to fetch from Express server
        fetchComplaints();
      }
    );

    return () => unsubscribeComplaints();
  }, []);

  // Submit Complaint Handler
  const handleSubmitComplaint = async (complaintData: any) => {
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(complaintData)
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("Error creating complaint:", err);
    }
  };

  // Update Status Handler
  const handleUpdateComplaintStatus = async (id: string, status: any, desc?: string) => {
    try {
      await fetch(`/api/complaints/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          description: desc,
          officerName: user?.role === "Officer" ? user.name : undefined
        })
      });
    } catch (err) {
      console.error("Error updating complaint status:", err);
    }
  };

  // Resolve Complaint Handler with EXIF geolocation checking
  const handleResolveComplaint = async (id: string, base64Image: string, overrideExif: boolean) => {
    try {
      const res = await fetch(`/api/complaints/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resolutionImageUrl: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=600&q=80",
          base64Image,
          overrideExif,
          officerName: user?.name
        })
      });
      const data = await res.json();
      if (data && data.success) {
        // Increment user merits points if officer is resolving
        if (user && user.role === "Officer" && data.complaint.status === "Resolved") {
          setUser((prev) => prev ? { ...prev, points: (prev.points || 0) + 50 } : null);
        }
        return data;
      }
    } catch (err) {
      console.error("Error solving task:", err);
    }
  };

  // Delete/Spam Complaint Handler
  const handleDeleteComplaint = async (id: string) => {
    // Simulated delete state
    setComplaints((prev) => prev.filter((c) => c.id !== id));
  };

  // Gamified credits updating
  const handleAddUserPoints = (pts: number) => {
    if (user) {
      setUser((prev) => prev ? { ...prev, points: (prev.points || 0) + pts } : null);
    }
  };

  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    // Automatically fetch updated state
    fetchComplaints();
  };

  const handleLogout = () => {
    setUser(null);
    setCitizenSubView("dashboard");
  };

  return (
    <div className="min-h-screen text-slate-100 relative">
      {/* Decorative top grid texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900/30 via-slate-950/10 to-slate-950 pointer-events-none -z-10" />

      {/* HEADER NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-white/10 py-4.5 px-4 md:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden border border-white/20 shadow-2xl shadow-indigo-500/20">
              <img 
                src={logoImg} 
                alt="Bhopal Smart City Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-[9px] font-mono font-black text-cyan-400 block tracking-widest uppercase">Bhopal Smart City</span>
              <h1 className="text-sm font-black font-display text-white tracking-wider uppercase">Unified Citizen Portal</h1>
            </div>
          </div>

          {/* User profile / session state header */}
          <AnimatePresence>
            {user && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 md:gap-5"
              >
                {/* Points indicator */}
                <div className="hidden sm:flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-white/5 font-mono text-xs">
                  <Award className="w-4 h-4 text-teal-400" />
                  <span className="text-slate-300">Merits:</span>
                  <span className="text-teal-400 font-bold">{user.points || 0} pts</span>
                </div>

                {/* Profile detail */}
                <div className="text-right">
                  <div className="text-xs font-bold text-white font-display flex items-center justify-end gap-1.5">
                    {user.name}
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded uppercase ${
                      user.role === "Admin"
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/10"
                        : user.role === "Officer"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/10"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/10"
                    }`}>
                      {user.role}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {user.role === "Officer" ? user.department : user.email}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="p-2 bg-slate-900 border border-slate-800 hover:border-teal-500/30 hover:bg-slate-900/50 rounded-xl text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
                  title="Logout Session"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* SUB-VIEW TAB NAVIGATION FOR CITIZEN PROFILE */}
      {user && user.role === "Citizen" && (
        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5 flex justify-start">
          <div className="flex bg-black/60 p-1.5 rounded-2xl border-2 border-purple-500/30 w-fit gap-1 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
            <button
              onClick={() => setCitizenSubView("dashboard")}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer ${
                citizenSubView === "dashboard"
                  ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-black shadow-[0_0_10px_rgba(20,184,166,0.4)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🏢 Dashboard
            </button>
            <button
              onClick={() => setCitizenSubView("game")}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold font-display transition-all cursor-pointer flex items-center gap-1.5 ${
                citizenSubView === "game"
                  ? "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white font-black shadow-[0_0_15px_rgba(217,70,239,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse text-fuchsia-300" /> Gamified Civic Zone
            </button>
          </div>
        </div>
      )}

      {/* MAIN APPLICATION CONSOLE LAYOUT */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 relative">
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="auth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Auth onLogin={handleLogin} />
            </motion.div>
          ) : user.role === "Citizen" ? (
            citizenSubView === "dashboard" ? (
              <motion.div
                key="citizen-dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.4 }}
              >
                <CitizenDashboard
                  user={user}
                  complaints={complaints}
                  onRefreshComplaints={fetchComplaints}
                  onSubmitComplaint={handleSubmitComplaint}
                  deadlines={deadlines}
                />
              </motion.div>
            ) : (
              <motion.div
                key="citizen-game"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.4 }}
              >
                <GameZone user={user} onAddUserPoints={handleAddUserPoints} />
              </motion.div>
            )
          ) : user.role === "Officer" ? (
            <motion.div
              key="officer-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.4 }}
            >
              <OfficerDashboard
                user={user}
                complaints={complaints}
                onRefreshComplaints={fetchComplaints}
                onUpdateComplaintStatus={handleUpdateComplaintStatus}
                onResolveComplaint={handleResolveComplaint}
                deadlines={deadlines}
              />
            </motion.div>
          ) : (
            <motion.div
              key="admin-dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.4 }}
            >
              <AdminDashboard
                user={user}
                complaints={complaints}
                onRefreshComplaints={fetchComplaints}
                onUpdateComplaintStatus={handleUpdateComplaintStatus}
                onDeleteComplaint={handleDeleteComplaint}
                deadlines={deadlines}
                onUpdateDeadlines={handleUpdateDeadlines}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* MITRA CHATBOT WIDGET (floating only for citizen logged-in users) */}
      {user && user.role === "Citizen" && (
        <MitraChatbot user={user} onRefreshComplaints={fetchComplaints} />
      )}

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-6 mt-12 text-center text-slate-600 text-xxs font-mono space-y-1">
        <p>© 2026 Municipal Government Administration Hub.</p>
        <p className="text-slate-700 flex items-center justify-center gap-1.5">
          <AlertCircle className="w-3 h-3 text-slate-700" /> Authorized access only. AI decision lines are logged autonomously.
        </p>
      </footer>
    </div>
  );
}
