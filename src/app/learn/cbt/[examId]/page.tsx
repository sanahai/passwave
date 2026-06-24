// 학생 CBT 응시 화면
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import CbtRunner from "@/components/cbt/cbt-runner";
import type { Question } from "@/types";

interface ExamRow {
  id: string;
  title: string;
  time_limit_minutes: number;
  question_ids: string[];
  is_active: boolean;
  question_order: "fixed" | "random";
  option_order: "fixed" | "random";
  result_visibility: "immediate" | "after";
  allow_retake: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

// Fisher–Yates 셔플
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default async function CbtTakePage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createServerSupabase();

  const { data: exam } = await supabase
    .from("cbt_exams")
    .select(
      "id, title, time_limit_minutes, question_ids, is_active, question_order, option_order, result_visibility, allow_retake, starts_at, ends_at"
    )
    .eq("id", examId)
    .single<ExamRow>();

  if (!exam) notFound();

  // 응시 기간 체크
  const now = new Date();
  const notStarted = exam.starts_at && new Date(exam.starts_at) > now;
  const ended = exam.ends_at && new Date(exam.ends_at) < now;

  // 재응시 여부
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let alreadyTaken = false;
  if (user) {
    const { data: prev } = await supabase
      .from("cbt_results")
      .select("id")
      .eq("exam_id", examId)
      .eq("student_id", user.id)
      .maybeSingle();
    alreadyTaken = !!prev;
  }

  const { data: questionsData } = await supabase
    .from("questions")
    .select("*, options:question_options(*)")
    .in("id", exam.question_ids);

  const map = new Map(
    (questionsData as unknown as Question[] | null)?.map((q) => [q.id, q]) ?? []
  );
  let questions = exam.question_ids
    .map((id) => map.get(id))
    .filter((q): q is Question => Boolean(q));

  if (exam.question_order === "random") questions = shuffle(questions);

  return (
    <CbtRunner
      examId={exam.id}
      title={exam.title}
      timeLimitMinutes={exam.time_limit_minutes}
      questions={questions}
      isActive={exam.is_active && !ended && !notStarted}
      unavailableReason={
        notStarted
          ? "아직 응시 시작 전입니다."
          : ended
          ? "응시 기간이 마감되었습니다."
          : null
      }
      resultVisibility={exam.result_visibility}
      optionOrder={exam.option_order}
      allowRetake={exam.allow_retake}
      alreadyTaken={alreadyTaken}
    />
  );
}
