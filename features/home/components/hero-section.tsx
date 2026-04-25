'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Building2,
  Users,
  TrendingUp,
  ChevronDown,
} from 'lucide-react';

/* ── Blueprint grid helpers ─────────────────────────────────────────── */
const GRID_LIGHT: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(30,27,75,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30,27,75,0.05) 1px, transparent 1px),
    linear-gradient(rgba(30,27,75,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30,27,75,0.02) 1px, transparent 1px)
  `,
  backgroundSize: '60px 60px, 60px 60px, 12px 12px, 12px 12px',
};

const GRID_DARK: React.CSSProperties = {
  backgroundImage: `
    linear-gradient(rgba(245,158,11,0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,158,11,0.06) 1px, transparent 1px),
    linear-gradient(rgba(245,158,11,0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(245,158,11,0.02) 1px, transparent 1px)
  `,
  backgroundSize: '60px 60px, 60px 60px, 12px 12px, 12px 12px',
};

/* ── Construction skyline SVG ───────────────────────────────────────── */
function CranesSvg() {
  return (
    <svg
      viewBox="0 0 900 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
      aria-hidden="true"
    >
      <rect x="30" y="120" width="70" height="220" fill="currentColor" />
      <rect x="40" y="130" width="12" height="16" fill="rgba(245,158,11,0.3)" />
      <rect x="62" y="130" width="12" height="16" fill="rgba(245,158,11,0.3)" />
      <rect
        x="40"
        y="158"
        width="12"
        height="16"
        fill="rgba(245,158,11,0.15)"
      />
      <rect
        x="62"
        y="158"
        width="12"
        height="16"
        fill="rgba(245,158,11,0.15)"
      />
      <rect x="40" y="186" width="12" height="16" fill="rgba(245,158,11,0.2)" />
      <rect x="62" y="186" width="12" height="16" fill="rgba(245,158,11,0.3)" />
      <rect x="120" y="60" width="55" height="280" fill="currentColor" />
      {Array.from({ length: 8 }).map((_, i) => (
        <g key={i}>
          <rect
            x="128"
            y={72 + i * 28}
            width="9"
            height="12"
            fill={`rgba(245,158,11,${0.1 + (i % 3) * 0.1})`}
          />
          <rect
            x="148"
            y={72 + i * 28}
            width="9"
            height="12"
            fill={`rgba(245,158,11,${0.15 + (i % 2) * 0.1})`}
          />
        </g>
      ))}
      <rect x="190" y="160" width="90" height="180" fill="currentColor" />
      <rect
        x="300"
        y="200"
        width="80"
        height="140"
        fill="currentColor"
        opacity="0.7"
      />
      <rect x="296" y="196" width="88" height="6" fill="rgba(245,158,11,0.4)" />
      <rect x="296" y="226" width="88" height="4" fill="rgba(245,158,11,0.3)" />
      <rect x="296" y="256" width="88" height="4" fill="rgba(245,158,11,0.3)" />
      <rect
        x="296"
        y="196"
        width="4"
        height="144"
        fill="rgba(245,158,11,0.3)"
      />
      <rect
        x="380"
        y="196"
        width="4"
        height="144"
        fill="rgba(245,158,11,0.3)"
      />
      <rect x="430" y="80" width="14" height="260" fill="currentColor" />
      <rect x="280" y="78" width="280" height="8" fill="currentColor" />
      <rect x="280" y="78" width="80" height="8" fill="rgba(245,158,11,0.5)" />
      <line
        x1="510"
        y1="86"
        x2="510"
        y2="160"
        stroke="rgba(245,158,11,0.5)"
        strokeWidth="2"
      />
      <rect
        x="503"
        y="158"
        width="14"
        height="10"
        fill="rgba(245,158,11,0.4)"
      />
      <rect x="560" y="140" width="65" height="200" fill="currentColor" />
      <rect x="640" y="100" width="50" height="240" fill="currentColor" />
      <rect
        x="710"
        y="170"
        width="120"
        height="170"
        fill="currentColor"
        opacity="0.8"
      />
      <rect x="840" y="40" width="12" height="300" fill="currentColor" />
      <rect x="720" y="38" width="200" height="6" fill="currentColor" />
      <line
        x1="860"
        y1="44"
        x2="860"
        y2="130"
        stroke="rgba(245,158,11,0.4)"
        strokeWidth="1.5"
      />
      <rect x="0" y="338" width="900" height="2" fill="currentColor" />
    </svg>
  );
}

/* ── Floating metric card ───────────────────────────────────────────── */
interface MetricCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  delay?: string;
}

function MetricCard({ icon, value, label, delay = '0s' }: MetricCardProps) {
  return (
    <div
      className="animate-float rounded-xl border border-stone-200 bg-white/90 p-4 backdrop-blur-md dark:border-white/8 dark:bg-zinc-900/90"
      style={{ animationDelay: delay }}
    >
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-black text-zinc-900 dark:text-white">
        {value}
      </div>
      <div className="mt-0.5 text-xs font-medium text-zinc-500">{label}</div>
    </div>
  );
}

/* ── Hero Section ───────────────────────────────────────────────────── */
export function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const skylineRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const y = window.scrollY;
        // Layer 1 — blueprint grid drifts at 30% scroll speed (70% lag)
        if (gridRef.current)
          gridRef.current.style.transform = `translateY(${y * 0.3}px)`;
        // Layer 2 — skyline moves at only 40% scroll speed (very visible lag)
        if (skylineRef.current)
          skylineRef.current.style.transform = `translateY(${y * 0.6}px)`;
        // Layer 3 — content floats slightly slower, gives foreground depth
        if (contentRef.current)
          contentRef.current.style.transform = `translateY(${y * 0.14}px)`;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <section className="relative flex min-h-screen flex-col justify-center bg-stone-50 dark:bg-zinc-950">
      {/* ── Parallax background layers (clipped to section bounds) ── */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden
      >
        {/* Layer 1 — blueprint grid, oversized so translateY doesn't reveal gaps */}
        <div
          ref={gridRef}
          className="absolute will-change-transform"
          style={{ inset: '-25% 0' }}
        >
          <div className="absolute inset-0 dark:hidden" style={GRID_LIGHT} />
          <div
            className="absolute inset-0 hidden dark:block"
            style={GRID_DARK}
          />
        </div>

        {/* Radial center accent — dark only */}
        <div
          className="absolute inset-0 hidden dark:block"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,158,11,0.04) 0%, transparent 70%)',
          }}
        />

        {/* Layer 2 — city skyline, oversized downward so it doesn't clip when translated */}
        <div
          ref={skylineRef}
          className="absolute right-0 left-0 text-stone-300/80 will-change-transform dark:text-zinc-800"
          style={{ bottom: '-35%', height: '135%' }}
        >
          <div className="absolute right-0 bottom-[26%] left-0 h-64 md:h-80 lg:h-96">
            <CranesSvg />
          </div>
        </div>

        {/* Ground fade — pins to actual bottom of section */}
        <div className="absolute right-0 bottom-0 left-0 h-48 bg-gradient-to-t from-stone-50 to-transparent dark:from-zinc-950" />
      </div>

      {/* ── Content — layer 3 (subtle lift parallax) ── */}
      <div
        ref={contentRef}
        className="relative z-10 mx-auto w-full max-w-7xl px-6 pt-36 pb-28 will-change-transform"
      >
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_380px]">
          {/* Left — copy */}
          <div>
            {/* Beta badge */}
            <div
              className={`mb-8 inline-flex items-center gap-2 rounded-full border border-amber-300/60 bg-amber-50 px-4 py-1.5 transition-all duration-700 dark:border-amber-500/20 dark:bg-amber-500/6 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
            >
              <span
                className="h-1.5 w-1.5 rounded-full bg-amber-500"
                style={{
                  animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
                }}
              />
              <span className="text-sm font-semibold tracking-wide text-amber-700 dark:text-amber-400">
                Now in Beta — Join India&apos;s construction revolution
              </span>
            </div>

            {/* Headline */}
            <h1
              className={`max-w-3xl text-5xl leading-[1.04] font-black tracking-tight text-zinc-900 transition-all delay-100 duration-700 sm:text-6xl lg:text-7xl dark:text-white ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
            >
              The Operating System
              <br />
              <span
                className="animate-shimmer-text text-transparent"
                style={{
                  backgroundImage:
                    'linear-gradient(90deg, #f59e0b, #ea580c, #fbbf24, #f59e0b)',
                  WebkitBackgroundClip: 'text',
                  backgroundClip: 'text',
                }}
              >
                for Modern
              </span>{' '}
              Construction.
            </h1>

            {/* Subheadline */}
            <p
              className={`mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 transition-all delay-200 duration-700 dark:text-zinc-400 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
            >
              Echno unifies workforce, projects, materials, finances, and site
              operations into a single command center — purpose-built for
              construction companies across India.
            </p>

            {/* CTAs */}
            <div
              className={`mt-10 flex flex-wrap gap-4 transition-all delay-300 duration-700 ${loaded ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
            >
              <Link href="/plans">
                <button
                  className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg px-8 py-4 text-base font-bold text-zinc-950 shadow-lg shadow-amber-500/20 transition-all duration-300 hover:scale-[1.03] hover:shadow-amber-500/30 active:scale-[0.98]"
                  style={{
                    background:
                      'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                  }}
                >
                  <span>Book a Demo</span>
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  <span
                    className="absolute inset-0 -translate-x-full skew-x-12 bg-white/20 transition-transform duration-500 group-hover:translate-x-full"
                    aria-hidden
                  />
                </button>
              </Link>
              <Link href="/features">
                <button className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white/80 px-8 py-4 text-base font-semibold text-zinc-700 backdrop-blur-sm transition-all duration-300 hover:border-zinc-400 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:border-white/20 dark:hover:bg-white/10">
                  Explore Platform
                </button>
              </Link>
            </div>

            {/* Trust line */}
            <p
              className={`mt-8 text-sm text-zinc-500 transition-all delay-500 duration-700 dark:text-zinc-600 ${loaded ? 'opacity-100' : 'opacity-0'}`}
            >
              No credit card required · Setup in under 10 minutes · GDPR
              compliant
            </p>
          </div>

          {/* Right — metric cards */}
          <div
            className={`hidden grid-cols-1 gap-4 transition-all delay-400 duration-700 lg:grid ${loaded ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}
          >
            <MetricCard
              icon={
                <Building2 className="h-4 w-4 text-amber-600 dark:text-amber-500" />
              }
              value="247"
              label="Active Construction Sites"
              delay="0s"
            />
            <MetricCard
              icon={<Users className="h-4 w-4 text-sky-500" />}
              value="12,000+"
              label="Workers Tracked Daily"
              delay="0.4s"
            />
            <MetricCard
              icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
              value="₹340Cr+"
              label="Project Value Managed"
              delay="0.8s"
            />
            {/* Live indicator */}
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                Platform live · 99.9% uptime
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-zinc-400 dark:text-zinc-700">
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase">
          Scroll
        </span>
        <ChevronDown
          className="h-5 w-5"
          style={{ animation: 'echno-float 2s ease-in-out infinite' }}
        />
      </div>
    </section>
  );
}
