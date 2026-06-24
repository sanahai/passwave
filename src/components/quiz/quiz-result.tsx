// 풀이 결과 화면
"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useQuizStore } from "@/stores/quiz-store";

export default function QuizResult({ certSlug }: { certSlug: string }) {
  const { questions, results, reset } = useQuizStore();

  const { total, correct, rate } = useMemo(() => {
    const total = questions.length;
    const correct = Object.values(results).filter(Boolean).length;
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { total, correct, rate };
  }, [questions, results]);

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <p className="text-gray-500 mb-2">학습 결과</p>
        <div className="text-5xl font-bold text-blue-600 mb-1">{rate}점</div>
        <p className="text-gray-600 mb-8">
          총 {total}문항 중 {correct}문항 정답
        </p>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="rounded-xl bg-green-50 p-4">
            <div className="text-2xl font-bold text-green-600">{correct}</div>
            <div className="text-sm text-gray-500">맞은 문제</div>
          </div>
          <div className="rounded-xl bg-red-50 p-4">
            <div className="text-2xl font-bold text-red-500">
              {total - correct}
            </div>
            <div className="text-sm text-gray-500">틀린 문제</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href={`/learn/${certSlug}/wrong-notes`}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            오답노트 복습하기
          </Link>
          <Link
            href={`/learn/${certSlug}`}
            onClick={() => reset()}
            className="w-full py-3 border border-gray-200 rounded-lg font-medium hover:border-blue-400 transition"
          >
            과목 선택으로
          </Link>
        </div>
      </div>
    </div>
  );
}
