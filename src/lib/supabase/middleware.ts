// 인증 미들웨어 헬퍼
// 모든 요청마다 세션을 갱신하고, 보호된 경로 접근을 통제한다.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// 로그인 없이 접근 가능한 경로
const publicPaths = ["/", "/login", "/signup", "/pricing", "/callback"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // 공개 경로 또는 인증 라우트 그룹의 콜백 등은 허용
  const isPublic = publicPaths.some(
    (p) => path === p || path.startsWith("/auth")
  );

  // 비로그인 사용자가 보호된 경로 접근 시 → 로그인 페이지로
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return response;
}
