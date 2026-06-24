// 학원 staff가 학생 데이터를 조회하기 위한 집계 헬퍼
// 학생의 풀이/오답/합격지수는 RLS상 본인 전용이므로,
// staff 권한을 코드에서 검증한 뒤 서비스 롤 클라이언트로 조회한다.
import { createServiceSupabase } from "@/lib/supabase/server";

export interface StudentAggregate {
  passIndex: number | null;
  accuracy: number | null;
  attempts: number;
}

export async function getStudentAggregates(
  studentIds: string[]
): Promise<Map<string, StudentAggregate>> {
  const map = new Map<string, StudentAggregate>();
  if (studentIds.length === 0) return map;

  const service = await createServiceSupabase();

  const [{ data: attempts }, { data: snapshots }] = await Promise.all([
    service
      .from("user_attempts")
      .select("user_id, is_correct")
      .in("user_id", studentIds),
    service
      .from("pass_index_snapshots")
      .select("user_id, score, calculated_at")
      .in("user_id", studentIds)
      .order("calculated_at", { ascending: false }),
  ]);

  const counts = new Map<string, { total: number; correct: number }>();
  (attempts || []).forEach((a) => {
    const c = counts.get(a.user_id) || { total: 0, correct: 0 };
    c.total++;
    if (a.is_correct) c.correct++;
    counts.set(a.user_id, c);
  });

  const latestPi = new Map<string, number>();
  (snapshots || []).forEach((s) => {
    if (!latestPi.has(s.user_id)) latestPi.set(s.user_id, s.score);
  });

  studentIds.forEach((id) => {
    const c = counts.get(id);
    map.set(id, {
      attempts: c?.total ?? 0,
      accuracy:
        c && c.total > 0 ? Math.round((c.correct / c.total) * 100) : null,
      passIndex: latestPi.get(id) ?? null,
    });
  });

  return map;
}

export interface SubjectAccuracy {
  name: string;
  total: number;
  correct: number;
  rate: number;
}

export interface StudentDetail {
  profile: { id: string; name: string | null; email: string; created_at: string } | null;
  passIndex: number | null;
  passHistory: { score: number; calculated_at: string }[];
  subjects: SubjectAccuracy[];
  misconceptions: { name: string; count: number }[];
  wrongTotal: number;
  wrongReviewed: number;
  cbtResults: { title: string; score: number; total: number; submittedAt: string }[];
  totalAttempts: number;
  accuracy: number | null;
}

