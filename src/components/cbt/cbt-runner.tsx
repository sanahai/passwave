// CBT 응시 진행 컴포넌트 — 타이머 + 전 문항 응답 + 결과 저장
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Question } from "@/types";

interface Props {
  examId: string;
  title: string;
  timeLimitMinutes: number;
  questions: Question[];
  isActive: boolean;
  unavailableReason?: string | null;
  resultVisibility?: "immediate" | "after";
  optionOrder?: "fixed" | "random";
  allowRetake?: boolean;
  alreadyTaken?: boolean;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function CbtRunner({
  examId,
  title,
  timeLimitMinutes,
  questions,
  isActive,
  unavailableReason = null,
  resultVisibility = "immediate",
  optionOrder = "fixed",
  allowRetake = false,
  alreadyTaken = false,
}: Props) {
  const supabase = createClient();
  const total = questions.length;

  // 보기 순서 (랜덤이면 1회만 셔플)
  const orderedOptions = useMemo(() => {
    const m = new Map<string, Question["options"]>();
    questions.forEach((q) => {
      const opts = [...q.options].sort(
        (a, b) => a.option_number - b.option_number
      );
      m.set(q.id, optionOrder === "random" ? shuffle(opts) : opts);
    });
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remaining, setRemaining] = useState(timeLimitMinutes * 60);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [score, setScore] = useState(0);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    setSubmitted(true);
    setSaving(true);

    // 채점
    let correct = 0;
    for (const q of questions) {
      const correctOption = q.options.find((o) => o.is_correct);
      if (correctOption && answers[q.id] === correctOption.id) correct += 1;
    }
    const computed = total > 0 ? Math.round((correct / total) * 100) : 0;
    setScore(computed);

    // 결과 저장 (cbt_results — 본인만 insert 가능)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("cbt_results").insert({
        exam_id: examId,
        student_id: user.id,
        score: computed,
        total_questions: total,
        answers,
        time_spent_seconds: timeLimitMinutes * 60 - remaining,
      });

      // 모든 풀이를 user_attempts에도 기록 (데이터 금광 + 합격지수 반영)
      const attemptRows = questions
        .filter((q) => answers[q.id])
        .map((q) => {
          const correctOption = q.options.find((o) => o.is_correct);
          return {
            user_id: user.id,
            question_id: q.id,
            selected_option_id: answers[q.id],
            is_correct: !!correctOption && answers[q.id] === correctOption.id,
            session_id: examId,
          };
        });
      if (attemptRows.length > 0) {
        await supabase.from("user_attempts").insert(attemptRows);
      }
    }
    setSaving(false);
  }, [
    submitted,
    questions,
    answers,
    total,
    supabase,
    examId,
    timeLimitMinutes,
    remaining,
  ]);

  // 카운트다운 타이머 (1초마다 감소)
  useEffect(() => {
    if (submitted || total === 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [submitted, total]);

  // 시간이 다 되면 자동 제출 (setTimeout으로 동기 setState 회피)
  useEffect(() => {
    if (submitted || total === 0 || remaining > 0) return;
    const id = setTimeout(() => handleSubmit(), 0);
    return () => clearTimeout(id);
  }, [remaining, submitted, total, handleSubmit]);

  const answeredCount = useMemo(
    () => Object.keys(answers).length,
    [answers]
  );

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  if (!isActive) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        {unavailableReason || "종료된 시험입니다."}
      </div>
    );
  }

  if (alreadyTaken && !allowRetake && !submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 mb-6">
          이미 응시한 시험입니다. 이 시험은 재응시가 허용되지 않습니다.
        </p>
        <Link
          href="/learn"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
        >
          학습으로 돌아가기
        </Link>
      </div>
    );
  }

  if (total === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-gray-500">
        이 시험에는 문항이 없습니다.
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
          <p className="text-gray-500 mb-2">{title} 결과</p>
          {resultVisibility === "immediate" ? (
            <>
              <div className="text-5xl font-bold text-indigo-600 mb-1">
                {score}점
              </div>
              <p className="text-gray-600 mb-8">
                총 {total}문항 / 응답 {answeredCount}문항
              </p>
            </>
          ) : (
            <p className="text-gray-600 my-8">
              제출이 완료되었습니다. 결과는 마감 후 공개됩니다.
            </p>
          )}
          {saving ? (
            <p className="text-sm text-gray-400">결과 저장 중...</p>
          ) : (
            <Link
              href="/learn"
              className="inline-block w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
            >
              학습으로 돌아가기
            </Link>
          )}
        </div>
      </div>
    );
  }

  const q = questions[index];
  const isLast = index >= total - 1;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* 상단: 제목 + 타이머 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-semibold">{title}</h1>
        <span
          className={cn(
            "text-sm font-mono px-3 py-1 rounded-lg",
            remaining <= 60
              ? "bg-red-50 text-red-600"
              : "bg-gray-100 text-gray-600"
          )}
        >
          {mm}:{ss}
        </span>
      </div>

      {/* 진행률 */}
      <div className="flex justify-between text-sm text-gray-500 mb-2">
        <span>
          {index + 1} / {total}
        </span>
        <span>응답 {answeredCount}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      {/* 문제 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <p className="text-lg leading-relaxed mb-6">{q.body}</p>
        <div className="space-y-3">
          {(orderedOptions.get(q.id) ?? q.options).map((option) => {
              const selected = answers[q.id] === option.id;
              return (
                <button
                  key={option.id}
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: option.id }))
                  }
                  className={cn(
                    "w-full text-left p-4 rounded-lg border-2 transition",
                    selected
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-400 bg-white"
                  )}
                >
                  <span className="font-medium text-gray-500 mr-3">
                    {option.option_number}
                  </span>
                  {option.text}
                </button>
              );
            })}
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="px-5 py-3 border border-gray-200 rounded-lg font-medium disabled:opacity-40 hover:border-indigo-400 transition"
        >
          이전
        </button>
        {!isLast ? (
          <button
            onClick={() => setIndex((i) => Math.min(total - 1, i + 1))}
            className="flex-1 py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition"
          >
            다음
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
          >
            제출하기
          </button>
        )}
      </div>
    </div>
  );
}
