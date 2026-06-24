// Zustand 퀴즈 상태 관리
// 문제풀기 중 상태를 여기서 관리
import { create } from "zustand";
import type { Question } from "@/types";

interface QuizStore {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>;
  results: Record<string, boolean>;
  sessionId: string;
  isFinished: boolean;
  // 액션
  startQuiz: (questions: Question[], sessionId: string) => void;
  selectAnswer: (questionId: string, optionId: string) => void;
  recordResult: (questionId: string, isCorrect: boolean) => void;
  nextQuestion: () => void;
  prevQuestion: () => void;
  finishQuiz: () => void;
  reset: () => void;
}

export const useQuizStore = create<QuizStore>((set) => ({
  questions: [],
  currentIndex: 0,
  answers: {},
  results: {},
  sessionId: "",
  isFinished: false,

  startQuiz: (questions, sessionId) =>
    set({
      questions,
      currentIndex: 0,
      answers: {},
      results: {},
      sessionId,
      isFinished: false,
    }),

  selectAnswer: (questionId, optionId) =>
    set((state) => ({
      answers: { ...state.answers, [questionId]: optionId },
    })),

  recordResult: (questionId, isCorrect) =>
    set((state) => ({
      results: { ...state.results, [questionId]: isCorrect },
    })),

  nextQuestion: () =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, state.questions.length - 1),
    })),

  prevQuestion: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),

  finishQuiz: () => set({ isFinished: true }),

  reset: () =>
    set({
      questions: [],
      currentIndex: 0,
      answers: {},
      results: {},
      sessionId: "",
      isFinished: false,
    }),
}));
