"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ACADEMY_PLANS, type AcademyPlan } from "@/lib/plans";
import { formatKRW } from "@/lib/utils";

interface Props {
  academy: {
    name: string;
    owner_name: string | null;
    phone: string | null;
    address: string | null;
    notify_email: boolean;
    plan: string;
  };
  canEdit: boolean;
}

export default function SettingsForm({ academy, canEdit }: Props) {
  const router = useRouter();
  const [name, setName] = useState(academy.name);
  const [ownerName, setOwnerName] = useState(academy.owner_name ?? "");
  const [phone, setPhone] = useState(academy.phone ?? "");
  const [address, setAddress] = useState(academy.address ?? "");
  const [notifyEmail, setNotifyEmail] = useState(academy.notify_email);
  const [plan, setPlan] = useState<AcademyPlan>(academy.plan as AcademyPlan);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");
    const res = await fetch("/api/academy/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ownerName, phone, address, notifyEmail, plan }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMsg(data.error || "저장 실패");
      setSaving(false);
      return;
    }
    setMsg("저장되었습니다.");
    setSaving(false);
    router.refresh();
  };

  const inputCls = "w-full px-4 py-2.5 border rounded-lg text-sm disabled:bg-gray-50";

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold">기본 정보</h2>
        <div>
          <label className="block text-sm text-gray-500 mb-1">학원명</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={!canEdit}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-500 mb-1">대표자</label>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              disabled={!canEdit}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">전화번호</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!canEdit}
              className={inputCls}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-500 mb-1">주소</label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            disabled={!canEdit}
            className={inputCls}
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.checked)}
            disabled={!canEdit}
            className="accent-indigo-600 w-4 h-4"
          />
          이메일 알림 받기
        </label>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold mb-4">요금제</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {(Object.values(ACADEMY_PLANS)).map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => canEdit && setPlan(p.id)}
              disabled={!canEdit}
              className={`text-left rounded-xl border p-4 transition ${
                plan === p.id
                  ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                  : "border-gray-200 hover:border-indigo-300"
              } disabled:opacity-60`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{p.name}</span>
                {plan === p.id && (
                  <span className="text-xs text-indigo-600">선택됨</span>
                )}
              </div>
              <div className="text-lg font-bold mt-1">
                {formatKRW(p.priceMonthly)}
                <span className="text-xs text-gray-400 font-normal"> /월</span>
              </div>
              <ul className="mt-2 space-y-0.5 text-xs text-gray-500">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f}>· {f}</li>
                ))}
              </ul>
            </button>
          ))}
        </div>
      </div>

      {canEdit && (
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "저장 중..." : "변경사항 저장"}
          </button>
          {msg && <span className="text-sm text-gray-500">{msg}</span>}
        </div>
      )}
    </form>
  );
}
