// 퀴즈 상태 관리 훅 — Zustand 스토어를 감싸는 편의 훅
"use client";

import { useQuizStore } from "@/stores/quiz-store";

export function useQuiz() {
  const questions = useQuizStore((s) => s.questions);
  const currentIndex = useQuizStore((s) => s.currentIndex);
  const isFinished = useQuizStore((s) => s.isFinished);
  const results = useQuizStore((s) => s.results);

  const current = questions[currentIndex] ?? null;
  const total = questions.length;
  const correctCount = Object.values(results).filter(Boolean).length;

  return {
    current,
    currentIndex,
    total,
    isFinished,
    correctCount,
    progress: total > 0 ? ((currentIndex + 1) / total) * 100 : 0,
  };
}
