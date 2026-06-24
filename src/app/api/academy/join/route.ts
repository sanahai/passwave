// 초대 코드로 학원 가입 API
// 학생/강사가 6자리 코드를 입력하면 해당 학원 소속으로 등록
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const { code } = (await request.json()) as { code?: string };
  if (!code) {
    return NextResponse.json({ error: "초대 코드를 입력하세요." }, { status: 400 });
  }

  const service = await createServiceSupabase();

  const { data: invite } = await service
    .from("academy_invites")
    .select("*")
    .eq("code", code.trim().toUpperCase())
    .maybeSingle();

  if (!invite) {
    return NextResponse.json(
      { error: "유효하지 않은 초대 코드입니다." },
      { status: 404 }
    );
  }
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "만료된 초대 코드입니다." }, { status: 410 });
  }
  if (invite.used_count >= invite.max_uses) {
    return NextResponse.json(
      { error: "사용 횟수가 초과된 코드입니다." },
      { status: 410 }
    );
  }

  // 이미 해당 학원 소속인지 확인
  const { data: already } = await service
    .from("academy_members")
    .select("id")
    .eq("academy_id", invite.academy_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!already) {
    const { error: memberError } = await service.from("academy_members").insert({
      academy_id: invite.academy_id,
      user_id: user.id,
      role: invite.role,
    });
    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 400 });
    }
  }

  // 지정된 반이 있으면 자동 배정
  if (invite.class_id) {
    await service
      .from("class_enrollments")
      .insert({ class_id: invite.class_id, student_id: user.id })
      .select()
      .maybeSingle();
  }

  await service
    .from("academy_invites")
    .update({ used_count: invite.used_count + 1 })
    .eq("id", invite.id);

  return NextResponse.json({
    success: true,
    academyId: invite.academy_id,
    role: invite.role,
  });
}
