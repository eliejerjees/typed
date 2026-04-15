"use client";

import { motion } from "framer-motion";
import { Question, Answer } from "@/data/questions";
import AnswerCard from "./AnswerCard";
import ProgressBar from "./ProgressBar";

const colors = [
  "bg-violet-600",
  "bg-rose-500",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-orange-600",
  "bg-indigo-600",
  "bg-fuchsia-600",
  "bg-amber-500",
];

interface QuizScreenProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  onAnswer: (answer: Answer) => void;
}

export default function QuizScreen({
  question,
  questionIndex,
  totalQuestions,
  onAnswer,
}: QuizScreenProps) {
  return (
    <div
      className={`relative flex min-h-screen w-full flex-col items-center justify-center ${colors[questionIndex % colors.length]}`}
    >
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
