import Link from "next/link";

// 소속 학원이 없을 때 공통으로 보여주는 안내
export default function EmptyAcademy() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="text-2xl font-bold mb-3">아직 소속된 학원이 없습니다</h1>
      <p className="text-gray-500 mb-8">
        학원 파트너십에 가입하면 반 관리, 학생 성적, CBT 모의고사 출제 기능을
        사용할 수 있습니다.
      </p>
      <Link
        href="/pricing"
        className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition"
      >
        학원 파트너십 문의
      </Link>
    </div>
  );
}
