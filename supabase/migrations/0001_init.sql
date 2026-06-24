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
