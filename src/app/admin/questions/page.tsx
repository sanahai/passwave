// 관리자 — 문제은행 현황 (자격증별 문항 수)
import { createServiceSupabase } from "@/lib/supabase/server";

interface CertRow {
  id: string;
  name: string;
  slug: string;
}

export default async function AdminQuestionsPage() {
  const service = await createServiceSupabase();
  const { data: certs } = await service
    .from("certifications")
    .select("id, name, slug")
    .order("display_order");

  const certRows = (certs || []) as CertRow[];

  const counts = await Promise.all(
    certRows.map(async (c) => {
      const [{ count: qCount }, { count: mCount }] = await Promise.all([
        service
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("cert_id", c.id),
        service
          .from("misconceptions")
          .select("id", { count: "exact", head: true })
          .eq("cert_id", c.id),
      ]);
      return { ...c, questions: qCount || 0, misconceptions: mCount || 0 };
    })
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">문제은행</h1>
      <p className="text-gray-500 mb-8">
        자격증별 등록 문항과 오개념 현황입니다. AI 문제 자동 출제는{" "}
        <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
          /api/ai/generate
        </code>{" "}
        로 추가됩니다.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {counts.map((c) => (
          <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-6">
            <h3 className="font-semibold mb-1">{c.name}</h3>
            <p className="text-xs text-gray-400 mb-4">/{c.slug}</p>
            <div className="flex gap-6">
              <div>
                <div className="text-2xl font-bold">{c.questions}</div>
                <div className="text-xs text-gray-500">문항</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{c.misconceptions}</div>
                <div className="text-xs text-gray-500">오개념</div>
              </div>
            </div>
          </div>
        ))}
        {counts.length === 0 && (
          <p className="text-gray-400 col-span-full text-center py-10">
            등록된 자격증이 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
