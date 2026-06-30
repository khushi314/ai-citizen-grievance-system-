import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import L from "leaflet";
import {
  Upload,
  Mic,
  MapPin,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Clock,
  Send,
  Zap,
  Info,
  Sliders,
  Sparkles,
  RefreshCw,
  PhoneCall
} from "lucide-react";
import { UserProfile, Complaint, ComplaintStatus } from "../types";
import { getSLAStatus } from "../utils";
import bhopalSmartCityBanner from "../assets/images/bhopal_smart_city_banner_1782700715079.jpg";
import smartCityBg from "../assets/images/indian_smart_city_bg_1782698551595.jpg";
import civicHeroVectorArt from "../assets/images/unified_community_vector_art_1782757030892.jpg";
import { db } from "../lib/firebase";
import { doc, onSnapshot, setDoc, getDoc, collection } from "firebase/firestore";

interface CitizenDashboardProps {
  user: UserProfile;
  complaints: Complaint[];
  onRefreshComplaints: () => void;
  onSubmitComplaint: (complaintData: any) => Promise<any>;
  deadlines: Record<string, number>;
}

export default function CitizenDashboard({
  user,
  complaints,
  onRefreshComplaints,
  onSubmitComplaint,
  deadlines
}: CitizenDashboardProps) {
  // Navigation / Tabs within Citizen dashboard
  const [activeTab, setActiveTab] = useState<"report" | "status">("report");

  // Category listing
  const categories = [
    { name: "Waste Management", icon: "🗑️", count: 142, cardBg: "bg-amber-400 border-amber-500/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" },
    { name: "Potholes", icon: "🕳️", count: 284, cardBg: "bg-rose-400 border-rose-500/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" },
    { name: "Broken Streetlights", icon: "💡", count: 198, cardBg: "bg-yellow-300 border-yellow-400/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" },
    { name: "Sanitation Related", icon: "🧹", count: 110, cardBg: "bg-emerald-400 border-emerald-500/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" },
    { name: "Road Related", icon: "🛣️", count: 95, cardBg: "bg-sky-400 border-sky-500/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" },
    { name: "Damaged Bridges", icon: "🌉", count: 18, cardBg: "bg-indigo-300 border-indigo-400/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" },
    { name: "Blocked Drains", icon: "🌧️", count: 77, cardBg: "bg-violet-400 border-violet-500/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" },
    { name: "Uncovered Manholes", icon: "🕳️", count: 42, cardBg: "bg-lime-400 border-lime-500/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" },
    { name: "Water Leakage", icon: "💧", count: 135, cardBg: "bg-cyan-400 border-cyan-500/30", iconBg: "bg-black/10 border border-black/10", badgeBg: "bg-black/10" }
  ];

  // Real-time stats states
  const [stats, setStats] = useState<any>(null);
  const [flashingCategory, setFlashingCategory] = useState<string | null>(null);
  const [liveCounts, setLiveCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // 1. Listen to real-time stats document in Firestore
    const unsubscribeStats = onSnapshot(
      doc(db, "systemStats", "bhopal"),
      (docSnap) => {
        if (docSnap.exists()) {
          setStats(docSnap.data());
        }
      },
      (err) => {
        console.error("Failed to subscribe to real-time stats:", err);
      }
    );

    // 2. Bind counters explicitly to real-time complaints collection utilizing the onSnapshot() listener hook
    const unsubscribeComplaints = onSnapshot(
      collection(db, "complaints"),
      (snapshot) => {
        const dbCounts: Record<string, number> = {};
        
        // Count complaints in Firestore
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.category) {
            dbCounts[data.category] = (dbCounts[data.category] || 0) + 1;
          }
        });

        // Compute the combined values using systemStats baseline and real-time database records
        const updatedCounts: Record<string, number> = {};
        categories.forEach((cat) => {
          const baseCount = stats?.categoryCounts?.[cat.name] ?? cat.count;
          const currentDbCount = dbCounts[cat.name] || 0;
          updatedCounts[cat.name] = baseCount + currentDbCount;
        });

        setLiveCounts((prevCounts) => {
          // Whenever an Admin or Officer updates a ticket status, increments a counter,
          // or resolves a complaint, trigger an instant update and flash animation
          Object.keys(updatedCounts).forEach((catName) => {
            if (prevCounts[catName] !== undefined && updatedCounts[catName] > prevCounts[catName]) {
              setFlashingCategory(catName);
              setTimeout(() => {
                setFlashingCategory(null);
              }, 4000);
            }
          });
          return updatedCounts;
        });
      },
      (err) => {
        console.error("Failed to subscribe to real-time complaints counter:", err);
      }
    );

    return () => {
      unsubscribeStats();
      unsubscribeComplaints();
    };
  }, [stats?.categoryCounts]);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Waste Management");
  const [severity, setSeverity] = useState<"High" | "Medium" | "Low">("Medium");
  const [lat, setLat] = useState(23.2599);
  const [lng, setLng] = useState(77.4126);
  const [address, setAddress] = useState("");

  // Multimodal upload/mic states
  const [isClassifying, setIsClassifying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [classificationResult, setClassificationResult] = useState<any>(null);
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "audio" | null>(null);

  // Search/Tracker states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);

  // Map references
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const recIntervalRef = useRef<any>(null);
  const mediaRecorderRef = useRef<any>(null);
  const audioChunksRef = useRef<any[]>([]);

  // Animated quote & background changes depending on hour
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getCivicQuote = () => {
    const hour = currentTime.getHours();
    if (hour < 12) {
      return {
        greeting: "GOOD MORNING",
        quote: "Cleanliness is next to godliness. Let's make our neighborhood shine today.",
        style: "from-cyan-600 via-blue-700 to-indigo-800 shadow-2xl shadow-cyan-500/20 border-cyan-400/20"
      };
    } else if (hour < 17) {
      return {
        greeting: "CIVIC PULSE ACTIVE",
        quote: "Active participation in civic duties is the core strength of democracy.",
        style: "from-indigo-600 via-purple-700 to-rose-600 shadow-2xl shadow-indigo-500/20 border-white/10"
      };
    } else {
      return {
        greeting: "GOOD EVENING",
        quote: "Your vigilance powers our city's safety. Thank you for staying proactive.",
        style: "from-purple-800 via-rose-700 to-slate-900 shadow-2xl shadow-rose-500/20 border-purple-500/20"
      };
    }
  };

  const activeTheme = getCivicQuote();

  // Handle Geolocation auto-capture
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const currentLat = position.coords.latitude;
          const currentLng = position.coords.longitude;
          setLat(currentLat);
          setLng(currentLng);
          reverseGeocode(currentLat, currentLng);
          if (mapRef.current && markerRef.current) {
            mapRef.current.setView([currentLat, currentLng], 14);
            markerRef.current.setLatLng([currentLat, currentLng]);
          }
        },
        (error) => console.log("Geolocation error:", error),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Map initialization inside standard ref
  useEffect(() => {
    if (activeTab === "report" && mapContainerRef.current && !mapRef.current) {
      // Create Map
      const mapInstance = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([lat, lng], 14);

      // Standard Day and Land view (OpenStreetMap standard layer similar to Google Maps)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapInstance);

      // Draggable marker with custom pulsing icon or standard default icon
      const markerInstance = L.marker([lat, lng], {
        draggable: true
      }).addTo(mapInstance);

      // Bind drag event to update fields
      markerInstance.on("dragend", () => {
        const position = markerInstance.getLatLng();
        setLat(position.lat);
        setLng(position.lng);
        reverseGeocode(position.lat, position.lng);
      });

      mapRef.current = mapInstance;
      markerRef.current = markerInstance;
    }

    // Cleanup map on tab switches
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [activeTab]);

  const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
      );
      const data = await response.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
      }
    } catch (err) {
      setAddress(`Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`);
    }
  };

  // Convert File to Base64 for Multimodal Classification
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setUploadedBase64(base64);
      setMediaType("image");
      triggerMultimodalClassification(base64, "image");
    };
    reader.readAsDataURL(file);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Simulated & Real Voice Record trigger (State-Driven MediaRecorder Loop)
  const toggleVoiceRecording = async () => {
    if (isRecording) {
      // STOP RECORDING: Transition to State 3 (Processing)
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      clearInterval(recIntervalRef.current);
      setIsRecording(false);
    } else {
      // START RECORDING: Transition to State 2 (Recording)
      setRecordDuration(0);
      audioChunksRef.current = [];
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          // Instantly terminate active tracks to release device mic hardware
          stream.getTracks().forEach((track) => track.stop());

          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            setUploadedBase64(base64);
            setMediaType("audio");
            await triggerMultimodalClassification(base64, "audio");
          };
          reader.readAsDataURL(audioBlob);
        };

        mediaRecorder.start();
        setIsRecording(true);
        recIntervalRef.current = setInterval(() => {
          setRecordDuration((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.warn("Browser microphone blocked or not supported. Falling back to secure audio simulation:", err);
        // Resilient Fallback Simulation for browser security/iframe sandbox sandboxing
        setIsRecording(true);
        recIntervalRef.current = setInterval(() => {
          setRecordDuration((prev) => prev + 1);
        }, 1000);

        // Assign a mock mediaRecorder.stop handler
        mediaRecorderRef.current = {
          stop: () => {
            const simulatedAudio = "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAAA";
            setUploadedBase64(simulatedAudio);
            setMediaType("audio");
            triggerMultimodalClassification(simulatedAudio, "audio");
          }
        };
      }
    }
  };

  const triggerMultimodalClassification = async (base64: string, type: "image" | "audio") => {
    setIsClassifying(true);
    setClassificationResult(null);

    try {
      const response = await fetch("/api/complaints/classify-multimodal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaType: type,
          base64Image: type === "image" ? base64 : undefined,
          base64Audio: type === "audio" ? base64 : undefined
        })
      });

      const parsed = await response.json();
      if (parsed && !parsed.error) {
        setClassificationResult(parsed);
        setTitle(parsed.summary || "");
        setDescription(parsed.details || "");
        setCategory(parsed.category || "Waste Management");
        setSeverity(parsed.severity || "Medium");

        // Trigger flash animation for detected category card!
        if (parsed.category) {
          setFlashingCategory(parsed.category);
          setTimeout(() => {
            setFlashingCategory(null);
          }, 4000);
        }
      }
    } catch (err) {
      console.error("Failed parsing multimodal payload:", err);
    } finally {
      setIsClassifying(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    const payload = {
      title,
      description,
      category,
      severity,
      location: {
        latitude: lat,
        longitude: lng,
        address
      },
      reporterName: user.name,
      reporterEmail: user.email,
      reporterPhone: user.phone || "",
      mediaUrl: mediaType === "image" ? uploadedBase64 : undefined,
      mediaType: mediaType || undefined
    };

    const newTicket = await onSubmitComplaint(payload);
    if (newTicket) {
      // Instantly increment and flash the counter on submission to bypass any synchronization lag
      const submittedCategory = payload.category;
      setLiveCounts((prev) => ({
        ...prev,
        [submittedCategory]: (prev[submittedCategory] || 0) + 1
      }));
      setFlashingCategory(submittedCategory);
      setTimeout(() => {
        setFlashingCategory(null);
      }, 4000);

      // Switch immediately to Tracker status view
      setSelectedComplaint(newTicket);
      setActiveTab("status");

      // Reset form states
      setTitle("");
      setDescription("");
      setUploadedBase64(null);
      setMediaType(null);
      setClassificationResult(null);
    }
  };

  // Helper for tracking timelines
  const getTimelineStepIndex = (status: ComplaintStatus): number => {
    switch (status) {
      case "Registered":
        return 0;
      case "Dispatched":
        return 1;
      case "In Progress":
        return 2;
      case "Resolved":
        return 3;
      case "Verification Failed":
        return 2; // rollback state visually
      default:
        return 0;
    }
  };

  // Simulates Gemini multimodal classification entirely on client side for sandbox safety
  const simulatedMultimodalPayloadClassifier = (messageText: string) => {
    const text = messageText.toLowerCase();
    let category = "Sanitation Related";
    let severity: "High" | "Medium" | "Low" = "Medium";
    let summary = "Civic complaint logged via WhatsApp";
    let details = "Automated transcription: " + messageText;

    if (text.includes("leak") || text.includes("water")) {
      category = "Water Leakage";
      severity = "Medium";
      summary = "Water line leakage on pavement";
      details = "WhatsApp Voice Note: 'Water leaking from a major pipe on Ward 2 main road.' Transcribed and classified into Water Leakage queue.";
    } else if (text.includes("garbage") || text.includes("waste") || text.includes("dustbin") || text.includes("overflowing")) {
      category = "Waste Management";
      severity = "High";
      summary = "Overflowing public dump bin";
      details = "WhatsApp Voice Note: 'Main waste bin overflowing in front of Central Market.' Mapped and routed automatically.";
    } else if (text.includes("light") || text.includes("dark") || text.includes("streetlights")) {
      category = "Broken Streetlights";
      severity = "Medium";
      summary = "Broken streetlight causing lane dark zone";
      details = "WhatsApp Voice Note: 'Streetlight bulb broken since 2 days, lane is fully dark.' Safety hazard flagged.";
    } else if (text.includes("pothole") || text.includes("hole") || text.includes("road")) {
      category = "Potholes";
      severity = "High";
      summary = "Deep road pothole vehicle hazard";
      details = "WhatsApp Voice Note: 'Pothole detected near Ward 5. Unsafe for night driving!' Mapped to PWD queue.";
    } else if (text.includes("manhole") || text.includes("uncovered")) {
      category = "Uncovered Manholes";
      severity = "High";
      summary = "Dangerous uncovered drainage manhole";
      details = "WhatsApp Voice Note: 'Uncovered manhole near public park entrance, please fix fast!' Urgent priority level assigned.";
    }

    return { category, severity, summary, details };
  };

  const simulatedAutomaticDepartmentRoutingEngine = (category: string) => {
    const routingMap: Record<string, { department: string; officerName: string; officerId: string }> = {
      "Waste Management": { department: "Waste Management", officerName: "Officer Vignesh", officerId: "officer-waste" },
      "Potholes": { department: "Public Works Department", officerName: "Officer Sandeep", officerId: "officer-potholes" },
      "Broken Streetlights": { department: "Electricity Department", officerName: "Officer Priya", officerId: "officer-lights" },
      "Sanitation Related": { department: "Sanitation Department", officerName: "Officer Ramesh", officerId: "officer-sanitation" },
      "Road Related": { department: "Public Works Department", officerName: "Officer Sandeep", officerId: "officer-potholes" },
      "Damaged Bridges": { department: "Public Works Department", officerName: "Officer Sandeep", officerId: "officer-potholes" },
      "Blocked Drains": { department: "Water Supply Department", officerName: "Officer Amit", officerId: "officer-water" },
      "Uncovered Manholes": { department: "Water Supply Department", officerName: "Officer Amit", officerId: "officer-water" },
      "Water Leakage": { department: "Water Supply Department", officerName: "Officer Amit", officerId: "officer-water" },
    };
    return routingMap[category] || { department: "Sanitation Department", officerName: "Officer Ramesh", officerId: "officer-sanitation" };
  };

  return (
    <div className="space-y-6 relative">
      {/* Premium Slate-Dark Base Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A] -z-20 pointer-events-none" />

      {/* The Heroic Background Layer */}
      <div 
        className="bg-cover bg-center blur-md opacity-25 fixed inset-0 -z-10" 
        style={{ backgroundImage: `url(${smartCityBg})` }}
      />

      {/* BHOPAL SMART CITY HIGH-FIDELITY SPLIT BANNER */}
      <motion.div
        className="rounded-3xl relative overflow-hidden bg-slate-900/60 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl opacity-30"></div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch">
          {/* Left Text / Info Panel */}
          <div className="lg:col-span-7 p-6 md:p-8 space-y-4 text-left z-10 flex flex-col justify-center">
            <span className="text-[10px] font-bold text-teal-400 font-mono bg-teal-400/10 border border-teal-500/20 px-3 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1 w-fit">
              <Sparkles className="w-3 h-3 text-teal-400 animate-pulse" /> {activeTheme.greeting} • CIVIC INTEGRATION HUB
            </span>
            <div className="space-y-1 relative">
              {/* Vibrant glowing background gradient pop layer behind text */}
              <div className="absolute -inset-x-6 -inset-y-3 bg-gradient-to-r from-emerald-500/25 via-amber-500/15 to-transparent blur-xl rounded-3xl pointer-events-none -z-10" />
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none text-white font-display relative z-10 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                Aapki Seva Mein Tatpar
              </h1>
              <h2 className="text-xs md:text-sm font-semibold text-teal-400 tracking-wide font-mono uppercase relative z-10 drop-shadow-[0_1px_5px_rgba(0,0,0,0.8)]">
                Bhopal Smart City Action Node
              </h2>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed max-w-xl">
              Welcome to the official high-resolution citizen-municipal resolution grid. Log structural damage, sewage overflows, road safety hazards, or lighting defects. Our cognitive routing dispatch pipeline assigns local officers in real time.
            </p>
            <div className="pt-2 border-t border-white/5 text-slate-400 max-w-xl text-[11px] italic leading-relaxed">
              "{activeTheme.quote}"
            </div>
          </div>

          {/* Right Sleek Realistic Image Banner Frame */}
          <div className="lg:col-span-5 relative h-52 lg:h-auto min-h-[220px] w-full overflow-hidden rounded-b-3xl lg:rounded-b-none lg:rounded-r-3xl">
            <img 
              src={civicHeroVectorArt} 
              alt="Bhopal Smart City Action Pipeline" 
              className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-700 hover:scale-105"
              referrerPolicy="no-referrer"
            />
            {/* Gradient overlay to blend left side with image */}
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0F172A] via-[#0F172A]/40 to-transparent" />
            
            {/* Quick stats badge floating */}
            <div className="absolute bottom-4 right-4 bg-slate-950/85 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
              <div className="text-right">
                <div className="text-4xl font-black tracking-tighter leading-none text-teal-400 font-mono">
                  {(() => {
                    if (stats && (stats.totalCount || 0) > 0) {
                      return Math.round(((stats.resolvedCount || 0) / (stats.totalCount || 1)) * 100);
                    }
                    const total = complaints.length;
                    const resolved = complaints.filter(c => c.status === "Resolved").length;
                    return total > 0 ? Math.round((resolved / total) * 100) : 92;
                  })()}<span className="text-sm opacity-60 text-white">%</span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mt-1">Resolution Efficiency (Solved)</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* CIVIC PULSE STATS HUB (Bento Grid) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-black uppercase tracking-widest text-teal-400 font-mono">
            REAL TIME RESOLUTION INDEX
          </h3>
          <span className="text-slate-500 text-xs font-mono uppercase tracking-widest">LIVE MUNICIPAL TELEMETRY</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
          {(() => {
            const categoryColors: Record<string, string> = {
              "Waste Management": "bg-[#F59E0B]", // Vibrant Amber
              "Potholes": "bg-[#EF4444]", // Vibrant Soft Red
              "Broken Streetlights": "bg-[#FBBF24]", // Vibrant Warm Yellow
              "Sanitation Related": "bg-[#10B981]", // Vibrant Emerald
              "Road Related": "bg-[#0EA5E9]", // Vibrant Sky Blue
              "Damaged Bridges": "bg-[#818CF8]", // Vibrant Pastel Indigo
              "Blocked Drains": "bg-[#A78BFA]", // Vibrant Pastel Violet
              "Uncovered Manholes": "bg-[#A3E635]", // Vibrant Mint Lime
              "Water Leakage": "bg-[#22D3EE]", // Vibrant Mint Cyan
            };

            return categories.map((cat) => {
              const finalCount = liveCounts[cat.name] !== undefined
                ? liveCounts[cat.name]
                : (stats?.categoryCounts?.[cat.name] !== undefined
                  ? stats.categoryCounts[cat.name]
                  : cat.count + (complaints.filter((c) => c.category === cat.name).length));

              const activeCount = complaints.filter(c => c.category === cat.name && c.status !== "Resolved" && c.status !== "Verification Failed").length;
              const solvedInCat = complaints.filter(c => c.category === cat.name && c.status === "Resolved").length;
              
              let badgeText = "Normal";
              let badgeClass = "bg-black/10 text-slate-950 border border-black/20 font-black";
              
              if (activeCount >= 2) {
                badgeText = "🔴 Critical";
                badgeClass = "bg-black/20 text-slate-950 border border-black/30 animate-pulse font-black";
              } else if (solvedInCat > 0) {
                badgeText = "🟢 Solved";
                badgeClass = "bg-black/20 text-slate-950 border border-black/30 font-black";
              } else {
                badgeText = "🔵 Normal";
                badgeClass = "bg-black/10 text-slate-950 border border-black/20 font-black";
              }

              const isFlashing = flashingCategory === cat.name;
              const cardBg = categoryColors[cat.name] || "bg-[#10B981]";
              const displayCount = isFlashing ? finalCount + 1 : finalCount;

              return (
                <motion.div
                  key={cat.name}
                  className={`border rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 cursor-pointer group shadow-2xl ${cardBg} ${
                    isFlashing
                      ? "ring-4 ring-cyan-400 shadow-[0_0_35px_rgba(34,211,238,0.8)] scale-105 border-black/30"
                      : "border-black/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105"
                  }`}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex justify-between items-start w-full mb-1">
                    <span className="text-xl p-1.5 rounded-xl border border-black/15 bg-black/10 text-slate-950">{cat.icon}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded font-mono uppercase tracking-tighter ${badgeClass}`}>
                      {badgeText}
                    </span>
                  </div>
                  <div className="text-left w-full mt-3">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-950 leading-tight line-clamp-1">
                      {cat.name}
                    </div>
                    <div className="text-3xl font-black font-mono mt-1 tracking-tight text-slate-950">
                      {displayCount.toString().padStart(3, "0")}
                    </div>
                  </div>
                </motion.div>
              );
            });
          })()}
        </div>
      </section>

      {/* DASHBOARD TABS NAVIGATION */}
      <div className="flex gap-4 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("report")}
          className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest font-display transition-all cursor-pointer ${
            activeTab === "report"
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-100 border-b-2 border-transparent"
          }`}
        >
          🚨 Nayi Shikayat Darj Karein (File Report)
        </button>
        <button
          onClick={() => setActiveTab("status")}
          className={`px-6 py-2.5 text-[11px] font-black uppercase tracking-widest font-display transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "status"
              ? "text-teal-400 border-b-2 border-teal-400"
              : "text-slate-400 hover:text-slate-100 border-b-2 border-transparent"
          }`}
        >
          My complaints & report tracker
          {complaints.filter((c) => c.reporterEmail === user.email).length > 0 && (
            <span className="bg-teal-500/10 text-teal-400 text-[9px] font-bold font-mono px-2 py-0.5 rounded border border-teal-400/20">
              {complaints.filter((c) => c.reporterEmail === user.email).length}
            </span>
          )}
        </button>
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div className="mt-4">
        {activeTab === "report" ? (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT REPORTING CARD */}
              <div className="lg:col-span-7 bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-5 md:p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-teal-500/10 rounded-lg border border-teal-500/20 text-teal-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold font-display text-white">💡 Samaj Sevak Portal - Aapki Shikayat (AI-Routed Terminal)</h4>
                      <p className="text-slate-400 text-xs">Apna photo upload karein ya bolkar samasya batayein</p>
                    </div>
                  </div>
                </div>

              {/* DRAG-AND-DROP MULTIMODAL HUB */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Drag Drop Area */}
                <div className="relative border border-dashed border-white/15 rounded-2xl p-5 hover:border-teal-500/30 transition-colors flex flex-col items-center justify-center text-center bg-black/40 min-h-[140px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  {uploadedBase64 && mediaType === "image" ? (
                    <div className="relative w-full h-28 rounded-lg overflow-hidden border border-white/10">
                      <img
                        src={uploadedBase64}
                        alt="Citizen upload proof"
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadedBase64(null);
                          setMediaType(null);
                        }}
                        className="absolute top-1 right-1 bg-black/60 hover:bg-black/90 text-white rounded-full p-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-500 mb-2 group-hover:text-teal-400" />
                      <span className="text-xs font-semibold text-slate-300">Drag & Drop Incident Proof Photo</span>
                      <span className="text-xxs text-slate-500 mt-1">Accepts live JPG/PNG (Max 10MB)</span>
                    </>
                  )}
                </div>

                {/* Voice Microphone Capture Node */}
                <div className={`relative border rounded-2xl p-5 flex flex-col items-center justify-center text-center transition-all ${
                  isRecording
                    ? "border-rose-500/40 bg-rose-500/5 animate-pulse"
                    : "border-white/15 hover:border-teal-500/30 bg-black/40"
                } min-h-[140px]`}>
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`w-14 h-14 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-all ${
                      isRecording
                        ? "bg-rose-500 hover:bg-rose-600 text-white scale-110"
                        : "bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/20"
                    }`}
                  >
                    {isRecording ? (
                      <span className="text-xs font-bold font-mono text-white animate-ping">●</span>
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </button>
                  <span className="text-xs font-bold text-slate-200 mt-3">
                    {isRecording ? `Recording... Tap again to Stop` : "Tap to Speak"}
                  </span>
                  {isRecording && (
                    <span className="text-sm font-mono font-bold text-rose-400 mt-1">
                      ⏱️ {formatTimer(recordDuration)}
                    </span>
                  )}
                  <span className="text-xxs text-slate-500 mt-0.5">
                    {mediaType === "audio" ? "Voice memo ready for analysis" : "Explain problem in native language"}
                  </span>
                </div>
              </div>

              {/* Classifying loader */}
              <AnimatePresence>
                {isClassifying && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-teal-950/40 border border-teal-500/20 rounded-xl p-3 flex items-center gap-3"
                  >
                    <Loader2 className="w-5 h-5 text-teal-400 animate-spin" />
                    <div>
                      <p className="text-xs font-semibold text-teal-200">AI Engine Deciding Category... Please Wait</p>
                      <p className="text-slate-400 text-xxs">Analyzing media features, transcribing coordinates, mapping category queues...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Autofill Notification */}
              {classificationResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl p-4 space-y-2 text-xs"
                >
                  <div className="flex items-center gap-1.5 font-bold text-emerald-400 font-mono">
                    <CheckCircle className="w-4 h-4" /> AI MULTIMODAL CLASSIFICATION RESULTS
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-slate-300 font-mono text-xxs">
                    <div>Category: <span className="text-emerald-300 font-bold">{classificationResult.category}</span></div>
                    <div>Severity: <span className="text-rose-400 font-bold">{classificationResult.severity}</span></div>
                  </div>
                  <p className="text-slate-400 text-xxs"><strong className="text-slate-200">Summarized Headline:</strong> "{classificationResult.summary}"</p>
                </motion.div>
              )}

              {/* Standard Form Inputs */}
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">📁 Issue Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      {categories.map((c) => (
                        <option key={c.name} value={c.name} className="bg-slate-950">
                          {c.icon} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">Severity / Priority</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(["Low", "Medium", "High"] as const).map((sev) => (
                        <button
                          key={sev}
                          type="button"
                          onClick={() => setSeverity(sev)}
                          className={`py-2 text-xs font-medium rounded-lg border cursor-pointer transition-all ${
                            severity === sev
                              ? sev === "High"
                                ? "bg-red-500/10 border-red-500 text-red-400"
                                : sev === "Medium"
                                ? "bg-amber-500/10 border-amber-500 text-amber-400"
                                : "bg-teal-500/10 border-teal-500 text-teal-400"
                              : "border-white/10 hover:bg-white/5 text-slate-400"
                          }`}
                        >
                          {sev}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">📌 Complaint Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="Short summary (e.g. Broken drainage valve flooding curb)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-slate-200 focus:outline-none focus:border-teal-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">📝 Incident Details</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide description of the context, ID tags on poles/meters if visible, or structural damage..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-2 px-3.5 text-slate-200 focus:outline-none focus:border-teal-500 text-sm"
                  />
                </div>

                {/* Draggable Geolocation Details */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-300 mb-1 font-mono">📍 Address</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl p-2 font-mono text-xxs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>Lat: {lat.toFixed(5)}</span>
                    </div>
                    <div className="flex items-center gap-1 bg-black/60 border border-white/10 rounded-xl p-2 font-mono text-xxs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>Lng: {lng.toFixed(5)}</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Retrieving current address..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl py-1.5 px-3 text-xxs text-slate-400 focus:outline-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  type="submit"
                  className="w-full cursor-pointer bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10 text-sm tracking-wide font-display"
                >
                  <Send className="w-4 h-4" /> ✍️ Shikayat Darj Karein (Submit Ticket)
                </motion.button>
              </form>
            </div>

            {/* RIGHT GEOLOCATION MAP CARD */}
            <div className="lg:col-span-5 bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-4 flex flex-col h-full min-h-[400px]">
              <div className="mb-3">
                <h4 className="text-sm font-bold text-white font-display">Drag Pin to Problem Spot</h4>
                <p className="text-slate-400 text-xxs">Verify exact municipal geolocation with street maps</p>
              </div>
              <div ref={mapContainerRef} className="w-full h-[320px] lg:h-[450px] z-10 rounded-2xl overflow-hidden" />
              <div className="mt-3 flex items-start gap-2 bg-black/60 border border-white/10 rounded-xl p-2.5 text-xxs text-slate-400">
                <Info className="w-3.5 h-3.5 text-teal-400 flex-shrink-0 mt-0.5" />
                <p>
                  Our internal router compares coordinates directly with active Officer shifts to optimize dispatch lines instantly.
                </p>
              </div>
            </div>
          </div>
          </div>
        ) : (
          /* MY REPORTS TRACKER TAB */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* MY TICKETS LIST */}
            <div className="lg:col-span-4 bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-4 space-y-3 max-h-[580px] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">My Reports</h4>
                <button
                  onClick={onRefreshComplaints}
                  className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {complaints.filter((c) => c.reporterEmail === user.email || c.reporterEmail === "mitra.bot@civic.gov").length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  Abhi tak koi shikayat darj nahi hui hai. (No reports filed yet)
                </div>
              ) : (
                complaints
                  .filter((c) => c.reporterEmail === user.email || c.reporterEmail === "mitra.bot@civic.gov")
                  .map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => setSelectedComplaint(ticket)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                        selectedComplaint?.id === ticket.id
                          ? "bg-teal-500/10 border-teal-500/40"
                          : "bg-black/40 border-white/5 hover:border-teal-400/20"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xxs font-mono font-bold text-teal-400">{ticket.id}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          ticket.status === "Resolved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : ticket.status === "In Progress"
                            ? "bg-amber-500/10 text-amber-400"
                            : ticket.status === "Dispatched"
                            ? "bg-blue-500/10 text-blue-400"
                            : "bg-slate-500/10 text-slate-400"
                        }`}>
                          {ticket.status}
                        </span>
                      </div>
                      <h5 className="text-slate-200 font-bold text-xs truncate">{ticket.title}</h5>
                      {(() => {
                        const sla = getSLAStatus(ticket, deadlines);
                        return (
                          <div className="text-[10px] font-mono mt-1.5 flex items-center justify-between text-slate-400">
                            <span className="truncate max-w-[120px]">{ticket.category}</span>
                            <span className={`font-bold px-1.5 py-0.5 rounded text-[8px] ${sla.isOverdue ? "text-rose-400 bg-rose-500/10" : "text-teal-400 bg-teal-500/10"}`}>
                              {sla.isOverdue ? "SLA Breached" : "On Schedule"}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                  ))
              )}
            </div>

            {/* HIGH-FIDELITY DETAILED TRACKER TIMELINE */}
            <div className="lg:col-span-8 bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-5 md:p-6 min-h-[400px]">
              {selectedComplaint ? (
                <div className="space-y-6 text-left">
                  {/* Complaint Details Header */}
                  <div className="border-b border-white/5 pb-4 space-y-2">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div>
                        <span className="text-xs font-mono font-bold text-teal-400">{selectedComplaint.id}</span>
                        <h3 className="text-xl font-bold font-display text-white mt-0.5">{selectedComplaint.title}</h3>
                      </div>
                      <span className={`self-start md:self-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        selectedComplaint.status === "Resolved"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : selectedComplaint.status === "In Progress"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      }`}>
                        {selectedComplaint.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xxs text-slate-400 font-mono pt-1">
                      <div>Category: <strong className="text-slate-300">{selectedComplaint.category}</strong></div>
                      <div>Priority: <strong className="text-slate-300">{selectedComplaint.severity}</strong></div>
                      <div>Registered: <strong className="text-slate-300">{new Date(selectedComplaint.createdAt).toLocaleString()}</strong></div>
                    </div>

                    {/* Resolution SLA Visual Display */}
                    {(() => {
                      const sla = getSLAStatus(selectedComplaint, deadlines);
                      return (
                        <div className={`mt-3 p-3.5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono bg-black/40 ${sla.color}`}>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-current animate-pulse" />
                              <span className="font-bold uppercase tracking-wider">Resolution SLA Status: {sla.label}</span>
                            </div>
                            <p className="text-[11px] text-slate-300">
                              This issue has a predefined Resolution Deadline of <strong className="text-white">{sla.hours} Hours</strong>.
                            </p>
                          </div>
                          <div className="md:text-right text-slate-300">
                            <div>Target: <strong className="text-white">{sla.deadlineFormatted}</strong></div>
                            <div className="font-bold text-teal-400 mt-0.5">{sla.timeLeftFormatted}</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Photo Proof attachments if uploaded */}
                  {selectedComplaint.mediaUrl && (
                    <div className="max-w-md border border-white/5 rounded-xl overflow-hidden shadow-inner bg-black/40">
                      <p className="bg-black/60 px-3 py-1 text-xxs text-slate-400 font-mono">Citizen Original Snapshot Attached</p>
                      <img src={selectedComplaint.mediaUrl} alt="Visual Proof" className="w-full max-h-48 object-cover" />
                    </div>
                  )}

                  {/* HORIZONTAL / VERTICAL COMPREHENSIVE TIMELINE */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-teal-400 font-mono">
                      Real-Time Resolution Progress Tracker
                    </h4>

                    {/* Step Graphics */}
                    <div className="relative pt-4 pb-2">
                      {/* Connection Line */}
                      <div className="absolute top-8 left-4 right-4 h-0.5 bg-slate-850" />
                      <div
                        className="absolute top-8 left-4 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-1000"
                        style={{
                           width: `${(getTimelineStepIndex(selectedComplaint.status) / 3) * 100}%`
                        }}
                      />

                      <div className="relative flex justify-between">
                        {[
                          { title: "Registered", desc: "Complaint Received", icon: AlertTriangle },
                          { title: "Dispatched", desc: "Dept AI Routed", icon: Sliders },
                          { title: "In Progress", desc: "Officer On-Site", icon: Clock },
                          { title: "Resolved", desc: "AI Verification Success", icon: CheckCircle }
                        ].map((step, idx) => {
                          const Icon = step.icon;
                          const currentActiveIdx = getTimelineStepIndex(selectedComplaint.status);
                          const isDone = idx <= currentActiveIdx;
                          const isCurrent = idx === currentActiveIdx;

                          return (
                            <div key={step.title} className="flex flex-col items-center text-center max-w-[80px] md:max-w-[120px] z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                                isDone
                                  ? isCurrent
                                    ? "bg-teal-500 border-teal-400 text-slate-950 shadow-[0_0_12px_rgba(20,184,166,0.5)]"
                                    : "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                                  : "bg-slate-900 border-slate-800 text-slate-500"
                              }`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <h5 className={`text-xxs font-bold mt-2 ${isDone ? "text-slate-100" : "text-slate-500"}`}>
                                {step.title}
                              </h5>
                              <p className="text-[9px] text-slate-500 leading-tight hidden md:block mt-0.5">
                                {step.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Log Entries */}
                  <div className="bg-black/40 border border-white/5 rounded-xl p-4 space-y-3">
                    <h5 className="text-xxs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                      System Automation & Verification Log Activity
                    </h5>
                    <div className="space-y-3 max-h-36 overflow-y-auto pr-1">
                      {selectedComplaint.timeline.map((event, idx) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                          <span className="text-[10px] font-mono text-teal-400 bg-teal-950/40 px-1.5 py-0.5 rounded border border-teal-950 flex-shrink-0 mt-0.5">
                            {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-200 block">{event.status}</span>
                            <p className="text-slate-400 text-xxs mt-0.5">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Anti-Fraud Audit Badge for Resolved complaints */}
                  {selectedComplaint.status === "Resolved" && selectedComplaint.verificationReason && (
                    <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 flex items-start gap-3">
                      <div className="p-1 bg-emerald-500/20 text-emerald-300 rounded-lg">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-emerald-400 font-mono">AI Verification Audit Pass</h5>
                        <p className="text-slate-300 text-xxs mt-1 italic">
                          "{selectedComplaint.verificationReason}"
                        </p>
                        {selectedComplaint.resolutionImageUrl && (
                          <div className="mt-3 border border-white/10 rounded-lg overflow-hidden max-w-sm">
                            <span className="bg-black/60 px-2.5 py-0.5 text-[9px] text-emerald-400 font-mono block border-b border-white/5">Officer Resolution Photo Uploaded</span>
                            <img src={selectedComplaint.resolutionImageUrl} alt="Resolution" className="max-h-36 w-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12 text-slate-500 text-center">
                  <Info className="w-12 h-12 text-slate-600 mb-3" />
                  <h4 className="text-sm font-semibold text-slate-400">Select a Ticket from Left Column</h4>
                  <p className="text-slate-500 text-xs max-w-xs mt-1">
                    Trace detailed live status transitions, AI routing logs, maps, and anti-fraud verification metrics.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
