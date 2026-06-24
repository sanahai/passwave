// CBT 시험 목록
import Link from "next/link";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import EmptyAcademy from "@/components/academy/empty-academy";
import { Badge } from "@/components/ui/badge";

interface ExamRow {
  id: string;
  title: string;
  time_limit_minutes: number;
  is_active: boolean;
  question_ids: string[];
  cert: { name: string } | null;
}

export default async function CbtListPage() {
  const { academy } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;

  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("cbt_exams")
    .select(
      "id, title, time_limit_minutes, is_active, question_ids, cert:certifications(name)"
    )
    .eq("academy_id", academy.id)
    .order("created_at", { ascending: false });

  const exams = (data || []) as unknown as ExamRow[];

  // 시험별 응시 수
  const service = await createServiceSupabase();
  const { data: resultRows } = await service
    .from("cbt_results")
    .select("exam_id")
    .in(
      "exam_id",
      exams.length ? exams.map((e) => e.id) : ["x"]
    );
  const takenByExam = new Map<string, number>();
  (resultRows || []).forEach((r) => {
    takenByExam.set(r.exam_id, (takenByExam.get(r.exam_id) || 0) + 1);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">CBT 모의고사</h1>
          <p className="text-gray-500">출제한 모의고사를 관리합니다.</p>
        </div>
        <Link
          href="/academy/cbt/create"
          className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          + 새 시험 만들기
        </Link>
      </div>

      <div className="space-y-3">
        {exams.map((exam) => (
          <Link
            key={exam.id}
            href={`/academy/cbt/${exam.id}`}
            className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between hover:shadow-md transition"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{exam.title}</h3>
                <Badge tone={exam.is_active ? "green" : "gray"}>
                  {exam.is_active ? "진행 중" : "종료"}
                </Badge>
              </div>
              <p className="text-sm text-gray-500">
                {exam.cert?.name ?? ""} · {exam.question_ids?.length ?? 0}문항 ·{" "}
                {exam.time_limit_minutes}분 · 응시 {takenByExam.get(exam.id) ?? 0}명
              </p>
            </div>
            <span className="text-sm text-indigo-600">결과 보기 →</span>
          </Link>
        ))}
        {exams.length === 0 && (
          <p className="text-gray-400 text-center py-10">
            출제된 시험이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
