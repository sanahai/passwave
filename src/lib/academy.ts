// 학원(B2B) 관련 서버 헬퍼
import { createServerSupabase } from "@/lib/supabase/server";
import type { Academy } from "@/types";

// 현재 로그인 사용자가 속한 학원 1곳을 반환 (RLS로 본인 소속만 조회됨)
export async function getMyAcademy(): Promise<{
  academy: Academy | null;
  role: string | null;
}> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { academy: null, role: null };

  const { data: membership } = await supabase
    .from("academy_members")
    .select("role, academy:academies(*)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!membership?.academy) return { academy: null, role: null };

  return {
    academy: membership.academy as unknown as Academy,
    role: membership.role as string,
  };
}

// 현재 로그인 사용자가 시스템 관리자(profiles.role='admin')인지 확인
export async function isSystemAdmin(): Promise<boolean> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  return data?.role === "admin";
}
