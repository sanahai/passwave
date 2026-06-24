// 반 생성 API (원장·강사)
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { academy, role } = await getMyAcademy();
  if (!academy)
    return NextResponse.json({ error: "소속된 학원이 없습니다." }, { status: 403 });
  if (role !== "owner" && role !== "teacher")
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });

  const { name, certId, teacherId } = (await request.json()) as {
    name?: string;
    certId?: string;
    teacherId?: string;
  };
  if (!name)
    return NextResponse.json({ error: "반 이름은 필수입니다." }, { status: 400 });

  const { error } = await supabase.from("academy_classes").insert({
    academy_id: academy.id,
    name,
    cert_id: certId || null,
    teacher_id: teacherId || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
