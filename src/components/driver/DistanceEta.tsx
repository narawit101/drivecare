"use client";

import { Icon } from "@iconify/react";
import React from "react";
import { getDistanceMeters } from "@/utils/distance";
import type { MapPoint } from "@/types/driver/route";

function formatDurationThai(totalMinutes: number): string {
    const safeMinutes = Math.max(1, Math.round(totalMinutes));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;

    if (hours <= 0) return `${safeMinutes} นาที`;
    if (minutes === 0) return `${hours} ชม`;
    return `${hours} ชม ${minutes} นาที`;
}

function formatDistanceThai(distanceMeters: number): string {
    if (distanceMeters < 1000) {
        return `${Math.round(distanceMeters)} ม.`;
    }

    const km = distanceMeters / 1000;
    return `${km.toFixed(1)} กม.`;
}

export default function DistanceEta({
    from,
    to,
    speedKmh = 40,
    roadFactor = 1.25,
    distanceMeters,
    durationMinutes,
    className,
    unknownText = "ยังไม่ทราบตำแหน่ง",
}: {
    from?: MapPoint | null;
    to?: MapPoint | null;
    speedKmh?: number;
    roadFactor?: number;
    distanceMeters?: number;
    durationMinutes?: number;
    className?: string;
    unknownText?: string;
}) {
    const hasRealMetrics = distanceMeters != null && durationMinutes != null;

    if (!hasRealMetrics && (!from || !to)) {
        return <div className={className ?? "text-xs text-gray-400"}>{unknownText}</div>;
    }

    const computedDistanceMeters = hasRealMetrics
        ? distanceMeters
        : getDistanceMeters(from!.lat, from!.lon, to!.lat, to!.lon) * Math.max(1, roadFactor);

    const computedEtaMinutes = hasRealMetrics
        ? durationMinutes
        : (computedDistanceMeters / 1000 / Math.max(1, speedKmh)) * 60;

    return (
        <div className={className ?? "text-xs w-full text-center text-white bg-[#70C5BE] rounded-lg px-4 py-1.5"}>
            <div className="flex items-center gap-2 justify-center">
                <Icon icon="game-icons:path-distance" width="16" height="16" />
                <div>
                    ระยะทาง{hasRealMetrics ? "" : "ประมาณ"} {formatDistanceThai(computedDistanceMeters)}
                    <br />เวลาประมาณ {hasRealMetrics ? "" : ""}
                    {formatDurationThai(computedEtaMinutes)}
                </div>
            </div>
        </div>
    );
}
