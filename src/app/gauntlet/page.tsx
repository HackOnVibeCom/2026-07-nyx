"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mic, CheckCircle2, AlertTriangle, ShieldAlert, Newspaper, Search, Briefcase, RefreshCw, Hand, TrendingUp, Zap, Target } from "lucide-react";
import { PERSONAS } from "@/lib/personas";
import { play, bind } from "cuelume";
import { playPaperSlap } from "@/lib/audio";
import LZString from "lz-string";

const ICONS = {
  ph_early_adopter: ShieldAlert,
  mobile_tech_journalist: Newspaper,
  social_media_scroller: Search,
  app_investor: Briefcase,
  app_store_browser: Search,
  first_time_user: Zap
};

const ASSET_TYPES = [
  "App Store Description",
  "Product Hunt Launch",
  "X/Twitter Launch Thread",
  "TikTok Caption",
  "Press Email",
  "Landing Page Hero",
  "Reddit Launch Post"
];

const AUDIENCES = [
  "Student",
  "Parent",
  "Gamer",
  "Productivity User",
  "Developer",
  "Creator"
];

const PERSONA_CUES: Record<string, any> = {
  ph_early_adopter: 'tick',
  mobile_tech_journalist: 'whisper',
  social_media_scroller: 'sparkle',
  app_investor: 'droplet',
  app_store_browser: 'bloom',
  first_time_user: 'success'
};

const AMBIENT_COPY = [
  "Comparing against familiar products.",
  "Looking for weak claims.",
  "Checking whether your hook survives first contact.",
  "Looking for reasons people might scroll past.",
  "Searching for your strongest sentence.",
  "Measuring clarity over cleverness.",
  "Looking for proof instead of promises."
];

