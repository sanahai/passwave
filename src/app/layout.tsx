import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: {
    default: "PassWave — 국가자격증 합격 플랫폼",
    template: "%s | PassWave",
  },
  description:
    "국가자격증, 합격까지 AI가 함께합니다. 통합 회원·결제·이력 관리, AI 오개념 진단, 합격지수까지 한 곳에서.",
  keywords: ["국가자격증", "미용사", "조리기능사", "CBT", "AI 튜터", "합격지수"],
  openGraph: {
    title: "PassWave — 국가자격증 합격 플랫폼",
    description: "국가자격증, 합격까지 AI가 함께합니다.",
    type: "website",
    locale: "ko_KR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full bg-gray-50 text-gray-900">{children}</body>
    </html>
  );
}
