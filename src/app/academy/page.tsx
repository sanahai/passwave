// 학원 대시보드 홈 — 4대 지표 + 반별 합격지수 + 위험군
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import {
  getAcademyStudentIds,
  getStudentAggregates,
} from "@/lib/academy-stats";
import { getPlanSpec } from "@/lib/plans";
import { passIndexGrade } from "@/lib/utils";
import EmptyAcademy from "@/components/academy/empty-academy";
import { Badge } from "@/components/ui/badge";

interface ClassRow {
  id: string;
  name: string;
}
interface EnrollRow {
  class_id: string;
  student_id: string;
}

export default async function AcademyHomePage() {
  const { academy } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;

  const supabase = await createServerSupabase();
  const spec = getPlanSpec(academy.plan);

  const studentIds = await getAcademyStudentIds(academy.id);
  const [aggregates, { count: classCount }, { count: examCount }, { data: classes }] =
    await Promise.all([
      getStudentAggregates(studentIds),
      supabase
        .from("academy_classes")
        .select("id", { count: "exact", head: true })
        .eq("academy_id", academy.id),
      supabase
        .from("cbt_exams")
        .select("id", { count: "exact", head: true })
        .eq("academy_id", academy.id),
      supabase
        .from("academy_classes")
        .select("id, name")
        .eq("academy_id", academy.id)
        .eq("is_active", true),
    ]);

  const riskCount = studentIds.filter((id) => {
    const pi = aggregates.get(id)?.passIndex;
    return typeof pi === "number" && pi < 50;
  }).length;

  // 반별 평균 합격지수
  const classRows = (classes || []) as ClassRow[];
  const classIds = classRows.map((c) => c.id);
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("class_id, student_id")
    .in("class_id", classIds.length ? classIds : ["x"]);
  const enrollRows = (enrollments || []) as unknown as EnrollRow[];
  const classStats = classRows.map((c) => {
    const ids = enrollRows.filter((e) => e.class_id === c.id).map((e) => e.student_id);
    const pis = ids
      .map((id) => aggregates.get(id)?.passIndex)
      .filter((v): v is number => typeof v === "number");
    const avg = pis.length ? Math.round(pis.reduce((a, b) => a + b, 0) / pis.length) : null;
    return { name: c.name, count: ids.length, avg };
  });

  const maxStudentsLabel = spec.maxStudents === -1 ? "무제한" : `/${spec.maxStudents}명`;
  const trialActive =
    academy.trial_ends_at && new Date(academy.trial_ends_at) > new Date();

  const stats = [
    { label: "등록 학생", value: `${studentIds.length}명`, sub: maxStudentsLabel },
    { label: "운영 반", value: `${classCount || 0}개`, sub: "" },
    { label: "CBT 시험", value: `${examCount || 0}회`, sub: "" },
    { label: "위험군 ⚠", value: `${riskCount}명`, sub: "합격지수 50↓" },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-1">
        <h1 className="text-2xl font-bold">{academy.name}</h1>
        <Badge tone="purple">{spec.name} 플랜</Badge>
        {trialActive && <Badge tone="blue">무료 체험 중</Badge>}
      </div>
      <p className="text-gray-500 mb-8">
        학원 운영 현황
        {trialActive &&
          ` · 무료 체험 ${new Date(academy.trial_ends_at!).toLocaleDateString(
            "ko-KR"
          )}까지`}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="text-3xl font-bold">{s.value}</div>
            {s.sub && <div className="text-xs text-gray-400 mt-1">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">반별 합격지수 분포</h2>
          <Link href="/academy/analytics" className="text-sm text-indigo-600 hover:underline">
            성적 분석 →
          </Link>
        </div>
        {classStats.length === 0 ? (
          <p className="text-gray-400 text-sm">
            반을 만들고 학생을 배정하면 합격지수가 표시됩니다.
          </p>
        ) : (
          <div className="space-y-3">
            {classStats.map((c) => {
              const grade = c.avg != null ? passIndexGrade(c.avg) : null;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      {c.name} <span className="text-gray-400">({c.count}명)</span>
                    </span>
                    <span className={grade?.text ?? "text-gray-400"}>
                      {c.avg != null ? `${c.avg}점` : "데이터 없음"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${grade?.bar ?? "bg-gray-200"}`}
                      style={{ width: `${c.avg ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
