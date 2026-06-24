// 회원가입 페이지 — 개인 학습자 / 학원(원장) 선택
"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

type Mode = "individual" | "academy";

const CERT_CHOICES = [
  { slug: "beauty", name: "미용사(일반)" },
  { slug: "cook-korean", name: "한식조리기능사" },
  { slug: "cook-chinese", name: "중식조리기능사" },
  { slug: "admin", name: "행정사" },
];

function SignupForm() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("individual");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");

  // 학원 가입 추가 필드
  const [academyName, setAcademyName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [certSlugs, setCertSlugs] = useState<string[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // 초대 링크(/signup?code=ABC-123)로 진입 시 코드 자동 입력
  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setInviteCode(code);
      setMode("individual");
    }
  }, [searchParams]);

  const toggleCert = (slug: string) =>
    setCertSlugs((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setLoading(false);
      return;
    }
    if (mode === "academy" && !academyName) {
      setError("학원 이름을 입력해주세요.");
      setLoading(false);
      return;
    }

    const displayName = mode === "academy" ? ownerName || name : name;

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: displayName },
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });
    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // 이메일 확인이 꺼져 있으면 세션이 즉시 생성됨 → 후속 처리
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      router.push("/login?message=이메일을 확인한 뒤 로그인해주세요");
      return;
    }

    if (mode === "academy") {
      const res = await fetch("/api/academy/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: academyName,
          ownerName: ownerName || name,
          phone,
          address,
          certSlugs,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "학원 등록에 실패했습니다.");
        setLoading(false);
        return;
      }
      router.push("/academy");
      router.refresh();
      return;
    }

    // 개인 가입 + 초대 코드가 있으면 학원 자동 소속
    if (inviteCode.trim()) {
      await fetch("/api/academy/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode }),
      }).catch(() => {});
    }
    router.push("/learn");
    router.refresh();
  };

  const inputCls =
    "w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <h1 className="text-2xl font-bold text-center mb-2">PassWave 회원가입</h1>
        <p className="text-gray-500 text-center mb-6">합격까지 함께하는 AI 플랫폼</p>

        {/* 모드 선택 탭 */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => setMode("individual")}
            className={`py-2.5 rounded-lg text-sm font-medium transition ${
              mode === "individual"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            개인 학습자
          </button>
          <button
            type="button"
            onClick={() => setMode("academy")}
            className={`py-2.5 rounded-lg text-sm font-medium transition ${
              mode === "academy"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500"
            }`}
          >
            학원으로 가입
          </button>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          {mode === "academy" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  학원 이름
                </label>
                <input
                  type="text"
                  value={academyName}
                  onChange={(e) => setAcademyName(e.target.value)}
                  className={inputCls}
                  placeholder="예: ABC미용학원"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  대표자 이름
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className={inputCls}
                  placeholder="대표자 성함"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    전화번호
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputCls}
                    placeholder="02-000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주소
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={inputCls}
                    placeholder="학원 주소"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  가르치는 자격증 (복수 선택)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {CERT_CHOICES.map((c) => (
                    <label
                      key={c.slug}
                      className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer ${
                        certSlugs.includes(c.slug)
                          ? "border-indigo-400 bg-indigo-50"
                          : "border-gray-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={certSlugs.includes(c.slug)}
                        onChange={() => toggleCert(c.slug)}
                        className="accent-indigo-600"
                      />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === "individual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                이름
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="이름을 입력하세요"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이메일 (로그인용)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="example@email.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="6자 이상"
              required
            />
          </div>

          {mode === "individual" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학원 초대 코드 (선택)
              </label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className={inputCls}
                placeholder="예: ABC-123"
              />
              <p className="text-xs text-gray-400 mt-1">
                학원에서 받은 코드가 있으면 입력하세요.
              </p>
            </div>
          )}

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white rounded-lg font-medium disabled:opacity-50 transition ${
              mode === "academy"
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading
              ? "가입 중..."
              : mode === "academy"
              ? "학원 등록하고 무료 체험 시작"
              : "회원가입"}
          </button>
          {mode === "academy" && (
            <p className="text-xs text-gray-400 text-center">
              카드 등록 없이 1개월 무료 체험이 시작됩니다.
            </p>
          )}
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="text-blue-600 hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-gray-400">
          불러오는 중...
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
