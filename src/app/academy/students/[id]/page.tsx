// 학생 상세 — 합격지수/과목별 정답률/오개념 TOP5/CBT 이력/오답 현황
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyAcademy } from "@/lib/academy";
import { getStudentDetail, isAcademyMember } from "@/lib/academy-stats";
import EmptyAcademy from "@/components/academy/empty-academy";
import { passIndexGrade } from "@/lib/utils";

export default async function StudentDetailPage({
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
        학생 상세를 볼 권한이 없습니다.
      </div>
    );
  }

  const isMember = await isAcademyMember(academy.id, id);
  if (!isMember) notFound();

  const d = await getStudentDetail(id);
  if (!d.profile) notFound();

  const grade = d.passIndex != null ? passIndexGrade(d.passIndex) : null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href="/academy/students"
        className="text-sm text-gray-500 hover:underline"
      >
        ← 학생 목록
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">{d.profile.name}</h1>
      <p className="text-gray-500 mb-8">
        {d.profile.email} · 가입{" "}
        {new Date(d.profile.created_at).toLocaleDateString("ko-KR")}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* 합격지수 */}
        <div
          className={`rounded-xl border p-6 ${grade?.bg ?? "bg-gray-50 border-gray-200"}`}
        >
          <p className="text-sm text-gray-500 mb-1">합격지수</p>
          {d.passIndex != null && grade ? (
            <>
              <p className={`text-4xl font-bold ${grade.text}`}>{d.passIndex}</p>
              <p className={`text-sm font-medium ${grade.text}`}>{grade.label}</p>
            </>
          ) : (
            <p className="text-gray-400 mt-2">데이터 없음</p>
          )}
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">전체 정답률</p>
          <p className="text-3xl font-bold">
            {d.accuracy != null ? `${d.accuracy}%` : "-"}
          </p>
          <p className="text-sm text-gray-400 mt-1">{d.totalAttempts}문제 풀이</p>
        </div>
        <div className="rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500 mb-1">오답노트</p>
          <p className="text-3xl font-bold">{d.wrongTotal}개</p>
          <p className="text-sm text-gray-400 mt-1">
            복습 {d.wrongReviewed} · 미복습 {d.wrongTotal - d.wrongReviewed}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 과목별 정답률 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">과목별 정답률</h2>
          {d.subjects.length === 0 && (
            <p className="text-gray-400 text-sm">데이터가 없습니다.</p>
          )}
          <div className="space-y-3">
            {d.subjects.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{s.name}</span>
                  <span className="text-gray-500">
                    {s.rate}% ({s.correct}/{s.total})
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${s.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 자주 틀리는 오개념 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">자주 틀리는 오개념 TOP 5</h2>
          {d.misconceptions.length === 0 && (
            <p className="text-gray-400 text-sm">데이터가 없습니다.</p>
          )}
          <ol className="space-y-2">
            {d.misconceptions.map((m, i) => (
              <li key={m.name} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 shrink-0 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                <span className="flex-1">{m.name}</span>
                <span className="text-gray-400">{m.count}회</span>
              </li>
            ))}
          </ol>
        </div>

        {/* 최근 CBT 결과 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">최근 CBT 시험 결과</h2>
          {d.cbtResults.length === 0 && (
            <p className="text-gray-400 text-sm">응시 기록이 없습니다.</p>
          )}
          <div className="space-y-2">
            {d.cbtResults.map((c, i) => (
              <div
                key={i}
                className="flex justify-between text-sm border-b border-gray-50 pb-2 last:border-0"
              >
                <span>{c.title}</span>
                <span className="text-gray-500">
                  {c.score}점 ({Math.round((c.score / 100) * c.total)}/{c.total}) ·{" "}
                  {c.submittedAt}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 합격지수 추이 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold mb-4">합격지수 추이</h2>
          {d.passHistory.length === 0 ? (
            <p className="text-gray-400 text-sm">데이터가 없습니다.</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {d.passHistory.map((p, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-indigo-400 rounded-t"
                    style={{ height: `${Math.max(p.score, 3)}%` }}
                    title={`${p.score}점`}
                  />
                  <span className="text-[10px] text-gray-400">{p.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
