"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  current: number;
  total: number;
}

export default function ProgressBar({ current, total }: ProgressBarProps) {
  const progress = ((current + 1) / total) * 100;

  return (
    <div className="absolute top-0 left-0 z-50 w-full px-6 pt-6">
      <div className="flex items-center gap-3">
        <span className="text-xs font-bold tracking-widest text-white/60 uppercase">
          {current + 1}/{total}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    </div>
  );
}
