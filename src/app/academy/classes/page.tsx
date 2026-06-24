// 반 관리
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import EmptyAcademy from "@/components/academy/empty-academy";
import ClassList, { type ClassRow } from "@/components/academy/class-list";

interface ClassQueryRow {
  id: string;
  name: string;
  is_active: boolean;
  teacher_id: string | null;
  cert: { name: string } | null;
  enrollments: { count: number }[];
}

export default async function ClassesPage() {
  const { academy, role } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;
  const canManage = role === "owner" || role === "teacher";

  const supabase = await createServerSupabase();
  const [{ data }, { data: certs }, { data: teachers }] = await Promise.all([
    supabase
      .from("academy_classes")
      .select(
        `
        id, name, is_active, teacher_id,
        cert:certifications(name),
        enrollments:class_enrollments(count)
      `
      )
      .eq("academy_id", academy.id)
      .order("created_at", { ascending: false }),
    supabase.from("certifications").select("id, name").eq("is_active", true),
    supabase
      .from("academy_members")
      .select("user_id, profile:profiles(name)")
      .eq("academy_id", academy.id)
      .in("role", ["owner", "teacher"]),
  ]);

  const rows = (data || []) as unknown as ClassQueryRow[];
  const teacherRows = (teachers || []) as unknown as {
    user_id: string;
    profile: { name: string | null } | null;
  }[];
  const teacherById = new Map(
    teacherRows.map((t) => [t.user_id, t.profile?.name ?? "(이름 없음)"])
  );

  const classes: ClassRow[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    certName: r.cert?.name ?? null,
    teacherName: r.teacher_id ? teacherById.get(r.teacher_id) ?? null : null,
    studentCount: r.enrollments?.[0]?.count ?? 0,
    isActive: r.is_active,
  }));

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">반 관리</h1>
      <p className="text-gray-500 mb-8">학원의 반 목록을 관리합니다.</p>
      <ClassList
        classes={classes}
        certs={(certs || []) as { id: string; name: string }[]}
        teachers={teacherRows.map((t) => ({
          id: t.user_id,
          name: t.profile?.name ?? "(이름 없음)",
        }))}
        canManage={canManage}
      />
    </div>
  );
}
