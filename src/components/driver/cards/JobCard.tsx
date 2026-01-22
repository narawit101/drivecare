"use client";

import React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

import ExpandableText from "@/components/driver/ExpandableText";

type Props = {
    headerLeft?: React.ReactNode;
    headerRight?: React.ReactNode;
    badge?: React.ReactNode;
    topRightAction?: React.ReactNode;

    scheduleDate: React.ReactNode;
    scheduleTime: React.ReactNode;

    pickupAddress: string;
    dropoffAddress: string;

    passengerName: string;
    passengerPhone?: string | null;
    passengerImageSrc?: string | null;

    actions?: React.ReactNode;
    className?: string;
    heightClassName?: string;
};

export default function JobCard({
    headerLeft,
    headerRight,
    badge,
    topRightAction,
    scheduleDate,
    scheduleTime,
    pickupAddress,
    dropoffAddress,
    passengerName,
    passengerPhone,
    passengerImageSrc,
    actions,
    className,
    heightClassName = "",
}: Props) {
    const hasTopOverlay = Boolean(badge || topRightAction);

    return (
        <div
            className={
                `relative flex flex-col ${heightClassName} ` +
                `shadow-[0_0_20px_rgba(120,198,160,0.3)] rounded-xl bg-white ` +
                `hover:scale-[1.02] transition ` +
                (className ? className : "")
            }
        >
            {badge ? <div className="absolute top-5 left-4 z-10">{badge}</div> : null}
            {topRightAction ? (
                <div className="absolute top-5 right-4 z-10">{topRightAction}</div>
            ) : null}

            <div className={(hasTopOverlay ? "pt-10" : "pt-6") + " px-6 pb-6 flex flex-col h-full gap-5 w-full"}>
                {(headerLeft || headerRight) && (
                    <div className="flex gap-0 items-center justify-between w-full">
                        <div>{headerLeft}</div>
                        <div>{headerRight}</div>
                    </div>
                )}

                {/* Schedule */}
                <div className="flex gap-4 items-center">
                    <div className="bg-[#70C5BE] rounded-full p-4 shrink-0">
                        <Icon icon="solar:calendar-bold" width="24" height="24" className="text-white" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">กำหนดการ</p>
                        <div className="font-bold text-lg flex-col">
                            <div>{scheduleDate}</div>
                            <div className="flex gap-2 items-center">
                                <Icon icon="iconamoon:clock-bold" width="24" height="24" className="text-button-primary" />
                                <div className="text-button-primary">{scheduleTime}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Route */}
                <div className="flex gap-4">
                    <div className="flex flex-col items-center py-1">
                        <Icon icon="solar:map-point-wave-bold" className="text-[#70C5BE] w-5 h-5" />
                        <div className="w-0.5 grow border-l-2 border-dashed border-gray-200 my-1" />
                        <Icon icon="solar:map-point-bold" className="text-gray-300 w-5 h-5" />
                    </div>

                    <div className="flex flex-col gap-6 grow min-w-0">
                        <div className="flex gap-3 items-start min-w-0">
                            <div className="flex flex-col gap-2 min-w-0">
                                <p className="text-sm text-gray-500">จุดรับ</p>
                                <ExpandableText
                                    text={pickupAddress}
                                    clampLines={2}
                                    modalTitle="ที่อยู่จุดรับ"
                                    className="font-medium text-gray-800"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 items-start min-w-0">
                            <div className="flex flex-col gap-2 min-w-0">
                                <p className="text-sm text-gray-500">จุดหมาย</p>
                                <ExpandableText
                                    text={dropoffAddress}
                                    clampLines={2}
                                    modalTitle="ที่อยู่จุดหมาย"
                                    className="font-medium text-gray-800"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="opacity-10" />

                {/* Passenger */}
                <div className="flex gap-4 items-center">
                    <Image
                        src={passengerImageSrc || "/images/noprofile-avatar.jpg"}
                        alt="user"
                        width={48}
                        height={48}
                        className="rounded-full object-cover"
                    />
                    <div className="flex-col gap-2 flex min-w-0">
                        <p className="truncate">{passengerName}</p>
                        {passengerPhone ? (
                            <div className="flex items-center gap-2 text-sm text-button-primary font-bold">
                                <Icon icon="solar:phone-linear" className="w-5 h-5" />
                                <span className="truncate">{passengerPhone}</span>
                            </div>
                        ) : null}
                    </div>
                </div>

                {actions ? <div className="mt-auto flex flex-col gap-3">{actions}</div> : null}
            </div>
        </div>
    );
}
