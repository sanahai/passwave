// 마케팅용 레이아웃 (헤더/푸터) — 비로그인
import Link from "next/link";
import Footer from "@/components/layout/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">
            PassWave
          </Link>
          <nav className="flex items-center gap-2 md:gap-4">
            <Link
              href="/pricing"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              요금제
            </Link>
            <Link
              href="/login"
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              무료로 시작
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
