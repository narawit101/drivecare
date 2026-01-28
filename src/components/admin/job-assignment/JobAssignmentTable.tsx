"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Button from "@/components/Button";
import type { JobAssignmentJob } from "@/types/admin/job-assignment";

type Props = {
    loading: boolean;
    jobs: JobAssignmentJob[];
    onOpenAssign: (job: JobAssignmentJob) => void;
    onOpenAddressModal: (type: "pickup" | "dropoff", address: string) => void;
};

export default function JobAssignmentTable({
    loading,
    jobs,
    onOpenAssign,
    onOpenAddressModal,
}: Props) {
    return (
        <div className="bg-white rounded-xl shadow overflow-x-auto w-full">
            <table
                className="min-w-full lg:w-full divide-y divide-slate-200 text-sm"
                style={{ minWidth: "1150px" }}
            >
                <thead className="bg-[#78C6A0] text-white">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">วัน/เวลาจอง</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ผู้ป่วย</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">จุดรับ</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase">จุดส่ง</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase">จัดการ</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                <div className="animate-pulse flex flex-col items-center">
                                    <div className="w-5 h-5 rounded-full border-4 border-t-[#70C5BE] border-gray-100 animate-spin"></div>
                                    <p className="mt-4 text-gray-400 font-medium">กำลังดึงข้อมูล...</p>
                                </div>
                            </td>
                        </tr>
                    ) : jobs.length === 0 ? (
                        <tr>
                            <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                                ไม่พบรายการงาน
                            </td>
                        </tr>
                    ) : (
                        jobs.map((job) => (
                            <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-slate-700 flex items-center gap-2">
                                            <Icon icon="solar:calendar-linear" className="text-slate-400" />
                                            {job.date}
                                        </span>
                                        <span className="text-xs text-slate-500 flex items-center gap-2">
                                            <Icon icon="solar:clock-circle-linear" className="text-slate-400" />
                                            {job.time}
                                            <span className="font-bold text-[12px]">#{job.id}</span>
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-slate-700">{job.customerName}</span>
                                        <span className="text-xs text-slate-500 flex items-center gap-1">
                                            <Icon icon="solar:phone-linear" className="text-slate-400" />
                                            {job.customerPhone}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 max-w-[200px]">
                                    <div className="group flex items-start gap-2">
                                        <Icon icon="solar:map-point-linear" className="text-emerald-500 mt-0.5 shrink-0" />
                                        <button
                                            type="button"
                                            onClick={() => onOpenAddressModal("pickup", job.pickup)}
                                            className="block w-full text-left text-sm text-slate-700 line-clamp-2 transition-colors group-hover:text-[#70C5BE] group-hover:underline"
                                        >
                                            {job.pickup}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-3 max-w-[200px]">
                                    <div className="group flex items-start gap-2">
                                        <Icon icon="solar:flag-linear" className="text-rose-500 mt-0.5 shrink-0" />
                                        <button
                                            type="button"
                                            onClick={() => onOpenAddressModal("dropoff", job.destination)}
                                            className="block w-full text-left text-sm text-slate-700 line-clamp-2 transition-colors group-hover:text-[#70C5BE] group-hover:underline"
                                        >
                                            {job.destination}
                                        </button>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-center flex items-center justify-center">
                                    <Button
                                        onClick={() => onOpenAssign(job)}
                                        className="bg-[#70C5BE] text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#5bb1aa] transition shadow-sm cursor-pointer"
                                    >
                                        <div className="flex gap-2 items-center justify-center">
                                            <Icon icon="solar:clipboard-list-bold" width="22" height="22" />
                                            <p className="text-sm">มอบหมายงาน</p>
                                        </div>
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
