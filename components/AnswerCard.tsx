"use client";

import { motion } from "framer-motion";

interface AnswerCardProps {
  text: string;
  index: number;
  onClick: () => void;
}

export default function AnswerCard({ text, index, onClick }: AnswerCardProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.3 + index * 0.1, duration: 0.5, ease: "easeOut" }}
      whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.25)" }}
      whileTap={{ scale: 0.95 }}
      className="w-full cursor-pointer rounded-2xl border border-white/20 bg-white/10 px-6 py-5 text-left backdrop-blur-sm transition-colors"
    >
      <span className="text-lg font-semibold text-white md:text-xl">
        {text}
      </span>
    </motion.button>
  );
}
