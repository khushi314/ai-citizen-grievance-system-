import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserRole, UserProfile } from "../types";
import logoImg from "../assets/images/portal_logo_1782640442954.jpg";
import { Shield, User, Landmark, Mail, Phone, MapPin, Building, ArrowRight } from "lucide-react";

interface AuthProps {
  onLogin: (profile: UserProfile) => void;
}

export default function Auth({ onLogin }: AuthProps) {
  const [role, setRole] = useState<UserRole>("Citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Officer-specific state
  const [department, setDepartment] = useState("Waste Management");
  const [area, setArea] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");

  const [error, setError] = useState("");

  const departmentsList = [
    "Waste Management",
    "Roads & Infrastructure",
    "Electrical Department",
    "Sanitation Department",
    "Water & Sewage",
    "General Municipal Department"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Please fill in your Name and Email address.");
      return;
    }

    if (role === "Officer" && (!area.trim() || !officeAddress.trim())) {
      setError("Officers must provide Jurisdiction Area and Office Address.");
      return;
    }

    setError("");
    const profile: UserProfile = {
      name,
      email,
      phone,
      role,
      department: role === "Officer" ? department : undefined,
      area: role === "Officer" ? area : undefined,
      officeAddress: role === "Officer" ? officeAddress : undefined,
      points: role === "Officer" ? 450 : 120 // start with some default points for realistic look
    };

    onLogin(profile);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-8 relative">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
 
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-xl bg-slate-900/60 backdrop-blur-2xl rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl border border-white/10"
      >
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-500" />
 
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <motion.div 
              className="w-24 h-24 rounded-3xl overflow-hidden border border-white/20 shadow-2xl p-1 bg-[#090d1a]"
              whileHover={{ scale: 1.05, rotate: 2 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img 
                src={logoImg} 
                alt="Bhopal Smart City Logo" 
                className="w-full h-full object-cover rounded-2xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </div>
          <motion.h1
            className="text-4xl md:text-5xl font-black font-display tracking-tighter uppercase text-white leading-none"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            UNIFIED CITIZEN PORTAL
          </motion.h1>
          <p className="text-cyan-400 mt-2.5 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            RESPONSIVE AI-ORCHESTRATED REDRESSAL OPERATIONAL CONSOLE
          </p>
        </div>
 
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection Group */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-3 font-mono">
              SELECT PORTAL ACCESS ROLE
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { r: "Citizen", label: "CITIZEN", icon: User, color: "text-blue-400 border-white/5 bg-white/5 hover:bg-white/10" },
                { r: "Officer", label: "OFFICER", icon: Shield, color: "text-emerald-400 border-white/5 bg-white/5 hover:bg-white/10" },
                { r: "Admin", label: "ADMIN", icon: Landmark, color: "text-purple-400 border-white/5 bg-white/5 hover:bg-white/10" }
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = role === item.r;
                return (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => {
                      setRole(item.r as UserRole);
                      setError("");
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border text-xs font-black tracking-wider transition-all duration-300 cursor-pointer ${
                      isSelected
                        ? "border-cyan-400 bg-cyan-400/15 text-cyan-200 shadow-[0_0_15px_rgba(34,211,238,0.15)] scale-102"
                        : `${item.color} text-slate-300`
                    }`}
                  >
                    <Icon className={`w-5 h-5 mb-1.5 ${isSelected ? "text-cyan-400" : ""}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
 
          {/* Standard Input Fields */}
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-mono">FULL NAME</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-mono">EMAIL ADDRESS</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>

            {/* Optional Contact details */}
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 font-mono">PHONE NUMBER</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                  <Phone className="w-4 h-4" />
                </span>
                <input
                  type="tel"
                  placeholder="+91 99999 99999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Dynamic AnimatePresence Section for Officers */}
          <AnimatePresence initial={false}>
            {role === "Officer" && (
              <motion.div
                key="officer-fields"
                initial={{ opacity: 0, height: 0, scaleY: 0.95 }}
                animate={{ opacity: 1, height: "auto", scaleY: 1 }}
                exit={{ opacity: 0, height: 0, scaleY: 0.95 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="space-y-4 pt-4 border-t border-white/10 overflow-hidden"
              >
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1.5 font-mono">
                    DEPARTMENT SELECTION DROPDOWN
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#0b1329] border border-white/10 rounded-2xl py-3 px-4 text-slate-200 focus:outline-none focus:border-cyan-400 transition-colors font-sans"
                  >
                    {departmentsList.map((d) => (
                      <option key={d} value={d} className="bg-slate-950 text-slate-200">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1.5 font-mono">
                      ASSIGNED JURISDICTION / AREA
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <MapPin className="w-4 h-4 text-emerald-400" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Ward-2 (MG Road)"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1.5 font-mono">
                      OFFICE PHYSICAL ADDRESS
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500">
                        <Building className="w-4 h-4 text-emerald-400" />
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Substation Annex, Sector-4"
                        value={officeAddress}
                        onChange={(e) => setOfficeAddress(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-11 pr-4 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback/Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 text-xs font-semibold text-center font-mono"
            >
              {error}
            </motion.p>
          )}

          {/* Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            className="w-full cursor-pointer bg-gradient-to-r from-cyan-500 via-indigo-500 to-rose-600 hover:opacity-95 text-white font-black uppercase tracking-widest text-xs py-4 px-4 rounded-2xl flex items-center justify-center gap-2 shadow-2xl shadow-indigo-500/20 transition-all duration-300 mt-4 font-display"
          >
            <span>ENTER DASHBOARD CONSOLE</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
