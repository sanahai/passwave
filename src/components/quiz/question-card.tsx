// 문제 1개를 보여주는 카드 컴포넌트
// 보기를 선택하면 즉시 정답/오답 피드백 + AI 진단 요청
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQuizStore } from "@/stores/quiz-store";
import AiDiagnosis from "./ai-diagnosis";
import { difficultyLabel, cn } from "@/lib/utils";
import type { Question } from "@/types";

export default function QuestionCard({ question }: { question: Question }) {
  const supabase = createClient();
  const {
    selectAnswer,
    recordResult,
    nextQuestion,
    finishQuiz,
    questions,
    currentIndex,
    sessionId,
  } = useQuizStore();

  const [submitted, setSubmitted] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showDiagnosis, setShowDiagnosis] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = (optionId: string) => {
    if (submitted) return; // 이미 제출했으면 변경 불가
    setSelectedId(optionId);
  };

  const handleSubmit = async () => {
    if (!selectedId) return;
    setSubmitted(true);
    setSaving(true);

    // 정답 확인
    const correctOption = question.options.find((o) => o.is_correct);
    const correct = selectedId === correctOption?.id;
    setIsCorrect(correct);
    selectAnswer(question.id, selectedId);
    recordResult(question.id, correct);

    // ⭐ user_attempts에 풀이 기록 저장 (데이터 금광에 쌓기!)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { error: attemptError } = await supabase
        .from("user_attempts")
        .insert({
          user_id: user.id,
          question_id: question.id,
          selected_option_id: selectedId,
          is_correct: correct,
          session_id: sessionId,
        });
      if (attemptError) console.error("풀이 기록 저장 실패:", attemptError);

      // 틀렸으면 오답노트에도 추가
      if (!correct) {
        const { error: noteError } = await supabase.from("wrong_notes").upsert(
          {
            user_id: user.id,
            question_id: question.id,
          },
          { onConflict: "user_id,question_id" }
        );
        if (noteError) console.error("오답노트 저장 실패:", noteError);
        setShowDiagnosis(true); // AI 진단 표시
      }
    }
    setSaving(false);
  };

  const handleNext = () => {
    setSubmitted(false);
    setSelectedId(null);
    setIsCorrect(null);
    setShowDiagnosis(false);

    if (currentIndex >= questions.length - 1) {
      finishQuiz();
    } else {
      nextQuestion();
    }
  };

  const isLast = currentIndex >= questions.length - 1;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* 문제 본문 */}
      <div className="mb-6">
        <span className="text-sm text-gray-400 mb-2 block">
          {difficultyLabel(question.difficulty)}
          {question.topic ? ` · ${question.topic}` : ""}
        </span>
        <p className="text-lg leading-relaxed">{question.body}</p>
      </div>

      {/* 보기 목록 */}
      <div className="space-y-3 mb-6">
        {question.options
          .slice()
          .sort((a, b) => a.option_number - b.option_number)
          .map((option) => {
            let borderColor = "border-gray-200 hover:border-blue-400";
            let bgColor = "bg-white";

            if (submitted) {
              if (option.is_correct) {
                borderColor = "border-green-500";
                bgColor = "bg-green-50";
              } else if (option.id === selectedId && !option.is_correct) {
                borderColor = "border-red-500";
                bgColor = "bg-red-50";
              }
            } else if (option.id === selectedId) {
              borderColor = "border-blue-500";
              bgColor = "bg-blue-50";
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelect(option.id)}
                disabled={submitted}
                className={cn(
                  "w-full text-left p-4 rounded-lg border-2 transition",
                  borderColor,
                  bgColor
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

      {/* 제출/다음 버튼 */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selectedId || saving}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          정답 확인
        </button>
      ) : (
        <div>
          {/* 정답/오답 피드백 */}
          <div
            className={cn(
              "p-4 rounded-lg mb-4",
              isCorrect ? "bg-green-50" : "bg-red-50"
            )}
          >
            <p className="font-semibold mb-1">
              {isCorrect ? "정답입니다!" : "틀렸습니다."}
            </p>
            {question.explanation && (
              <p className="text-sm mt-2">{question.explanation}</p>
            )}
          </div>

          {/* AI 오개념 진단 (틀렸을 때만) */}
          {showDiagnosis && selectedId && (
            <div className="mb-4">
              <AiDiagnosis
                questionId={question.id}
                selectedOptionId={selectedId}
              />
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full py-3 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-900 transition"
          >
            {isLast ? "결과 보기" : "다음 문제"}
          </button>
        </div>
      )}
    </div>
  );
}
