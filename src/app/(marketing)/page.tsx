// 메인 랜딩페이지
import Link from "next/link";
import {
  Users,
  CreditCard,
  History,
  NotebookPen,
  Sparkles,
  GraduationCap,
} from "lucide-react";

const features = [
  {
    icon: Users,
    title: "통합 회원",
    desc: "하나의 계정으로 모든 국가자격증을 학습하세요.",
  },
  {
    icon: CreditCard,
    title: "간편 결제",
    desc: "Toss 정기결제로 구독을 손쉽게 관리합니다.",
  },
  {
    icon: History,
    title: "통합 학습이력",
    desc: "모든 풀이 기록이 한 곳에 쌓여 추이를 한눈에.",
  },
  {
    icon: NotebookPen,
    title: "스마트 오답노트",
    desc: "틀린 문제를 자동 정리하고 복습을 도와줍니다.",
  },
  {
    icon: Sparkles,
    title: "AI 오개념 진단",
    desc: "왜 틀렸는지 AI 튜터가 즉시 진단해줍니다.",
  },
  {
    icon: GraduationCap,
    title: "학원 관리",
    desc: "B2B 멀티테넌트로 반·학생·CBT를 관리합니다.",
  },
];

export default function LandingPage() {
  return (
    <>
      {/* 히어로 */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-24 text-center">
          <span className="inline-block mb-4 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
            국가자격증 합격 플랫폼
          </span>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
            국가자격증, 합격까지
            <br />
            <span className="text-blue-600">AI가 함께합니다</span>
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
            통합 회원·결제·이력 관리부터 AI 오개념 진단, 합격지수까지.
            <br className="hidden md:block" />
            합격에 필요한 모든 것을 PassWave 한 곳에서.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="px-7 py-3.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition"
            >
              무료로 시작하기
            </Link>
            <Link
              href="/pricing"
              className="px-7 py-3.5 border border-gray-200 bg-white rounded-xl font-semibold hover:border-blue-400 transition"
            >
              요금제 보기
            </Link>
          </div>
        </div>
      </section>

      {/* 6대 통합 기능 */}
      <section className="py-20 bg-white border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-3">6대 통합 기능</h2>
            <p className="text-gray-500">
              흩어진 학습 도구를 하나로. 합격에만 집중하세요.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 rounded-2xl border border-gray-100 hover:shadow-sm transition"
                >
                  <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
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

      {/* 합격지수 데모 */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-10 md:p-14 text-center">
            <p className="text-blue-100 mb-2">나의 합격 가능성을 숫자로</p>
            <div className="text-7xl font-bold mb-2">87</div>
            <p className="text-blue-100 mb-8">합격지수 (정답률·복습·진도 종합)</p>
            <Link
              href="/signup"
              className="inline-block px-7 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition"
            >
              내 합격지수 확인하기
            </Link>
          </div>
        </div>
      </section>

      {/* 학원 파트너십 CTA */}
      <section className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-3">학원을 운영하시나요?</h2>
          <p className="text-gray-500 mb-8">
            반 관리, 학생 성적, CBT 모의고사까지. PassWave 학원 파트너십으로
            교육 효율을 높이세요.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-7 py-3.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            학원 파트너십 문의
          </Link>
        </div>
      </section>
    </>
  );
}
