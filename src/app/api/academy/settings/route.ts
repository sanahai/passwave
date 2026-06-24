// 학원 설정 변경 API (원장만) — 기본 정보 + 요금제 변경
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import { ACADEMY_PLANS, type AcademyPlan } from "@/lib/plans";

export async function PATCH(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "로그인 필요" }, { status: 401 });

  const { academy, role } = await getMyAcademy();
  if (!academy)
    return NextResponse.json({ error: "소속된 학원이 없습니다." }, { status: 403 });
  if (role !== "owner")
    return NextResponse.json({ error: "원장만 변경할 수 있습니다." }, { status: 403 });

  const body = await request.json();
  const { name, ownerName, phone, address, notifyEmail, plan } = body as {
    name?: string;
    ownerName?: string;
    phone?: string;
    address?: string;
    notifyEmail?: boolean;
    plan?: AcademyPlan;
  };

  const update: Record<string, unknown> = {};
  if (name !== undefined) update.name = name;
  if (ownerName !== undefined) update.owner_name = ownerName;
  if (phone !== undefined) update.phone = phone;
  if (address !== undefined) update.address = address;
  if (notifyEmail !== undefined) update.notify_email = notifyEmail;
  if (plan && ACADEMY_PLANS[plan]) {
    update.plan = plan;
    const spec = ACADEMY_PLANS[plan];
    update.max_students = spec.maxStudents === -1 ? 100000 : spec.maxStudents;
  }

  const { error } = await supabase
    .from("academies")
    .update(update)
    .eq("id", academy.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
