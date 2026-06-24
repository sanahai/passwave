// CBT 시험 결과 상세 (원장/강사) — 응시 현황·점수 분포·오답 TOP·학생별 점수
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import EmptyAcademy from "@/components/academy/empty-academy";
import { Badge } from "@/components/ui/badge";
import CopyButton from "@/components/ui/copy-button";
import { appUrl } from "@/lib/config";

export default async function CbtResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { academy, role } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;
  if (role !== "owner" && role !== "teacher") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        결과를 볼 권한이 없습니다.
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const { data: exam } = await supabase
    .from("cbt_exams")
    .select(
      "id, title, academy_id, question_ids, time_limit_minutes, pass_score, is_active, target_class_id, result_visibility, allow_retake, cert:certifications(name)"
    )
    .eq("id", id)
    .maybeSingle();

  if (!exam || (exam as { academy_id: string }).academy_id !== academy.id) {
    notFound();
  }
  const e = exam as unknown as {
    title: string;
    question_ids: string[];
    pass_score: number;
    is_active: boolean;
    target_class_id: string | null;
    cert: { name: string } | null;
  };

  const service = await createServiceSupabase();

  // 결과 + 문항 정답 로드
  const [{ data: results }, { data: questions }, targetCount] = await Promise.all([
    service
      .from("cbt_results")
      .select("student_id, score, answers, submitted_at, student:profiles(name)")
      .eq("exam_id", id)
      .order("score", { ascending: false }),
    service
      .from("questions")
      .select("id, body, options:question_options(id, is_correct)")
      .in("id", e.question_ids.length ? e.question_ids : ["x"]),
    (async () => {
      if (e.target_class_id) {
        const { count } = await service
          .from("class_enrollments")
          .select("id", { count: "exact", head: true })
          .eq("class_id", e.target_class_id);
        return count || 0;
      }
      const { count } = await service
        .from("academy_members")
        .select("id", { count: "exact", head: true })
        .eq("academy_id", academy.id)
        .eq("role", "student");
      return count || 0;
    })(),
  ]);

  type ResultRow = {
    student_id: string;
    score: number;
    answers: Record<string, string>;
    submitted_at: string;
    student: { name: string | null } | null;
  };
  const rows = (results || []) as unknown as ResultRow[];

  // 정답 맵
  const correctByQuestion = new Map<string, string>();
  type QRow = { id: string; body: string; options: { id: string; is_correct: boolean }[] };
  const qRows = (questions || []) as unknown as QRow[];
  const bodyByQuestion = new Map<string, string>();
  qRows.forEach((q) => {
    bodyByQuestion.set(q.id, q.body);
    const correct = q.options.find((o) => o.is_correct);
    if (correct) correctByQuestion.set(q.id, correct.id);
  });

  const scores = rows.map((r) => r.score);
  const avg =
    scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;
  const max = scores.length ? Math.max(...scores) : 0;
  const min = scores.length ? Math.min(...scores) : 0;
  const passed = rows.filter((r) => r.score >= e.pass_score).length;

  // 점수 분포
  const buckets = [
    { label: "90~100", min: 90, max: 100, count: 0 },
    { label: "80~89", min: 80, max: 89, count: 0 },
    { label: "70~79", min: 70, max: 79, count: 0 },
    { label: "60~69", min: 60, max: 69, count: 0 },
    { label: "50~59", min: 50, max: 59, count: 0 },
    { label: "40~49", min: 40, max: 49, count: 0 },
    { label: "0~39", min: 0, max: 39, count: 0 },
  ];
  scores.forEach((s) => {
    const b = buckets.find((bk) => s >= bk.min && s <= bk.max);
    if (b) b.count++;
  });
  const maxBucket = Math.max(...buckets.map((b) => b.count), 1);

  // 가장 많이 틀린 문제 TOP
  const wrongByQuestion = new Map<string, number>();
  rows.forEach((r) => {
    Object.entries(r.answers || {}).forEach(([qid, oid]) => {
      const correct = correctByQuestion.get(qid);
      if (correct && oid !== correct) {
        wrongByQuestion.set(qid, (wrongByQuestion.get(qid) || 0) + 1);
      }
    });
  });
  const topWrong = Array.from(wrongByQuestion.entries())
    .map(([qid, count]) => ({
      body: bodyByQuestion.get(qid) || "문항",
      count,
      rate: rows.length ? Math.round((count / rows.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const takeUrl = `${appUrl()}/learn/cbt/${id}`;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/academy/cbt" className="text-sm text-gray-500 hover:underline">
        ← CBT 목록
      </Link>
      <div className="flex items-center gap-2 mt-2 mb-1">
        <h1 className="text-2xl font-bold">{e.title}</h1>
        <Badge tone={e.is_active ? "green" : "gray"}>
          {e.is_active ? "진행 중" : "종료"}
        </Badge>
      </div>
      <p className="text-gray-500 mb-6">
        {e.cert?.name} · {e.question_ids.length}문항 · 합격 기준 {e.pass_score}점
      </p>

      {/* 응시 링크 */}
      <div className="bg-indigo-50 rounded-xl p-4 mb-8 flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-600">학생 응시 링크:</span>
        <code className="text-sm bg-white px-2 py-1 rounded border">{takeUrl}</code>
        <CopyButton text={takeUrl} label="링크 복사" />
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="응시 / 대상" value={`${rows.length} / ${targetCount}`} />
        <Stat label="평균" value={`${avg}점`} />
        <Stat label="최고 / 최저" value={`${max} / ${min}`} />
        <Stat
          label="합격"
          value={`${passed}명 (${rows.length ? Math.round((passed / rows.length) * 100) : 0}%)`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* 점수 분포 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">점수 분포</h2>
          <div className="space-y-2">
            {buckets.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-sm">
                <span className="w-16 text-gray-500">{b.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-4">
                  <div
                    className="bg-indigo-400 h-4 rounded-full"
                    style={{ width: `${(b.count / maxBucket) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right text-gray-500">{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 가장 많이 틀린 문제 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">가장 많이 틀린 문제 TOP 3</h2>
          {topWrong.length === 0 && (
            <p className="text-gray-400 text-sm">데이터가 없습니다.</p>
          )}
          <ol className="space-y-3">
            {topWrong.map((w, i) => (
              <li key={i} className="text-sm">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-red-600">{i + 1}위</span>
                  <span className="flex-1 line-clamp-2">{w.body}</span>
                </div>
                <p className="text-xs text-gray-400 ml-7">
                  오답률 {w.rate}% ({w.count}명)
                </p>
              </li>
            ))}
          </ol>
          {topWrong.length > 0 && (
            <p className="text-xs text-gray-500 mt-4">
              → 다음 수업에서 이 개념들을 집중적으로 복습하면 효과적입니다.
            </p>
          )}
        </div>
      </div>

      {/* 학생별 점수 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3">이름</th>
              <th className="text-left font-medium px-4 py-3">점수</th>
              <th className="text-left font-medium px-4 py-3">상태</th>
              <th className="text-left font-medium px-4 py-3">제출</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.student_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {r.student?.name ?? "(이름 없음)"}
                </td>
                <td className="px-4 py-3">{r.score}점</td>
                <td className="px-4 py-3">
                  <Badge tone={r.score >= e.pass_score ? "green" : "red"}>
                    {r.score >= e.pass_score ? "합격" : "불합격"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(r.submitted_at).toLocaleString("ko-KR")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  아직 응시 기록이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
}
