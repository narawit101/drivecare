"use client";

import * as FormatDatetime from "@/utils/format-datetime";
import { TimelineItemType } from "@/types/driver/timeline";

function TimelineItem({
    time,
    label,
}: {
    time: string;
    label: string;
}) {
    return (
        <div className="flex gap-3 items-start">
            <div className="w-2 h-2 rounded-full bg-[#70C5BE] mt-2" />
            <div className="flex flex-col gap-2">
                <div className="flex gap-2 text-sm text-slate-500">
                    <span>{FormatDatetime.formatThaiShortDate(time)} เวลา</span>
                    <span>{FormatDatetime.formatThaiTime(time)}</span>
                </div>
                <p className="text-sm text-slate-800">{label}</p>
            </div>
        </div>
    );
}

export default function Timeline({
    items,
    emptyText = "ไม่มีข้อมูลไทม์ไลน์",
}: {
    items: TimelineItemType[];
    emptyText?: string;
}) {
    if (items.length === 0) {
        return (
            <p className="text-center text-sm text-gray-400">
                {emptyText}
            </p>
        );
    }

    return (
        <div className="space-y-4">
            {items.map((item, index) => (
                <TimelineItem
                    key={index}
                    time={item.time}
                    label={item.label}
                />
            ))}
        </div>
    );
}
