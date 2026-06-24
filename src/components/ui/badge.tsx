import { cn } from "@/lib/utils";

type Tone = "blue" | "green" | "red" | "gray" | "purple" | "yellow";

const tones: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-700",
  green: "bg-green-50 text-green-700",
  red: "bg-red-50 text-red-700",
  gray: "bg-gray-100 text-gray-600",
  purple: "bg-purple-50 text-purple-700",
  yellow: "bg-yellow-50 text-yellow-700",
};

export function Badge({
  tone = "gray",
  children,
  className,
}: {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
