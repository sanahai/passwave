"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Header({ userName }: { userName?: string | null }) {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="h-14 shrink-0 border-b border-gray-200 bg-white flex items-center justify-between px-4 md:px-6">
      <span className="text-sm text-gray-500 md:hidden font-bold text-blue-600">
        PassWave
      </span>
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {userName && (
          <span className="text-sm text-gray-600">{userName}님</span>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <LogOut className="w-4 h-4" />
          로그아웃
        </button>
      </div>
    </header>
  );
}
