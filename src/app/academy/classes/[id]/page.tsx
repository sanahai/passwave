// 반 상세 — 소속 학생 + 성적 요약
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import { getStudentAggregates } from "@/lib/academy-stats";
import EmptyAcademy from "@/components/academy/empty-academy";
import { passIndexGrade } from "@/lib/utils";

interface EnrollRow {
  student: { id: string; name: string | null; email: string } | null;
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { academy, role } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;
  const isStaff = role === "owner" || role === "teacher";

  const supabase = await createServerSupabase();
  const { data: cls } = await supabase
    .from("academy_classes")
    .select("id, name, academy_id, cert:certifications(name), teacher:profiles(name)")
    .eq("id", id)
    .maybeSingle();

  if (!cls || (cls as { academy_id: string }).academy_id !== academy.id) {
    notFound();
  }

  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student:profiles(id, name, email)")
    .eq("class_id", id);

  const rows = (enrollments || []) as unknown as EnrollRow[];
  const studentIds = rows.filter((r) => r.student).map((r) => r.student!.id);
  const aggregates = isStaff
    ? await getStudentAggregates(studentIds)
    : new Map();

  const piValues = studentIds
    .map((sid) => aggregates.get(sid)?.passIndex)
    .filter((v): v is number => typeof v === "number");
  const avgPi =
    piValues.length > 0
      ? Math.round(piValues.reduce((a, b) => a + b, 0) / piValues.length)
      : null;

  const c = cls as unknown as {
    name: string;
    cert: { name: string } | null;
    teacher: { name: string } | null;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/academy/classes" className="text-sm text-gray-500 hover:underline">
        ← 반 목록
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">{c.name}</h1>
      <p className="text-gray-500 mb-8">
        {c.cert?.name ?? "자격증 미지정"} · 담당 강사 {c.teacher?.name ?? "미지정"} ·
        학생 {studentIds.length}명
        {avgPi != null && ` · 평균 합격지수 ${avgPi}점`}
      </p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3">이름</th>
              <th className="text-left font-medium px-4 py-3">이메일</th>
              <th className="text-left font-medium px-4 py-3">합격지수</th>
              <th className="text-left font-medium px-4 py-3">정답률</th>
              <th className="text-left font-medium px-4 py-3">풀이 수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows
              .filter((r) => r.student)
              .map((r) => {
                const agg = aggregates.get(r.student!.id);
                const pi = agg?.passIndex ?? null;
                const grade = pi != null ? passIndexGrade(pi) : null;
                return (
                  <tr key={r.student!.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/academy/students/${r.student!.id}`}
                        className="font-medium text-indigo-600 hover:underline"
                      >
                        {r.student!.name ?? "(이름 없음)"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{r.student!.email}</td>
                    <td className="px-4 py-3">
                      {pi != null && grade ? (
                        <span className={`font-semibold ${grade.text}`}>{pi}</span>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {agg?.accuracy != null ? `${agg.accuracy}%` : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{agg?.attempts ?? 0}</td>
                  </tr>
                );
              })}
            {studentIds.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-400">
                  배정된 학생이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
