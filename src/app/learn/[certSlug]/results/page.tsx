// 결과/분석 — 해당 자격증의 누적 학습 통계
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toPercent } from "@/lib/utils";
import type { Certification } from "@/types";

export default async function ResultsPage({
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

  if (!cert) notFound();

  const { data: attempts } = await supabase
    .from("user_attempts")
    .select("is_correct, question:questions!inner(cert_id)")
    .eq("question.cert_id", cert.id);

  const total = attempts?.length || 0;
  const correct = attempts?.filter((a) => a.is_correct).length || 0;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={`/learn/${certSlug}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← {cert.name}
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-8">학습 분석</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">총 풀이</div>
          <div className="text-3xl font-bold">{total}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">정답</div>
          <div className="text-3xl font-bold text-green-600">{correct}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="text-sm text-gray-500 mb-1">정답률</div>
          <div className="text-3xl font-bold text-blue-600">
            {toPercent(accuracy)}
          </div>
        </div>
      </div>
    </div>
  );
}
