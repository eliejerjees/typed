"use client";

import { motion } from "framer-motion";

interface AnimatedBackgroundProps {
  gradient?: string;
  children: React.ReactNode;
}

export default function AnimatedBackground({
  gradient = "from-purple-600 via-pink-500 to-orange-500",
  children,
}: AnimatedBackgroundProps) {
  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden bg-gradient-to-br ${gradient}`}
    >
      {/* Floating blobs */}
      <motion.div
        className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/2 -right-20 h-80 w-80 rounded-full bg-white/10 blur-3xl"
        animate={{
          x: [0, -60, 30, 0],
          y: [0, 50, -70, 0],
          scale: [1, 0.8, 1.3, 1],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-white/5 blur-3xl"
        animate={{
          x: [0, 40, -60, 0],
          y: [0, -40, 20, 0],
          scale: [1, 1.4, 0.7, 1],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-20 left-1/2 h-48 w-48 rounded-full bg-yellow-300/10 blur-3xl"
        animate={{
          x: [0, -50, 70, 0],
          y: [0, 60, -30, 0],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
