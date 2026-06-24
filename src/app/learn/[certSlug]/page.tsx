// 해당 자격증 홈 (과목 선택, 진도)
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Certification, Subject } from "@/types";

export default async function CertHomePage({
  params,
}: {
  params: Promise<{ certSlug: string }>;
}) {
  const { certSlug } = await params;
  const supabase = await createServerSupabase();

  const { data: cert } = await supabase
    .from("certifications")
    .select("*")
    .eq("slug", certSlug)
    .single<Certification>();

  if (!cert) {
    notFound();
  }

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("*")
    .eq("cert_id", cert.id)
    .order("display_order");

  const subjects = (subjectsData || []) as Subject[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <Link href="/learn" className="text-sm text-blue-600 hover:underline">
          ← 자격증 목록
        </Link>
        <h1 className="text-2xl font-bold mt-2">{cert.name}</h1>
        <p className="text-gray-500">{cert.description}</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-10">
        <Link
          href={`/learn/${certSlug}/wrong-notes`}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:border-blue-400 transition"
        >
          오답노트
        </Link>
        <Link
          href={`/learn/dashboard`}
          className="px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium hover:border-blue-400 transition"
        >
          합격지수 보기
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-4">과목 선택</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="p-6 bg-white rounded-xl border border-gray-200"
          >
            <h3 className="text-base font-semibold mb-3">{subject.name}</h3>
            <div className="flex gap-2">
              <Link
                href={`/learn/${certSlug}/quiz?subject=${subject.slug}&count=20`}
                className="flex-1 text-center py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                문제풀기 (20문항)
              </Link>
              <Link
                href={`/learn/${certSlug}/quiz?subject=${subject.slug}&count=5`}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-400 transition"
              >
                빠른풀기
              </Link>
            </div>
          </div>
        ))}
        {subjects.length === 0 && (
          <p className="text-gray-400 col-span-full">등록된 과목이 없습니다.</p>
        )}
      </div>
    </div>
  );
}