export async function getStudentDetail(studentId: string): Promise<StudentDetail> {
  const service = await createServiceSupabase();

  const [profileRes, attemptsRes, wrongRes, piRes, cbtRes] = await Promise.all([
    service
      .from("profiles")
      .select("id, name, email, created_at")
      .eq("id", studentId)
      .maybeSingle(),
    service
      .from("user_attempts")
      .select("is_correct, question:questions(subject:subjects(name))")
      .eq("user_id", studentId),
    service
      .from("wrong_notes")
      .select("review_count, is_resolved, misconception:misconceptions(name)")
      .eq("user_id", studentId),
    service
      .from("pass_index_snapshots")
      .select("score, calculated_at")
      .eq("user_id", studentId)
      .order("calculated_at", { ascending: false })
      .limit(10),
    service
      .from("cbt_results")
      .select("score, total_questions, submitted_at, exam:cbt_exams(title)")
      .eq("student_id", studentId)
      .order("submitted_at", { ascending: false })
      .limit(5),
  ]);

  // 과목별 정답률
  const subjMap = new Map<string, { total: number; correct: number }>();
  let total = 0;
  let correct = 0;
  type AttemptRow = {
    is_correct: boolean;
    question: { subject: { name: string } | null } | null;
  };
  ((attemptsRes.data || []) as unknown as AttemptRow[]).forEach((a) => {
    total++;
    if (a.is_correct) correct++;
    const name = a.question?.subject?.name || "기타";
    const s = subjMap.get(name) || { total: 0, correct: 0 };
    s.total++;
    if (a.is_correct) s.correct++;
    subjMap.set(name, s);
  });
  const subjects: SubjectAccuracy[] = Array.from(subjMap.entries())
    .map(([name, s]) => ({
      name,
      total: s.total,
      correct: s.correct,
      rate: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);

  // 오개념 TOP
  const miscMap = new Map<string, number>();
  let wrongReviewed = 0;
  type WrongRow = {
    review_count: number;
    is_resolved: boolean;
    misconception: { name: string } | null;
  };
  const wrongRows = (wrongRes.data || []) as unknown as WrongRow[];
  wrongRows.forEach((w) => {
    if (w.review_count >= 1 || w.is_resolved) wrongReviewed++;
    const name = w.misconception?.name;
    if (name) miscMap.set(name, (miscMap.get(name) || 0) + 1);
  });
  const misconceptions = Array.from(miscMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const passHistory = (piRes.data || []) as { score: number; calculated_at: string }[];

  type CbtRow = {
    score: number;
    total_questions: number;
    submitted_at: string;
    exam: { title: string } | null;
  };
  const cbtResults = ((cbtRes.data || []) as unknown as CbtRow[]).map((r) => ({
    title: r.exam?.title || "모의고사",
    score: r.score,
    total: r.total_questions,
    submittedAt: new Date(r.submitted_at).toLocaleDateString("ko-KR"),
  }));

  return {
    profile: profileRes.data ?? null,
    passIndex: passHistory[0]?.score ?? null,
    passHistory: [...passHistory].reverse(),
    subjects,
    misconceptions,
    wrongTotal: wrongRows.length,
    wrongReviewed,
    cbtResults,
    totalAttempts: total,
    accuracy: total > 0 ? Math.round((correct / total) * 100) : null,
  };
}

// 학원 소속 학생 id 목록
export async function getAcademyStudentIds(
  academyId: string
): Promise<string[]> {
  const service = await createServiceSupabase();
  const { data } = await service
    .from("academy_members")
    .select("user_id")
    .eq("academy_id", academyId)
    .eq("role", "student");
  return (data || []).map((m) => m.user_id);
}

export interface MisconceptionStat {
  name: string;
  students: number;
  frequency: number;
}

// 학원 전체 오개념 통계 (해당 학생 수 + 빈도)
export async function getAcademyMisconceptions(
  studentIds: string[]
): Promise<MisconceptionStat[]> {
  if (studentIds.length === 0) return [];
  const service = await createServiceSupabase();
  const { data } = await service
    .from("wrong_notes")
    .select("user_id, misconception:misconceptions(name)")
    .in("user_id", studentIds);

  type Row = { user_id: string; misconception: { name: string } | null };
  const rows = (data || []) as unknown as Row[];
  const byName = new Map<string, { students: Set<string>; freq: number }>();
  rows.forEach((r) => {
    const name = r.misconception?.name;
    if (!name) return;
    const e = byName.get(name) || { students: new Set<string>(), freq: 0 };
    e.students.add(r.user_id);
    e.freq++;
    byName.set(name, e);
  });
  return Array.from(byName.entries())
    .map(([name, e]) => ({ name, students: e.students.size, frequency: e.freq }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10);
}

export interface SubjectWrongStat {
  name: string;
  count: number;
}

// 과목별 오답 분포 (학원 전체)
export async function getAcademySubjectWrongs(
  studentIds: string[]
): Promise<{ subjects: SubjectWrongStat[]; total: number }> {
  if (studentIds.length === 0) return { subjects: [], total: 0 };
  const service = await createServiceSupabase();
  const { data } = await service
    .from("wrong_notes")
    .select("question:questions(subject:subjects(name))")
    .in("user_id", studentIds);

  type Row = { question: { subject: { name: string } | null } | null };
  const rows = (data || []) as unknown as Row[];
  const byName = new Map<string, number>();
  rows.forEach((r) => {
    const name = r.question?.subject?.name || "기타";
    byName.set(name, (byName.get(name) || 0) + 1);
  });
  return {
    subjects: Array.from(byName.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count),
    total: rows.length,
  };
}

// 특정 학생이 해당 학원 소속인지 확인
export async function isAcademyMember(
  academyId: string,
  userId: string
): Promise<boolean> {
  const service = await createServiceSupabase();
  const { data } = await service
    .from("academy_members")
    .select("id")
    .eq("academy_id", academyId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}
