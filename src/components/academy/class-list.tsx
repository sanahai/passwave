"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export interface ClassRow {
  id: string;
  name: string;
  certName: string | null;
  teacherName: string | null;
  studentCount: number;
  isActive: boolean;
}

interface Option {
  id: string;
  name: string;
}

export default function ClassList({
  classes,
  certs = [],
  teachers = [],
  canManage = false,
}: {
  classes: ClassRow[];
  certs?: Option[];
  teachers?: Option[];
  canManage?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [certId, setCertId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/academy/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, certId: certId || undefined, teacherId: teacherId || undefined }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "반 생성 실패");
      setLoading(false);
      return;
    }
    setName("");
    setCertId("");
    setTeacherId("");
    setOpen(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <div>
      {canManage && (
        <div className="mb-5">
          {!open ? (
            <button
              onClick={() => setOpen(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              + 새 반 만들기
            </button>
          ) : (
            <form
              onSubmit={submit}
              className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 max-w-lg"
            >
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="반 이름 (예: 오전반)"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <select
                  value={certId}
                  onChange={(e) => setCertId(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">자격증 선택</option>
                  {certs.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  <option value="">담당 강사 (선택)</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {loading ? "생성 중..." : "만들기"}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 border rounded-lg text-sm"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => (
          <Link
            key={c.id}
            href={`/academy/classes/${c.id}`}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition"
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold">{c.name}</h3>
              <Badge tone={c.isActive ? "green" : "gray"}>
                {c.isActive ? "운영중" : "종료"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500">{c.certName ?? "자격증 미지정"}</p>
            <p className="text-sm text-gray-400 mt-1">
              강사 {c.teacherName ?? "미지정"}
            </p>
            <p className="mt-3 text-sm text-gray-400">학생 {c.studentCount}명</p>
          </Link>
        ))}
        {classes.length === 0 && (
          <p className="text-gray-400 col-span-full text-center py-10">
            등록된 반이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
