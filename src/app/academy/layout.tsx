// 학원 관리 레이아웃 (B2B) — 로그인 필수
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import Header from "@/components/layout/header";

export default async function AcademyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  const nav = [
    { href: "/academy", label: "대시보드" },
    { href: "/academy/students", label: "학생 관리" },
    { href: "/academy/classes", label: "반 관리" },
    { href: "/academy/cbt", label: "CBT 시험" },
    { href: "/academy/ai-diagnosis", label: "AI 진단 분석" },
    { href: "/academy/analytics", label: "성적 분석" },
    { href: "/academy/teachers", label: "강사 관리" },
    { href: "/academy/settings", label: "설정" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-gray-200 bg-white">
        <div className="px-6 py-5 border-b border-gray-100">
          <Link href="/academy" className="text-xl font-bold text-indigo-600">
            PassWave <span className="text-xs text-gray-400">학원</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-100">
          <Link
            href="/learn"
            className="block px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50"
          >
            ← 학습으로 돌아가기
          </Link>
        </div>
      </aside>
      <div className="flex flex-col flex-1 min-w-0">
        <Header userName={profile?.name ?? user.email} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
