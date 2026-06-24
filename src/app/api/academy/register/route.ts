// 학원 등록 API — "학원으로 가입하기"
// 원장 본인 계정으로 학원 생성 + owner 멤버십 + 1개월 무료체험 시작
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase/server";
import { ACADEMY_PLANS } from "@/lib/plans";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "로그인 필요" }, { status: 401 });
  }

  const body = await request.json();
  const { name, ownerName, phone, address, certSlugs } = body as {
    name?: string;
    ownerName?: string;
    phone?: string;
    address?: string;
    certSlugs?: string[];
  };

  if (!name) {
    return NextResponse.json({ error: "학원 이름은 필수입니다." }, { status: 400 });
  }

  const service = await createServiceSupabase();

  // 이미 소속 학원이 있으면 중복 생성 방지
  const { data: existing } = await service
    .from("academy_members")
    .select("academy_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (existing) {
    return NextResponse.json(
      { error: "이미 소속된 학원이 있습니다." },
      { status: 409 }
    );
  }

  // 1개월 무료체험 종료일
  const trialEnd = new Date();
  trialEnd.setMonth(trialEnd.getMonth() + 1);

  const { data: academy, error } = await service
    .from("academies")
    .insert({
      name,
      owner_id: user.id,
      owner_name: ownerName || null,
      phone: phone || null,
      address: address || null,
      cert_slugs: certSlugs || [],
      plan: "basic",
      max_students: ACADEMY_PLANS.basic.maxStudents,
      trial_ends_at: trialEnd.toISOString(),
    })
    .select("id")
    .single();

  if (error || !academy) {
    return NextResponse.json(
      { error: error?.message || "학원 생성 실패" },
      { status: 400 }
    );
  }

  const { error: memberError } = await service.from("academy_members").insert({
    academy_id: academy.id,
    user_id: user.id,
    role: "owner",
  });
  if (memberError) {
    return NextResponse.json({ error: memberError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, academyId: academy.id });
}
