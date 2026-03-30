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
      className="w-full cursor-pointer rounded-2xl border border-white/20 bg-white/10 px-8 py-5 text-left backdrop-blur-sm transition-all duration-200 ease-out hover:scale-[1.03] hover:bg-white/20 active:scale-95"
    >
      <span className="text-lg font-semibold text-white md:text-xl">
        {text}
      </span>
    </motion.button>
  );
}
