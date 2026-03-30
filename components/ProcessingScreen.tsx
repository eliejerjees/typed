"use client";

import { motion } from "framer-motion";

export default function ProcessingScreen() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Pulsing rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute h-40 w-40 rounded-full border border-white/20"
          animate={{ scale: [1, 2.5, 1], opacity: [0.4, 0, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: "easeOut" }}
        />
      ))}

      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.h2
          className="text-3xl font-black tracking-tight text-white md:text-5xl"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          Analyzing your taste…
        </motion.h2>

        <div className="h-1 w-48 overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 1.8, ease: "easeInOut" }}
          />
        </div>

        <motion.p
          className="text-sm text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          calibrating vibes...
        </motion.p>
      </div>
    </div>
  );
}
