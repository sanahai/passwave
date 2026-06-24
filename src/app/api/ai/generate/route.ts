// AI 유사문항 생성 API (관리자/출제용)
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { generateQuestions } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  // 관리자만 문항 생성 가능
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  const { topic, difficulty, count, certName } = await request.json();

  const raw = await generateQuestions(
    topic,
    Number(difficulty) || 2,
    Number(count) || 5,
    certName || "국가자격증"
  );

  let questions: unknown = [];
  try {
    questions = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "생성 결과를 파싱하지 못했습니다.", raw },
      { status: 502 }
    );
  }

  return NextResponse.json({ questions });
}
