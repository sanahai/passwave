// 메인 랜딩페이지 (passwave.kr)
import Link from "next/link";
import {
  Sparkles,
  BarChart3,
  FileText,
  NotebookPen,
  Link2,
  GraduationCap,
  Check,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: Sparkles,
    title: "AI 오개념 진단",
    desc: "틀리면 AI가 원인을 짚어줍니다",
  },
  {
    icon: BarChart3,
    title: "합격지수",
    desc: "내 합격 확률을 숫자 하나로",
  },
  {
    icon: FileText,
    title: "스마트 문제풀이",
    desc: "수천 문항, 난이도별·과목별",
  },
  {
    icon: NotebookPen,
    title: "통합 오답노트",
    desc: "틀린 문제 자동 수집 + 복습 추적",
  },
  {
    icon: Link2,
    title: "통합 계정",
    desc: "한 번 가입, 모든 자격증",
  },
  {
    icon: GraduationCap,
    title: "학원 관리 시스템",
    desc: "CBT 출제 · 자동 채점 · 성적 분석",
  },
];

const academyEffects = [
  { from: "반나절", to: "5분", label: "모의고사 출제·채점 시간" },
  { from: "감(感)", to: "데이터", label: "학생 약점을 숫자로 파악" },
  { from: "수강료의", to: "1~2%", label: "수강료 대비 도입 비용" },
];

const certsActive = [
  "미용사(일반)",
  "미용사(피부)",
  "미용사(네일)",
  "미용사(메이크업)",
  "이용사",
  "한식조리기능사",
  "양식조리기능사",
  "일식조리기능사",
  "중식조리기능사",
  "제과기능사",
  "제빵기능사",
  "지게차운전기능사",
  "굴착기운전기능사",
];
const certsSoon = ["전기기능사", "위생사"];

const trustStats = [
  { value: "6,648+", label: "문항 (미용 5종)" },
  { value: "1,300+", label: "문항 (조리)" },
  { value: "10개", label: "자격증 지원 (확장 중)" },
  { value: "AI", label: "진단 정확도 지속 개선 중" },
];

