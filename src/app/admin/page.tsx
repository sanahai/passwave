// 관리자 대시보드 — 전체 학원/매출 현황
import { createServiceSupabase } from "@/lib/supabase/server";
import { formatKRW } from "@/lib/utils";

export default async function AdminHomePage() {
  const service = await createServiceSupabase();

  const [
    { count: academyCount },
    { count: memberCount },
    { count: proCount },
    { data: payments },
  ] = await Promise.all([
    service.from("academies").select("id", { count: "exact", head: true }),
    service.from("academy_members").select("id", { count: "exact", head: true }),
    service
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("plan", "pro")
      .eq("status", "active"),
    service.from("payments").select("amount, status").eq("status", "paid"),
  ]);

  const revenue = (payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);

  const stats = [
    { label: "전체 학원", value: `${academyCount || 0}곳` },
    { label: "전체 멤버", value: `${memberCount || 0}명` },
    { label: "개인 Pro 구독", value: `${proCount || 0}명` },
    { label: "누적 결제 매출", value: formatKRW(revenue) },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">시스템 관리자 대시보드</h1>
      <p className="text-gray-500 mb-8">PassWave 전체 운영 현황</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl border border-gray-200 p-6"
          >
            <div className="text-sm text-gray-500 mb-1">{s.label}</div>
            <div className="text-2xl font-bold">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
