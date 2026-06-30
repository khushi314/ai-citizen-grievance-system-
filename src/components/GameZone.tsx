import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, Award, Gamepad2, HelpCircle, Star, ArrowRight, Play, RefreshCw, Volume2 } from "lucide-react";
import { QuizQuestion, LeaderboardUser, UserProfile } from "../types";

interface GameZoneProps {
  user: UserProfile;
  onAddUserPoints: (pts: number) => void;
}

export default function GameZone({ user, onAddUserPoints }: GameZoneProps) {
  const [activeSubTab, setActiveSubTab] = useState<"catcher" | "quiz" | "leaderboard">("catcher");

  // Leaderboard Mock lists
  const leaderboardData: LeaderboardUser[] = [
    { rank: 1, name: "Rohan Malhotra", points: 840, badges: ["🏆 Grand Marshal", "🌳 Eco Warrior"], resolvedCount: 16 },
    { rank: 2, name: "Dr. Sunita Rao", points: 720, badges: ["🥇 Elder Protector", "💡 Lightkeeper"], resolvedCount: 12 },
    { rank: 3, name: "Ananya Sen", points: 610, badges: ["🥈 Community Hero"], resolvedCount: 10 },
    { rank: 4, name: user.name, points: user.points || 280, badges: ["🥉 Vigilant Guard"], resolvedCount: 5 },
    { rank: 5, name: "John Doe", points: 280, badges: ["🍀 Active Volunteer"], resolvedCount: 4 }
  ];

  // Quiz states
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  const quizQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: "Which of the following is correct regarding dry and wet waste separation?",
      options: [
        "Plastics, tins, and dry paper go to DRY bin; vegetable peels and left-over foods go to WET bin.",
        "Everything can be discarded in a single bin and separated later by municipal workers.",
        "Metals and glass are classified as Wet Waste due to condensation."
      ],
      correctAnswer: 0,
      hint: "Organic matter decomposts and belongs to wet, while recyclables are kept dry."
    },
    {
      id: 2,
      question: "How can we assist senior citizens during severe water logging or pipeline breakdown?",
      options: [
        "Ignore since disaster teams are already on-site.",
        "Initiate direct contact, provide emergency fresh water cans, and report priority assistance on the Citizen Portal.",
        "Suggest they migrate to other wards temporarily on their own."
      ],
      correctAnswer: 1,
      hint: "Priority communication and physical help makes the neighborhood resilient."
    },
    {
      id: 3,
      question: "What is the primary action when finding an uncovered deep manhole on a busy street?",
      options: [
        "Take a video for social media and drive past.",
        "Place a visible temporary branch/warning and file a High-Severity report immediately on the Portal for instant AI dispatch.",
        "Wait till the weekend to file an email query."
      ],
      correctAnswer: 1,
      hint: "A warning prevents direct vehicle accidents while the AI dispatches the sewage team instantly."
    }
  ];

  // Canvas Waste Catcher Game States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameScore, setGameScore] = useState(0);
  const [gameLives, setGameLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [selectedBin, setSelectedBin] = useState<"dry" | "wet">("dry"); // 'dry' (blue) or 'wet' (green)
  const [binX, setBinX] = useState(150);

  // Core Game Loop variables in refs to avoid React re-render lag
  const gameScoreRef = useRef(0);
  const gameLivesRef = useRef(3);
  const activeItemsRef = useRef<any[]>([]);
  const binXRef = useRef(150);
  const selectedBinRef = useRef<"dry" | "wet">("dry");
  const animationFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Keep refs in sync with state changes
    binXRef.current = binX;
    selectedBinRef.current = selectedBin;
  }, [binX, selectedBin]);

  // Audio speech synthesis helper for Quiz
  const readQuizQuestionAloud = () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const text = quizQuestions[currentQuestionIdx].question + ". Option 1: " + quizQuestions[currentQuestionIdx].options[0] + ". Option 2: " + quizQuestions[currentQuestionIdx].options[1];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // HTML5 Canvas Catcher Game Loop Setup
  const startGame = () => {
    setGameRunning(true);
    setGameOver(false);
    setGameScore(0);
    setGameLives(3);

    gameScoreRef.current = 0;
    gameLivesRef.current = 3;
    activeItemsRef.current = [];
    binXRef.current = 150;

    // Spawn initial items
    spawnItem();

    if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    animationFrameIdRef.current = requestAnimationFrame(updateGame);
  };

  const spawnItem = () => {
    if (!gameRunning && gameLivesRef.current <= 0) return;

    const itemsList = [
      { char: "🧴", name: "Plastic Bottle", type: "dry", color: "#38bdf8" },
      { char: "🍌", name: "Banana Peel", type: "wet", color: "#4ade80" },
      { char: "📦", name: "Paper Box", type: "dry", color: "#38bdf8" },
      { char: "🍎", name: "Apple Core", type: "wet", color: "#4ade80" },
      { char: "🥫", name: "Metal Can", type: "dry", color: "#38bdf8" }
    ];

    const randomItem = itemsList[Math.floor(Math.random() * itemsList.length)];
    activeItemsRef.current.push({
      x: Math.random() * 260 + 20,
      y: 0,
      speed: Math.random() * 1.5 + 1.2,
      ...randomItem
    });

    // Spawn next item in 1.5 - 2.5 seconds
    if (gameLivesRef.current > 0) {
      setTimeout(() => {
        if (gameLivesRef.current > 0) spawnItem();
      }, Math.random() * 1000 + 1500);
    }
  };

  const updateGame = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Background Grid/Accents
    ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw active falling items
    activeItemsRef.current.forEach((item, index) => {
      item.y += item.speed;

      // Draw premium bubble around item
      const isDryItem = item.type === "dry";
      
      ctx.save();
      
      // Shadow and neon glow around item bubble
      ctx.shadowBlur = 12;
      ctx.shadowColor = isDryItem ? "#00c6ff" : "#10b981";
      
      // Create rich linear gradient for item background sphere
      const itemGrad = ctx.createLinearGradient(item.x - 16, item.y - 16, item.x + 16, item.y + 16);
      if (isDryItem) {
        itemGrad.addColorStop(0, "#00c6ff"); // Electric cyan
        itemGrad.addColorStop(1, "#0072ff"); // Rich blue
      } else {
        itemGrad.addColorStop(0, "#00ff87"); // Neon mint
        itemGrad.addColorStop(1, "#11998e"); // Emerald
      }
      
      ctx.fillStyle = itemGrad;
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      
      // Draw circular glossy sphere
      ctx.beginPath();
      ctx.arc(item.x, item.y - 8, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      
      ctx.restore();
      
      // Draw centered icon/emoji inside the sphere
      ctx.font = "16px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(item.char, item.x, item.y - 8);

      // Collision Check with Bin at bottom (Y = 240)
      if (item.y >= 230 && item.y <= 255) {
        const binLeft = binXRef.current - 35;
        const binRight = binXRef.current + 35;

        if (item.x >= binLeft && item.x <= binRight) {
          // Caught! Check category
          if (item.type === selectedBinRef.current) {
            gameScoreRef.current += 10;
            setGameScore(gameScoreRef.current);
          } else {
            // Wrong bin!
            gameScoreRef.current = Math.max(0, gameScoreRef.current - 5);
            setGameScore(gameScoreRef.current);
          }
          activeItemsRef.current.splice(index, 1);
          return;
        }
      }

      // Out of bounds check
      if (item.y > canvas.height) {
        // missed item
        gameLivesRef.current -= 1;
        setGameLives(gameLivesRef.current);
        activeItemsRef.current.splice(index, 1);

        if (gameLivesRef.current <= 0) {
          setGameOver(true);
          setGameRunning(false);
          onAddUserPoints(gameScoreRef.current); // Credit game score directly to real user profile points!
          if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
          return;
        }
      }
    });

    // Draw active Bin with glossy linear gradient and neon glow
    ctx.save();

    const isDry = selectedBinRef.current === "dry";
    ctx.shadowBlur = 15;
    ctx.shadowColor = isDry ? "#38bdf8" : "#34d399";
    
    const binGrad = ctx.createLinearGradient(binXRef.current - 32, canvas.height - 40, binXRef.current + 32, canvas.height - 10);
    if (isDry) {
      binGrad.addColorStop(0, "#00f2fe"); // High vis cyan
      binGrad.addColorStop(1, "#4facfe"); // Electric blue
    } else {
      binGrad.addColorStop(0, "#00ff87"); // Cyber neon mint
      binGrad.addColorStop(1, "#11998e"); // Emerald
    }
    
    ctx.fillStyle = binGrad;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;

    // Draw modern rounded basket container
    ctx.beginPath();
    ctx.roundRect(binXRef.current - 32, canvas.height - 40, 64, 30, 10);
    ctx.fill();
    ctx.stroke();
    
    ctx.restore();

    // Draw high-visibility label on basket
    ctx.fillStyle = "#090d16";
    ctx.font = "900 9px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isDry ? "⚡ DRY ⚡" : "🌿 WET 🌿", binXRef.current, canvas.height - 24);

    if (gameLivesRef.current > 0) {
      animationFrameIdRef.current = requestAnimationFrame(updateGame);
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, []);

  const moveBin = (direction: "left" | "right") => {
    setBinX((prev) => {
      const next = direction === "left" ? prev - 30 : prev + 30;
      return Math.max(35, Math.min(265, next));
    });
  };

  // Keyboard controls for game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameRunning) return;
      if (e.key === "ArrowLeft") moveBin("left");
      if (e.key === "ArrowRight") moveBin("right");
      if (e.key === " " || e.key === "Enter") {
        // Toggle bin type on space
        setSelectedBin((prev) => (prev === "dry" ? "wet" : "dry"));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameRunning]);

  // Quiz response handlers
  const handleQuizAnswer = (optionIdx: number) => {
    setSelectedOption(optionIdx);
    setShowExplanation(true);

    if (optionIdx === quizQuestions[currentQuestionIdx].correctAnswer) {
      setQuizScore((prev) => prev + 1);
      onAddUserPoints(15); // reward 15 points per correct answer
    }
  };

  const handleNextQuizQuestion = () => {
    setSelectedOption(null);
    setShowExplanation(false);

    if (currentQuestionIdx < quizQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      setQuizComplete(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setShowExplanation(false);
    setQuizScore(0);
    setQuizComplete(false);
  };

  return (
    <div className="bg-gradient-to-br from-[#121026] via-[#1E112A] to-[#0A0713] p-6 md:p-8 rounded-3xl border-2 border-purple-500/30 shadow-[0_0_35px_rgba(168,85,247,0.25)] text-left space-y-6 relative overflow-hidden">
      {/* Dynamic ambient background blur pops */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* HEADER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-purple-500/20 pb-4 gap-4">
        <div>
          <h3 className="text-2xl font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-pink-400 to-cyan-400 tracking-tight animate-pulse">
            🎮 Gamified Quick Zone
          </h3>
          <p className="text-slate-300 text-xs mt-1">
            Separation challenges and welfare quizzes. Play to earn instant community merits!
          </p>
        </div>

        {/* User Badge Counter */}
        <div className="flex items-center gap-3 bg-gradient-to-r from-fuchsia-500/20 to-cyan-500/20 border-2 border-purple-500/40 px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-[0_0_15px_rgba(168,85,247,0.3)]">
          <Award className="w-6 h-6 text-fuchsia-400 animate-bounce" />
          <div>
            <span className="text-[9px] font-black font-mono text-cyan-300 block uppercase tracking-wider">My Profile Merits</span>
            <span className="text-base font-black font-mono text-white">{user.points || 280} Merits</span>
          </div>
        </div>
      </div>

      {/* SUB TABS NAVIGATION */}
      <div className="flex bg-black/60 p-1.5 rounded-2xl border-2 border-purple-500/20 w-fit gap-1 shadow-inner">
        {[
          { id: "catcher", label: "Trash Sorter Game", icon: Gamepad2, activeBg: "bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow-[0_0_15px_rgba(217,70,239,0.4)] font-bold" },
          { id: "quiz", label: "Neighborhood Quiz", icon: HelpCircle, activeBg: "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.4)] font-bold" },
          { id: "leaderboard", label: "Civic Leaderboard", icon: Trophy, activeBg: "bg-gradient-to-r from-purple-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] font-bold" }
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold font-display transition-all duration-300 cursor-pointer ${
                isSelected ? tab.activeBg : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT SPACES */}
      <div className="mt-4">
        {activeSubTab === "catcher" && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* HTML5 Canvas Left Side - Polished Arcade Cabinet look */}
            <div className="md:col-span-6 bg-gradient-to-b from-[#1E112A] to-[#120D1A] border-2 border-fuchsia-500/40 rounded-3xl p-5 flex flex-col items-center shadow-2xl relative">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-fuchsia-500/30 rounded-full" />
              <div className="w-full flex items-center justify-between mb-4 mt-1 text-xs font-mono font-black">
                <div className="flex items-center gap-2 text-yellow-400">
                  <Star className="w-4 h-4 fill-current text-yellow-400 animate-spin" /> Score: <span className="text-white font-black">{gameScore}</span>
                </div>
                <div className="text-rose-400 flex items-center gap-1">
                  Lives: <span className="font-bold">{"❤️".repeat(gameLives)}</span>
                </div>
              </div>

              {/* Game Screen Canvas with pulsing neon border */}
              <div className="relative border-4 border-[#3D1460] rounded-2xl overflow-hidden bg-black shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={270}
                  className="block max-w-full"
                />

                {/* Overlays */}
                {!gameRunning && !gameOver && (
                  <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-4">
                    <Gamepad2 className="w-14 h-14 text-fuchsia-400 mb-2 animate-bounce" />
                    <h4 className="text-base font-black text-white tracking-tight">Civic Waste Catcher v1.0</h4>
                    <p className="text-slate-400 text-[10px] max-w-[220px] mt-1.5 leading-relaxed">
                      Slide Dry (Blue) or Wet (Green) bins to catch organic vs recyclable waste. Left/Right Arrow to slide, Space to toggle!
                    </p>
                    <button
                      onClick={startGame}
                      className="mt-4 bg-gradient-to-r from-fuchsia-500 to-pink-500 hover:from-fuchsia-400 hover:to-pink-400 text-white text-xs font-black font-display px-5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(217,70,239,0.5)] transform active:scale-95 transition-all"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" /> Play Now!
                    </button>
                  </div>
                )}

                {gameOver && (
                  <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center text-center p-4">
                    <Trophy className="w-12 h-12 text-yellow-400 mb-2 animate-pulse" />
                    <h4 className="text-base font-black text-white">Game Over!</h4>
                    <p className="text-emerald-400 text-sm font-black font-mono mt-1">+{gameScore} Merits Credited!</p>
                    <p className="text-slate-500 text-[10px] mt-1.5">Excellent waste separation practice.</p>
                    <button
                      onClick={startGame}
                      className="mt-4 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black px-5 py-2.5 rounded-xl flex items-center gap-1 cursor-pointer shadow-[0_0_15px_rgba(34,211,238,0.5)] transform active:scale-95 transition-all"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> Play Again
                    </button>
                  </div>
                )}
              </div>

              {/* Game Control Buttons for Touch/Mobile click fallbacks */}
              <div className="w-full grid grid-cols-3 gap-2 mt-4">
                <button
                  onClick={() => moveBin("left")}
                  disabled={!gameRunning}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-200 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  ◀ Move Left
                </button>
                <button
                  onClick={() => setSelectedBin((prev) => (prev === "dry" ? "wet" : "dry"))}
                  disabled={!gameRunning}
                  className={`border text-[10px] font-bold uppercase rounded-lg cursor-pointer ${
                    selectedBin === "dry"
                      ? "bg-sky-500/10 border-sky-400 text-sky-400"
                      : "bg-emerald-500/10 border-emerald-400 text-emerald-400"
                  }`}
                >
                  Swap Bin ({selectedBin === "dry" ? "Dry" : "Wet"})
                </button>
                <button
                  onClick={() => moveBin("right")}
                  disabled={!gameRunning}
                  className="bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 text-slate-200 py-2 rounded-lg text-xs font-bold cursor-pointer"
                >
                  Move Right ▶
                </button>
              </div>
            </div>

            {/* Explanatory rules cards right side */}
            <div className="md:col-span-6 space-y-4">
              <div className="bg-gradient-to-br from-[#1E1B4B] via-[#2E1065] to-[#12072B] border-2 border-fuchsia-500/30 rounded-3xl p-5 space-y-3 shadow-[0_0_15px_rgba(217,70,239,0.15)]">
                <h4 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-pink-400 font-display flex items-center gap-2">
                  <Star className="w-4 h-4 fill-current text-fuchsia-400 animate-spin" /> Interactive Eco Sorter Rules
                </h4>
                <ul className="space-y-2 text-xxs text-slate-200 list-disc list-inside leading-relaxed">
                  <li>Wet Waste is biodegradable organic items (Banana, Apple cores). Sort inside <strong className="text-emerald-400">Green Bin</strong>.</li>
                  <li>Dry Waste is recyclable solids (Plastics, Cardboard, Tins). Sort inside <strong className="text-sky-400">Blue Bin</strong>.</li>
                  <li>Correct catches earn <strong className="text-emerald-400 font-bold">+10 Points</strong>. Mismatches deduct <strong className="text-rose-400 font-bold">-5 Points</strong>.</li>
                  <li>Keyboard supports: <kbd className="px-1.5 py-0.5 bg-black/60 border border-purple-500/30 text-white rounded font-mono text-[9px]">◀</kbd> and <kbd className="px-1.5 py-0.5 bg-black/60 border border-purple-500/30 text-white rounded font-mono text-[9px]">▶</kbd> Arrow keys, and <kbd className="px-1.5 py-0.5 bg-black/60 border border-purple-500/30 text-white rounded font-mono text-[9px]">Spacebar</kbd> to swap bins instantly!</li>
                </ul>
              </div>

              <div className="bg-[#12072B]/80 border-2 border-cyan-500/20 rounded-2xl p-4 flex gap-3 text-xs text-slate-300 shadow-[0_0_15px_rgba(34,211,238,0.1)]">
                <Award className="w-8 h-8 text-cyan-400 flex-shrink-0 animate-bounce" />
                <p className="leading-relaxed text-[11px]">
                  High Scores made in Catcher games are instantly synced with the annual municipal <strong className="text-cyan-300">Best Citizen Award</strong> rankings! Participate daily.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === "quiz" && (
          <div className="bg-gradient-to-br from-[#1E112A] via-[#12072B] to-[#0D051C] border-2 border-purple-500/30 rounded-3xl p-6 max-w-2xl mx-auto space-y-6 shadow-2xl">
            {!quizComplete ? (
              <div className="space-y-4">
                {/* Question Counter */}
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="text-[10px] font-mono text-teal-400 uppercase tracking-wider">
                    Neighborhood Welfare Quiz: Question {currentQuestionIdx + 1} of {quizQuestions.length}
                  </span>
                  <button
                    onClick={readQuizQuestionAloud}
                    className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 cursor-pointer bg-slate-900 px-2.5 py-1 rounded-lg border border-white/5"
                    title="Synthesize and speak question"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-teal-400" /> Listen Audio Hint
                  </button>
                </div>

                {/* Question text */}
                <h4 className="text-base font-bold font-display text-white">
                  {quizQuestions[currentQuestionIdx].question}
                </h4>

                {/* Multiple choice Options */}
                <div className="space-y-2.5">
                  {quizQuestions[currentQuestionIdx].options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === quizQuestions[currentQuestionIdx].correctAnswer;
                    let optionStyle = "border-slate-800 hover:bg-slate-900/50 text-slate-300";

                    if (selectedOption !== null) {
                      if (isCorrect) optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-300";
                      else if (isSelected) optionStyle = "border-red-500 bg-red-500/10 text-red-300";
                    }

                    return (
                      <button
                        key={idx}
                        disabled={selectedOption !== null}
                        onClick={() => handleQuizAnswer(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs leading-relaxed transition-all cursor-pointer ${optionStyle}`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Hints and explanations */}
                <AnimatePresence>
                  {showExplanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-slate-900 border border-white/5 p-4 rounded-xl space-y-2"
                    >
                      <h5 className="text-xxs font-semibold uppercase tracking-wider text-teal-400 font-mono">
                        {selectedOption === quizQuestions[currentQuestionIdx].correctAnswer
                          ? "✓ Correct Answer! +15 Merits Credited!"
                          : "✕ Incorrect Option"}
                      </h5>
                      <p className="text-slate-300 text-xxs italic leading-normal">
                        <strong>Context Hint:</strong> {quizQuestions[currentQuestionIdx].hint}
                      </p>

                      <button
                        onClick={handleNextQuizQuestion}
                        className="mt-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold font-display text-xs px-4 py-2 rounded-xl flex items-center gap-1 cursor-pointer self-end"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <Trophy className="w-14 h-14 text-yellow-400 mx-auto animate-bounce" />
                <h4 className="text-lg font-bold text-white font-display">Welfare Quiz Completed!</h4>
                <p className="text-slate-400 text-xs">
                  You answered {quizScore} of {quizQuestions.length} questions correctly. Excellent job protecting community elders and environment welfare!
                </p>
                <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold font-mono py-2 px-4 rounded-xl inline-block text-xs">
                  +{quizScore * 15} Merits Earned!
                </div>
                <div>
                  <button
                    onClick={resetQuiz}
                    className="bg-slate-900 border border-slate-800 text-slate-200 text-xs font-bold px-4 py-2 rounded-xl cursor-pointer hover:bg-slate-800"
                  >
                    Retake Quiz
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSubTab === "leaderboard" && (
          <div className="bg-gradient-to-br from-[#1E112A] via-[#12072B] to-[#0D051C] border-2 border-purple-500/30 rounded-3xl p-5 space-y-4 shadow-2xl">
            <h4 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-cyan-400 font-display flex items-center gap-2">
              🏆 Annual "Best Citizen Award" Rankings
            </h4>
            <p className="text-slate-300 text-xs leading-relaxed">Points are accumulated by resolving reports, daily eco sorter scores, and community quiz submissions.</p>

            <div className="space-y-2.5">
              {leaderboardData.map((lead, idx) => (
                <div
                  key={lead.name}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    lead.name === user.name
                      ? "bg-teal-500/10 border-teal-500/30 text-teal-200"
                      : "bg-slate-900/30 border-slate-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank indicator */}
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold font-mono text-xs ${
                      lead.rank === 1
                        ? "bg-yellow-500 text-slate-950"
                        : lead.rank === 2
                        ? "bg-slate-300 text-slate-950"
                        : lead.rank === 3
                        ? "bg-amber-600 text-slate-950"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {lead.rank}
                    </span>

                    <div>
                      <h5 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                        {lead.name}
                        {lead.name === user.name && <span className="bg-teal-500 text-slate-950 text-[8px] font-bold px-1.5 py-0.2 rounded font-mono">YOU</span>}
                      </h5>
                      {/* Badges indicators */}
                      <div className="flex gap-1 mt-1">
                        {lead.badges.map((b) => (
                          <span key={b} className="bg-slate-800/80 text-slate-400 text-[8px] px-1.5 py-0.2 rounded font-mono">
                            {b}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold font-mono text-teal-400 block">{lead.points} Merits</span>
                    <span className="text-[10px] text-slate-500 font-mono">{lead.resolvedCount} Issues Solved</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
