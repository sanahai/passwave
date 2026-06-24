// CBT 시험 출제 API — 자격증/과목에서 문항 선택 + 상세 설정 저장
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import { getPlanSpec } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { academy, role } = await getMyAcademy();
  if (!academy) {
    return NextResponse.json({ error: "소속된 학원이 없습니다." }, { status: 403 });
  }
  if (role !== "owner" && role !== "teacher") {
    return NextResponse.json({ error: "출제 권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const {
    title,
    certId,
    subjectId,
    timeLimit,
    questionCount,
    questionIds: manualIds,
    questionOrder = "fixed",
    optionOrder = "fixed",
    targetClassId,
    startsAt,
    endsAt,
    resultVisibility = "immediate",
    allowRetake = false,
    passScore = 60,
  } = body;

  if (!title || !certId) {
    return NextResponse.json(
      { error: "시험명과 자격증은 필수입니다." },
      { status: 400 }
    );
  }

  // 플랜별 CBT 월 출제 제한 (Basic 월 5회)
  const spec = getPlanSpec(academy.plan);
  if (spec.cbtPerMonth !== -1) {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("cbt_exams")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", academy.id)
      .gte("created_at", monthStart.toISOString());
    if ((count || 0) >= spec.cbtPerMonth) {
      return NextResponse.json(
        {
          error: `${spec.name} 플랜은 월 ${spec.cbtPerMonth}회까지 출제할 수 있습니다. 플랜을 업그레이드해주세요.`,
        },
        { status: 403 }
      );
    }
  }

  let questionIds: string[] = Array.isArray(manualIds)
    ? manualIds.filter(Boolean)
    : [];

  // 수동 선택이 없으면 자격증/과목에서 자동 추출
  if (questionIds.length === 0) {
    let q = supabase.from("questions").select("id").eq("cert_id", certId);
    if (subjectId) q = q.eq("subject_id", subjectId);
    const { data: questions } = await q.limit(Number(questionCount) || 20);
    questionIds = (questions || []).map((row) => row.id);
  }

  if (questionIds.length === 0) {
    return NextResponse.json(
      { error: "선택한 조건에 등록된 문항이 없습니다." },
      { status: 400 }
    );
  }

  const { data: exam, error } = await supabase
    .from("cbt_exams")
    .insert({
      academy_id: academy.id,
      cert_id: certId,
      subject_id: subjectId || null,
      title,
      question_ids: questionIds,
      time_limit_minutes: Number(timeLimit) || 60,
      question_order: questionOrder,
      option_order: optionOrder,
      target_class_id: targetClassId || null,
      starts_at: startsAt || null,
      ends_at: endsAt || null,
      result_visibility: resultVisibility,
      allow_retake: !!allowRetake,
      pass_score: Number(passScore) || 60,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, examId: exam.id });
}
