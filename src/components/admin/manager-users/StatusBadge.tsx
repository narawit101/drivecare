"use client";

export type StatusBadgeProps = {
    text: string;
    tone: "emerald" | "slate" | "rose" | "green" | "amber" | "gray";
};

export default function StatusBadge({ text, tone }: StatusBadgeProps) {
    const palette = {
        emerald: "bg-emerald-100 text-emerald-600",
        slate: "bg-slate-200 text-slate-700",
        rose: "bg-rose-100 text-rose-600",
        green: "bg-green-100 text-green-600",
        amber: "bg-amber-100 text-yellow-800",
        gray: "bg-gray-100 text-gray-400",
    } as const;

    return (
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${palette[tone]}`}>
            {text}
        </span>
    );
}
