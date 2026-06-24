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
