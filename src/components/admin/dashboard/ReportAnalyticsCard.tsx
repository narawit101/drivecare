"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

type Props = {
    answered: number;
    unanswered: number;
    href?: string;
    linkLabel?: string;
    loading?: boolean;
    loadingText?: string;
};

export default function ReportAnalyticsCard({
    answered,
    unanswered,
    href,
    linkLabel,
    loading = false,
    loadingText = "กำลังดึงข้อมูล...",
}: Props) {
    const total = answered + unanswered;
    const answeredPct = total > 0 ? (answered / total) * 100 : 0;
    const unansweredPct = total > 0 ? (unanswered / total) * 100 : 0;

    return (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-button-primary">สถิติรายงานปัญหา</p>
                    <p className="text-xs text-slate-500">จำนวนรายงานที่ตอบกลับแล้ว/ยังไม่ได้ตอบกลับ</p>
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#70C5BE]/10">
                    <Icon icon="solar:shield-warning-outline" className="h-5 w-5 text-button-primary" />
                </div>
            </div>

            {loading ? (
                <div className="mt-6 animate-pulse flex flex-col items-center justify-center py-10">
                    <div className="w-5 h-5 rounded-full border-4 border-t-[#70C5BE] border-gray-100 animate-spin" />
                    <p className="mt-4 text-gray-400 font-medium text-sm">{loadingText}</p>
                </div>
            ) : (
                <>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                            <p className="text-xs text-slate-500">รวมทั้งหมด</p>
                            <p className="mt-1 text-2xl font-semibold text-button-primary">{total.toLocaleString()}</p>
                        </div>
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                            <p className="text-xs text-slate-500">ตอบกลับแล้ว</p>
                            <p className="mt-1 text-2xl font-semibold text-button-primary">
                                {total > 0 ? `${answeredPct.toFixed(0)}%` : "-"}
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        <div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">ตอบกลับแล้ว</span>
                                <span className="font-semibold text-button-primary">{answered.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full"
                                    style={{
                                        width: `${answeredPct}%`,
                                        backgroundColor: "#70C5BE",
                                        transition: "width 700ms ease",
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-700">ยังไม่ได้ตอบกลับ</span>
                                <span className="font-semibold text-button-primary">{unanswered.toLocaleString()}</span>
                            </div>
                            <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                                <div
                                    className="h-full"
                                    style={{
                                        width: `${unansweredPct}%`,
                                        backgroundColor: "#94a3b8",
                                        transition: "width 700ms ease",
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="text-xs text-slate-500">{total === 0 ? "ยังไม่มีรายงานในช่วงวันที่เลือก" : ""}</div>
                        {href ? (
                            <Link
                                href={href}
                                className="inline-flex items-center  bg-slate-50 px-3 py-1 text-xs font-semibold text-button-primary hover:underline"
                                aria-label={linkLabel ?? "ไปหน้าจัดการรายงาน"}
                            >
                                {linkLabel ?? "จัดการรายงาน"}
                            </Link>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
}
