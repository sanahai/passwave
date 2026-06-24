import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function WrongNoteSummary({
  total,
  unreviewed,
}: {
  total: number;
  unreviewed: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <h3 className="font-semibold">오답노트</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-3xl font-bold">{total}</div>
          <div className="text-sm text-gray-500">전체 오답</div>
        </div>
        <div>
          <div className="text-3xl font-bold text-red-500">{unreviewed}</div>
          <div className="text-sm text-gray-500">미복습</div>
        </div>
      </div>
      <Link
        href="/learn"
        className="mt-4 inline-block text-sm text-blue-600 hover:underline"
      >
        복습하러 가기 →
      </Link>
    </div>
  );
}