export default function GauntletPage() {
  const [pitch, setPitch] = useState("");
  const [placeholderText, setPlaceholderText] = useState("");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(
    Object.keys(PERSONAS)
  );
  const [assetType, setAssetType] = useState(ASSET_TYPES[0]);
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  
  type PitchHistoryEntry = { id: string; pitch: string; assetType: string; audience: string; score: number; date: number };
  const [pitchHistory, setPitchHistory] = useState<PitchHistoryEntry[]>([]);

  type LoadingPhase = "idle" | "personas" | "report" | "complete" | "error";
  const [loadingPhase, setLoadingPhase] = useState<LoadingPhase>("idle");
  const [personaStates, setPersonaStates] = useState<Record<string, { status: "waiting" | "reading" | "complete"; response?: any }>>({});
  
  const [loadingDots, setLoadingDots] = useState("");
  const [readingText, setReadingText] = useState("reading");
  const [activePersonaStart, setActivePersonaStart] = useState<number>(0);
  const [ambientCopyIndex, setAmbientCopyIndex] = useState(0);
  const [reportStep, setReportStep] = useState(0);

  // Timeline Event Tracking
  type TimelineEvent = { label: string; time: string };
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

  const getLocalTime = () => new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const [results, setResults] = useState<{
    personaResponses: { persona: string; response: string; wouldShare: string }[];
    report: any;
  } | null>(null);

  // Mouse Spotlight and Cuelume Bind
  useEffect(() => {
    bind();
    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--y', `${e.clientY}px`);
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Load history
    const stored = localStorage.getItem("heckleHistory");
    if (stored) {
      try { setPitchHistory(JSON.parse(stored)); } catch(e) {}
    }

    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (loadingPhase !== "idle" && loadingPhase !== "complete" && loadingPhase !== "error") return;
    const phrases = ["Building an AI...", "Launching...", "Product Hunt post..."];
    let currentPhraseIndex = 0;
    let currentText = "";
    let isDeleting = false;
    let timerId: NodeJS.Timeout;
    
    const type = () => {
      const fullPhrase = phrases[currentPhraseIndex];
      if (isDeleting) {
        currentText = fullPhrase.substring(0, currentText.length - 1);
      } else {
        currentText = fullPhrase.substring(0, currentText.length + 1);
      }
      setPlaceholderText(currentText + "|");
      let typingSpeed = isDeleting ? 30 : 80;
      
      if (!isDeleting && currentText === fullPhrase) {
        typingSpeed = 2000;
        isDeleting = true;
      } else if (isDeleting && currentText === "") {
        isDeleting = false;
        currentPhraseIndex = (currentPhraseIndex + 1) % phrases.length;
        typingSpeed = 500;
      }
      timerId = setTimeout(type, typingSpeed);
    };
    
    timerId = setTimeout(type, 500);
    return () => clearTimeout(timerId);
  }, [loadingPhase]);

  // Loading animations loops
  useEffect(() => {
    let dotInterval: NodeJS.Timeout;
    let readInterval: NodeJS.Timeout;
    let copyInterval: NodeJS.Timeout;

    if (loadingPhase === "personas" || loadingPhase === "report") {
      dotInterval = setInterval(() => {
        setLoadingDots(prev => prev.length >= 3 ? "" : prev + ".");
      }, 500);
    }

    if (loadingPhase === "personas") {
      readInterval = setInterval(() => {
        const elapsed = Date.now() - activePersonaStart;
        if (elapsed > 5000) setReadingText("writing");
        else if (elapsed > 2000) setReadingText("thinking");
        else setReadingText("reading");
      }, 100);
    }

    if (loadingPhase === "report") {
      copyInterval = setInterval(() => {
        setAmbientCopyIndex(prev => (prev + 1) % AMBIENT_COPY.length);
      }, 2000);
    }

    return () => {
      clearInterval(dotInterval);
      clearInterval(readInterval);
      clearInterval(copyInterval);
    };
  }, [loadingPhase, activePersonaStart]);

  const togglePersona = (key: string) => {
    setSelectedPersonas((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const getOverallScore = (r: any) => {
    if (!r) return 0;
    const s = r.report.scores;
    return Math.round((s.clarity + s.differentiation + s.credibility + s.hookStrength) / 4);
  };

  const executeGauntlet = async (pitchToRun: string) => {
    if (!pitchToRun.trim() || selectedPersonas.length === 0) {
      setLoadingPhase("error");
      return;
    }

    setLoadingPhase("personas");
    setResults(null);
    
    const initialStates: Record<string, any> = {};
    selectedPersonas.forEach(p => initialStates[p] = { status: "waiting" });
    setPersonaStates(initialStates);

    const newTimeline: TimelineEvent[] = [{ label: "Pitch submitted", time: getLocalTime() }];
    setTimeline(newTimeline);

    const responses: any[] = [];

    try {
      for (const p of selectedPersonas) {
        setPersonaStates(prev => ({ ...prev, [p]: { ...prev[p], status: "reading" } }));
        setActivePersonaStart(Date.now());
        setReadingText("reading");

        const res = await fetch("/api/persona", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pitch: pitchToRun, personaKey: p, assetType, audience }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        responses.push({ persona: p, ...data });
        setPersonaStates(prev => ({ ...prev, [p]: { status: "complete", response: data } }));
        play("tick");
        
        newTimeline.push({ label: `${PERSONAS[p as keyof typeof PERSONAS].name} responded`, time: getLocalTime() });
        setTimeline([...newTimeline]);
      }

      await new Promise(r => setTimeout(r, 500));
      
      setLoadingPhase("report");
      setReportStep(0);

      const reportRes = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch: pitchToRun, personaResponses: responses, assetType, audience }),
      });

      play("chime");

      const reportData = await reportRes.json();
      if (!reportRes.ok) throw new Error(reportData.error);

      for(let i=1; i<=5; i++) {
         await new Promise(r => setTimeout(r, 400));
         setReportStep(i);
         if (i <= 4) play("tick");
      }
      
      await new Promise(r => setTimeout(r, 500));
      
      play("success");
      
      newTimeline.push({ label: "Report generated", time: getLocalTime() });
      setTimeline([...newTimeline]);

      setResults({ personaResponses: responses, report: reportData });
      setLoadingPhase("complete");
      
      // Save history
      const score = getOverallScore({ report: reportData });
      const newHistoryEntry: PitchHistoryEntry = {
        id: Math.random().toString(36).substr(2, 9),
        pitch: pitchToRun,
        assetType,
        audience,
        score,
        date: Date.now()
      };
      
      setPitchHistory(prev => {
        const next = [newHistoryEntry, ...prev].slice(0, 5);
        localStorage.setItem("heckleHistory", JSON.stringify(next));
        return next;
      });
      
      setTimeout(() => play("bloom"), 300);
    } catch (err: any) {
      setLoadingPhase("error");
    }
  };

  const runGauntlet = () => {
    setPreviousScore(null);
    playPaperSlap();
    executeGauntlet(pitch);
  };

  const handleRewriteAndRetry = () => {
    if (!results) return;
    play("toggle");
    setPreviousScore(getOverallScore(results));
    const suggestedPitch = results.report.rewrite.fullRewrite;
    setPitch(suggestedPitch);
    executeGauntlet(suggestedPitch);
  };

  const reset = () => {
    setLoadingPhase("idle");
    setResults(null);
    setPitch("");
    setPreviousScore(null);
    setTimeline([]);
  };

  const trySamplePitch = () => {
    setPitch("TodoApp is a todo list. You can add tasks. You can delete tasks. It helps you be productive. Download now for $4.99/mo.");
    setAssetType("App Store Description");
    setAudience("Productivity User");
  };

  const handleShare = () => {
    if (!results) return;
    const data = LZString.compressToEncodedURIComponent(JSON.stringify(results));
    const url = `${window.location.origin}/report?data=${data}`;
    navigator.clipboard.writeText(url);
    alert("Report link copied to clipboard!");
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-6 bg-[var(--bg)] relative overflow-hidden">
      {/* Decorative Quotes */}
      <div className="fixed top-[-60px] left-8 font-serif text-[280px] text-[var(--ink)] opacity-[0.03] pointer-events-none leading-none select-none z-0">
        “
      </div>
      <div className="fixed top-[-60px] right-8 font-serif text-[280px] text-[var(--ink)] opacity-[0.03] pointer-events-none leading-none select-none z-0">
        ”
      </div>

      {/* Mouse Spotlight Layer */}
      <div className="fixed inset-0 pointer-events-none z-[100]" 
           style={{ background: 'radial-gradient(120px circle at var(--x, 50%) var(--y, 50%), rgba(255,255,255,0.35), transparent 100%)', mixBlendMode: 'screen' }} />

      {/* Conversation Timeline */}
      {timeline.length > 0 && loadingPhase !== "idle" && (
        <div className="fixed left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-3 animate-in fade-in duration-700 pointer-events-none z-10 hidden lg:flex">
          {timeline.map((event, i) => (
            <div key={i} className="flex flex-col items-center gap-3 w-full">
              <div className="flex flex-col items-center">
                <span className="font-mono text-[10px] tracking-widest text-[var(--muted)]/70">{event.time}</span>
                <span className="text-[11px] font-semibold text-[var(--ink)] tracking-wider mt-0.5">{event.label}</span>
              </div>
              {i < timeline.length - 1 && <span className="text-[var(--line)] text-lg animate-in slide-in-from-top-1 fade-in duration-500">↓</span>}
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <header className="w-full max-w-[800px] py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-semibold">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <div className="flex items-center gap-2 font-display text-[var(--ink)] text-xl tracking-tight">
          <img src="/logo.png" alt="Heckle Logo" className="w-7 h-7 object-contain drop-shadow-sm" />
          HECKLE
        </div>
      </header>

      <div className="w-full max-w-[800px] flex flex-col items-center pt-8 pb-[15vh] relative z-10">
        
        {loadingPhase === "idle" && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="font-display text-3xl md:text-4xl text-[var(--ink)] mb-2 text-center">
              Run the Gauntlet
            </h1>
            <p className="text-[var(--muted)] mb-10 text-center">
              Paste your pitch below and see how the internet really reacts.
            </p>

            <div className="w-full mb-[40px] flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <textarea
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                  placeholder={placeholderText}
                  className="w-full h-48 p-4 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] resize-none transition-colors shadow-sm"
                />
                <button 
                  onClick={trySamplePitch}
                  className="self-end text-xs font-semibold text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                >
                  Try a Sample Pitch
                </button>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <label className="text-[var(--muted)] text-sm font-semibold uppercase tracking-wider">
                  What are you testing?
                </label>
                <div className="flex flex-wrap gap-2">
                  {ASSET_TYPES.map((type) => (
                    <button
                      key={type}
                      onClick={() => setAssetType(type)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 border ${
                        assetType === type
                          ? "bg-[var(--ink)] text-white border-[var(--ink)] shadow-sm"
                          : "bg-white text-[var(--muted)] border-[var(--line)] hover:border-[var(--muted)] hover:text-[var(--ink)]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <label className="text-[var(--muted)] text-sm font-semibold uppercase tracking-wider">
                  Target Audience
                </label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] text-[var(--ink)] font-semibold focus:outline-none focus:border-[var(--accent)] cursor-pointer"
                >
                  {AUDIENCES.map((aud) => (
                    <option key={aud} value={aud}>{aud}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <label className="text-[var(--muted)] text-sm font-semibold uppercase tracking-wider">
                  Select Personas
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.entries(PERSONAS).map(([key, persona]) => (
                    <label
                      key={key}
                      className={`flex items-start gap-3 p-4 rounded-2xl ${
                        selectedPersonas.includes(key)
                          ? "bg-[var(--accent-soft)] shadow-sm"
                          : "bg-white/50 hover:bg-white shadow-sm"
                      } cursor-pointer transition-all duration-200`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPersonas.includes(key)}
                        onChange={() => { togglePersona(key); play(PERSONA_CUES[key]); }}
                        className="mt-1 h-4 w-4 rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
                        style={{ accentColor: "var(--accent)" }}
                      />
                      <div className="flex flex-col">
                        <span className="font-semibold text-[var(--ink)] leading-tight">{persona.name}</span>
                        <span className="text-[0.8rem] text-[var(--muted)] mt-0.5">{persona.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={runGauntlet}
              data-cuelume-press="press"
              data-cuelume-release="release"
              className="rounded-full px-[36px] py-[16px] bg-[var(--accent)] text-white font-bold text-[1.05rem] shadow-[0_10px_24px_rgba(27,143,111,0.28)] -rotate-2 hover:rotate-0 hover:bg-[var(--accent-dark)] hover:shadow-[0_14px_28px_rgba(27,143,111,0.35)] transition-all duration-200 ease-out"
            >
              Run the Gauntlet
            </button>

            {pitchHistory.length > 0 && (
              <div className="w-full max-w-[600px] mt-16 flex flex-col gap-4 animate-in fade-in duration-700">
                <h3 className="font-semibold text-sm uppercase tracking-widest text-[var(--muted)] border-l-2 border-[var(--line)] pl-3">Previous Runs</h3>
                <div className="flex flex-col gap-3">
                  {pitchHistory.map((hist, i) => (
                    <div key={hist.id} className="p-4 rounded-xl border border-[var(--line)] bg-white/50 flex flex-col gap-2 relative overflow-hidden group hover:bg-white transition-colors cursor-pointer" onClick={() => { setPitch(hist.pitch); setAssetType(hist.assetType); setAudience(hist.audience); }}>
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-[var(--ink)]">{hist.assetType}</span>
                          <span className="text-xs text-[var(--muted)] truncate max-w-[200px] sm:max-w-[300px]">{hist.pitch}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-1">Score</span>
                          <span className="text-xl font-display text-[var(--accent)]">{hist.score}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loadingPhase === "error" && (
          <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500 py-16">
            <h2 className="font-display text-2xl text-[var(--ink)] mb-4">The room went quiet.</h2>
            <p className="text-[var(--muted)] text-center max-w-md mb-8">
              We couldn't reach one or more reviewers. Nothing was fabricated.
            </p>
            <button
              onClick={() => setLoadingPhase("idle")}
              className="rounded-full px-6 py-3 border border-[var(--line)] text-[var(--ink)] font-semibold rotate-2 hover:rotate-0 hover:bg-[var(--line)] transition-all duration-200"
            >
              Try again
            </button>
          </div>
        )}

        {(loadingPhase === "personas" || loadingPhase === "report") && (
          <div className="w-full max-w-[600px] flex flex-col items-center animate-in fade-in duration-500">
            <div className="w-full border-b border-[var(--line)] py-12 flex flex-col items-center mb-8">
              <span className="font-display text-2xl text-[var(--ink)]">
                {loadingPhase === "personas" ? "Your pitch has entered the gauntlet." : "Generating Pitch Report"}
              </span>
            </div>

            {loadingPhase === "personas" && (
              <div className="w-full flex flex-col">
                {selectedPersonas.map((key) => {
                  const p = PERSONAS[key as keyof typeof PERSONAS];
                  const state = personaStates[key];
                  if (!state) return null;

                  return (
                    <div key={key} className={`w-full py-6 border-b border-[var(--line)] flex flex-col transition-all duration-500 ${state.status === 'complete' ? 'bg-[var(--bg)]' : ''}`}>
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-2">
                          {state.status === "complete" && <CheckCircle2 className="w-4 h-4 text-[var(--accent)]" />}
                          <span className="font-display text-[16px] text-[var(--ink)]">{p.name}</span>
                        </div>
                        <span className="font-['Supreme'] text-[14px] text-[var(--muted)] lowercase">
                          {state.status === "waiting" && "waiting"}
                          {state.status === "reading" && `${readingText}${loadingDots}`}
                          {state.status === "complete" && "review complete"}
                        </span>
                      </div>
                      
                      {state.status === "complete" && state.response && (
                        <div className="mt-4 text-[14px] text-[var(--ink)] leading-relaxed italic animate-in fade-in slide-in-from-bottom-2 duration-700 opacity-80">
                          "{state.response.response}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {loadingPhase === "report" && (
              <div className="w-full flex flex-col items-center py-8">
                <span className="text-sm font-semibold uppercase tracking-wider text-[var(--muted)] mb-12 h-6 animate-pulse text-center">
                  {AMBIENT_COPY[ambientCopyIndex]}
                </span>
                
                <div className="flex flex-col gap-4 w-full max-w-[200px]">
                  <div className={`flex items-center gap-3 transition-opacity duration-500 ${reportStep >= 1 ? 'opacity-100' : 'opacity-0'}`}>
                    <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" /> <span className="text-[var(--ink)] font-semibold">Clarity</span>
                  </div>
                  <div className={`flex items-center gap-3 transition-opacity duration-500 ${reportStep >= 2 ? 'opacity-100' : 'opacity-0'}`}>
                    <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" /> <span className="text-[var(--ink)] font-semibold">Differentiation</span>
                  </div>
                  <div className={`flex items-center gap-3 transition-opacity duration-500 ${reportStep >= 3 ? 'opacity-100' : 'opacity-0'}`}>
                    <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" /> <span className="text-[var(--ink)] font-semibold">Credibility</span>
                  </div>
                  <div className={`flex items-center gap-3 transition-opacity duration-500 ${reportStep >= 4 ? 'opacity-100' : 'opacity-0'}`}>
                    <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" /> <span className="text-[var(--ink)] font-semibold">Hook</span>
                  </div>
                  
                  <div className={`mt-6 text-sm text-[var(--muted)] italic transition-opacity duration-500 ${reportStep >= 5 ? 'opacity-100' : 'opacity-0'}`}>
                    Writing rewrite suggestions{loadingDots}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {loadingPhase === "complete" && results && (
          <div className="w-full flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Area */}
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
              <h2 className="font-display text-4xl text-[var(--ink)] tracking-tight">RESULTS</h2>
              <button
                onClick={reset}
                className="text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-semibold"
              >
                Try another pitch &rarr;
              </button>
            </div>

            {/* Before/After Loop Logic */}
            {previousScore !== null && (
              <div className="w-full p-6 rounded-2xl bg-[var(--ink)] text-white flex flex-col items-center shadow-lg relative overflow-hidden -mt-4">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                <h3 className="text-sm font-semibold uppercase tracking-widest text-white/70 mb-4">Immediate Re-Hell Results</h3>
                <div className="flex items-center justify-center gap-8 md:gap-16">
                  <div className="flex flex-col items-center">
                    <span className="text-white/60 font-semibold mb-1">Before</span>
                    <span className="font-display text-5xl">{previousScore}</span>
                  </div>
                  <ArrowLeft className="w-8 h-8 text-[var(--accent)] rotate-180" />
                  <div className="flex flex-col items-center">
                    <span className="text-[var(--accent)] font-semibold mb-1">After</span>
                    <span className="font-display text-5xl text-white">{getOverallScore(results)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* --- PHASE 1: OVERALL VERDICT --- */}
            <div className="flex flex-col gap-6">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-[var(--muted)] border-l-2 border-[var(--line)] pl-3">Overall Verdict</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Launch Confidence */}
                <div className="col-span-1 p-6 rounded-2xl bg-[var(--bg)] border border-[var(--line)] shadow-sm flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-4">
                    <Target className="w-5 h-5 text-[var(--ink)]" />
                    <h4 className="font-display text-xl text-[var(--ink)]">Launch Confidence</h4>
                  </div>
                  <div className="font-display text-6xl text-[var(--accent)] mb-4">
                    {results.report.launchConfidence?.score || 0}%
                  </div>
                  <div className="flex flex-col gap-2 mt-auto">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Why?</span>
                    <ul className="text-sm text-[var(--ink)] space-y-1">
                      {results.report.launchConfidence?.reasons?.map((reason: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--accent)]">•</span> {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Consensus */}
                <div className="col-span-1 lg:col-span-2 p-6 rounded-2xl bg-[var(--bg)] border border-[var(--line)] shadow-sm flex flex-col justify-center">
                  <h4 className="font-display text-xl text-[var(--ink)] mb-4">Consensus</h4>
                  <p className="text-xl text-[var(--ink)] font-medium mb-8 italic border-l-2 border-[var(--accent)] pl-4 py-1 leading-relaxed">
                    "{results.report.consensus?.synthesis}"
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {(["clarity", "differentiation", "hookStrength", "credibility"] as const).map((dim) => {
                      const metric = results.report.consensus?.metrics?.[dim];
                      if (!metric) return null;
                      return (
                        <div key={dim} className="flex items-start gap-3">
                          {metric.status === "positive" ? (
                            <CheckCircle2 className="w-5 h-5 text-[var(--accent)] shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                          )}
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                              {dim === "hookStrength" ? "Hook" : dim}
                            </span>
                            <span className="text-sm text-[var(--ink)] leading-tight mt-1">{metric.message}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* --- PHASE 2: PERSONA REACTIONS --- */}
            <div className="flex flex-col gap-6">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-[var(--muted)] border-l-2 border-[var(--line)] pl-3">Persona Reactions</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.personaResponses.map((r, idx) => {
                  const p = PERSONAS[r.persona as keyof typeof PERSONAS];
                  const Icon = ICONS[r.persona as keyof typeof ICONS];
                  return (
                    <div
                      key={r.persona}
                      className="border border-[var(--line)] bg-[var(--bg)] p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden group"
                      style={{ animationDelay: `${idx * 150}ms`, animationFillMode: "both" }}
                    >
                      <div className="flex flex-row gap-3 items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <div className="font-display text-lg text-[var(--ink)] leading-tight">{p.name}</div>
                          <div className="text-xs text-[var(--muted)] uppercase tracking-wider font-semibold mt-0.5">
                            {p.label}
                          </div>
                        </div>
                      </div>
                      <div className="text-[var(--ink)] text-sm leading-relaxed whitespace-pre-wrap flex-grow relative z-10">
                        "{r.response}"
                      </div>
                      <div className="mt-4 pt-3 border-t border-[var(--line)] flex items-center justify-between relative z-10">
                        <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Would they share it?</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${r.wouldShare?.toLowerCase() === 'yes' ? 'bg-[var(--accent)] text-white' : r.wouldShare?.toLowerCase() === 'no' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                          {r.wouldShare?.toUpperCase() || 'MAYBE'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* --- PHASE 3: LAUNCH IMPACT --- */}
            <div className="flex flex-col gap-6">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-[var(--muted)] border-l-2 border-[var(--line)] pl-3">Launch Impact</h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {(["downloadIntent", "shareability", "mediaPotential", "storeConversionConfidence"] as const).map(
                  (dim) => {
                    const val = results.report.launchImpact?.[dim] || 0;
                    const labels: Record<string, string> = {
                      downloadIntent: "Download Intent",
                      shareability: "Shareability",
                      mediaPotential: "Media Potential",
                      storeConversionConfidence: "Store Conversion"
                    };
                    return (
                      <div key={dim} className="p-5 rounded-xl bg-white border border-[var(--line)] flex flex-col gap-3 shadow-sm text-center">
                        <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] leading-tight">{labels[dim]}</span>
                        <span className="font-display text-4xl text-[var(--ink)]">{val}%</span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            {/* --- PHASE 4: SCORECARD --- */}
            <div className="flex flex-col gap-6">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-[var(--muted)] border-l-2 border-[var(--line)] pl-3">Scorecard</h3>
              
              <div className="flex flex-col gap-4">
                {/* Hook Metric is special now */}
                <div className="p-5 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex flex-col gap-4">
                  <div className="flex justify-between items-center text-sm font-semibold text-[var(--ink)]">
                    <span className="uppercase tracking-wider flex items-center gap-2">
                      <Hand className="w-4 h-4 text-[var(--accent)]" /> HOOK
                    </span>
                    <span className="font-display text-xl">{results.report.scores?.hookStrength || 0}/100</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--line)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] rounded-full"
                      style={{ width: `${results.report.scores?.hookStrength || 0}%` }}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2 bg-[var(--line)]/30 p-4 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-[var(--muted)]">Would someone stop scrolling?</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${results.report.hookTest?.stopScrolling?.toLowerCase() === 'yes' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--ink)] text-white'}`}>
                        {results.report.hookTest?.stopScrolling?.toUpperCase() || 'NO'}
                      </span>
                    </div>
                    <div className="text-sm text-[var(--ink)] mt-1">
                      <span className="font-semibold text-xs uppercase tracking-wider text-[var(--muted)] mr-2">Reason</span>
                      {results.report.hookTest?.reason}
                    </div>
                  </div>
                </div>

                {/* Other Metrics */}
                {(["clarity", "differentiation", "credibility"] as const).map(
                  (dim) => (
                    <div key={dim} className="p-5 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex flex-col gap-3">
                      <div className="flex justify-between items-center text-sm font-semibold text-[var(--ink)]">
                        <span className="uppercase tracking-wider">{dim}</span>
                        <span className="font-display text-xl">{results.report.scores?.[dim] || 0}/100</span>
                      </div>
                      <div className="h-2 w-full bg-[var(--line)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--accent)] rounded-full"
                          style={{ width: `${results.report.scores?.[dim] || 0}%` }}
                        />
                      </div>
                      <p className="text-sm text-[var(--ink)] leading-relaxed mt-2">
                        {results.report.notes?.[dim]}
                      </p>
                    </div>
                  )
                )}

                {/* Sentence Analysis */}
                {results.report.sentenceAnalysis && (
                  <div className="mt-2 p-6 rounded-xl bg-gradient-to-r from-[var(--ink)] to-[#1a1a1a] text-white flex flex-col gap-3 shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                      <Zap className="w-32 h-32" />
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-white/50">
                      {results.report.sentenceAnalysis.type} Sentence
                    </span>
                    <p className="text-lg font-medium leading-relaxed italic relative z-10">
                      "{results.report.sentenceAnalysis.quote}"
                    </p>
                    <div className="mt-2 text-sm text-white/80 relative z-10">
                      <span className="font-bold text-[var(--accent)] mr-2">Why?</span>
                      {results.report.sentenceAnalysis.reason}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- PHASE 5: PROMOTION COVERAGE MAP --- */}
            <div className="flex flex-col gap-6">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-[var(--muted)] border-l-2 border-[var(--line)] pl-3">Promotion Coverage Map</h3>
              <div className="p-6 rounded-2xl bg-[var(--bg)] border border-[var(--line)] shadow-sm">
                <p className="text-sm text-[var(--muted)] mb-4">Recommended assets for a complete launch strategy:</p>
                <div className="flex flex-col gap-3">
                  {results.report.promotionCoverageMap?.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between border-b border-[var(--line)] pb-3 last:border-0 last:pb-0">
                      <span className="font-medium text-sm text-[var(--ink)]">{item.asset}</span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                        item.status === "Strong" ? "bg-[var(--accent)] text-white" :
                        item.status === "Weak" ? "bg-amber-100 text-amber-700" :
                        item.status === "Optional" ? "bg-[var(--line)] text-[var(--muted)]" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {item.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* --- PHASE 6: REWRITE --- */}
            <div className="flex flex-col gap-6">
              <h3 className="font-semibold text-sm uppercase tracking-widest text-[var(--muted)] border-l-2 border-[var(--line)] pl-3">Targeted Rewrite</h3>
              
              <div className="p-8 rounded-2xl bg-[var(--accent-soft)] border border-[var(--line)] shadow-sm relative">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Improved Opening</h4>
                    <p className="text-lg font-medium text-[var(--ink)] border-l-4 border-[var(--accent)] pl-4 py-1">
                      {results.report.rewrite?.improvedOpening}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Biggest Change</h4>
                    <p className="text-sm text-[var(--ink)] bg-white p-3 rounded-lg border border-[var(--line)]">
                      {results.report.rewrite?.biggestChange}
                    </p>
                  </div>

                  <div className="flex flex-col items-center mt-6 pt-8 border-t border-[var(--line)]">
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:justify-center">
                      <button
                        onClick={handleRewriteAndRetry}
                        className="flex items-center justify-center gap-2 rounded-full px-[32px] py-[16px] bg-[var(--ink)] text-white font-bold text-[1.05rem] rotate-2 hover:rotate-0 hover:shadow-xl hover:shadow-[var(--ink)]/20 transition-all duration-300 ease-out relative z-10 w-full sm:w-auto"
                      >
                        <RefreshCw className="w-5 h-5" /> Run Again with Rewrite
                      </button>
                      <button
                        onClick={handleShare}
                        className="flex items-center justify-center gap-2 rounded-full px-[32px] py-[16px] bg-white border-2 border-[var(--line)] text-[var(--ink)] font-bold text-[1.05rem] -rotate-1 hover:rotate-0 hover:border-[var(--muted)] transition-all duration-300 ease-out relative z-10 w-full sm:w-auto"
                      >
                        Share Report Link
                      </button>
                    </div>
                    <span className="text-xs text-[var(--muted)] mt-4 text-center max-w-sm">
                      This will instantly re-run the gauntlet using the AI's full rewritten pitch.
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
