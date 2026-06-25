import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="text-lg font-bold text-blue-600 mb-2">PassWave</div>
          <p className="text-sm text-gray-600">국가자격증 합격 플랫폼</p>
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            패스웨이브(Pass Wave) | 대표: 이동길
            <br />
            <a
              href="https://passwave.kr"
              className="hover:text-gray-900"
            >
              passwave.kr
            </a>{" "}
            ·{" "}
            <a
              href="mailto:support@passwave.kr"
              className="hover:text-gray-900"
            >
              support@passwave.kr
            </a>
          </p>
        </div>

        <div className="text-sm text-gray-500 space-y-2">
          <div className="font-medium text-gray-700">서비스</div>
          <Link href="/learn" className="block hover:text-gray-900">
            학습 시작
          </Link>
          <Link href="/pricing" className="block hover:text-gray-900">
            요금제
          </Link>
        </div>

        <div className="text-sm text-gray-500 space-y-2">
          <div className="font-medium text-gray-700">고객지원</div>
          <Link href="/terms" className="block hover:text-gray-900">
            이용약관
          </Link>
          <Link href="/privacy" className="block hover:text-gray-900">
            개인정보처리방침
          </Link>
          <div className="font-medium text-gray-700 pt-2">패밀리</div>
          <span className="block">BEAUTYmaster</span>
          <span className="block">COOKmaster</span>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Pass Wave. All rights reserved.
      </div>
    </footer>
  );
}
