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
