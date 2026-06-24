-- PassWave 전체 DB 셋업 (0001~0004 통합본) — Supabase SQL Editor에 붙여넣고 실행하세요.


-- ===== 0001_init.sql =====
-- ============================================
-- PassWave 데이터베이스 스키마 v1.0
-- 실행 순서: 0001 → 0002 → 0003
-- ============================================

-- 0. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- A. 회원 (profiles)
-- Supabase Auth의 auth.users와 1:1 연결
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 새 유저 가입 시 profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- B. 자격증 마스터
-- slug는 URL 경로에 사용: /learn/beauty, /learn/cook
-- ============================================
CREATE TABLE public.certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                       -- '미용사(일반)', '한식조리기능사'
  slug TEXT NOT NULL UNIQUE,                -- 'beauty', 'cook-korean'
  description TEXT,
  icon_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- C. 과목
-- cert_id로 어떤 자격증의 과목인지 구분
-- ============================================
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cert_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                       -- '공통과목', '미용 전용과목'
  slug TEXT NOT NULL,                       -- 'common', 'beauty-specific'
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cert_id, slug)
);

-- ============================================
-- D. 문제 (questions) + 보기 (question_options)
-- ============================================
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cert_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  body TEXT NOT NULL,                       -- 문제 본문
  explanation TEXT,                         -- 해설
  difficulty INT NOT NULL DEFAULT 2 CHECK (difficulty BETWEEN 1 AND 3),
  -- 1=쉬움, 2=보통, 3=어려움
  quality_score INT DEFAULT 90,             -- 품질 점수 (0~100)
  topic TEXT,                               -- 세부 주제 태그
  is_free BOOLEAN NOT NULL DEFAULT false,   -- 무료 체험용 여부
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.question_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  option_number INT NOT NULL CHECK (option_number BETWEEN 1 AND 5),
  text TEXT NOT NULL,                       -- 보기 내용
  is_correct BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(question_id, option_number)
);

CREATE INDEX idx_questions_cert ON public.questions(cert_id);
CREATE INDEX idx_questions_subject ON public.questions(subject_id);
CREATE INDEX idx_question_options_question ON public.question_options(question_id);

-- ============================================
-- E. 오개념 마스터 + 매핑
-- "가위 각도와 빗 각도를 혼동" 같은 오개념 정의
-- ============================================
CREATE TABLE public.misconceptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cert_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                       -- '가위-빗 각도 혼동'
  description TEXT,                         -- 상세 설명
  related_topic TEXT,                       -- 관련 주제
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 어떤 오답 보기가 어떤 오개념과 연결되는지
CREATE TABLE public.option_misconception_map (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  option_id UUID NOT NULL REFERENCES public.question_options(id) ON DELETE CASCADE,
  misconception_id UUID NOT NULL REFERENCES public.misconceptions(id) ON DELETE CASCADE,
  UNIQUE(option_id, misconception_id)
);

-- ============================================
-- F. 풀이 기록 (user_attempts) ⭐ 데이터 금광
-- 모든 학습 데이터의 원천. 절대 가볍게 보지 말 것.
-- ============================================
CREATE TABLE public.user_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES public.question_options(id),
  is_correct BOOLEAN NOT NULL,
  time_spent_seconds INT,                   -- 이 문제에 걸린 시간(초)
  session_id UUID,                          -- 한 번의 학습 세션 구분용
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 사용자별 풀이 조회를 빠르게
CREATE INDEX idx_user_attempts_user ON public.user_attempts(user_id, answered_at DESC);
CREATE INDEX idx_user_attempts_question ON public.user_attempts(question_id);

-- ============================================
-- G. 오답노트 (wrong_notes)
-- ============================================
CREATE TABLE public.wrong_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  misconception_id UUID REFERENCES public.misconceptions(id),
  review_count INT NOT NULL DEFAULT 0,      -- 복습 횟수
  is_resolved BOOLEAN NOT NULL DEFAULT false, -- 해결 완료 여부
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, question_id)              -- 같은 문제는 오답노트에 1번만
);

-- ============================================
-- H. AI 진단 캐시 (ai_diagnoses)
-- 같은 오개념에 대한 설명을 재사용해서 API 비용 절감
-- ============================================
CREATE TABLE public.ai_diagnoses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  misconception_id UUID NOT NULL REFERENCES public.misconceptions(id) ON DELETE CASCADE,
  diagnosis_text TEXT NOT NULL,             -- AI가 생성한 진단 설명
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(misconception_id)                  -- 오개념 1개당 진단 1개만 캐싱
);

