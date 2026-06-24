// AI 오개념 분석 — 학원 전체 학생이 가장 많이 헷갈리는 개념 TOP 10
import { getMyAcademy } from "@/lib/academy";
import {
  getAcademyStudentIds,
  getAcademyMisconceptions,
} from "@/lib/academy-stats";
import EmptyAcademy from "@/components/academy/empty-academy";

export default async function AiDiagnosisPage() {
  const { academy, role } = await getMyAcademy();
  if (!academy) return <EmptyAcademy />;
  if (role !== "owner" && role !== "teacher") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
        볼 권한이 없습니다.
      </div>
    );
  }

  const studentIds = await getAcademyStudentIds(academy.id);
  const stats = await getAcademyMisconceptions(studentIds);
  const maxFreq = Math.max(...stats.map((s) => s.frequency), 1);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-1">AI 오개념 분석</h1>
      <p className="text-gray-500 mb-8">
        우리 학원 학생들이 가장 많이 헷갈리는 개념입니다. 수업 커리큘럼 조정에
        활용하세요.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="text-left font-medium px-4 py-3 w-12">순위</th>
              <th className="text-left font-medium px-4 py-3">오개념</th>
              <th className="text-left font-medium px-4 py-3 w-28">학생 수</th>
              <th className="text-left font-medium px-4 py-3 w-1/3">빈도</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.map((s, i) => (
              <tr key={s.name} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-semibold text-gray-400">{i + 1}</td>
                <td className="px-4 py-3 font-medium">{s.name}</td>
                <td className="px-4 py-3 text-gray-600">{s.students}명</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-red-400 h-3 rounded-full"
                        style={{ width: `${(s.frequency / maxFreq) * 100}%` }}
                      />
                    </div>
                    <span className="text-gray-500 w-10 text-right">
                      {s.frequency}회
                    </span>
                  </div>
                </td>
              </tr>
            ))}
            {stats.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-gray-400">
                  아직 수집된 오개념 데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {stats.length > 0 && (
        <p className="text-sm text-gray-500 mt-4">
          → 다음 주 수업에서 상위 오개념을 집중 복습하면 효과적입니다.
        </p>
      )}
    </div>
  );
}
