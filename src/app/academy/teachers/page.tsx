// 강사 관리 — 강사 목록 + 담당 반 + 초대
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import EmptyAcademy from "@/components/academy/empty-academy";
import InvitePanel from "@/components/academy/invite-panel";
import { Badge } from "@/components/ui/badge";

interface MemberRow {
  user_id: string;
  role: string;
  profile: { name: string | null; email: string } | null;
}

interface ClassRow {
  id: string;
  name: string;
  teacher_id: string | null;
}

export default async function TeachersPage() {
  const { academy, role } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;

  const supabase = await createServerSupabase();
  const [{ data: members }, { data: classes }] = await Promise.all([
    supabase
      .from("academy_members")
      .select("user_id, role, profile:profiles(name, email)")
      .eq("academy_id", academy.id)
      .in("role", ["owner", "teacher"]),
    supabase
      .from("academy_classes")
      .select("id, name, teacher_id")
      .eq("academy_id", academy.id),
  ]);

  const staff = (members || []) as unknown as MemberRow[];
  const classRows = (classes || []) as ClassRow[];

  const classNamesByTeacher = (teacherId: string) =>
    classRows
      .filter((c) => c.teacher_id === teacherId)
      .map((c) => c.name)
      .join(", ") || "-";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">강사 관리</h1>
      <p className="text-gray-500 mb-8">
        강사를 초대하고 담당 반을 관리합니다. 강사는 자기 반 학생만 볼 수 있습니다.
      </p>

      {role === "owner" && (
        <div className="mb-6">
          <InvitePanel role="teacher" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3">이름</th>
              <th className="text-left font-medium px-4 py-3">이메일</th>
              <th className="text-left font-medium px-4 py-3">담당 반</th>
              <th className="text-left font-medium px-4 py-3">역할</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.map((m) => (
              <tr key={m.user_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">
                  {m.profile?.name ?? "(이름 없음)"}
                </td>
                <td className="px-4 py-3 text-gray-500">{m.profile?.email}</td>
                <td className="px-4 py-3 text-gray-500">
                  {classNamesByTeacher(m.user_id)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={m.role === "owner" ? "purple" : "blue"}>
                    {m.role === "owner" ? "원장" : "강사"}
                  </Badge>
                </td>
              </tr>
            ))}
            {staff.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  등록된 강사가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
