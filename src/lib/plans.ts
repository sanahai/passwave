// 학원(B2B) 요금제 정의 — 마스터 기획안 기능1-3 "요금제 선택" 반영
// 플랜별 기능 제한을 한 곳에서 관리

export type AcademyPlan = "basic" | "standard" | "premium";

export interface AcademyPlanSpec {
  id: AcademyPlan;
  name: string;
  priceMonthly: number; // 원
  includedStudents: number; // 기본 포함 학생 수
  maxStudents: number; // 추가 학생 포함 운영 상한 (-1 = 무제한)
  extraStudentPrice: string; // 추가 학생 단가 안내
  maxTeachers: number;
  cbtPerMonth: number; // -1 = 무제한
  aiGeneratePerMonth: number; // AI 문제 자동 출제 (월), 0 = 미지원
  aiDiagnosisPerStudentPerDay: number; // 0 = 미지원, -1 = 무제한
  hasPassIndexDashboard: boolean;
  hasExcelExport: boolean;
  hasPrioritySupport: boolean;
  features: string[];
}

// 내부 plan 키는 DB 제약(basic/standard/premium) 유지, 표시명만 변경
export const ACADEMY_PLANS: Record<AcademyPlan, AcademyPlanSpec> = {
  basic: {
    id: "basic",
    name: "Starter",
    priceMonthly: 99000,
    includedStudents: 15,
    maxStudents: 15,
    extraStudentPrice: "추가 학생 2,000~3,000원/명·월",
    maxTeachers: 1,
    cbtPerMonth: 5,
    aiGeneratePerMonth: 0,
    aiDiagnosisPerStudentPerDay: 0,
    hasPassIndexDashboard: false,
    hasExcelExport: false,
    hasPrioritySupport: false,
    features: [
      "학생 15명 포함",
      "강사 1명 (원장)",
      "CBT 모의고사 월 5회",
      "자동 채점",
      "기본 성적 분석 (점수)",
      "추가 학생 2,000~3,000원/명·월",
    ],
  },
  standard: {
    id: "standard",
    name: "Standard",
    priceMonthly: 199000,
    includedStudents: 40,
    maxStudents: 40,
    extraStudentPrice: "추가 학생 2,000~3,000원/명·월",
    maxTeachers: 3,
    cbtPerMonth: -1,
    aiGeneratePerMonth: 100,
    aiDiagnosisPerStudentPerDay: 10,
    hasPassIndexDashboard: false,
    hasExcelExport: true,
    hasPrioritySupport: false,
    features: [
      "학생 40명 포함",
      "강사 3명",
      "CBT 무제한",
      "AI 문제 자동 출제 월 100문항",
      "AI 오개념 진단 (학생당 하루 10회)",
      "상세 성적 분석 (과목별 + 오개념)",
      "엑셀 데이터 내보내기",
      "추가 학생 2,000~3,000원/명·월",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    priceMonthly: 399000,
    includedStudents: 100,
    maxStudents: 100,
    extraStudentPrice: "추가 학생 2,000~3,000원/명·월",
    maxTeachers: 10,
    cbtPerMonth: -1,
    aiGeneratePerMonth: -1,
    aiDiagnosisPerStudentPerDay: -1,
    hasPassIndexDashboard: true,
    hasExcelExport: true,
    hasPrioritySupport: true,
    features: [
      "학생 100명 포함",
      "강사 10명",
      "CBT 무제한",
      "AI 문제 자동 출제 무제한",
      "AI 오개념 진단 무제한",
      "합격지수 대시보드",
      "엑셀 데이터 내보내기",
      "우선 고객지원",
      "추가 학생 2,000~3,000원/명·월",
    ],
  },
};

export function getPlanSpec(plan: string | null | undefined): AcademyPlanSpec {
  if (plan === "standard") return ACADEMY_PLANS.standard;
  if (plan === "premium") return ACADEMY_PLANS.premium;
  return ACADEMY_PLANS.basic;
}

export function planMaxStudents(plan: string | null | undefined): number {
  return getPlanSpec(plan).maxStudents;
}

// B2C 개인 요금제
export interface ConsumerPlanSpec {
  id: "free" | "pass" | "pass-plus" | "guarantee";
  name: string;
  tagline: string;
  priceMonthly: number;
  priceQuarterly?: number; // 3개월 결제가
  highlight?: boolean;
  features: string[];
}

export const CONSUMER_PLANS: ConsumerPlanSpec[] = [
  {
    id: "free",
    name: "Free",
    tagline: "가볍게 시작하기",
    priceMonthly: 0,
    features: [
      "무료 체험 문항 100개",
      "기본 오답노트",
      "합격지수 미리보기",
      "AI 진단 체험 (일 3회)",
    ],
  },
  {
    id: "pass",
    name: "Pass",
    tagline: "1개 자격증 집중",
    priceMonthly: 14900,
    priceQuarterly: 39900,
    features: [
      "선택한 자격증 1개 무제한",
      "AI 오개념 진단 무제한",
      "합격지수 + 학습이력 전체",
      "통합 오답노트",
    ],
  },
  {
    id: "pass-plus",
    name: "Pass Plus",
    tagline: "전 자격증 통합",
    priceMonthly: 29900,
    priceQuarterly: 79900,
    highlight: true,
    features: [
      "전 자격증 무제한",
      "AI 오개념 진단 무제한",
      "합격지수 + 통합 학습이력",
      "신규 자격증 자동 포함",
      "다중 자격증 동시 관리",
    ],
  },
  {
    id: "guarantee",
    name: "합격보장",
    tagline: "장기 합격 보장 (예정)",
    priceMonthly: 49900,
    priceQuarterly: 129900,
    features: [
      "Pass Plus 전체 기능",
      "데이터 기반 합격 보장 플랜",
      "불합격 시 환불/재수강",
      "1:1 학습 코칭 (예정)",
    ],
  },
];
