// 학습용 레이아웃 (사이드바 + 헤더) — 로그인 필수
import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Header userName={profile?.name ?? user.email} />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
