// 합격지수 카드 — 마운트 시 /api/pass-index 호출하여 계산/표시
"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/ui/progress-bar";

interface PassIndex {
  score: number;
  accuracyRate: number;
  reviewRate: number;
  progressRate: number;
  totalAttempts: number;
}

export default function PassIndexCard({
  certId,
  certName,
}: {
  certId: string;
  certName: string;
}) {
  const [data, setData] = useState<PassIndex | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/pass-index", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ certId }),
        });
        if (res.ok) setData(await res.json());
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [certId]);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">{certName}</h3>
        <span className="text-xs text-gray-400">합격지수</span>
      </div>

      {loading ? (
        <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
          계산 중...
        </div>
      ) : data ? (
        <>
          <div className="flex items-end gap-2 mb-5">
            <span className="text-5xl font-bold text-blue-600">
              {data.score}
            </span>
            <span className="text-gray-400 mb-1.5">/ 100</span>
          </div>

          <div className="space-y-3">
            <Metric label="정답률" value={data.accuracyRate} />
            <Metric label="복습 달성률" value={data.reviewRate} />
            <Metric label="진도율" value={data.progressRate} />
          </div>

          <p className="mt-4 text-xs text-gray-400">
            총 {data.totalAttempts}문항 풀이 기준
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-400">데이터를 불러오지 못했습니다.</p>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm text-gray-500 mb-1">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}
