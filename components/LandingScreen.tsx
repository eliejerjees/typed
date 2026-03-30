"use client";

import { motion } from "framer-motion";

export default function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-600 to-orange-500 px-6">
      {/* Floating blobs */}
      <motion.div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, 80, -40, 0], y: [0, -60, 40, 0], scale: [1, 1.2, 0.9, 1] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, -60, 30, 0], y: [0, 50, -70, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 40, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2, duration: 1, type: "spring", stiffness: 80 }}
          className="text-8xl font-black tracking-tighter text-white md:text-9xl"
        >
          Typed
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="text-center text-lg font-medium tracking-wide text-white/70 md:text-xl"
        >
          Your taste has a type.
        </motion.p>

        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, duration: 0.6, type: "spring" }}
          onClick={onStart}
          className="mt-6 cursor-pointer rounded-full bg-white px-14 py-5 text-xl font-black tracking-wider text-black uppercase shadow-2xl transition-all duration-200 ease-out hover:scale-110 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] active:scale-90"
        >
          Start
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          className="mt-8 text-xs tracking-widest text-white/30 uppercase"
        >
          8 questions · 2 minutes · infinite taste
        </motion.p>
      </motion.div>
    </div>
  );
}
