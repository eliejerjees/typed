"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { questions, Answer } from "@/data/questions";
import { determineType } from "@/lib/scoring";
import LandingScreen from "@/components/LandingScreen";
import QuizScreen from "@/components/QuizScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultScreen from "@/components/ResultScreen";

type AppState = "landing" | "quiz" | "processing" | "result";

export default function Home() {
  const [state, setState] = useState<AppState>("landing");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);

  function handleStart() {
    setAnswers([]);
    setQuestionIndex(0);
    setState("quiz");
  }

  function handleAnswer(answer: Answer) {
    const updated = [...answers, answer];
    setAnswers(updated);

    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
    } else {
      setState("processing");
      setTimeout(() => setState("result"), 2200);
    }
  }

  function handleRestart() {
    setAnswers([]);
    setQuestionIndex(0);
    setState("landing");
  }

  const result = state === "result" ? determineType(answers) : null;
  const screenKey = state === "quiz" ? `quiz-${questionIndex}` : state;

  return (
    <main className="h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screenKey}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {state === "landing" && <LandingScreen onStart={handleStart} />}
          {state === "quiz" && (
            <QuizScreen
              question={questions[questionIndex]}
              questionIndex={questionIndex}
              totalQuestions={questions.length}
              onAnswer={handleAnswer}
            />
          )}
          {state === "processing" && <ProcessingScreen />}
          {state === "result" && result && (
            <ResultScreen result={result} onRestart={handleRestart} />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