-- ============================================
-- I. 합격지수 스냅샷
-- 날짜별로 합격지수를 기록해서 변화 추이를 봄
-- ============================================
CREATE TABLE public.pass_index_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  cert_id UUID NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 0 AND 100),
  accuracy_rate NUMERIC(5,2),               -- 정답률 (%)
  review_rate NUMERIC(5,2),                 -- 복습 달성률 (%)
  progress_rate NUMERIC(5,2),               -- 진도율 (%)
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pass_index_user_cert ON public.pass_index_snapshots(user_id, cert_id, calculated_at DESC);

-- ============================================
-- J. 구독 & 결제
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
  billing_key TEXT,                         -- Toss 빌링키 (카드정보 대신 이 열쇠로 결제)
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount INT NOT NULL,                      -- 결제 금액 (원)
  toss_payment_key TEXT,                    -- Toss 결제 고유키
  toss_order_id TEXT,                       -- 주문번호
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- K. 학원 (B2B 멀티테넌트)
-- ============================================
CREATE TABLE public.academies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id),
  plan TEXT NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'standard', 'premium')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  max_students INT NOT NULL DEFAULT 30,     -- 플랜별 최대 학생 수
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.academy_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('owner', 'teacher', 'student')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(academy_id, user_id)
);

CREATE TABLE public.academy_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,                       -- '오전반', 'A반'
  cert_id UUID REFERENCES public.certifications(id),
  teacher_id UUID REFERENCES public.profiles(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.class_enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES public.academy_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(class_id, student_id)
);

-- ============================================
-- L. CBT 모의고사
-- ============================================
CREATE TABLE public.cbt_exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  cert_id UUID NOT NULL REFERENCES public.certifications(id),
  title TEXT NOT NULL,                      -- '제3회 모의고사'
  question_ids UUID[] NOT NULL,             -- 문제 ID 배열
  time_limit_minutes INT DEFAULT 60,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.cbt_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id UUID NOT NULL REFERENCES public.cbt_exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INT NOT NULL,                       -- 점수
  total_questions INT NOT NULL,
  answers JSONB NOT NULL,                   -- { question_id: selected_option_id }
  time_spent_seconds INT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===== 0002_rls.sql =====
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

-- ===== 0003_seed.sql =====
-- ============================================
-- 초기 자격증 + 과목 데이터
-- ============================================
INSERT INTO public.certifications (name, slug, description, display_order) VALUES
  ('미용사(일반)', 'beauty', '미용사(일반) 국가기술자격', 1),
  ('한식조리기능사', 'cook-korean', '한식조리기능사 국가기술자격', 2),
  ('중식조리기능사', 'cook-chinese', '중식조리기능사 국가기술자격', 3),
  ('행정사', 'admin', '행정사 국가자격', 4)
ON CONFLICT (slug) DO NOTHING;

-- 미용사 과목
INSERT INTO public.subjects (cert_id, name, slug, display_order)
SELECT id, '공통과목', 'common', 1 FROM public.certifications WHERE slug = 'beauty'
ON CONFLICT (cert_id, slug) DO NOTHING;
INSERT INTO public.subjects (cert_id, name, slug, display_order)
SELECT id, '미용 전용과목', 'beauty-specific', 2 FROM public.certifications WHERE slug = 'beauty'
ON CONFLICT (cert_id, slug) DO NOTHING;

-- 한식조리 과목
INSERT INTO public.subjects (cert_id, name, slug, display_order)
SELECT id, '공통과목', 'common', 1 FROM public.certifications WHERE slug = 'cook-korean'
ON CONFLICT (cert_id, slug) DO NOTHING;
INSERT INTO public.subjects (cert_id, name, slug, display_order)
SELECT id, '한식 전용과목', 'korean-specific', 2 FROM public.certifications WHERE slug = 'cook-korean'
ON CONFLICT (cert_id, slug) DO NOTHING;

-- 중식조리 과목
INSERT INTO public.subjects (cert_id, name, slug, display_order)
SELECT id, '공통과목', 'common', 1 FROM public.certifications WHERE slug = 'cook-chinese'
ON CONFLICT (cert_id, slug) DO NOTHING;
INSERT INTO public.subjects (cert_id, name, slug, display_order)
SELECT id, '중식 전용과목', 'chinese-specific', 2 FROM public.certifications WHERE slug = 'cook-chinese'
ON CONFLICT (cert_id, slug) DO NOTHING;

