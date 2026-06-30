import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, X, Send, Mic, Volume2, VolumeX, Sparkles, AlertCircle, Bot } from "lucide-react";
import { MitraMessage, UserProfile } from "../types";
import { db } from "../lib/firebase";
import { collection, addDoc, doc, getDoc, setDoc } from "firebase/firestore";

function SineWaveVisualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw 3 layers of overlapping sine waves for premium aesthetic
      const waves = [
        { amplitude: 15, frequency: 0.02, speed: 0.08, color: "rgba(20,184,166,0.5)" },   // Teal
        { amplitude: 10, frequency: 0.04, speed: 0.12, color: "rgba(16,185,129,0.3)" },   // Emerald
        { amplitude: 5, frequency: 0.06, speed: 0.16, color: "rgba(56,189,248,0.2)" }     // Sky Blue
      ];

      waves.forEach((w) => {
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = w.color;

        for (let x = 0; x < canvas.width; x++) {
          const y = canvas.height / 2 + Math.sin(x * w.frequency + offset * w.speed) * w.amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      offset += 0.5;
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={280}
      height={64}
      className="w-full h-16 rounded-xl bg-slate-950/80 border border-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.15)]"
    />
  );
}

interface MitraChatbotProps {
  user: UserProfile;
  onRefreshComplaints: () => void;
}

export default function MitraChatbot({ user, onRefreshComplaints }: MitraChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showHoverBubble, setShowHoverBubble] = useState(true);
  const [messages, setMessages] = useState<MitraMessage[]>([
    {
      id: "welcome",
      sender: "mitra",
      text: `🙏 Namaste ${user.name}! Main Aapka Citizen Guide Assistant hoon. Main aapko is portal ka upayog karna sikha sakta hoon! Aap is portal par "Tap to Speak" microphone ka upayog karke bolkar shikayat darj kar sakte hain, ya image upload karke proof de sakte hain. Mujhe Hindi, Gujarati, ya English mein kuch bhi poochiye, main aapki poori sahayata karoonga!`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [listeningStateText, setListeningStateText] = useState("Mitra is listening...");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const speakText = (text: string) => {
    if (!isAudioEnabled || !synthRef.current) return;

    // Stop previous utterance
    synthRef.current.cancel();

    // Remove system notes or ticket numbers from speech for natural audio
    const speechText = text.replace(/\[System Note:.*\]/g, "");

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.rate = 1.0;
    utterance.pitch = 1.1; // Friendly assistant tone

    // Dynamic Multi-lingual Speech Output Routing
    let detectedLang = "en-IN";
    if (/[\u0900-\u097F]/.test(text)) {
      detectedLang = "hi-IN"; // Hindi
    } else if (/[\u0A80-\u0AFF]/.test(text)) {
      detectedLang = "gu-IN"; // Gujarati
    }
    utterance.lang = detectedLang;

    // Choose a female/pleasant voice if available
    const voices = synthRef.current.getVoices();
    const langVoice = voices.find(v => v.lang.toLowerCase().replace("_", "-").startsWith(detectedLang.toLowerCase()));
    if (langVoice) {
      utterance.voice = langVoice;
    } else {
      const indVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-US") || v.lang.includes("hi-IN"));
      if (indVoice) utterance.voice = indVoice;
    }

    synthRef.current.speak(utterance);
  };

  const handleSendMessage = async (textToSend: string) => {
    // Strict Guardrail Check: Abort on empty string, whitespace, null, or noise tokens
    const cleanText = (textToSend || "").trim();
    const noiseTokens = [
      "", "null", "undefined", "[noise]", "[background noise]", "[music]", "[silence]",
      "background noise", "noise", "silence", "[cough]", "[sigh]", "cough", "sigh"
    ];
    if (!cleanText || noiseTokens.includes(cleanText.toLowerCase())) {
      console.warn("Ghosting Guardrail Active: Empty/Noise voice transcript aborted. No API call triggered.");
      setIsTyping(false);
      setIsListening(false);
      return;
    }

    const userMessage: MitraMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: cleanText,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    try {
      // 1. System Prompt Instruction Directive for language locking and Citizen Guide persona
      const promptDirective = `\n\n[System Instruction Directive: You are Mitra, the Citizen Guide Assistant. You must communicate strictly using highly conversational, clear Natural Language Processing (NLP). Your core objective is to act as a highly intuitive, seamless onboarding helper designed to guide citizens step-by-step through operating the entire application ecosystem, tracking statuses, and submitting multi-modal inputs. You MUST NOT log or register tickets in the database. Instead, warmly guide citizens on how to use the portal. Explain that they can file reports easily by using the "Tap to Speak" microphone (bolkar shikayat darj karne ke liye) and the image upload fields to add photo proof. Dynamically analyze the language of the message above. If it is in Hindi, you MUST reply entirely in Hindi. If in Gujarati, you MUST reply entirely in Gujarati. If in English, Hinglish, or Gujlish, respond in that exact natural conversational tone. Keep it highly warm, polite, and reassuring. Keep the response short (2-3 sentences) and conversational. No markdown.]`;

      const textWithDirective = `${cleanText}${promptDirective}`;

      // 2. Priming system instruction injected in conversation history to enforce behavior
      const systemPrimingItem = {
        sender: "user" as const,
        text: `SYSTEM INSTRUCTION PRIMER: You are Mitra, the Citizen Guide Assistant.
        Rules:
        1. ROLE & OBJECTIVE: You must communicate strictly using highly conversational, clear Natural Language Processing (NLP). Your core objective is to act as a highly intuitive, seamless onboarding helper designed to guide citizens step-by-step through operating the entire application ecosystem, tracking statuses, and submitting multi-modal inputs. You DO NOT register tickets or complaints directly.
        2. EXPLAIN CONTROLS: Warmly guide the user on how to use the "Tap to Speak" microphone to record their issue and the image upload fields to submit photo proof.
        3. LANGUAGE MODE: If asked in Hindi, Gujarati, or English/Hinglish, reply warmly in that exact language.
        4. TONE & FORMAT: Warm, respectful, clear, and encouraging. Keep it short (2-3 sentences) and conversational without markdown.`
      };

      const historyList = messages.slice(-6).map((m) => ({
        sender: m.sender,
        text: m.text
      }));

      const fullHistory = [systemPrimingItem, ...historyList];

      const response = await fetch("/api/mitra/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textWithDirective,
          userName: user.name,
          history: fullHistory
        })
      });

      const data = await response.json();
      setIsTyping(false);

      if (data && data.response) {
        const botMessage: MitraMessage = {
          id: `msg-${Date.now() + 1}`,
          sender: "mitra",
          text: data.response,
          timestamp: new Date().toISOString()
        };
        setMessages((prev) => [...prev, botMessage]);

        // Speak response aloud in detected language
        speakText(data.response);

        // If ticket was created, parse and save directly to Firestore, then increment statistics
        if (data.response.includes("[System Note:")) {
          let parsedCategory = "Sanitation Related";
          let parsedId = `comp-m${Date.now().toString().slice(-5)}`;
          try {
            const idMatch = data.response.match(/Ticket #([a-zA-Z0-9-]+)/);
            if (idMatch && idMatch[1]) {
              parsedId = idMatch[1];
            }
            const catMatch = data.response.match(/inside\s+([^for]+?)\s+for\s+you/i);
            if (catMatch && catMatch[1]) {
              parsedCategory = catMatch[1].trim();
            }
          } catch (e) {
            console.error("Failed to parse system note details:", e);
          }

          const validCategories = [
            "Waste Management",
            "Potholes",
            "Broken Streetlights",
            "Sanitation Related",
            "Road Related",
            "Damaged Bridges",
            "Blocked Drains",
            "Uncovered Manholes",
            "Water Leakage"
          ];
          const category = validCategories.find(
            (c) => c.toLowerCase() === parsedCategory.toLowerCase()
          ) || "Sanitation Related";

          // Add complaint document to Firestore using addDoc(collection(db, "complaints"), { ... })
          const docData = {
            id: parsedId,
            title: `Mitra Chatbot: ${category}`,
            description: cleanText,
            category: category,
            severity: "Medium" as const,
            status: "Pending", // Set default to "Pending"
            timestamp: new Date().toISOString(),
            createdAt: new Date().toISOString(),
            reporterName: user.name || "Citizen User",
            reporterEmail: user.email,
            citizenId: user.email, // Maps to the actively logged-in user's UID (email acts as unique identifier)
            location: {
              latitude: 23.2599 + (Math.random() - 0.5) * 0.02,
              longitude: 77.4126 + (Math.random() - 0.5) * 0.02,
              address: "Mitra Voice Companion Captured Area, Bhopal"
            },
            timeline: [
              {
                status: "Pending" as const,
                timestamp: new Date().toISOString(),
                description: "Ticket registered via Mitra Voice Companion chatbot."
              }
            ]
          };

          addDoc(collection(db, "complaints"), docData)
            .then(async () => {
              try {
                // Trigger Global Count Increment
                const statsRef = doc(db, "systemStats", "bhopal");
                const statsSnap = await getDoc(statsRef);
                if (statsSnap.exists()) {
                  const currentStats = statsSnap.data();
                  const categoryCounts = { ...(currentStats.categoryCounts || {}) };
                  categoryCounts[category] = (categoryCounts[category] || 0) + 1;
                  await setDoc(statsRef, {
                    totalCount: (currentStats.totalCount || 0) + 1,
                    categoryCounts
                  }, { merge: true });
                }
              } catch (statsErr) {
                console.error("Failed to update global count increment:", statsErr);
              }
              
              // Refresh complaints list
              onRefreshComplaints();
            })
            .catch((err) => {
              console.error("Failed to write Mitra chatbot ticket directly to Firestore:", err);
              // Fallback refresh
              onRefreshComplaints();
            });
        }
      }
    } catch (err) {
      console.error("Mitra Bot communication failed:", err);
      setIsTyping(false);
    }
  };

  // State-Driven Speech Recognition with fallback simulation
  const triggerVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.error(e);
        }
      }
      setIsListening(false);
      return;
    }

    setIsListening(true);
    setListeningStateText("Mitra is listening...");

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "hi-IN"; // Optimize for Indian multilingual contexts

        rec.onstart = () => {
          setListeningStateText("Mitra is listening...");
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript && transcript.trim()) {
            const cleaned = transcript.trim();
            const noiseTokens = ["[noise]", "[cough]", "[sigh]", "background noise", "cough", "noise", "silence"];
            if (!cleaned || noiseTokens.includes(cleaned.toLowerCase())) {
              console.warn("Detected voice noise/silence token. Aborting pipeline.");
              setListeningStateText("No clear speech detected. Please try again.");
              setIsListening(false);
              return;
            }
            
            // Transition to state 3 (Processing)
            setListeningStateText("Mitra is understanding...");
            setTimeout(() => {
              setIsListening(false);
              handleSendMessage(cleaned);
            }, 1000);
          } else {
            console.warn("Empty speech recognition transcript.");
            setListeningStateText("Could not understand. Please speak again.");
            setIsListening(false);
          }
        };

        rec.onerror = (err: any) => {
          console.warn("Speech recognition error, using safe fallback simulation:", err);
          fallbackSimulation();
        };

        rec.onend = () => {
          // Will be handled dynamically, avoid resetting states too early
        };

        recognitionRef.current = rec;
        rec.start();
      } catch (err) {
        console.warn("Could not start speech recognition, running fallback:", err);
        fallbackSimulation();
      }
    } else {
      fallbackSimulation();
    }
  };

  const fallbackSimulation = () => {
    setListeningStateText("Mitra is listening...");
    
    // Choose a random realistic multilingual report
    const simulatedPhases = [
      "MG Road ward 2 par street light kharab hai, lane me andhera hai", // Hindi
      "અહીંયા પાણીની પાઇપલાઇન લીક થઈ ગઈ છે, જલ્દી સરખી કરો", // Gujarati
      "There is a huge garbage pile overflowing near the Central Market entrance", // English
      "Hamare ward me road par bada pothole hai, please fix it" // Hinglish
    ];

    const randomChoice = simulatedPhases[Math.floor(Math.random() * simulatedPhases.length)];

    setTimeout(() => {
      setListeningStateText("Mitra is understanding...");
      setTimeout(() => {
        setIsListening(false);
        handleSendMessage(randomChoice);
      }, 1500);
    }, 2000);
  };

  return (
    <>
      {/* HOVER/LOAD HELLO BUBBLE */}
      <AnimatePresence>
        {!isOpen && showHoverBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="fixed bottom-24 right-6 z-50 max-w-[280px] bg-black/85 backdrop-blur-2xl border border-white/10 p-3.5 rounded-2xl shadow-2xl flex flex-col gap-2 cursor-pointer text-left"
            onClick={() => {
              setIsOpen(true);
              setShowHoverBubble(false);
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-teal-400 font-mono uppercase tracking-widest flex items-center gap-1">
                Your Support System
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowHoverBubble(false);
                }}
                className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-white/5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
            <p className="text-slate-200 text-xs leading-relaxed">
              🙏 Namaste! Main Aapka Samaj Sevak Hoon. Bol Kar Apni Samasya Batayein.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING ACTION BADGE - DARK-GLASS ORB */}
      <motion.button
        id="mitra-fab"
        onClick={() => {
          setIsOpen(!isOpen);
          setShowHoverBubble(false);
        }}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-br from-slate-900/95 to-black/95 backdrop-blur-2xl hover:scale-110 transition-all duration-300 shadow-[0_0_30px_rgba(20,184,166,0.3)] cursor-pointer z-50 border-2 border-teal-500/40 flex items-center justify-center overflow-hidden"
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulsing Outer Aura Ring */}
        <span className="absolute inset-0 rounded-full border-2 border-teal-400/45 animate-ping opacity-25 scale-105 pointer-events-none" />
        <span className="absolute inset-1 rounded-full border border-emerald-400/30 animate-pulse opacity-40 pointer-events-none" />

        {isOpen ? (
          <div className="relative z-10 text-white hover:rotate-90 transition-transform duration-300">
            <X className="w-6 h-6" />
          </div>
        ) : (
          /* Dark Glass Orb Glowing Center */
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Spinning background neon radial */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-teal-500/20 via-blue-500/10 to-emerald-500/20 animate-spin" style={{ animationDuration: '6s' }} />
            {/* Glowing Orb Sphere Core */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-teal-400 to-emerald-400 shadow-[0_0_15px_rgba(45,212,191,0.65)] animate-pulse flex items-center justify-center">
              <Bot className="w-4.5 h-4.5 text-slate-950" />
            </div>
          </div>
        )}
      </motion.button>

      {/* CHAT INTERFACE WINDOW */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="mitra-chat-window"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-24 right-6 w-full max-w-[360px] md:max-w-[400px] h-[520px] bg-black/50 backdrop-blur-2xl border border-white/10 shadow-2xl rounded-3xl flex flex-col z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-teal-950/60 to-slate-950 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full border border-teal-500/40 flex-shrink-0 bg-gradient-to-br from-slate-900 to-black flex items-center justify-center relative shadow-[0_0_15px_rgba(20,184,166,0.25)] overflow-hidden">
                  <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-teal-500/25 via-emerald-500/10 to-blue-500/25 animate-spin" style={{ animationDuration: '4s' }} />
                  <Bot className="w-5 h-5 text-teal-400 relative z-10 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white font-display flex items-center gap-1">
                    Samaj Sevak Mitra <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  </h4>
                  <span className="text-[10px] text-teal-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span> Aapki Seva Mein Tatpar, 24x7
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* TTS Toggle */}
                <button
                  onClick={() => {
                    setIsAudioEnabled(!isAudioEnabled);
                    if (isAudioEnabled && synthRef.current) synthRef.current.cancel();
                  }}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                    isAudioEnabled ? "text-teal-400 hover:bg-teal-500/10" : "text-slate-500 hover:bg-white/5"
                  }`}
                  title={isAudioEnabled ? "Mute Voice Response" : "Unmute Voice Response"}
                >
                  {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Chat message space */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/20">
              {messages.map((m) => {
                const isUser = m.sender === "user";
                const isSystem = m.text.includes("[System Note:");
                const textDisplay = m.text.replace(/\[System Note:.*\]/g, "");
                const systemNote = m.text.match(/\[System Note: (.*)\]/)?.[1];

                return (
                  <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                    <div className="max-w-[85%] space-y-1">
                      <div
                        className={`p-3.5 rounded-2xl text-xs leading-relaxed text-left shadow-md ${
                          isUser
                            ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-semibold rounded-tr-none"
                            : "bg-black/60 border border-white/5 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        <p className="whitespace-pre-line">{textDisplay}</p>

                        {/* System Alert Embedded Inside Mitra Message */}
                        {systemNote && (
                          <div className="mt-2.5 bg-teal-500/10 border border-teal-500/30 text-teal-300 rounded-lg p-2 flex items-start gap-1.5 text-[10px] font-mono leading-snug">
                            <AlertCircle className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                            <span>{systemNote}</span>
                          </div>
                        )}
                      </div>
                      <span className="block text-[9px] text-slate-500 text-right font-mono px-1">
                        {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-black/60 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 shadow-md">
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                    <span className="w-1.5 h-1.5 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                  </div>
                </div>
              )}

              {/* Listening Audio Waves */}
              {isListening && (
                <div className="flex flex-col items-center justify-center p-4 bg-teal-500/5 border border-teal-500/15 rounded-xl space-y-3">
                  <SineWaveVisualizer />
                  <span className="text-[10px] font-mono text-teal-300">{listeningStateText}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-slate-950 border-t border-white/5 flex items-center gap-2">
              <button
                onClick={triggerVoiceInput}
                className={`p-2.5 rounded-xl cursor-pointer border transition-colors ${
                  isListening
                    ? "bg-red-500 text-white border-red-500 animate-pulse"
                    : "bg-black/60 hover:bg-white/5 border-white/10 text-teal-400 hover:text-teal-300"
                }`}
                title="Tap to speak"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder="Ask Mitra or report an issue..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                className="flex-1 bg-black/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />

              <button
                onClick={() => handleSendMessage(inputValue)}
                className="p-2.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 rounded-xl cursor-pointer shadow transition-all flex items-center justify-center font-bold"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
