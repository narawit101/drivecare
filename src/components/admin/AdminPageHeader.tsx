"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Button from "@/components/Button";
import ReportTypeDropdown from "./report/ReportTypeDropdown";

type StatItem = {
    label: string;
    value: number;
    color: "amber" | "emerald";
    icon: string;
};

type TabItem<T extends string> = {
    label: string;
    value: T;
    icon?: string;
};

type Props<T extends string> = {
    title: string;
    subtitle: string;

    stats: StatItem[];

    tabs: TabItem<T>[];
    activeTab: T;
    onTabChange: (v: T) => void;

    tabsVariant?: "buttons" | "dropdown";

    showTabs?: boolean;

    selectedDate: string;
    onDateChange: (v: string) => void;

    search: string;
    onSearchChange: (v: string) => void;

    extraFilters?: React.ReactNode;
    
    reportTypeFilter?: string;
    onReportTypeFilterChange?: (v: string) => void;

    onClear: () => void;

    onRefresh?: () => void;
    refreshLabel?: string;
    refreshIsLoading?: boolean;
};

export default function AdminPageHeader<T extends string>({
    title,
    subtitle,
    stats,
    tabs,
    activeTab,
    onTabChange,
    showTabs = true,
    tabsVariant = "buttons",
    selectedDate,
    onDateChange,
    search,
    onSearchChange,
    extraFilters,
    reportTypeFilter,
    onReportTypeFilterChange,
    onClear,
    onRefresh,
    refreshLabel = "รีเฟรช",
    refreshIsLoading = false,
}: Props<T>) {
    const [mounted, setMounted] = useState(false);
    const [openTabsDropdown, setOpenTabsDropdown] = useState(false);
    const tabsDropdownRef = useRef<HTMLDivElement | null>(null);

    const activeTabMeta = useMemo(() => {
        return tabs.find((t) => t.value === activeTab) ?? tabs[0];
    }, [activeTab, tabs]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!openTabsDropdown) return;

        const onPointerDown = (e: MouseEvent) => {
            const el = tabsDropdownRef.current;
            if (!el) return;
            if (el.contains(e.target as Node)) return;
            setOpenTabsDropdown(false);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenTabsDropdown(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [openTabsDropdown]);

    if (!mounted) return null;
    return (
        <>
            {/* Header */}
            <header>
                <div className="flex flex-col gap-4 mb-4">
                    <p className="mt-4 text-3xl font-semibold text-[#70C5BE]">{title}</p>
                    <p className="text-sm text-slate-500">{subtitle}</p>
                </div>
            </header>

            {/* Stats */}
            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-[repeat(auto-fit,minmax(260px,1fr))]">
                {stats.map((s) => (
                    <div
                        key={s.label}
                        className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-6 py-4"
                    >
                        <div>
                            <p className="text-base text-slate-500">{s.label}</p>
                            <p className="text-2xl font-bold text-button-primary">
                                {s.value}
                            </p>
                        </div>
                        <div
                            className={`rounded-lg p-2 ${s.color === "amber" ? "bg-amber-100" : "bg-emerald-100"
                                }`}
                        >
                            <Icon icon={s.icon} className={`text-xl ${s.color === "amber" ? "text-amber-500" : "text-emerald-500"
                                }`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 mb-4 flex flex-col gap-4">
                {/* Tabs */}
                {showTabs && (
                    <div className="flex flex-wrap items-center gap-2 ">
                        <div className="font-bold flex gap-2 text-button-primary items-center">
                            สถานะ:
                            <Icon icon="grommet-icons:status-good" width={24} height={24} />
                        </div>

                        {tabsVariant === "dropdown" ? (
                            <div ref={tabsDropdownRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setOpenTabsDropdown((v) => !v)}
                                    className="rounded-lg border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition focus:outline-none focus:ring-1 focus:ring-[#70C5BE]"
                                    aria-expanded={openTabsDropdown}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        {activeTabMeta?.icon && <Icon icon={activeTabMeta.icon} width={18} height={18} />}
                                        {activeTabMeta?.label ?? "เลือกสถานะ"}
                                    </span>
                                </button>
                                <Icon
                                    icon="solar:alt-arrow-down-linear"
                                    className={
                                        "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform " +
                                        (openTabsDropdown ? "rotate-180" : "")
                                    }
                                />

                                {openTabsDropdown && (
                                    <div className="absolute left-0 z-50 mt-2 min-w-[280px] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                                        <div className="max-h-80 overflow-y-auto">
                                            {tabs.map((tab) => (
                                                <button
                                                    key={tab.value}
                                                    type="button"
                                                    className={
                                                        "w-full px-4 py-3 text-left transition flex items-center gap-2 hover:bg-slate-50 " +
                                                        (tab.value === activeTab ? " bg-[#70C5BE]/5" : "")
                                                    }
                                                    onClick={() => {
                                                        setOpenTabsDropdown(false);
                                                        onTabChange(tab.value);
                                                    }}
                                                >
                                                    {tab.icon && <Icon icon={tab.icon} className="h-5 w-5 text-slate-400" />}
                                                    <span className="text-sm font-semibold text-slate-700">{tab.label}</span>
                                                    {tab.value === activeTab ? (
                                                        <Icon icon="solar:check-circle-linear" className="ml-auto h-5 w-5 text-emerald-500" />
                                                    ) : null}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            tabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => onTabChange(tab.value)}
                                    className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition
                    ${activeTab === tab.value
                                            ? "bg-[#70C5BE] text-white"
                                            : "border border-gray-200 text-slate-600 hover:bg-slate-100"
                                        }`}
                                >
                                    <span className="inline-flex items-center gap-2">
                                        {tab.icon && <Icon icon={tab.icon} width={18} height={18} />}
                                        {tab.label}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}
                {extraFilters ? (
                    <div className="flex items-center gap-2">
                        {extraFilters}
                    </div>
                ) : null}
                
                {/* Report Type Filter - Position after tabs */}
                {onReportTypeFilterChange && (
                    <div className="flex items-center gap-2">
                        <div className="font-bold flex gap-2 text-button-primary items-center">
                            ประเภทรายงาน:
                            <Icon icon="solar:document-text-linear" width={24} height={24} />
                        </div>
                        <ReportTypeDropdown
                            value={reportTypeFilter || ""}
                            onChange={onReportTypeFilterChange}
                            className="min-w-[200px]"
                        />
                    </div>
                )}
                
                {/* Date + Search */}
                <div className="flex flex-col md:flex-row gap-3 items-start md:items-center w-full">
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="font-bold flex gap-2 text-button-primary items-center">
                            ตัวกรอง:
                            <Icon icon="prime:filter" width={24} height={24} />
                        </div>

                        {/* Date */}
                        <div className="relative">
                            <Icon
                                icon="solar:calendar-linear"
                                className="absolute left-3 top-3.5 text-slate-400"
                            />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => onDateChange(e.target.value)}
                                className="rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#70C5BE]"
                            />
                        </div>

                        {/* Search */}
                        <div className="relative flex-1">
                            <Icon
                                icon="solar:magnifer-linear"
                                className="absolute left-3 top-3.5 text-slate-400"
                            />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => onSearchChange(e.target.value)}
                                placeholder="ค้นหา..."
                                className="xl:min-w-85 w-full rounded-lg border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm
                            focus:outline-none focus:ring-1 focus:ring-[#70C5BE]"
                            />
                        </div>

                        <Button onClick={onClear}>
                            <div className="flex items-center gap-2 text-sm font-bold text-white">
                                ล้างตัวกรอง
                                <Icon icon="ant-design:clear-outlined" width={20} height={20} />
                            </div>
                        </Button>

                        {onRefresh && (
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={onRefresh}
                                buttonIsLoading={refreshIsLoading}
                                title={refreshLabel}
                            >
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <Icon
                                        icon="solar:refresh-linear"
                                        className={refreshIsLoading ? "animate-spin" : ""}
                                        width={20}
                                        height={20}
                                    />
                                    {refreshLabel}
                                </div>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
