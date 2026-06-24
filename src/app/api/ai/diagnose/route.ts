// AI 오개념 진단 API
// ⭐ 핵심: 캐시 먼저 확인 → 없을 때만 Claude 호출 → 결과 캐시 저장
// 이렇게 해야 API 비용을 대폭 절감할 수 있음
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateDiagnosis } from "@/lib/claude";

interface OptionRow {
  id: string;
  text: string;
  is_correct: boolean;
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  // 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "로그인이 필요합니다." },
      { status: 401 }
    );
  }

  // TODO: 무료 사용자 일일 횟수 제한 체크
  // const todayCount = await getTodayDiagnosisCount(user.id)
  // if (subscription.plan === 'free' && todayCount >= 5) {
  //   return NextResponse.json({ error: '무료 플랜은 하루 5회까지...' }, { status: 429 })
  // }

  const { questionId, selectedOptionId } = await request.json();

  // 1. 문제 + 보기 정보 가져오기
  const { data: question } = await supabase
    .from("questions")
    .select(
      `
      body,
      options:question_options(id, text, is_correct)
    `
    )
    .eq("id", questionId)
    .single();

  if (!question) {
    return NextResponse.json(
      { error: "문제를 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const options = question.options as OptionRow[];
  const correctOption = options.find((o) => o.is_correct);
  const selectedOption = options.find((o) => o.id === selectedOptionId);

  if (!correctOption || !selectedOption) {
    return NextResponse.json(
      { error: "보기를 찾을 수 없습니다." },
      { status: 400 }
    );
  }

  // 2. 이 오답 보기에 연결된 오개념이 있는지 확인
  const { data: misconceptionMap } = await supabase
    .from("option_misconception_map")
    .select("misconception_id, misconception:misconceptions(id, name)")
    .eq("option_id", selectedOptionId)
    .limit(1)
    .maybeSingle();

  const misconception = misconceptionMap?.misconception as
    | { id: string; name: string }
    | undefined;

  // 3. ⭐ 캐시 확인: 이 오개념에 대한 진단이 이미 있는지
  if (misconceptionMap?.misconception_id) {
    const { data: cached } = await supabase
      .from("ai_diagnoses")
      .select("diagnosis_text")
      .eq("misconception_id", misconceptionMap.misconception_id)
      .maybeSingle();

    if (cached) {
      // 캐시 히트! → API 비용 0원 💰
      return NextResponse.json({
        diagnosis: cached.diagnosis_text,
        misconception,
        cached: true,
      });
    }
  }

  // 4. 캐시 미스 → Claude API 호출
  let diagnosisText: string;
  try {
    diagnosisText = await generateDiagnosis(
      question.body,
      correctOption.text,
      selectedOption.text,
      misconception?.name
    );
  } catch (err) {
    console.error("[ai/diagnose] Claude 호출 실패:", err);
    return NextResponse.json(
      { error: "AI 진단을 생성하지 못했습니다. 잠시 후 다시 시도해주세요." },
      { status: 502 }
    );
  }

  // 5. 결과를 캐시에 저장 (다음 사람은 무료로 받음)
  if (misconceptionMap?.misconception_id) {
    await supabase.from("ai_diagnoses").upsert(
      {
        misconception_id: misconceptionMap.misconception_id,
        diagnosis_text: diagnosisText,
      },
      { onConflict: "misconception_id" }
    );
  }

  return NextResponse.json({
    diagnosis: diagnosisText,
    misconception: misconception || null,
    cached: false,
  });
}
