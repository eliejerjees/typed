"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { questions, Answer } from "@/data/questions";
import { calculateTraits, determineType, TraitScores } from "@/lib/scoring";
import { TypeResult } from "@/data/types";
import LandingScreen from "@/components/LandingScreen";
import QuizScreen from "@/components/QuizScreen";
import ProcessingScreen from "@/components/ProcessingScreen";
import ResultScreen from "@/components/ResultScreen";

type AppState = "landing" | "quiz" | "processing" | "result";

const pageVariants = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 1.02 },
};

export default function Home() {
  const [state, setState] = useState<AppState>("landing");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<TypeResult | null>(null);
  const [scores, setScores] = useState<TraitScores>({});

  const handleStart = useCallback(() => {
    setState("quiz");
    setCurrentQuestion(0);
    setAnswers([]);
  }, []);

  const handleAnswer = useCallback(
    (answer: Answer) => {
      const newAnswers = [...answers, answer];
      setAnswers(newAnswers);

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
      } else {
        setState("processing");
        const finalScores = calculateTraits(newAnswers);
        const finalResult = determineType(newAnswers);
        setScores(finalScores);
        setResult(finalResult);

        setTimeout(() => {
          setState("result");
        }, 2200);
      }
    },
    [answers, currentQuestion]
  );

  const handleRestart = useCallback(() => {
    setState("landing");
    setCurrentQuestion(0);
    setAnswers([]);
    setResult(null);
    setScores({});
  }, []);

  const screenKey =
    state === "quiz" ? `quiz-${currentQuestion}` : state;

  return (
    <main className="overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={screenKey}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {state === "landing" && (
            <LandingScreen onStart={handleStart} />
          )}
          {state === "quiz" && (
            <QuizScreen
              question={questions[currentQuestion]}
              questionIndex={currentQuestion}
              totalQuestions={questions.length}
              onAnswer={handleAnswer}
            />
          )}
          {state === "processing" && <ProcessingScreen />}
          {state === "result" && result && (
            <ResultScreen
              result={result}
              scores={scores}
              onRestart={handleRestart}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
