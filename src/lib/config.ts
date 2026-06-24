// 앱 기본 URL (서버/클라이언트 공용)
export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}
