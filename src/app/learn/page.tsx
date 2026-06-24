// /learn — 내 자격증 목록 + 새 자격증 추가
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import type { Certification } from "@/types";

export default async function LearnPage() {
  const supabase = await createServerSupabase();

  // 활성화된 자격증 목록
  const { data: certs } = await supabase
    .from("certifications")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  const certifications = (certs || []) as Certification[];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">내 학습</h1>
      <p className="text-gray-500 mb-8">준비할 자격증을 선택하세요</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {certifications.map((cert) => (
          <Link
            key={cert.id}
            href={`/learn/${cert.slug}`}
            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-blue-400 hover:shadow-sm transition"
          >
            <h2 className="text-lg font-semibold mb-1">{cert.name}</h2>
            <p className="text-sm text-gray-500">{cert.description}</p>
          </Link>
        ))}
        {certifications.length === 0 && (
          <p className="text-gray-400 col-span-full">
            등록된 자격증이 없습니다. 시드 데이터를 실행해주세요.
          </p>
        )}
      </div>
    </div>
  );
}
