// 합격지수 계산 API
// 가중치: 정답률 50% + 복습 달성률 30% + 진도율 20%
// 나중에 데이터 쌓이면 ML 모델로 고도화 가능
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { certId } = await request.json();

  // 1. 정답률 계산
  const { data: attempts } = await supabase
    .from("user_attempts")
    .select("is_correct, question:questions!inner(cert_id)")
    .eq("user_id", user.id)
    .eq("question.cert_id", certId);

  const totalAttempts = attempts?.length || 0;
  const correctAttempts = attempts?.filter((a) => a.is_correct).length || 0;
  const accuracyRate =
    totalAttempts > 0 ? (correctAttempts / totalAttempts) * 100 : 0;

  // 2. 복습 달성률 (오답노트 중 복습 1회 이상 한 비율)
  const { data: wrongNotes } = await supabase
    .from("wrong_notes")
    .select("review_count, question:questions!inner(cert_id)")
    .eq("user_id", user.id)
    .eq("question.cert_id", certId);

  const totalWrong = wrongNotes?.length || 0;
  const reviewedWrong =
    wrongNotes?.filter((w) => w.review_count >= 1).length || 0;
  const reviewRate =
    totalWrong > 0 ? (reviewedWrong / totalWrong) * 100 : 100; // 오답이 없으면 만점

  // 3. 진도율 (해당 자격증 전체 문제 중 풀어본 비율)
  const { count: totalQuestions } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("cert_id", certId);

  const { data: attemptedQuestions } = await supabase
    .from("user_attempts")
    .select("question_id, question:questions!inner(cert_id)")
    .eq("user_id", user.id)
    .eq("question.cert_id", certId);

  const uniqueAttempted = new Set(
    attemptedQuestions?.map((a) => a.question_id)
  ).size;
  const progressRate =
    (totalQuestions || 0) > 0
      ? (uniqueAttempted / (totalQuestions || 1)) * 100
      : 0;

  // 4. 합격지수 = 정답률(50%) + 복습률(30%) + 진도율(20%)
  const score = Math.round(
    accuracyRate * 0.5 + reviewRate * 0.3 + progressRate * 0.2
  );

  // 5. 스냅샷 저장
  await supabase.from("pass_index_snapshots").insert({
    user_id: user.id,
    cert_id: certId,
    score: Math.min(score, 100),
    accuracy_rate: Math.round(accuracyRate * 100) / 100,
    review_rate: Math.round(reviewRate * 100) / 100,
    progress_rate: Math.round(progressRate * 100) / 100,
  });

  return NextResponse.json({
    score: Math.min(score, 100),
    accuracyRate: Math.round(accuracyRate * 100) / 100,
    reviewRate: Math.round(reviewRate * 100) / 100,
    progressRate: Math.round(progressRate * 100) / 100,
    totalAttempts,
    uniqueAttempted,
    totalQuestions: totalQuestions || 0,
  });
}
