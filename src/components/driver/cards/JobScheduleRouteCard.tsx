"use client";

import React from "react";
import { Icon } from "@iconify/react";

import ExpandableText from "@/components/driver/ExpandableText";
import * as FormatDatetime from "@/utils/format-datetime";

import type { Job } from "@/types/driver/job";
import type { DisplayRoute, RouteLabel } from "@/types/driver/route";

type Props = {
    job: Job;
    route: Pick<DisplayRoute, "startAddress" | "endAddress"> | null;
    getRouteLabels: (status: string) => RouteLabel;
    className?: string;
};

export default function JobScheduleRouteCard({ job, route, getRouteLabels, className }: Props) {
    return (
        <div className={"rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm space-y-4 " + (className ?? "")}>
            <div className="flex gap-4 items-center">
                <div className="bg-[#70C5BE] rounded-full p-4 shrink-0">
                    <Icon icon="solar:calendar-bold" className="text-white" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">กำหนดการ</p>
                    <div className="font-bold text-lg flex flex-col gap-2">
                        <p>{FormatDatetime.formatThaiDate(job.booking_date)} </p>
                        <div className="flex gap-2 items-center">
                            <Icon icon="iconamoon:clock-bold" width="24" height="24" className="text-button-primary" />
                            <p className="text-button-primary">{FormatDatetime.formatThaiTime(job.start_time)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {route && (() => {
                const { startLabel, endLabel } = getRouteLabels(job.status);

                return (
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center py-1">
                            <Icon icon="solar:map-point-wave-bold" className="text-[#70C5BE] w-5 h-5" />
                            <div className="w-0.5 grow border-l-2 border-dashed border-gray-200 my-1" />
                            <Icon icon="solar:map-point-bold" className="text-gray-300 w-5 h-5" />
                        </div>

                        <div className="flex flex-col gap-6 grow min-w-0">
                            <RoutePoint label={startLabel} address={route.startAddress} modalTitle={startLabel} />
                            <RoutePoint label={endLabel} address={route.endAddress} modalTitle={endLabel} />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function RoutePoint({
    label,
    address,
    modalTitle,
}: {
    label: string;
    address: string;
    modalTitle: string;
}) {
    return (
        <div className="min-w-0">
            <p className="text-sm text-gray-500">{label}</p>
            <ExpandableText
                text={address}
                clampLines={2}
                modalTitle={modalTitle}
                className="font-medium text-gray-800"
            />
        </div>
    );
}
