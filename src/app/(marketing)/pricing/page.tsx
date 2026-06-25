// 요금제 안내 — 개인(B2C) + 학원(B2B) 통합
import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { formatKRW } from "@/lib/utils";
import { ACADEMY_PLANS, CONSUMER_PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "요금제",
  description:
    "PassWave 요금제 — 개인(Free·Pass·Pass Plus·합격보장)과 학원(Starter·Standard·Premium).",
};

export default function PricingPage() {
  const academyPlans = [
    ACADEMY_PLANS.basic,
    ACADEMY_PLANS.standard,
    ACADEMY_PLANS.premium,
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="text-center mb-14">
        <h1 className="text-4xl font-bold mb-3">요금제</h1>
        <p className="text-gray-500">개인 학습자부터 학원까지, 합격을 위한 선택</p>
      </div>

      {/* 개인 요금제 */}
      <h2 className="text-2xl font-bold mb-6 text-center">개인 (B2C)</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
        {CONSUMER_PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-2xl border p-6 bg-white ${
              plan.highlight
                ? "border-blue-600 shadow-md ring-1 ring-blue-100"
                : "border-gray-200"
            }`}
          >
            {plan.highlight && (
              <span className="inline-block self-start mb-3 px-3 py-1 rounded-full bg-blue-600 text-white text-xs font-medium">
                인기
              </span>
            )}
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-xs text-gray-500 mb-4">{plan.tagline}</p>
            <div className="mb-1">
              <span className="text-3xl font-bold">
                {plan.priceMonthly === 0 ? "무료" : formatKRW(plan.priceMonthly)}
              </span>
              {plan.priceMonthly > 0 && (
                <span className="text-gray-400 text-sm"> /월</span>
              )}
            </div>
            {plan.priceQuarterly && (
              <p className="text-xs text-gray-400 mb-5">
                또는 {formatKRW(plan.priceQuarterly)} / 3개월
              </p>
            )}
            {!plan.priceQuarterly && <div className="mb-5" />}
            <ul className="space-y-2.5 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
                  <span className="text-gray-600">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className={`block text-center py-2.5 rounded-lg font-medium transition ${
                plan.highlight
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "border border-gray-200 hover:border-blue-400"
              }`}
            >
              {plan.id === "free" ? "무료로 시작" : "시작하기"}
            </Link>
          </div>
        ))}
      </div>

      {/* 학원 요금제 */}
      <h2 className="text-2xl font-bold mb-2 text-center">
        PassWave Academy (B2B)
      </h2>
      <p className="text-center text-gray-500 mb-8">
        카드 등록 없이 1개월 무료 체험으로 시작하세요.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {academyPlans.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-2xl border p-8 bg-white ${
              plan.id === "standard"
                ? "border-indigo-600 shadow-md ring-1 ring-indigo-100"
                : "border-gray-200"
            }`}
          >
            {plan.id === "standard" && (
              <span className="inline-block self-start mb-3 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-medium">
                추천
              </span>
            )}
            <h3 className="text-xl font-bold">{plan.name}</h3>
            <p className="text-xs text-gray-500 mb-3">
              학생 {plan.includedStudents}명 포함
            </p>
            <div className="mb-5">
              <span className="text-4xl font-bold">
                {formatKRW(plan.priceMonthly)}
              </span>
              <span className="text-gray-400 text-sm"> /월</span>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                  <span className="text-gray-600">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={`/signup?mode=academy&plan=${plan.id}`}
              className={`block text-center py-3 rounded-lg font-medium transition ${
                plan.id === "standard"
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "border border-gray-200 hover:border-indigo-400"
              }`}
            >
              학원으로 시작하기
            </Link>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-gray-400 mt-6">
        모든 학원 요금제는 추가 학생 2,000~3,000원/명·월로 확장할 수 있습니다.
      </p>
    </div>
  );
}