export default function LandingPage() {
  return (
    <>
      {/* 섹션 1: 히어로 */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 to-white">
        <div className="max-w-6xl mx-auto px-4 py-24 md:py-28 text-center">
          <span className="inline-block mb-5 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
            국가자격증 합격 플랫폼
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
            합격까지, <span className="text-blue-600">AI가 함께합니다</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            다른 곳은 &ldquo;정답은 2번&rdquo;으로 끝납니다.
            <br className="hidden md:block" />
            PassWave는 <strong className="text-gray-900">왜 틀렸는지</strong> AI가
            진단하고, <strong className="text-gray-900">합격 확률</strong>을 숫자로
            알려드립니다.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/signup?mode=academy"
              className="w-full sm:w-auto px-7 py-3.5 border border-gray-200 bg-white rounded-xl font-semibold hover:border-blue-400 transition"
            >
              학원용 문의하기
            </Link>
          </div>
          <p className="mt-6 text-sm text-gray-500">
            가입 즉시 100문항 무료 · 카드 등록 없이 시작
          </p>
        </div>
      </section>

      {/* 섹션 2: 차별점 + 기능 6개 */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              다른 곳은 &ldquo;정답은 2번&rdquo;으로 끝납니다
            </h2>
            <p className="text-lg text-gray-500">
              PassWave는 <strong className="text-gray-900">왜 틀렸는지</strong>까지
              알려드립니다.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-2xl border border-gray-100 hover:shadow-md hover:border-blue-100 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold mb-1">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 섹션 3: 학원용 어필 */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white p-10 md:p-14">
            <div className="text-center mb-10">
              <span className="inline-block mb-3 px-3 py-1 rounded-full bg-white/15 text-sm font-medium">
                학원이라면
              </span>
              <h2 className="text-2xl md:text-3xl font-bold leading-snug">
                종이 모의고사에 반나절 쓰고 계신가요?
              </h2>
              <p className="mt-3 text-blue-100 text-lg">
                PassWave Academy면{" "}
                <strong className="text-white">
                  출제 5분, 채점 0초, 성적 분석 자동
                </strong>
                입니다.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
              {academyEffects.map((e) => (
                <div
                  key={e.label}
                  className="rounded-2xl bg-white/10 p-6 text-center"
                >
                  <div className="text-sm text-blue-100 line-through opacity-70">
                    {e.from}
                  </div>
                  <div className="text-3xl font-bold my-1">{e.to}</div>
                  <div className="text-sm text-blue-100">{e.label}</div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <Link
                href="/signup?mode=academy"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 rounded-xl font-semibold hover:bg-blue-50 transition"
              >
                학원용 1개월 무료 체험 <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 섹션 6: 지원 자격증 */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            계속 늘어나는 자격증
          </h2>
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 mb-4 text-sm font-semibold text-green-700">
              <span className="w-2 h-2 rounded-full bg-green-500" /> 운영중
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {certsActive.map((c) => (
                <span
                  key={c}
                  className="px-4 py-2 rounded-full bg-gray-50 border border-gray-200 text-sm text-gray-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 mb-4 text-sm font-semibold text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-300" /> 준비중
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {certsSoon.map((c) => (
                <span
                  key={c}
                  className="px-4 py-2 rounded-full bg-white border border-dashed border-gray-300 text-sm text-gray-400"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 섹션 7: 요금제 */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">
              필요한 만큼만. 언제든 변경 가능.
            </h2>
            <p className="text-gray-500">개인 학습자</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Free */}
            <PlanCard
              name="Free"
              price="0원"
              features={["100문항 맛보기", "AI 진단 하루 3회"]}
              cta="무료 시작"
              ctaHref="/signup"
            />
            {/* Pass (인기) */}
            <PlanCard
              name="Pass"
              price="14,900원"
              period="/월"
              highlight="가장 인기"
              features={[
                "전체 문제은행",
                "AI 진단 하루 20회",
                "합격지수",
                "자격증 1개",
              ]}
              cta="가장 인기"
              ctaHref="/signup"
              featured
            />
            {/* Pass Plus */}
            <PlanCard
              name="Pass Plus"
              price="29,900원"
              period="/월"
              features={[
                "전체 문제은행",
                "AI 진단 무제한",
                "합격지수",
                "전 자격증",
              ]}
              cta="Plus 시작"
              ctaHref="/signup"
            />
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            3개월 결제 시: Pass 39,900원 / Pass Plus 79,900원
          </p>

          {/* 학원용 요약 */}
          <div className="mt-12 max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <h3 className="text-xl font-bold mb-4">학원용</h3>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-gray-700 mb-3">
              <span>
                <strong>Starter</strong> 99,000원~/월
              </span>
              <span className="text-gray-300">·</span>
              <span>
                <strong>Standard</strong> 199,000원~/월
              </span>
              <span className="text-gray-300">·</span>
              <span>
                <strong>Premium</strong> 399,000원~/월
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              학생 수에 따라 유연하게. 수강료의 1~2% 수준.
            </p>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
            >
              학원용 상세 보기 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* 섹션 8: 신뢰 요소 */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            숫자로 보는 PassWave
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {trustStats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">
                  {s.value}
                </div>
                <div className="text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 섹션 9: 마지막 CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            지금 시작하면, 합격이 가까워집니다
          </h2>
          <p className="text-lg text-gray-500 mb-8">
            100문항 무료 체험. 카드 등록 없이, 1분이면 시작합니다.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>
    </>
  );
}

function PlanCard({
  name,
  price,
  period,
  highlight,
  features,
  cta,
  ctaHref,
  featured,
}: {
  name: string;
  price: string;
  period?: string;
  highlight?: string;
  features: string[];
  cta: string;
  ctaHref: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-7 bg-white border ${
        featured
          ? "border-blue-600 shadow-lg ring-1 ring-blue-100"
          : "border-gray-200"
      }`}
    >
      {highlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-semibold">
          {highlight}
        </span>
      )}
      <div className="text-lg font-bold mb-2">{name}</div>
      <div className="mb-6">
        <span className="text-3xl font-bold">{price}</span>
        {period && <span className="text-gray-400 text-sm">{period}</span>}
      </div>
      <ul className="space-y-3 mb-8 min-h-[140px]">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
            <Check className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Link
        href={ctaHref}
        className={`block text-center py-3 rounded-xl font-semibold transition ${
          featured
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "border border-gray-200 hover:border-blue-400"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
