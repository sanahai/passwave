import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관 | PassWave",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold mb-4">이용약관</h1>
      <p className="text-gray-500 leading-relaxed">
        PassWave 이용약관을 준비하고 있습니다. 정식 약관이 게시되기 전까지
        문의사항은{" "}
        <a
          href="mailto:support@passwave.kr"
          className="text-blue-600 hover:underline"
        >
          support@passwave.kr
        </a>{" "}
        로 연락해 주세요.
      </p>
    </div>
  );
}
