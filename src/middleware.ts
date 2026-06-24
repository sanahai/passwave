// 모든 요청마다 인증 세션을 갱신하고,
// 로그인이 필요한 페이지에 비로그인 접근 시 /login으로 리다이렉트
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // 정적 자산을 제외한 모든 경로에서 실행 → 매 이동마다 세션 쿠키를 갱신/재저장해야
  // 로그인이 유지됨 (Supabase SSR 공식 권장). 공개 페이지는 updateSession이 통과시킴.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
