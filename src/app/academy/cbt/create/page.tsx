// CBT 시험 출제
import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import EmptyAcademy from "@/components/academy/empty-academy";
import CbtBuilder from "@/components/academy/cbt-builder";

export default async function CbtCreatePage() {
  const { academy } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;

  const supabase = await createServerSupabase();
  const [{ data: certs }, { data: subjects }, { data: classes }] =
    await Promise.all([
      supabase
        .from("certifications")
        .select("id, name")
        .eq("is_active", true)
        .order("display_order"),
      supabase.from("subjects").select("id, name, cert_id").order("display_order"),
      supabase
        .from("academy_classes")
        .select("id, name")
        .eq("academy_id", academy.id)
        .eq("is_active", true),
    ]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Link href="/academy/cbt" className="text-sm text-indigo-600 hover:underline">
        ← CBT 목록
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">CBT 시험 출제</h1>
      <p className="text-gray-500 mb-8">새 모의고사를 만듭니다.</p>
      <CbtBuilder
        certs={certs || []}
        subjects={(subjects || []) as { id: string; name: string; cert_id: string }[]}
        classes={(classes || []) as { id: string; name: string }[]}
      />
    </div>
  );
}
