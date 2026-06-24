import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 grid gap-6 md:grid-cols-3">
        <div>
          <div className="text-lg font-bold text-blue-600 mb-2">PassWave</div>
          <p className="text-sm text-gray-500">
            국가자격증, 합격까지 AI가 함께합니다.
          </p>
        </div>
        <div className="text-sm text-gray-500 space-y-2">
          <div className="font-medium text-gray-700">서비스</div>
          <Link href="/pricing" className="block hover:text-gray-900">
            요금제
          </Link>
          <Link href="/learn" className="block hover:text-gray-900">
            학습 시작
          </Link>
        </div>
        <div className="text-sm text-gray-500 space-y-2">
          <div className="font-medium text-gray-700">파트너</div>
          <Link href="/academy" className="block hover:text-gray-900">
            학원 파트너십
          </Link>
        </div>
      </div>
      <div className="border-t border-gray-100 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} PassWave. All rights reserved.
      </div>
    </footer>
  );
}