-- 행정사 과목
INSERT INTO public.subjects (cert_id, name, slug, display_order)
SELECT id, '공통과목', 'common', 1 FROM public.certifications WHERE slug = 'admin'
ON CONFLICT (cert_id, slug) DO NOTHING;

-- ============================================
-- 데모용 무료 문제 (미용사 > 공통과목)
-- 앱이 바로 동작하도록 최소 샘플 데이터 제공
-- ============================================
DO $$
DECLARE
  v_cert_id UUID;
  v_subject_id UUID;
  v_q1 UUID;
  v_q2 UUID;
  v_q3 UUID;
  v_misc_id UUID;
  v_wrong_opt UUID;
BEGIN
  SELECT id INTO v_cert_id FROM public.certifications WHERE slug = 'beauty';
  SELECT id INTO v_subject_id FROM public.subjects WHERE cert_id = v_cert_id AND slug = 'common';

  -- 이미 시드된 경우 중복 방지
  IF EXISTS (SELECT 1 FROM public.questions WHERE subject_id = v_subject_id) THEN
    RETURN;
  END IF;

  -- 오개념 정의
  INSERT INTO public.misconceptions (cert_id, name, description, related_topic)
  VALUES (v_cert_id, '소독-멸균 개념 혼동', '소독(병원성 미생물 제거)과 멸균(모든 미생물 제거)을 구분하지 못하는 오개념', '공중보건/소독')
  RETURNING id INTO v_misc_id;

  -- 문제 1
  INSERT INTO public.questions (cert_id, subject_id, body, explanation, difficulty, topic, is_free)
  VALUES (v_cert_id, v_subject_id,
    '다음 중 "소독"의 정의로 가장 옳은 것은?',
    '소독은 병원성 미생물을 제거하거나 약화시키는 것을 말하며, 멸균은 모든 미생물을 완전히 사멸시키는 것을 의미합니다.',
    2, '공중보건', true)
  RETURNING id INTO v_q1;

  INSERT INTO public.question_options (question_id, option_number, text, is_correct) VALUES
    (v_q1, 1, '모든 미생물을 완전히 사멸시키는 것', false),
    (v_q1, 2, '병원성 미생물을 제거하거나 약화시키는 것', true),
    (v_q1, 3, '미생물의 발육과 생활 작용을 정지시키는 것', false),
    (v_q1, 4, '병원성 미생물의 독성만을 제거하는 것', false);

  -- 1번 보기(멸균 정의)를 오개념과 매핑
  SELECT id INTO v_wrong_opt FROM public.question_options WHERE question_id = v_q1 AND option_number = 1;
  INSERT INTO public.option_misconception_map (option_id, misconception_id)
  VALUES (v_wrong_opt, v_misc_id);

  -- 문제 2
  INSERT INTO public.questions (cert_id, subject_id, body, explanation, difficulty, topic, is_free)
  VALUES (v_cert_id, v_subject_id,
    '자외선 소독기에 대한 설명으로 옳지 않은 것은?',
    '자외선은 직접 조사된 표면만 소독 효과가 있으며, 그늘진 부분이나 겹쳐진 기구의 내부는 소독되지 않습니다.',
    2, '소독', true)
  RETURNING id INTO v_q2;

  INSERT INTO public.question_options (question_id, option_number, text, is_correct) VALUES
    (v_q2, 1, '기구를 겹쳐 놓아도 모든 면이 균일하게 소독된다', true),
    (v_q2, 2, '자외선은 직접 조사된 표면에 소독 효과가 있다', false),
    (v_q2, 3, '램프와의 거리가 가까울수록 효과가 크다', false),
    (v_q2, 4, '사용 전 기구의 표면을 깨끗이 닦아야 한다', false);

  -- 문제 3
  INSERT INTO public.questions (cert_id, subject_id, body, explanation, difficulty, topic, is_free)
  VALUES (v_cert_id, v_subject_id,
    '석탄산(페놀) 소독에 대한 설명으로 옳은 것은?',
    '석탄산은 소독제의 살균력을 비교하는 기준(석탄산 계수)으로 사용되며, 금속 부식성과 냄새가 단점입니다.',
    3, '소독', true)
  RETURNING id INTO v_q3;

  INSERT INTO public.question_options (question_id, option_number, text, is_correct) VALUES
    (v_q3, 1, '무색·무취로 사용이 편리하다', false),
    (v_q3, 2, '소독약의 살균력 비교 기준으로 사용된다', true),
    (v_q3, 3, '금속을 전혀 부식시키지 않는다', false),
    (v_q3, 4, '인체에 전혀 무해하다', false);
