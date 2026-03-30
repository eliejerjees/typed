"use client";

import { motion } from "framer-motion";
import { TypeResult } from "@/data/types";
import { TraitScores, getTopTraits } from "@/lib/scoring";

interface ResultScreenProps {
  result: TypeResult;
  scores: TraitScores;
  onRestart: () => void;
}

function TraitLabel({ trait, index }: { trait: string; index: number }) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 1.2 + index * 0.15, type: "spring", stiffness: 200 }}
      className="rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-sm font-semibold text-white backdrop-blur-sm"
    >
      {trait}
    </motion.span>
  );
}

function RecommendationSection({
  title,
  items,
  delay,
}: {
  title: string;
  items: string[];
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
    >
      <h4 className="mb-2 text-xs font-bold tracking-widest text-white/50 uppercase">
        {title}
      </h4>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium text-white"
          >
            {item}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

export default function ResultScreen({
  result,
  scores,
  onRestart,
}: ResultScreenProps) {
  const topTraits = getTopTraits(scores);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className={`results-scrollable flex min-h-screen w-full flex-col items-center bg-gradient-to-br ${result.gradient} relative overflow-y-auto`}
    >
      {/* Background blobs */}
      <motion.div
        className="absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-white/5 blur-3xl"
        animate={{ scale: [1, 1.2, 1], rotate: [0, 45, 0] }}
        transition={{ duration: 20, repeat: Infinity }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-black/10 blur-3xl"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 15, repeat: Infinity }}
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-6 px-6 py-16">
        {/* "You are" label */}
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm font-bold tracking-[0.3em] text-white/60 uppercase"
        >
          You are
        </motion.p>

        {/* Type name */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{
            delay: 0.5,
            duration: 0.8,
            type: "spring",
            stiffness: 100,
          }}
          className="text-center text-5xl font-black leading-tight tracking-tight text-white md:text-7xl"
        >
          {result.name}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="max-w-md text-center text-base leading-relaxed text-white/80 md:text-lg"
        >
          {result.description}
        </motion.p>

        {/* Traits */}
        <div className="flex flex-wrap justify-center gap-2">
          {topTraits.map((trait, i) => (
            <TraitLabel key={trait} trait={trait} index={i} />
          ))}
        </div>

        {/* MBTI */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-center backdrop-blur-sm"
        >
          <p className="text-xs font-bold tracking-widest text-white/50 uppercase">
            Closest MBTI
          </p>
          <p className="text-2xl font-black text-white">{result.mbti}</p>
        </motion.div>

        {/* Recommendations */}
        <motion.div
          className="mt-4 flex w-full flex-col gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
        >
          <motion.h3
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.8 }}
            className="text-center text-lg font-bold tracking-widest text-white/70 uppercase"
          >
            Your Recommendations
          </motion.h3>

          <RecommendationSection
            title="Movies"
            items={result.movies}
            delay={2.0}
          />
          <RecommendationSection
            title="Artists"
            items={result.artists}
            delay={2.2}
          />
          <RecommendationSection
            title="Shows"
            items={result.shows}
            delay={2.4}
          />
        </motion.div>

        {/* Restart */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRestart}
          className="mt-6 cursor-pointer rounded-full bg-white px-8 py-3 text-sm font-bold tracking-wide text-black uppercase"
        >
          Retake Quiz
        </motion.button>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8 }}
          className="pb-8 text-xs text-white/30"
        >
          typed.
        </motion.p>
      </div>
    </motion.div>
  );
}
