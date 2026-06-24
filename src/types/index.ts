// 전역 타입 정의 — 프로젝트 전체에서 사용

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: "user" | "admin";
}

export interface Certification {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_url: string | null;
  is_active: boolean;
  display_order: number;
}

export interface Subject {
  id: string;
  cert_id: string;
  name: string;
  slug: string;
  display_order: number;
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_number: number;
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  cert_id: string;
  subject_id: string;
  body: string;
  explanation: string | null;
  difficulty: 1 | 2 | 3;
  quality_score: number;
  topic: string | null;
  is_free: boolean;
  options: QuestionOption[]; // JOIN해서 가져옴
}

export interface UserAttempt {
  id: string;
  user_id: string;
  question_id: string;
  selected_option_id: string | null;
  is_correct: boolean;
  time_spent_seconds: number | null;
  session_id: string | null;
  answered_at: string;
}

export interface WrongNote {
  id: string;
  user_id: string;
  question_id: string;
  misconception_id: string | null;
  review_count: number;
  is_resolved: boolean;
  last_reviewed_at: string | null;
  question?: Question; // JOIN해서 가져올 때
}

export interface Misconception {
  id: string;
  cert_id: string;
  name: string;
  description: string | null;
  related_topic: string | null;
}

export interface PassIndexSnapshot {
  id: string;
  user_id: string;
  cert_id: string;
  score: number;
  accuracy_rate: number;
  review_rate: number;
  progress_rate: number;
  calculated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  plan: "free" | "pro" | "premium";
  status: "active" | "cancelled" | "expired" | "past_due";
  current_period_end: string | null;
}

export interface Academy {
  id: string;
  name: string;
  owner_id: string;
  plan: "basic" | "standard" | "premium";
  is_active: boolean;
  max_students: number;
  owner_name: string | null;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
  cert_slugs: string[];
  notify_email: boolean;
  trial_ends_at: string | null;
}

export interface AcademyClass {
  id: string;
  academy_id: string;
  name: string;
  cert_id: string | null;
  teacher_id: string | null;
  is_active: boolean;
}

export interface AcademyInvite {
  id: string;
  academy_id: string;
  code: string;
  role: "owner" | "teacher" | "student";
  class_id: string | null;
  email: string | null;
  max_uses: number;
  used_count: number;
  expires_at: string | null;
  created_at: string;
}

export type CbtOrder = "fixed" | "random";

export interface CbtExam {
  id: string;
  academy_id: string;
  cert_id: string;
  subject_id: string | null;
  title: string;
  question_ids: string[];
  time_limit_minutes: number;
  is_active: boolean;
  question_order: CbtOrder;
  option_order: CbtOrder;
  target_class_id: string | null;
  starts_at: string | null;
  ends_at: string | null;
  result_visibility: "immediate" | "after";
  allow_retake: boolean;
  pass_score: number;
}

export interface CbtResult {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  total_questions: number;
  answers: Record<string, string>;
  time_spent_seconds: number | null;
  submitted_at: string;
}

// 합격지수 등급 유틸에서 사용
export type PassIndexGrade = "stable" | "likely" | "effort" | "risk";

// 퀴즈 진행 상태 (Zustand 스토어용)
export interface QuizState {
  questions: Question[];
  currentIndex: number;
  answers: Record<string, string>; // { question_id: selected_option_id }
  results: Record<string, boolean>; // { question_id: is_correct }
  sessionId: string;
  isFinished: boolean;
}
