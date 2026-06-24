// 학생 관리 / 성적 — 검색·필터·정렬 + 초대 코드
import { createServerSupabase } from "@/lib/supabase/server";
import { getMyAcademy } from "@/lib/academy";
import { getStudentAggregates } from "@/lib/academy-stats";
import EmptyAcademy from "@/components/academy/empty-academy";
import InvitePanel from "@/components/academy/invite-panel";
import StudentTable, {
  type StudentRow,
} from "@/components/academy/student-table";

interface MemberRow {
  user_id: string;
  joined_at: string;
  profile: { id: string; name: string | null; email: string } | null;
}

interface EnrollRow {
  student_id: string;
  class: { name: string } | null;
}

export default async function StudentsPage() {
  const { academy, role } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;
  const isStaff = role === "owner" || role === "teacher";

  const supabase = await createServerSupabase();
  const [{ data: members }, { data: classes }] = await Promise.all([
    supabase
      .from("academy_members")
      .select("user_id, joined_at, profile:profiles(id, name, email)")
      .eq("academy_id", academy.id)
      .eq("role", "student")
      .order("joined_at", { ascending: false }),
    supabase
      .from("academy_classes")
      .select("id, name")
      .eq("academy_id", academy.id),
  ]);

  const memberRows = (members || []) as unknown as MemberRow[];
  const studentIds = memberRows.filter((m) => m.profile).map((m) => m.profile!.id);

  // 반 소속 매핑
  const { data: enrollments } = await supabase
    .from("class_enrollments")
    .select("student_id, class:academy_classes(name)")
    .in("student_id", studentIds.length ? studentIds : ["00000000-0000-0000-0000-000000000000"]);
  const enrollRows = (enrollments || []) as unknown as EnrollRow[];
  const classByStudent = new Map<string, string>();
  enrollRows.forEach((e) => {
    if (e.class?.name) classByStudent.set(e.student_id, e.class.name);
  });

  const aggregates = isStaff
    ? await getStudentAggregates(studentIds)
    : new Map();

  const students: StudentRow[] = memberRows
    .filter((m) => m.profile)
    .map((m) => {
      const agg = aggregates.get(m.profile!.id);
      return {
        id: m.profile!.id,
        name: m.profile!.name ?? "(이름 없음)",
        email: m.profile!.email,
        joinedAt: new Date(m.joined_at).toLocaleDateString("ko-KR"),
        className: classByStudent.get(m.profile!.id) ?? null,
        passIndex: agg?.passIndex ?? null,
        accuracy: agg?.accuracy ?? null,
        attempts: agg?.attempts ?? 0,
      };
    });

  const classOptions = (classes || []) as { id: string; name: string }[];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">학생 관리</h1>
      <p className="text-gray-500 mb-6">
        소속 학생의 성적과 합격지수를 관리합니다.
      </p>

      {isStaff && (
        <div className="mb-6">
          <InvitePanel role="student" classes={classOptions} />
        </div>
      )}

      <StudentTable
        students={students}
        classNames={classOptions.map((c) => c.name)}
      />
    </div>
  );
}
