"use client";

import { StatusItem } from "@/types/driver/types";
import { Icon } from "@iconify/react";

export function StatusActions({
    statuses,
    currentIndex,
    disabled,
    onSelectNext,
}: {
    statuses: StatusItem[];
    currentIndex: number;
    disabled: boolean;
    onSelectNext: (index: number) => void;
}) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
            {statuses.map((s, index) => {
                const isActive = index === currentIndex;
                const isNext = index === currentIndex + 1;
                const isCompleted = index < currentIndex;
                const isLocked = !isActive && !isNext && !isCompleted;

                const icon = isCompleted
                    ? "mdi:check-circle"
                    : isNext
                        ? "mdi:arrow-right-circle"
                        : isActive
                            ? "mdi:progress-clock"
                            : "mdi:lock";

                const isDisabled = disabled || !isNext;

                return (
                    <button
                        key={s.key}
                        disabled={isDisabled}
                        onClick={() => onSelectNext(index)}
                        className={
                            "group relative flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm text-left transition-all " +
                            (isNext && !disabled
                                ? "border-button-primary/40 bg-button-primary text-white shadow-md hover:shadow-lg hover:brightness-[1.02]"
                                : "border-gray-200 bg-white") +
                            (isActive ? " ring-2 ring-button-primary/20" : "") +
                            (isCompleted ? " bg-gray-50 text-gray-500" : "") +
                            (isLocked ? " opacity-60" : "") +
                            (isDisabled ? " cursor-not-allowed" : " cursor-pointer")
                        }
                    >
                        <span
                            className={
                                "grid place-items-center w-9 h-9 rounded-xl border shrink-0 transition-all " +
                                (isNext && !disabled
                                    ? "border-white/30 bg-white/15"
                                    : isCompleted
                                        ? "border-button-primary/20 bg-button-primary/10 text-button-primary"
                                        : isActive
                                            ? "border-button-primary/20 bg-button-primary/10 text-button-primary"
                                            : "border-gray-200 bg-gray-50 text-gray-500")
                            }
                        >
                            <Icon icon={icon} className="text-lg" />
                        </span>

                        <span className="flex-1 min-w-0">
                            <span className={"block font-semibold truncate " + (isNext && !disabled ? "text-white" : "text-gray-800")}>
                                {s.label}
                            </span>
                            <span
                                className={
                                    "block text-[11px] mt-0.5 " +
                                    (isNext && !disabled
                                        ? "text-white/90"
                                        : isActive
                                            ? "text-button-primary"
                                            : isCompleted
                                                ? "text-gray-400"
                                                : "text-gray-400")
                                }
                            >
                                {isNext ? "ขั้นถัดไป" : isActive ? "กำลังดำเนินการ" : isCompleted ? "เสร็จแล้ว" : "ล็อก"}
                            </span>
                        </span>

                        {/* {isNext && !disabled ? (
                            // <span className="text-[11px] font-bold px-2 py-1 rounded-full bg-white/15 border border-white/25">
                            //     เปลี่ยน
                            // </span>
                        ) : null} */}
                    </button>
                );
            })}
        </div>
    );
}
