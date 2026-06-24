// 성적 분석 — 반별 합격지수 분포 + 과목별 오답 분포
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import {
  getAcademyStudentIds,
  getStudentAggregates,
  getAcademySubjectWrongs,
} from "@/lib/academy-stats";
import EmptyAcademy from "@/components/academy/empty-academy";
import { passIndexGrade } from "@/lib/utils";

interface ClassRow {
  id: string;
  name: string;
}
interface EnrollRow {
  class_id: string;
  student_id: string;
}

export default async function AnalyticsPage() {
  const { academy, role } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;
  if (role !== "owner" && role !== "teacher") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        볼 권한이 없습니다.
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const studentIds = await getAcademyStudentIds(academy.id);

  const [{ data: classes }, aggregates, subjectWrongs] = await Promise.all([
    supabase
      .from("academy_classes")
      .select("id, name")
      .eq("academy_id", academy.id)
      .eq("is_active", true),
    getStudentAggregates(studentIds),
    getAcademySubjectWrongs(studentIds),
  ]);

  const classRows = (classes || []) as ClassRow[];
  const classIds = classRows.map((c) => c.id);
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("class_id, student_id")
    .in("class_id", classIds.length ? classIds : ["x"]);
  const enrollRows = (enrollments || []) as unknown as EnrollRow[];

  // 반별 평균 합격지수
  const classStats = classRows.map((c) => {
    const ids = enrollRows
      .filter((e) => e.class_id === c.id)
      .map((e) => e.student_id);
    const piValues = ids
      .map((id) => aggregates.get(id)?.passIndex)
      .filter((v): v is number => typeof v === "number");
    const avg =
      piValues.length > 0
        ? Math.round(piValues.reduce((a, b) => a + b, 0) / piValues.length)
        : null;
    return { name: c.name, count: ids.length, avg };
  });

  const maxWrong = Math.max(...subjectWrongs.subjects.map((s) => s.count), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">성적 분석</h1>
      <p className="text-gray-500 mb-8">반별·과목별 학습 현황을 분석합니다.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 반별 합격지수 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">반별 평균 합격지수</h2>
          {classStats.length === 0 && (
            <p className="text-gray-400 text-sm">반이 없습니다.</p>
          )}
          <div className="space-y-3">
            {classStats.map((c) => {
              const grade = c.avg != null ? passIndexGrade(c.avg) : null;
              return (
                <div key={c.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>
                      {c.name}{" "}
                      <span className="text-gray-400">({c.count}명)</span>
                    </span>
                    <span className={grade?.text ?? "text-gray-400"}>
                      {c.avg != null ? `${c.avg}점` : "-"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${grade?.bar ?? "bg-gray-300"}`}
                      style={{ width: `${c.avg ?? 0}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 과목별 오답 분포 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">
            과목별 오답 분포{" "}
            <span className="text-sm text-gray-400">
              (전체 {subjectWrongs.total}개)
            </span>
          </h2>
          {subjectWrongs.subjects.length === 0 && (
            <p className="text-gray-400 text-sm">데이터가 없습니다.</p>
          )}
          <div className="space-y-3">
            {subjectWrongs.subjects.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{s.name}</span>
                  <span className="text-gray-500">
                    {s.count}개 (
                    {subjectWrongs.total
                      ? Math.round((s.count / subjectWrongs.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-orange-400 h-2.5 rounded-full"
                    style={{ width: `${(s.count / maxWrong) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
