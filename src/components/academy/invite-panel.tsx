// 초대 코드 생성 패널 — 코드/가입 링크/QR 제공
"use client";

import { useState } from "react";
import { Copy, Check, QrCode } from "lucide-react";

interface ClassOption {
  id: string;
  name: string;
}

export default function InvitePanel({
  role,
  classes = [],
}: {
  role: "teacher" | "student";
  classes?: ClassOption[];
}) {
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const joinUrl =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/signup?code=${code}`
      : "";

  const create = async () => {
    setLoading(true);
    setError("");
    setCode("");
    const res = await fetch("/api/academy/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, classId: classId || undefined }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error || "초대 코드 생성 실패");
      setLoading(false);
      return;
    }
    setCode(data.invite.code);
    setLoading(false);
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-end gap-3">
        {role === "student" && classes.length > 0 && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              자동 배정 반 (선택)
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm bg-white"
            >
              <option value="">미지정</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <button
          onClick={create}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading
            ? "생성 중..."
            : role === "teacher"
            ? "강사 초대 코드 생성"
            : "학생 초대 코드 생성"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

      {code && (
        <div className="mt-4 p-4 bg-indigo-50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-0.5">초대 코드</p>
              <p className="text-2xl font-bold tracking-widest text-indigo-700">
                {code}
              </p>
            </div>
            <button
              onClick={() => copy(code)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border rounded-lg text-sm"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              코드 복사
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              readOnly
              value={joinUrl}
              className="flex-1 px-3 py-2 text-sm border rounded-lg bg-white text-gray-600"
            />
            <button
              onClick={() => copy(joinUrl)}
              className="px-3 py-2 bg-white border rounded-lg text-sm whitespace-nowrap"
            >
              링크 복사
            </button>
            <button
              onClick={() => setShowQr((v) => !v)}
              className="px-3 py-2 bg-white border rounded-lg text-sm flex items-center gap-1.5"
            >
              <QrCode className="w-4 h-4" />
              QR
            </button>
          </div>

          {showQr && joinUrl && (
            <div className="flex justify-center pt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                alt="가입 QR 코드"
                width={160}
                height={160}
                className="rounded-lg border bg-white p-2"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(
                  joinUrl
                )}`}
              />
            </div>
          )}
          <p className="text-xs text-gray-500">
            이 코드/링크/QR로 가입하면 자동으로 학원 소속이 됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
