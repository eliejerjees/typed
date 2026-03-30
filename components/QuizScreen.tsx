"use client";

import { motion } from "framer-motion";
import { Question, Answer } from "@/data/questions";
import AnswerCard from "./AnswerCard";
import ProgressBar from "./ProgressBar";

interface QuizScreenProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (answer: Answer) => void;
}

const gradients = [
  "from-violet-600 via-purple-600 to-indigo-700",
  "from-pink-600 via-rose-500 to-orange-500",
  "from-cyan-600 via-blue-600 to-purple-700",
  "from-emerald-500 via-teal-500 to-cyan-600",
  "from-orange-500 via-red-500 to-pink-600",
  "from-indigo-600 via-violet-600 to-purple-600",
  "from-rose-500 via-pink-500 to-fuchsia-600",
  "from-amber-500 via-orange-500 to-red-500",
];

export default function QuizScreen({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
}: QuizScreenProps) {
  const gradient = gradients[questionIndex % gradients.length];

  return (
    <div
      className={`flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-br ${gradient} relative`}
    >
      {/* Floating blobs */}
      <motion.div
        className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, 50, -30, 0], y: [0, -40, 30, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-16 bottom-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"
        animate={{ x: [0, -40, 20, 0], y: [0, 30, -50, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />

      <ProgressBar current={questionIndex} total={totalQuestions} />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-8 px-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center text-3xl font-black tracking-tight text-white md:text-5xl"
        >
          {question.question}
        </motion.h2>

        <div className="flex w-full flex-col gap-3">
          {question.answers.map((answer, i) => (
            <AnswerCard
              key={answer.text}
              text={answer.text}
              index={i}
              onClick={() => onAnswer(answer)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
