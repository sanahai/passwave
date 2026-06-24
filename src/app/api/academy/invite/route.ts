// 초대 코드/링크 생성 API — 강사/학생 초대 (원장·강사)
import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import { generateInviteCode } from "@/lib/utils";

export async function POST(request: NextRequest) {
  const { academy, role } = await getMyAcademy();
  if (!academy) {
    return NextResponse.json({ error: "소속된 학원이 없습니다." }, { status: 403 });
  }
  if (role !== "owner" && role !== "teacher") {
    return NextResponse.json({ error: "초대 권한이 없습니다." }, { status: 403 });
  }

  const body = await request.json();
  const {
    role: inviteRole = "student",
    classId,
    email,
    maxUses = 100,
    expiresInDays,
  } = body as {
    role?: "teacher" | "student";
    classId?: string;
    email?: string;
    maxUses?: number;
    expiresInDays?: number;
  };

  // 강사는 강사 초대 불가 (원장만)
  if (inviteRole === "teacher" && role !== "owner") {
    return NextResponse.json(
      { error: "강사 초대는 원장만 가능합니다." },
      { status: 403 }
    );
  }

  const service = await createServiceSupabase();

  // 유니크 코드 생성 (충돌 시 재시도)
  let code = generateInviteCode();
  for (let i = 0; i < 5; i++) {
    const { data: dup } = await service
      .from("academy_invites")
      .select("id")
      .eq("code", code)
      .maybeSingle();
    if (!dup) break;
    code = generateInviteCode();
  }

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
    : null;

  const { data: invite, error } = await service
    .from("academy_invites")
    .insert({
      academy_id: academy.id,
      code,
      role: inviteRole,
      class_id: classId || null,
      email: email || null,
      max_uses: Number(maxUses) || 100,
      expires_at: expiresAt,
    })
    .select("id, code, role")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, invite });
}
