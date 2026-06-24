// 시스템 관리자(sanahai) 영역 — profiles.role = 'admin' 만 접근
import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import Header from "@/components/layout/header";

export default async function AdminLayout({
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
    .select("name, role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/learn");

  const nav = [
    { href: "/admin", label: "대시보드" },
    { href: "/admin/academies", label: "학원 관리" },
    { href: "/admin/questions", label: "문제은행" },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex md:flex-col w-60 shrink-0 border-r border-gray-200 bg-gray-900 text-gray-100">
        <div className="px-6 py-5 border-b border-gray-800">
          <Link href="/admin" className="text-xl font-bold">
            PassWave <span className="text-xs text-gray-400">관리자</span>
          </Link>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-gray-800">
          <Link
            href="/learn"
            className="block px-3 py-2 rounded-lg text-sm text-gray-400 hover:bg-gray-800"
          >
            ← 학습으로
          </Link>
        </div>
      </aside>
      <div className="flex flex-col flex-1 min-w-0">
        <Header userName={profile?.name ?? user.email} />
        <main className="flex-1 overflow-y-auto bg-gray-50">{children}</main>
      </div>
    </div>
  );
}
