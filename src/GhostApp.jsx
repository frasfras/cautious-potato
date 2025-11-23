import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function GhostApp() {
  const [flicker, setFlicker] = useState(false);
  const [whisper, setWhisper] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setFlicker((f) => !f), 2000 + Math.random() * 3000);
    const w = setInterval(() => setWhisper(Math.random()), 4000 + Math.random() * 5000);
    return () => {
      clearInterval(i);
      clearInterval(w);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black text-gray-200 overflow-hidden font-mono select-none">
      {/* Subtle grain */}
      <div className="absolute inset-0 opacity-[0.09] pointer-events-none" style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }} />

      {/* Whisper text */}
      <motion.div
        className="absolute top-10 left-6 text-xs tracking-widest text-gray-400"
        animate={{ opacity: whisper > 0.5 ? 0.15 : 0 }}
        transition={{ duration: 0.8 }}
      >
        do you hear it?
      </motion.div>

      {/* Ghost silhouette */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 mx-auto w-48 h-48 rounded-full bg-gradient-to-b from-white/20 to-transparent blur-2xl"
        animate={{ y: flicker ? -10 : 0, opacity: flicker ? 0.18 : 0.32 }}
        transition={{ duration: 1.8, ease: "easeInOut" }}
      />

      {/* Floating panels */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[340px] p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl shadow-2xl shadow-black/60">
        <motion.h1
          className="text-2xl mb-3 tracking-widest text-gray-100"
          animate={{ opacity: flicker ? 0.7 : 1 }}
          transition={{ duration: 0.4 }}
        >
          G H O S T   I N T E R F A C E
        </motion.h1>

        <p className="text-gray-400 text-sm leading-relaxed">
          Something lingers inside this UI. It watches the cursor. It remembers every movement.
        </p>
      </div>

      {/* Cursor glow */}
      <GhostCursor />
    </div>
  );
}

export function GhostCursor() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const move = (e) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <motion.div
      className="pointer-events-none fixed w-16 h-16 rounded-full bg-white/10 blur-2xl"
      animate={{ x: pos.x - 32, y: pos.y - 32 }}
      transition={{ type: "spring", stiffness: 60, damping: 20 }}
    />
  );
}
