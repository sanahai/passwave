// 학원 설정
import { getMyAcademy } from "@/lib/academy";
import EmptyAcademy from "@/components/academy/empty-academy";
import SettingsForm from "@/components/academy/settings-form";

export default async function AcademySettingsPage() {
  const { academy, role } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">학원 설정</h1>
      <p className="text-gray-500 mb-8">
        {role === "owner"
          ? "학원 정보와 요금제를 관리합니다."
          : "학원 정보 (원장만 수정 가능)"}
      </p>
      <SettingsForm
        academy={{
          name: academy.name,
          owner_name: academy.owner_name,
          phone: academy.phone,
          address: academy.address,
          notify_email: academy.notify_email,
          plan: academy.plan,
        }}
        canEdit={role === "owner"}
      />
    </div>
  );
}
