"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { passIndexGrade } from "@/lib/utils";

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  className: string | null;
  passIndex: number | null;
  accuracy: number | null;
  attempts: number;
}

type SortKey = "passIndex" | "name" | "joinedAt" | "attempts";

export default function StudentTable({
  students,
  classNames = [],
}: {
  students: StudentRow[];
  classNames?: string[];
}) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [sort, setSort] = useState<SortKey>("passIndex");

  const rows = useMemo(() => {
    let r = [...students];
    if (query.trim()) {
      const q = query.toLowerCase();
      r = r.filter(
        (s) =>
          s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }
    if (classFilter) r = r.filter((s) => s.className === classFilter);
    r.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "joinedAt") return b.joinedAt.localeCompare(a.joinedAt);
      if (sort === "attempts") return b.attempts - a.attempts;
      return (b.passIndex ?? -1) - (a.passIndex ?? -1);
    });
    return r;
  }, [students, query, classFilter, sort]);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="이름 또는 이메일 검색"
          className="flex-1 min-w-[180px] px-3 py-2 border rounded-lg text-sm"
        />
        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="">전체 반</option>
          {classNames.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="px-3 py-2 border rounded-lg text-sm bg-white"
        >
          <option value="passIndex">합격지수순</option>
          <option value="name">이름순</option>
          <option value="joinedAt">가입일순</option>
          <option value="attempts">풀이수순</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3">이름</th>
              <th className="text-left font-medium px-4 py-3">반</th>
              <th className="text-left font-medium px-4 py-3">합격지수</th>
              <th className="text-left font-medium px-4 py-3">정답률</th>
              <th className="text-left font-medium px-4 py-3">풀이 수</th>
              <th className="text-left font-medium px-4 py-3">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((s) => {
              const grade = s.passIndex != null ? passIndexGrade(s.passIndex) : null;
              return (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/academy/students/${s.id}`}
                      className="font-medium text-indigo-600 hover:underline"
                    >
                      {s.name}
                    </Link>
                    <div className="text-xs text-gray-400">{s.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.className ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {s.passIndex != null && grade ? (
                      <span className={`font-semibold ${grade.text}`}>
                        {s.passIndex}
                        {s.passIndex < 50 && " ⚠"}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {s.accuracy != null ? `${s.accuracy}%` : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{s.attempts}</td>
                  <td className="px-4 py-3 text-gray-500">{s.joinedAt}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  학생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-3">
        <Badge tone="gray">전체 {students.length}명</Badge>
      </div>
    </div>
  );
}
