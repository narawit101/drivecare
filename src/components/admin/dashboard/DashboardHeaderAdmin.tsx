"use client";

import React from "react";
import { Icon } from "@iconify/react";

export type DashboardHeaderAdminFilterMode = "month" | "range";

type Props = {
    filterMode: DashboardHeaderAdminFilterMode;
    setFilterMode: (mode: DashboardHeaderAdminFilterMode) => void;

    month: string;
    setMonth: (value: string) => void;

    start: string;
    setStart: (value: string) => void;

    end: string;
    setEnd: (value: string) => void;

    onClearFilters: () => void;
    onRefresh: () => void;
    loading?: boolean;
};

export default function DashboardHeaderAdmin({
    filterMode,
    setFilterMode,
    month,
    setMonth,
    start,
    setStart,
    end,
    setEnd,
    onClearFilters,
    onRefresh,
    loading = false,
}: Props) {
    return (
        <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
                <h1 className="text-3xl font-semibold text-[#70C5BE]">แดรชบอร์ด</h1>
                <p className="text-sm text-slate-500 mt-1">สรุปภาพรวมระบบตามช่วงวันที่ที่เลือก</p>
            </div>

            <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-2 py-1 shadow-sm">
                    <button
                        type="button"
                        onClick={() => setFilterMode("month")}
                        className={
                            "px-3 py-1.5 rounded-lg text-sm font-semibold transition " +
                            (filterMode === "month" ? "bg-[#70C5BE] text-white" : "text-slate-600 hover:bg-slate-50")
                        }
                    >
                        เดือน
                    </button>
                    <button
                        type="button"
                        onClick={() => setFilterMode("range")}
                        className={
                            "px-3 py-1.5 rounded-lg text-sm font-semibold transition " +
                            (filterMode === "range" ? "bg-[#70C5BE] text-white" : "text-slate-600 hover:bg-slate-50")
                        }
                    >
                        เลือกช่วงวัน
                    </button>
                </div>

                {filterMode === "month" ? (
                    <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm">
                        <Icon icon="solar:calendar-date-linear" className="h-5 w-5 text-slate-400" />
                        <input
                            type="month"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                            className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm">
                        <Icon icon="solar:calendar-linear" className="h-5 w-5 text-slate-400" />
                        <input
                            type="date"
                            value={start}
                            onChange={(e) => setStart(e.target.value)}
                            className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none"
                        />
                        <span className="text-slate-400 text-sm">ถึง</span>
                        <input
                            type="date"
                            value={end}
                            onChange={(e) => setEnd(e.target.value)}
                            className="bg-transparent text-sm text-slate-700 font-medium focus:outline-none"
                        />
                    </div>
                )}

                <button
                    type="button"
                    onClick={onClearFilters}
                    className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    title="ล้างตัวกรอง"
                >
                    <Icon icon="ant-design:clear-outlined" className="h-5 w-5" />
                    ล้างตัวกรอง
                </button>

                <button
                    type="button"
                    onClick={onRefresh}
                    className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    title="รีเฟรช"
                >
                    <Icon icon="solar:refresh-linear" className={loading ? "animate-spin" : ""} />
                    รีเฟรช
                </button>
            </div>
        </header>
    );
}
