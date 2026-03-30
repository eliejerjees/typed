"use client";

import { useState, useRef, useCallback } from "react";
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
  const [result, setResult] = useState<TypeResult | null>(null);
  const [scores, setScores] = useState<TraitScores>({});

  const answersRef = useRef<Answer[]>([]);
  const questionRef = useRef(0);

  const handleStart = useCallback(() => {
    answersRef.current = [];
    questionRef.current = 0;
    setCurrentQuestion(0);
    setState("quiz");
  }, []);

  const handleAnswer = useCallback((answer: Answer) => {
    answersRef.current = [...answersRef.current, answer];
    const qi = questionRef.current;

    if (qi < questions.length - 1) {
      questionRef.current = qi + 1;
      setCurrentQuestion(qi + 1);
    } else {
      const finalScores = calculateTraits(answersRef.current);
      const finalResult = determineType(answersRef.current);
      setScores(finalScores);
      setResult(finalResult);
      setState("processing");

      setTimeout(() => {
        setState("result");
      }, 2200);
    }
  }, []);

  const handleRestart = useCallback(() => {
    answersRef.current = [];
    questionRef.current = 0;
    setCurrentQuestion(0);
    setResult(null);
    setScores({});
    setState("landing");
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
          {state === "quiz" && questions[currentQuestion] && (
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
