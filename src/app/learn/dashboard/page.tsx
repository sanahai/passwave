// 개인 대시보드 (합격지수, 통합이력)
import { createServerSupabase } from "@/lib/supabase/server";
import PassIndexCard from "@/components/dashboard/pass-index-card";
import StudyHistoryChart, {
  type DailyStudy,
} from "@/components/dashboard/study-history-chart";
import WrongNoteSummary from "@/components/dashboard/wrong-note-summary";
import Link from "next/link";

interface AttemptRow {
  answered_at: string;
  is_correct: boolean;
  question: { cert_id: string } | null;
}

export default async function DashboardPage() {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 최근 30일 풀이 이력
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: attemptsData } = await supabase
    .from("user_attempts")
    .select("answered_at, is_correct, question:questions!inner(cert_id)")
    .eq("user_id", user!.id)
    .gte("answered_at", since.toISOString())
    .order("answered_at", { ascending: false });

  const attempts = (attemptsData || []) as unknown as AttemptRow[];

  // 사용자가 학습한 자격증 목록
  const certIds = Array.from(
    new Set(attempts.map((a) => a.question?.cert_id).filter(Boolean))
  ) as string[];

  let certs: { id: string; name: string }[] = [];
  if (certIds.length > 0) {
    const { data } = await supabase
      .from("certifications")
      .select("id, name")
      .in("id", certIds);
    certs = data || [];
  }

  // 최근 7일 학습 이력 버킷
  const history: DailyStudy[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getMonth() + 1}/${d.getDate()}`;
    const count = attempts.filter((a) => {
      const ad = new Date(a.answered_at);
      return (
        ad.getMonth() === d.getMonth() && ad.getDate() === d.getDate()
      );
    }).length;
    history.push({ date: key, count });
  }

  // 오답노트 요약
  const { data: wrongNotes } = await supabase
    .from("wrong_notes")
    .select("review_count")
    .eq("user_id", user!.id);
  const totalWrong = wrongNotes?.length || 0;
  const unreviewed =
    wrongNotes?.filter((w) => w.review_count === 0).length || 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">대시보드</h1>
      <p className="text-gray-500 mb-8">
        내 학습 현황과 합격지수를 한눈에 확인하세요.
      </p>

      {certs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {certs.map((cert) => (
            <PassIndexCard
              key={cert.id}
              certId={cert.id}
              certName={cert.name}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-6">
          <p className="text-gray-500 mb-4">
            아직 학습 기록이 없습니다. 문제를 풀면 합격지수가 계산됩니다.
          </p>
          <Link
            href="/learn"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            학습 시작하기
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <StudyHistoryChart data={history} />
        </div>
        <WrongNoteSummary total={totalWrong} unreviewed={unreviewed} />
      </div>
    </div>
  );
}
