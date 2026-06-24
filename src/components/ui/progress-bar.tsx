import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  className,
  barClassName,
}: {
  value: number; // 0~100
  className?: string;
  barClassName?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("w-full bg-gray-200 rounded-full h-2", className)}>
      <div
        className={cn("bg-blue-600 h-2 rounded-full transition-all", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
