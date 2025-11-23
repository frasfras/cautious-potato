import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HauntedMinimal() {
  const [pulse, setPulse] = useState(false);
  const [glitch, setGlitch] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const p = setInterval(() => setPulse((s) => !s), 4500);
    const g = setInterval(() => setGlitch(true), 8000);
    const gOff = setInterval(() => setGlitch(false), 8200);
    return () => {
      clearInterval(p);
      clearInterval(g);
      clearInterval(gOff);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#050507] text-gray-200 antialiased font-sans relative overflow-hidden">

      {/* noise */}
      <div
        aria-hidden
        className="pointer-events-none inset-0 fixed opacity-5"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'120\\' height=\\'120\\' viewBox=\\'0 0 120 120\\'><filter id=\\'n\\'><feTurbulence baseFrequency=\\'0.9\\' numOctaves=\\'2\\' stitchTiles=\\'stitch\\'/></filter><rect width=\\'100%\\' height=\\'100%\\' filter=\\'url(%23n)\\' opacity=\\'0.02\\' fill=\\'#ffffff' /></svg>')",
          mixBlendMode: "overlay",
        }}
      />

      {/* scanlines */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-[repeating-linear-gradient(180deg,rgba(255,255,255,0.01),rgba(255,255,255,0.01)1px,transparent 2px,transparent 3px)]"
        style={{ opacity: 0.03 }}
      />

      <main className="relative z-10 max-w-xl mx-auto px-6 py-24">
        <header className="mb-8">
          <h1 className="text-5xl md:text-6xl font-light tracking-widest leading-tight select-none">
            <GlitchText text="HALLOWS" active={glitch} />
          </h1>
          <p className="mt-4 text-gray-400 max-w-md">
            A quiet interface. Tension in the gaps. Minimal, but not empty.
          </p>
        </header>

        <section className="space-y-6">
          <Card title="Latest Echo" pulse={pulse}>
            Whispers archived. Click to listen.
          </Card>

          <Card title="Memory" subtle>
            Last activity — 2 days ago.
          </Card>

          <button
            className="mt-6 px-4 py-2 rounded-md text-sm bg-white/5 backdrop-blur-sm border border-white/8 hover:translate-y-[-1px] transition-transform"
            onClick={() => setSettingsOpen(true)}
          >
            Settings
          </button>
        </section>

        <footer className="mt-20 text-xs text-gray-600">
          Made with silence • 2025
        </footer>
      </main>

      {/* faint vignette pulse */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 0.06, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            transition={{ duration: 1.5 }}
            aria-hidden
            className="pointer-events-none fixed inset-0 bg-gradient-to-b from-transparent via-black/20 to-transparent"
          />
        )}
      </AnimatePresence>

      {/* SETTINGS PANEL */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="fixed right-0 top-0 w-80 h-full bg-[#0a0a0d] border-l border-white/10 shadow-2xl shadow-black/50 z-50 p-6 space-y-6"
          >
            <h2 className="text-xl tracking-widest text-gray-200">
              Settings
            </h2>

            <Toggle label="Ambient Pulse" value={pulse} setValue={setPulse} />
            <Toggle label="Glitch Mode" value={glitch} setValue={setGlitch} />
            <Toggle
              label="Enable Grain"
              value={true}
              disabled
              hint="(always on)"
            />

            <button
              className="w-full mt-10 px-4 py-2 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 transition"
              onClick={() => setSettingsOpen(false)}
            >
              Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Toggle({ label, value, setValue, disabled, hint }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400">{label}</span>
      <button
        disabled={disabled}
        onClick={() => !disabled && setValue((v) => !v)}
        className={`w-12 h-6 flex items-center rounded-full transition ${
          value ? "bg-white/20" : "bg-white/5"
        } ${disabled ? "opacity-30 cursor-not-allowed" : ""}`}
      >
        <div
          className={`w-5 h-5 rounded-full bg-white transition ${
            value ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>

      {hint && <span className="text-[10px] text-gray-500 ml-2">{hint}</span>}
    </div>
  );
}

function Card({ title, children, pulse, subtle }) {
  return (
    <article
      className={`p-5 rounded-2xl border ${
        subtle ? "border-white/6" : "border-white/8"
      } bg-white/3 backdrop-blur-sm`}
    >
      <h3 className="text-sm tracking-widest text-gray-200 mb-2">{title}</h3>
      <div className="text-gray-300 text-sm">{children}</div>
    </article>
  );
}

function GlitchText({ text, active }) {
  return (
    <span className="relative inline-block">
      <span className="relative z-10">{text}</span>

      {/* glitch shadow */}
      <span
        className="absolute left-0 top-0 z-0 pointer-events-none"
        style={{
          mixBlendMode: "screen",
          transform: active ? "translate(2px,-1px)" : "translate(0,0)",
          opacity: active ? 0.9 : 0,
        }}
      >
        <svg
          width="100%"
          height="1em"
          viewBox="0 0 100 10"
          preserveAspectRatio="none"
          style={{ display: "block" }}
        >
          <text
            x="0"
            y="8"
            fontSize="10"
            fill="#ff6b6b"
            fontFamily="inherit"
          >
            {text}
          </text>
        </svg>
      </span>
    </span>
  );
}
