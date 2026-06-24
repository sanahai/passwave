// CBT 시험 출제 폼 — 문항 선택 + 상세 설정 (기획서 5-3)
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CertOption {
  id: string;
  name: string;
}
interface SubjectOption {
  id: string;
  name: string;
  cert_id: string;
}
interface ClassOption {
  id: string;
  name: string;
}

export default function CbtBuilder({
  certs,
  subjects = [],
  classes = [],
}: {
  certs: CertOption[];
  subjects?: SubjectOption[];
  classes?: ClassOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [certId, setCertId] = useState(certs[0]?.id ?? "");
  const [subjectId, setSubjectId] = useState("");
  const [timeLimit, setTimeLimit] = useState("60");
  const [questionCount, setQuestionCount] = useState("20");
  const [questionOrder, setQuestionOrder] = useState("fixed");
  const [optionOrder, setOptionOrder] = useState("fixed");
  const [targetClassId, setTargetClassId] = useState("");
  const [resultVisibility, setResultVisibility] = useState("immediate");
  const [allowRetake, setAllowRetake] = useState(false);
  const [passScore, setPassScore] = useState("60");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const certSubjects = useMemo(
    () => subjects.filter((s) => s.cert_id === certId),
    [subjects, certId]
  );

  const selectCls =
    "w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/academy/cbt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        certId,
        subjectId: subjectId || undefined,
        timeLimit,
        questionCount,
        questionOrder,
        optionOrder,
        targetClassId: targetClassId || undefined,
        resultVisibility,
        allowRetake,
        passScore,
        startsAt: startsAt || undefined,
        endsAt: endsAt || undefined,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "시험 출제에 실패했습니다.");
      setLoading(false);
      return;
    }

    router.push("/academy/cbt");
    router.refresh();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-2xl"
    >
      <Input
        id="title"
        label="시험명"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="예: 제3회 모의고사"
        required
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            자격증
          </label>
          <select
            value={certId}
            onChange={(e) => {
              setCertId(e.target.value);
              setSubjectId("");
            }}
            className={selectCls}
            required
          >
            {certs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            과목 (선택)
          </label>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className={selectCls}
          >
            <option value="">전체 과목</option>
            {certSubjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          id="count"
          label="문항 수 (랜덤 추출)"
          type="number"
          value={questionCount}
          onChange={(e) => setQuestionCount(e.target.value)}
        />
        <Input
          id="time"
          label="제한시간(분, 0=무제한)"
          type="number"
          value={timeLimit}
          onChange={(e) => setTimeLimit(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            문제 순서
          </label>
          <select
            value={questionOrder}
            onChange={(e) => setQuestionOrder(e.target.value)}
            className={selectCls}
          >
            <option value="fixed">고정</option>
            <option value="random">랜덤 (컨닝 방지)</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            보기 순서
          </label>
          <select
            value={optionOrder}
            onChange={(e) => setOptionOrder(e.target.value)}
            className={selectCls}
          >
            <option value="fixed">고정</option>
            <option value="random">랜덤</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            응시 대상 반
          </label>
          <select
            value={targetClassId}
            onChange={(e) => setTargetClassId(e.target.value)}
            className={selectCls}
          >
            <option value="">전체</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Input
          id="pass"
          label="합격 기준 점수"
          type="number"
          value={passScore}
          onChange={(e) => setPassScore(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            응시 시작 (선택)
          </label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className={selectCls}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            응시 마감 (선택)
          </label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className={selectCls}
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            결과 공개
          </label>
          <select
            value={resultVisibility}
            onChange={(e) => setResultVisibility(e.target.value)}
            className={selectCls}
          >
            <option value="immediate">즉시</option>
            <option value="after">마감 후</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm mt-6">
          <input
            type="checkbox"
            checked={allowRetake}
            onChange={(e) => setAllowRetake(e.target.checked)}
            className="accent-indigo-600 w-4 h-4"
          />
          재응시 허용
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "출제 중..." : "시험 출제하기"}
      </Button>
    </form>
  );
}
