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
    >
      <span className="text-lg font-semibold text-white md:text-xl">
        {text}
      </span>
    </motion.button>
  );
}
