// 오답노트 — 틀린 문제 모아보기 + 복습
import { createServerSupabase } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { difficultyLabel } from "@/lib/utils";
import type { Certification } from "@/types";

interface WrongNoteRow {
  id: string;
  review_count: number;
  is_resolved: boolean;
  question: {
    id: string;
    body: string;
    explanation: string | null;
    difficulty: number;
    topic: string | null;
    cert_id: string;
    options: { id: string; text: string; option_number: number; is_correct: boolean }[];
  } | null;
}

export default async function WrongNotesPage({
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

  const { data } = await supabase
    .from("wrong_notes")
    .select(
      `
      id, review_count, is_resolved,
      question:questions!inner(
        id, body, explanation, difficulty, topic, cert_id,
        options:question_options(id, text, option_number, is_correct)
      )
    `
    )
    .eq("question.cert_id", cert.id)
    .order("created_at", { ascending: false });

  const notes = (data || []) as unknown as WrongNoteRow[];

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link
        href={`/learn/${certSlug}`}
        className="text-sm text-blue-600 hover:underline"
      >
        ← {cert.name}
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-1">오답노트</h1>
      <p className="text-gray-500 mb-8">
        틀린 문제를 다시 보며 약점을 보완하세요. (총 {notes.length}문항)
      </p>

      <div className="space-y-4">
        {notes.map((note) => {
          if (!note.question) return null;
          const correct = note.question.options.find((o) => o.is_correct);
          return (
            <div
              key={note.id}
              className="bg-white rounded-xl border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">
                  {difficultyLabel(note.question.difficulty)}
                  {note.question.topic ? ` · ${note.question.topic}` : ""}
                </span>
                <span className="text-xs text-gray-400">
                  복습 {note.review_count}회
                </span>
              </div>
              <p className="text-base mb-4">{note.question.body}</p>
              <div className="rounded-lg bg-green-50 p-3 mb-2">
                <span className="text-sm font-medium text-green-700">
                  정답: {correct?.option_number}. {correct?.text}
                </span>
              </div>
              {note.question.explanation && (
                <p className="text-sm text-gray-600">
                  {note.question.explanation}
                </p>
              )}
            </div>
          );
        })}

        {notes.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            아직 오답이 없습니다. 문제를 풀어보세요!
          </div>
        )}
      </div>
    </div>
  );
}
