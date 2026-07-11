"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import LZString from "lz-string";
import { ArrowLeft, Zap } from "lucide-react";
import { PERSONAS } from "@/lib/personas";

function ReportContent() {
  const searchParams = useSearchParams();
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const dataParam = searchParams.get("data");
    if (dataParam) {
      try {
        const decompressed = LZString.decompressFromEncodedURIComponent(dataParam);
        if (decompressed) {
          setResults(JSON.parse(decompressed));
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      }
    } else {
      setError(true);
    }
  }, [searchParams]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <h2 className="font-display text-2xl text-[var(--ink)] mb-4">Report Not Found</h2>
        <p className="text-[var(--muted)] mb-8">This share link is invalid or corrupted.</p>
        <Link href="/gauntlet" className="rounded-full px-6 py-3 border border-[var(--line)] text-[var(--ink)] font-semibold hover:bg-[var(--line)] transition-all">
          Run your own pitch
        </Link>
      </div>
    );
  }

  if (!results) {
    return <div className="py-20 text-center text-[var(--muted)] animate-pulse">Loading report...</div>;
  }

  return (
    <div className="w-full max-w-[600px] flex flex-col items-center animate-in fade-in duration-500 pb-[15vh]">
      <div className="w-full border-b border-[var(--line)] py-12 flex flex-col items-center mb-8">
        <span className="font-display text-2xl text-[var(--ink)]">Heckle Pitch Report</span>
        <span className="text-sm text-[var(--muted)] mt-2">A snapshot of how the internet reacted.</span>
      </div>

      {/* Personas */}
      <div className="w-full flex flex-col">
        {results.personaResponses.map((r: any, idx: number) => {
          const p = PERSONAS[r.persona as keyof typeof PERSONAS];
          if (!p) return null;
          return (
            <div key={idx} className="w-full py-6 border-b border-[var(--line)] flex flex-col bg-[var(--bg)]">
              <div className="flex justify-between items-center w-full">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--line)] flex items-center justify-center text-[var(--ink)]">
                    {/* fallback icon if missing */}
                    <Zap className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm text-[var(--ink)]">{p.name}</span>
                    <span className="text-[10px] uppercase tracking-wider text-[var(--muted)]">{p.label}</span>
                  </div>
                </div>
                {r.wouldShare && r.wouldShare.toLowerCase() !== "no" && (
                  <span className="text-xs font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 rounded-md">
                    WOULD SHARE
                  </span>
                )}
              </div>
              <p className="mt-4 text-[0.95rem] text-[var(--ink)] leading-relaxed pl-11">
                "{r.response}"
              </p>
            </div>
          );
        })}
      </div>

      <div className="w-full border-b border-[var(--line)] py-12 flex flex-col items-center mb-8">
        <span className="font-display text-2xl text-[var(--ink)]">Pitch Scorecard</span>
      </div>

      {/* Metrics */}
      <div className="flex flex-col gap-6 w-full">
        {results.report.verdict && (
          <div className="p-6 rounded-xl bg-[var(--ink)] text-white shadow-lg">
            <h3 className="font-semibold text-xs uppercase tracking-widest text-white/50 mb-3">Overall Verdict</h3>
            <p className="text-lg font-medium leading-relaxed">{results.report.verdict}</p>
          </div>
        )}

        {(["clarity", "differentiation", "credibility", "hookStrength"] as const).map(
          (dim) => (
            <div key={dim} className="p-5 rounded-xl bg-[var(--bg)] border border-[var(--line)] flex flex-col gap-3">
              <div className="flex justify-between items-center text-sm font-semibold text-[var(--ink)]">
                <span className="uppercase tracking-wider">{dim}</span>
                <span className="font-display text-xl">{results.report.scores?.[dim] || 0}/100</span>
              </div>
              <div className="h-2 w-full bg-[var(--line)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--accent)] rounded-full" style={{ width: `${results.report.scores?.[dim] || 0}%` }} />
              </div>
            </div>
          )
        )}
      </div>

      <div className="mt-16 flex flex-col items-center">
        <Link href="/gauntlet" className="rounded-full px-[36px] py-[16px] bg-[var(--accent)] text-white font-bold text-[1.05rem] shadow-[0_10px_24px_rgba(27,143,111,0.28)] -rotate-2 hover:rotate-0 hover:bg-[var(--accent-dark)] transition-all duration-200">
          Run Your Own Pitch
        </Link>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <main className="min-h-screen flex flex-col items-center p-6 bg-[var(--bg)] relative overflow-hidden">
      {/* Decorative Quotes */}
      <div className="fixed top-[-60px] left-8 font-serif text-[280px] text-[var(--ink)] opacity-[0.03] pointer-events-none leading-none select-none z-0">“</div>
      <div className="fixed top-[-60px] right-8 font-serif text-[280px] text-[var(--ink)] opacity-[0.03] pointer-events-none leading-none select-none z-0">”</div>

      <header className="w-full max-w-[800px] py-6 flex items-center justify-between relative z-10">
        <Link href="/" className="flex items-center gap-2 text-[var(--muted)] hover:text-[var(--ink)] transition-colors font-semibold">
          <ArrowLeft className="w-4 h-4" /> Heckle Home
        </Link>
      </header>

      <Suspense fallback={<div className="py-20 text-center text-[var(--muted)]">Loading report data...</div>}>
        <ReportContent />
      </Suspense>
    </main>
  );
}
