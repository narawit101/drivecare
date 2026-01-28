"use client";

import React from "react";
import { Icon } from "@iconify/react";
import type { JobAssignmentJob } from "@/types/admin/job-assignment";

type Props = {
    loading: boolean;
    jobs: JobAssignmentJob[];
    onOpenAssign: (job: JobAssignmentJob) => void;
    onOpenAddressModal: (type: "pickup" | "dropoff", address: string) => void;
};

export default function JobAssignmentMobileCards({
    loading,
    jobs,
    onOpenAssign,
    onOpenAddressModal,
}: Props) {
    if (loading) {
        return (
            <div className="text-center py-10 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
                กำลังโหลดรายการงาน...
            </div>
        );
    }

    if (jobs.length === 0) {
        return (
            <div className="text-center py-10 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-100">
                ไม่พบรายการงาน
            </div>
        );
    }

    return (
        <>
            {jobs.map((job) => (
                <div
                    key={job.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-3"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="font-bold text-slate-800">{job.customerName}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                <Icon icon="solar:phone-linear" className="text-slate-400" />
                                {job.customerPhone}
                            </p>
                        </div>
                    </div>

                    <div className="divider my-0 border-t border-slate-50"></div>

                    <div className="flex flex-col gap-2 text-sm bg-slate-50 p-3 rounded-lg">
                        <div className="group flex items-start gap-2">
                            <Icon
                                icon="solar:map-point-linear"
                                className="text-emerald-500 mt-0.5 shrink-0"
                            />
                            <div className="min-w-0">
                                <p className="text-[11px] text-slate-400">จุดรับ</p>
                                <button
                                    type="button"
                                    onClick={() => onOpenAddressModal("pickup", job.pickup)}
                                    className="block w-full text-left text-sm text-slate-700 font-medium line-clamp-2 transition-colors group-hover:text-[#70C5BE] group-hover:underline"
                                >
                                    {job.pickup}
                                </button>
                            </div>
                        </div>
                        <div className="group flex items-start gap-2">
                            <Icon icon="solar:flag-linear" className="text-rose-500 mt-0.5 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[11px] text-slate-400">จุดส่ง</p>
                                <button
                                    type="button"
                                    onClick={() => onOpenAddressModal("dropoff", job.destination)}
                                    className="block w-full text-left text-sm text-slate-700 font-medium line-clamp-2 transition-colors group-hover:text-[#70C5BE] group-hover:underline"
                                >
                                    {job.destination}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-sm">
                        <p className="text-slate-400 text-xs">วัน/เวลาจอง</p>
                        <div className="flex items-center gap-2 mt-1 font-medium text-slate-700">
                            <Icon icon="solar:calendar-date-linear" className="text-slate-400" />
                            <span className="text-sm">{job.date}</span>
                            <span className="text-slate-400 text-xs">{job.time}</span>
                        </div>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-50 flex items-center justify-between">
                        <button
                            onClick={() => onOpenAssign(job)}
                            className="w-full bg-[#70C5BE] text-white py-2 rounded-lg text-sm font-medium hover:bg-[#5bb1aa] transition shadow-sm"
                        >
                            มอบหมายงาน
                        </button>
                    </div>
                </div>
            ))}
        </>
    );
}
