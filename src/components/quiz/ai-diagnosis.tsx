// 틀렸을 때 AI 진단 결과를 보여주는 컴포넌트
"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

interface Props {
  questionId: string;
  selectedOptionId: string;
}

export default function AiDiagnosis({ questionId, selectedOptionId }: Props) {
  const [diagnosis, setDiagnosis] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchDiagnosis = async () => {
      try {
        const res = await fetch("/api/ai/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questionId, selectedOptionId }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "AI 진단 실패");
        }

        // 스트리밍 응답을 받는 즉시 화면에 출력
        const reader = res.body?.getReader();
        if (!reader) {
          const text = await res.text();
          if (!cancelled) setDiagnosis(text);
          return;
        }
        const decoder = new TextDecoder();
        let acc = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          if (!cancelled) {
            setDiagnosis(acc);
            setLoading(false); // 첫 글자가 도착하면 로딩 해제 → 즉시 출력
          }
        }
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "AI 진단 실패");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDiagnosis();
    return () => {
      cancelled = true;
    };
  }, [questionId, selectedOptionId]);

  if (loading) {
    return (
      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
        <p className="text-sm text-purple-600">AI 튜터가 진단하는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <p className="text-sm text-yellow-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-purple-700" />
        <span className="text-purple-700 font-semibold text-sm">
          AI 오개념 진단
        </span>
      </div>
      <p className="text-sm text-purple-900 leading-relaxed whitespace-pre-line">
        {diagnosis}
      </p>
    </div>
  );
}
