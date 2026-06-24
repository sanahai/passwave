-- ============================================
-- PassWave 마스터 기획안 반영 업그레이드
-- 0001~0004 이후 실행
--   1) academy_invites 테이블 (초대 코드/링크) — 20번째 테이블
--   2) academies / cbt_exams 상세 컬럼 추가
--   3) 시스템 관리자(admin) + 강사 스코핑 RLS 보강
-- ============================================

-- ============================================
-- A. 학원 추가 정보 (대표자/연락처/주소/로고/무료체험)
-- ============================================
ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cert_slugs TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- ============================================
-- B. CBT 시험 상세 설정 컬럼
--   기획서 5-3 "시험 설정 옵션" 반영
-- ============================================
ALTER TABLE public.cbt_exams
  ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id),
  ADD COLUMN IF NOT EXISTS question_order TEXT NOT NULL DEFAULT 'fixed'
    CHECK (question_order IN ('fixed', 'random')),
  ADD COLUMN IF NOT EXISTS option_order TEXT NOT NULL DEFAULT 'fixed'
    CHECK (option_order IN ('fixed', 'random')),
  ADD COLUMN IF NOT EXISTS target_class_id UUID REFERENCES public.academy_classes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS result_visibility TEXT NOT NULL DEFAULT 'immediate'
    CHECK (result_visibility IN ('immediate', 'after')),
  ADD COLUMN IF NOT EXISTS allow_retake BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS pass_score INT NOT NULL DEFAULT 60;

-- ============================================
-- C. academy_invites — 초대 코드/링크 (20번째 테이블)
--   이메일 초대 / 6자리 코드 / QR 모두 code 한 컬럼으로 처리
-- ============================================
CREATE TABLE IF NOT EXISTS public.academy_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,                 -- 예: "ABC-123"
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('owner', 'teacher', 'student')),
  class_id UUID REFERENCES public.academy_classes(id) ON DELETE SET NULL, -- 자동 배정 반
  email TEXT,                                 -- 이메일 초대 시 대상
  max_uses INT NOT NULL DEFAULT 100,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_academy_invites_code ON public.academy_invites(code);
ALTER TABLE public.academy_invites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- D. 시스템 관리자 헬퍼 (profiles.role = 'admin')
-- ============================================
CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- ============================================
-- E. academy_invites RLS — 학원 staff만 관리
--   (코드로 가입하는 흐름은 서비스 롤 API에서 처리)
-- ============================================
DROP POLICY IF EXISTS "academy_invites_select_staff" ON public.academy_invites;
CREATE POLICY "academy_invites_select_staff" ON public.academy_invites
  FOR SELECT USING (public.is_academy_staff(academy_id) OR public.is_system_admin());

DROP POLICY IF EXISTS "academy_invites_insert_staff" ON public.academy_invites;
CREATE POLICY "academy_invites_insert_staff" ON public.academy_invites
  FOR INSERT WITH CHECK (public.is_academy_staff(academy_id));

DROP POLICY IF EXISTS "academy_invites_update_staff" ON public.academy_invites;
CREATE POLICY "academy_invites_update_staff" ON public.academy_invites
  FOR UPDATE USING (public.is_academy_staff(academy_id));

DROP POLICY IF EXISTS "academy_invites_delete_staff" ON public.academy_invites;
CREATE POLICY "academy_invites_delete_staff" ON public.academy_invites
  FOR DELETE USING (public.is_academy_staff(academy_id));

-- ============================================
-- F. 학생 퇴원 / 강사 삭제 / 반 배정 해제 / 시험 삭제용 정책
-- ============================================
DROP POLICY IF EXISTS "academy_members_delete_staff" ON public.academy_members;
CREATE POLICY "academy_members_delete_staff" ON public.academy_members
  FOR DELETE USING (public.is_academy_staff(academy_id));

DROP POLICY IF EXISTS "class_enrollments_delete_staff" ON public.class_enrollments;
CREATE POLICY "class_enrollments_delete_staff" ON public.class_enrollments
  FOR DELETE USING (
    class_id IN (
      SELECT ac.id FROM public.academy_classes ac
      WHERE public.is_academy_staff(ac.academy_id)
    )
  );

DROP POLICY IF EXISTS "academy_classes_delete_staff" ON public.academy_classes;
CREATE POLICY "academy_classes_delete_staff" ON public.academy_classes
  FOR DELETE USING (public.is_academy_staff(academy_id));

DROP POLICY IF EXISTS "cbt_exams_delete_staff" ON public.cbt_exams;
CREATE POLICY "cbt_exams_delete_staff" ON public.cbt_exams
  FOR DELETE USING (public.is_academy_staff(academy_id));

-- ============================================
-- G. 시스템 관리자(sanahai) 전역 조회 정책
--   /admin 영역에서 전체 학원/매출을 볼 수 있도록
-- ============================================
DROP POLICY IF EXISTS "academies_select_admin" ON public.academies;
CREATE POLICY "academies_select_admin" ON public.academies
  FOR SELECT USING (public.is_system_admin());

DROP POLICY IF EXISTS "academy_members_select_admin" ON public.academy_members;
CREATE POLICY "academy_members_select_admin" ON public.academy_members
  FOR SELECT USING (public.is_system_admin());

DROP POLICY IF EXISTS "payments_select_admin" ON public.payments;
CREATE POLICY "payments_select_admin" ON public.payments
  FOR SELECT USING (public.is_system_admin());

DROP POLICY IF EXISTS "subscriptions_select_admin" ON public.subscriptions;
CREATE POLICY "subscriptions_select_admin" ON public.subscriptions
  FOR SELECT USING (public.is_system_admin());

-- 문제은행 관리(admin): 문제/보기 쓰기
DROP POLICY IF EXISTS "questions_write_admin" ON public.questions;
CREATE POLICY "questions_write_admin" ON public.questions
  FOR ALL USING (public.is_system_admin()) WITH CHECK (public.is_system_admin());

DROP POLICY IF EXISTS "options_write_admin" ON public.question_options;
CREATE POLICY "options_write_admin" ON public.question_options
  FOR ALL USING (public.is_system_admin()) WITH CHECK (public.is_system_admin());