END $$;

-- ===== 0004_academy_writes.sql =====
-- ============================================
-- 학원(B2B) 쓰기 정책 + 학생 본인 학원 데이터 조회 보강
-- 0001~0003 이후 실행
-- ============================================

-- === 학원 생성: 본인이 owner인 학원만 생성 ===
CREATE POLICY "academies_insert_owner" ON public.academies
  FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "academies_update_staff" ON public.academies
  FOR UPDATE USING (public.is_academy_staff(id));

-- === 멤버 관리: staff가 멤버 추가/수정, 본인은 자기 행 조회 가능 ===
CREATE POLICY "academy_members_insert_staff" ON public.academy_members
  FOR INSERT WITH CHECK (
    public.is_academy_staff(academy_id) OR user_id = auth.uid()
  );
CREATE POLICY "academy_members_update_staff" ON public.academy_members
  FOR UPDATE USING (public.is_academy_staff(academy_id));

-- === 반 관리: staff만 생성/수정 ===
CREATE POLICY "academy_classes_insert_staff" ON public.academy_classes
  FOR INSERT WITH CHECK (public.is_academy_staff(academy_id));
CREATE POLICY "academy_classes_update_staff" ON public.academy_classes
  FOR UPDATE USING (public.is_academy_staff(academy_id));

-- === 수강 등록: staff가 등록 ===
CREATE POLICY "class_enrollments_insert_staff" ON public.class_enrollments
  FOR INSERT WITH CHECK (
    class_id IN (
      SELECT ac.id FROM public.academy_classes ac
      WHERE public.is_academy_staff(ac.academy_id)
    )
  );

-- === CBT 시험: staff만 생성/수정 ===
CREATE POLICY "cbt_exams_insert_staff" ON public.cbt_exams
  FOR INSERT WITH CHECK (public.is_academy_staff(academy_id));
CREATE POLICY "cbt_exams_update_staff" ON public.cbt_exams
  FOR UPDATE USING (public.is_academy_staff(academy_id));

-- ============================================
-- 0005: 마스터 기획안 업그레이드
-- ============================================
ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS owner_name TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS cert_slugs TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

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

CREATE TABLE IF NOT EXISTS public.academy_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student'
    CHECK (role IN ('owner', 'teacher', 'student')),
  class_id UUID REFERENCES public.academy_classes(id) ON DELETE SET NULL,
  email TEXT,
  max_uses INT NOT NULL DEFAULT 100,
  used_count INT NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_academy_invites_code ON public.academy_invites(code);
ALTER TABLE public.academy_invites ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_system_admin()
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

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

DROP POLICY IF EXISTS "academy_members_delete_staff" ON public.academy_members;
CREATE POLICY "academy_members_delete_staff" ON public.academy_members
  FOR DELETE USING (public.is_academy_staff(academy_id));
DROP POLICY IF EXISTS "class_enrollments_delete_staff" ON public.class_enrollments;
CREATE POLICY "class_enrollments_delete_staff" ON public.class_enrollments
  FOR DELETE USING (
    class_id IN (SELECT ac.id FROM public.academy_classes ac WHERE public.is_academy_staff(ac.academy_id))
  );
DROP POLICY IF EXISTS "academy_classes_delete_staff" ON public.academy_classes;
CREATE POLICY "academy_classes_delete_staff" ON public.academy_classes
  FOR DELETE USING (public.is_academy_staff(academy_id));
DROP POLICY IF EXISTS "cbt_exams_delete_staff" ON public.cbt_exams;
CREATE POLICY "cbt_exams_delete_staff" ON public.cbt_exams
  FOR DELETE USING (public.is_academy_staff(academy_id));

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
DROP POLICY IF EXISTS "questions_write_admin" ON public.questions;
CREATE POLICY "questions_write_admin" ON public.questions
  FOR ALL USING (public.is_system_admin()) WITH CHECK (public.is_system_admin());
DROP POLICY IF EXISTS "options_write_admin" ON public.question_options;
CREATE POLICY "options_write_admin" ON public.question_options
  FOR ALL USING (public.is_system_admin()) WITH CHECK (public.is_system_admin());
