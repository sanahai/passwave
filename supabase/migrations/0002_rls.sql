-- ============================================
-- RLS (Row Level Security) 정책
-- "옆집 데이터 못 보게 막기"
-- ============================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.misconceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_misconception_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wrong_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pass_index_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cbt_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 헬퍼 함수 (SECURITY DEFINER → RLS 우회)
-- academy_members 자기참조 정책의 무한 재귀 방지용
-- ============================================
CREATE OR REPLACE FUNCTION public.user_academy_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT academy_id FROM public.academy_members WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_academy_staff(target_academy_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_members
    WHERE academy_id = target_academy_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'teacher')
  );
$$;

-- === profiles: 본인 것만 읽기/수정 ===
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- === 자격증/과목/문제/보기/오개념: 모든 로그인 사용자가 읽기 가능 ===
CREATE POLICY "cert_select_all" ON public.certifications
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "subjects_select_all" ON public.subjects
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "questions_select_all" ON public.questions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "options_select_all" ON public.question_options
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "misconceptions_select_all" ON public.misconceptions
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "option_misconception_map_select_all" ON public.option_misconception_map
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "ai_diagnoses_select_all" ON public.ai_diagnoses
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- === 풀이기록: 본인 것만 ===
CREATE POLICY "attempts_select_own" ON public.user_attempts
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "attempts_insert_own" ON public.user_attempts
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- === 오답노트: 본인 것만 ===
CREATE POLICY "wrong_notes_select_own" ON public.wrong_notes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wrong_notes_insert_own" ON public.wrong_notes
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "wrong_notes_update_own" ON public.wrong_notes
  FOR UPDATE USING (user_id = auth.uid());

-- === 합격지수: 본인 것만 ===
CREATE POLICY "pass_index_select_own" ON public.pass_index_snapshots
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "pass_index_insert_own" ON public.pass_index_snapshots
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- === 구독/결제: 본인 것만 ===
CREATE POLICY "subscriptions_select_own" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payments_select_own" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

-- === 학원: 소속 멤버만 ===
CREATE POLICY "academies_select_member" ON public.academies
  FOR SELECT USING (id IN (SELECT public.user_academy_ids()));

CREATE POLICY "academy_members_select" ON public.academy_members
  FOR SELECT USING (academy_id IN (SELECT public.user_academy_ids()));

CREATE POLICY "academy_classes_select" ON public.academy_classes
  FOR SELECT USING (academy_id IN (SELECT public.user_academy_ids()));

CREATE POLICY "class_enrollments_select" ON public.class_enrollments
  FOR SELECT USING (
    class_id IN (
      SELECT ac.id FROM public.academy_classes ac
      WHERE ac.academy_id IN (SELECT public.user_academy_ids())
    )
  );

-- === CBT: 소속 학원 멤버만 ===
CREATE POLICY "cbt_exams_select" ON public.cbt_exams
  FOR SELECT USING (academy_id IN (SELECT public.user_academy_ids()));

CREATE POLICY "cbt_results_select_own" ON public.cbt_results
  FOR SELECT USING (student_id = auth.uid());
CREATE POLICY "cbt_results_insert_own" ON public.cbt_results
  FOR INSERT WITH CHECK (student_id = auth.uid());

-- === 학원 관리자(owner/teacher): 소속 학원 학생 데이터 조회 ===
CREATE POLICY "cbt_results_select_staff" ON public.cbt_results
  FOR SELECT USING (
    exam_id IN (
      SELECT ce.id FROM public.cbt_exams ce
      WHERE public.is_academy_staff(ce.academy_id)
    )
  );
