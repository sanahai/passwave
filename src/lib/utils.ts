// 공통 유틸

// 조건부 className 병합 (간단 구현, clsx 대체)
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

// 원화 포맷
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(amount);
}

// 퍼센트 반올림 (소수 1자리)
export function toPercent(value: number): string {
  return `${Math.round(value * 10) / 10}%`;
}

// 난이도 라벨
export function difficultyLabel(difficulty: number): string {
  return difficulty === 1 ? "쉬움" : difficulty === 2 ? "보통" : "어려움";
}

// 합격지수 등급 (기획서 7-2)
export interface PassIndexGradeInfo {
  label: string;
  text: string; // text color class
  bg: string; // bg + border class
  bar: string; // 막대 색
}

export function passIndexGrade(score: number): PassIndexGradeInfo {
  if (score >= 80)
    return {
      label: "합격 안정권",
      text: "text-green-600",
      bg: "bg-green-50 border-green-200",
      bar: "bg-green-500",
    };
  if (score >= 60)
    return {
      label: "합격 가능권",
      text: "text-blue-600",
      bg: "bg-blue-50 border-blue-200",
      bar: "bg-blue-500",
    };
  if (score >= 40)
    return {
      label: "노력 필요",
      text: "text-yellow-600",
      bg: "bg-yellow-50 border-yellow-200",
      bar: "bg-yellow-500",
    };
  return {
    label: "위험",
    text: "text-red-600",
    bg: "bg-red-50 border-red-200",
    bar: "bg-red-500",
  };
}

// 6자리 초대 코드 생성 (예: ABC-123)
export function generateInviteCode(): string {
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "0123456789";
  const pick = (set: string, n: number) =>
    Array.from({ length: n }, () => set[Math.floor(Math.random() * set.length)]).join("");
  return `${pick(letters, 3)}-${pick(digits, 3)}`;
}
