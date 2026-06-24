// 문제풀기 메인 화면
// URL: /learn/beauty/quiz?subject=common&count=20
"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useQuizStore } from "@/stores/quiz-store";
import QuestionCard from "@/components/quiz/question-card";
import QuizResult from "@/components/quiz/quiz-result";
import type { Question } from "@/types";

function QuizRunner({ certSlug }: { certSlug: string }) {
  const searchParams = useSearchParams();
  const subjectSlug = searchParams.get("subject") || "common";
  const count = parseInt(searchParams.get("count") || "20");
  const supabase = createClient();

  const { questions, currentIndex, isFinished, startQuiz } = useQuizStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuestions = async () => {
      setLoading(true);

      // 1. 자격증 ID 찾기
      const { data: cert } = await supabase
        .from("certifications")
        .select("id")
        .eq("slug", certSlug)
        .single();
      if (!cert) {
        setLoading(false);
        return;
      }

      // 2. 과목 ID 찾기
      const { data: subject } = await supabase
        .from("subjects")
        .select("id")
        .eq("cert_id", cert.id)
        .eq("slug", subjectSlug)
        .single();
      if (!subject) {
        setLoading(false);
        return;
      }

      // 3. 문제 가져오기 (보기 포함)
      const { data: loaded } = await supabase
        .from("questions")
        .select(
          `
          *,
          options:question_options(*)
        `
        )
        .eq("subject_id", subject.id)
        .order("id") // TODO: 랜덤 정렬은 서버에서 처리
        .limit(count);

      if (loaded && loaded.length > 0) {
        const sessionId = crypto.randomUUID();
        startQuiz(loaded as unknown as Question[], sessionId);
      }
      setLoading(false);
    };

    loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certSlug, subjectSlug, count]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">문제를 불러오는 중...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-gray-500">문제가 없습니다.</div>
      </div>
    );
  }

  if (isFinished) {
    return <QuizResult certSlug={certSlug} />;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 진행률 바 */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>
            {currentIndex + 1} / {questions.length}
          </span>
          <span>
            {Math.round(((currentIndex + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all"
            style={{
              width: `${((currentIndex + 1) / questions.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* 문제 카드 */}
      <QuestionCard question={questions[currentIndex]} />
    </div>
  );
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ certSlug: string }>;
}) {
  const { certSlug } = use(params);
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] text-gray-500">
          불러오는 중...
        </div>
      }
    >
      <QuizRunner certSlug={certSlug} />
    </Suspense>
  );
}
