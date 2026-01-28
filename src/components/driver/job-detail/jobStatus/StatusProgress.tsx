"use client";

import { Icon } from "@iconify/react";
import { StatusItem } from "@/types/driver/types";

export function StatusProgress({
    statuses,
    currentIndex,
}: {
    statuses: StatusItem[];
    currentIndex: number;
}) {
    const safeIndex = Math.max(currentIndex, -1);
    const denom = Math.max(statuses.length - 1, 1);
    const widthPct = safeIndex < 0 ? 0 : (safeIndex / denom) * 100;

    return (
        <div className="relative overflow-x-auto py-2">
            {/*
              Center the steps when they fit, but keep scroll when they overflow.
              - min-w-full: ensures the inner area is at least as wide as the viewport
              - w-max + mx-auto: centers the steps group when it's smaller than the viewport
            */}
            <div className="relative min-w-full px-2">
                <div className="relative w-max mx-auto">
                    {/*
                      Line aligned to circle centers.
                      Each step has min-w-20 (80px) and the circle is centered, so its center is 40px => left-10.
                      Circle is w-8 (32px) with pt-1 (4px) => center Y ~ 20px => top-5.
                    */}
                    <div className="absolute top-5 left-11 right-10 h-1 bg-gray-100 z-0 rounded-full">
                        <div
                            className="h-full bg-button-primary transition-all duration-500 rounded-full"
                            style={{ width: `${widthPct}%` }}
                        />
                    </div>

                    <div className="flex items-start gap-6">
                        {statuses.map((s, i) => (
                            <div key={s.key} className="flex flex-col items-center pt-1 z-10 min-w-22">
                                <div
                                    className={
                                        "w-8 h-8 rounded-full flex items-center justify-center transition-all leading-none " +
                                        (i < currentIndex
                                            ? "bg-button-primary text-white shadow-lg"
                                            : i === currentIndex
                                                ? "bg-button-primary text-white shadow-lg ring-4 ring-button-primary/20"
                                                : "bg-gray-100 text-gray-400")
                                    }
                                >
                                    {s.icon && (
                                        <Icon icon={s.icon} width={18} height={18} className="block" />
                                    )}
                                </div>

                                <span
                                    className={`text-[11px] mt-2 font-bold text-center leading-tight ${i <= currentIndex ? "text-button-primary" : "text-gray-300"
                                        }`}
                                >
                                    {s.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

