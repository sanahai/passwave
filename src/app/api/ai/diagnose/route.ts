// AI 오개념 진단 API
// ⭐ 핵심: 캐시 먼저 확인 → 없을 때만 Claude 호출 → 결과 캐시 저장
// 이렇게 해야 API 비용을 대폭 절감할 수 있음
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { diagnosisStream } from "@/lib/claude";

// 캐시 히트 텍스트를 스트림처럼 즉시 반환
function textResponse(text: string) {
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

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

  // 1. 문제+보기, 오개념 매핑을 병렬 조회 (순차 → 병렬로 지연 단축)
  const [questionRes, mapRes] = await Promise.all([
    supabase
      .from("questions")
      .select(`body, options:question_options(id, text, is_correct)`)
      .eq("id", questionId)
      .single(),
    supabase
      .from("option_misconception_map")
      .select("misconception_id, misconception:misconceptions(id, name)")
      .eq("option_id", selectedOptionId)
      .limit(1)
      .maybeSingle(),
  ]);

  const question = questionRes.data;
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

  const misconceptionMap = mapRes.data;
  const misconception = misconceptionMap?.misconception as
    | { id: string; name: string }
    | undefined;
  const misconceptionId = misconceptionMap?.misconception_id as
    | string
    | undefined;

  // 2. ⭐ 캐시 확인: 이 오개념에 대한 진단이 이미 있으면 즉시 반환 (0초)
  if (misconceptionId) {
    const { data: cached } = await supabase
      .from("ai_diagnoses")
      .select("diagnosis_text")
      .eq("misconception_id", misconceptionId)
      .maybeSingle();

    if (cached?.diagnosis_text) {
      return textResponse(cached.diagnosis_text);
    }
  }

  // 3. 캐시 미스 → Claude 스트리밍 호출 (토큰을 받는 즉시 흘려보냄)
  let stream;
  try {
    stream = diagnosisStream(
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

  const encoder = new TextEncoder();
  let full = "";
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            full += event.delta.text;
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        // 스트림 종료 후 캐시에 저장 (다음 사람은 0초로 받음)
        if (misconceptionId && full) {
          await supabase.from("ai_diagnoses").upsert(
            { misconception_id: misconceptionId, diagnosis_text: full },
            { onConflict: "misconception_id" }
          );
        }
        controller.close();
      } catch (err) {
        console.error("[ai/diagnose] 스트리밍 실패:", err);
        controller.error(err);
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
