// 최근 7일 학습 이력 막대 차트 (외부 라이브러리 없이 구현)

export interface DailyStudy {
  date: string; // 'MM/DD'
  count: number;
}

export default function StudyHistoryChart({ data }: { data: DailyStudy[] }) {
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="font-semibold mb-4">최근 학습 이력</h3>
      <div className="flex items-end justify-between gap-2 h-40">
        {data.map((d) => (
          <div key={d.date} className="flex flex-col items-center flex-1 gap-2">
            <div className="text-xs text-gray-400">{d.count}</div>
            <div className="w-full flex items-end h-28">
              <div
                className="w-full bg-blue-500 rounded-t-md transition-all"
                style={{ height: `${(d.count / max) * 100}%` }}
              />
            </div>
            <div className="text-xs text-gray-400">{d.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
