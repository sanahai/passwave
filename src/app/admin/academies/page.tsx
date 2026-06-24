// 관리자 — 학원 목록
import { createServiceSupabase } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { getPlanSpec } from "@/lib/plans";

interface AcademyRow {
  id: string;
  name: string;
  plan: string;
  is_active: boolean;
  owner_name: string | null;
  phone: string | null;
  trial_ends_at: string | null;
  created_at: string;
}

export default async function AdminAcademiesPage() {
  const service = await createServiceSupabase();
  const { data: academies } = await service
    .from("academies")
    .select(
      "id, name, plan, is_active, owner_name, phone, trial_ends_at, created_at"
    )
    .order("created_at", { ascending: false });

  const rows = (academies || []) as AcademyRow[];

  // 학원별 멤버 수
  const { data: members } = await service
    .from("academy_members")
    .select("academy_id");
  const memberCount = new Map<string, number>();
  (members || []).forEach((m) => {
    memberCount.set(m.academy_id, (memberCount.get(m.academy_id) || 0) + 1);
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">학원 관리</h1>
      <p className="text-gray-500 mb-8">등록된 전체 학원 목록입니다.</p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3">학원</th>
              <th className="text-left font-medium px-4 py-3">대표자</th>
              <th className="text-left font-medium px-4 py-3">플랜</th>
              <th className="text-left font-medium px-4 py-3">멤버</th>
              <th className="text-left font-medium px-4 py-3">상태</th>
              <th className="text-left font-medium px-4 py-3">가입일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-gray-500">
                  {a.owner_name ?? "-"}
                  {a.phone && (
                    <span className="block text-xs text-gray-400">{a.phone}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge tone="purple">{getPlanSpec(a.plan).name}</Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {memberCount.get(a.id) ?? 0}명
                </td>
                <td className="px-4 py-3">
                  <Badge tone={a.is_active ? "green" : "gray"}>
                    {a.is_active ? "운영중" : "정지"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(a.created_at).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  등록된 학원이 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
