"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

import Button from "@/components/Button";
import Pagination from "@/components/driver/Pagination";
import EmptyState from "@/components/driver/driver-job/EmptyState";
import JobCard from "@/components/driver/cards/JobCard";

import * as FormatDatetime from "@/utils/format-datetime";

import type { Job } from "@/types/driver/job";

interface Props {
    allJobs: Job[];
    jobs: Job[];
    paginatedJobs: Job[];
    currentPage: number;
    totalPages: number;
    setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
    onStartJob: (bookingId: Job["booking_id"]) => void;
    onViewDetail: (bookingId: Job["booking_id"]) => void;
    statusFilter: string;
    setStatusFilter: React.Dispatch<React.SetStateAction<"accepted" | string>>;
    selectedDate: string;
    setSelectedDate: React.Dispatch<React.SetStateAction<string>>;
    isOparation: boolean;
    onCancelJob: (booking_id: Job["booking_id"]) => void;
    onRefresh?: () => void | Promise<void>;
    refreshing?: boolean;
}

type StatusOption = {
    value: string;
    label: string;
    icon: string;
};

const STATUS_OPTIONS: StatusOption[] = [
    { value: "all", label: "ทุกสถานะ", icon: "solar:layers-linear" },
    { value: "accepted", label: "รับงานแล้ว", icon: "solar:checklist-linear" },
    { value: "in_progress", label: "กำลังดำเนินงาน", icon: "fluent-mdl2:processing" },
    { value: "going_pickup", label: "กำลังไปรับผู้ป่วย", icon: "mdi:car" },
    { value: "picked_up", label: "รับผู้ป่วยแล้ว", icon: "mdi:account-check" },
    { value: "heading_to_hospital", label: "กำลังไปโรงพยาบาล", icon: "solar:hospital-linear" },
    { value: "arrived_at_hospital", label: "ถึงโรงพยาบาลแล้ว", icon: "solar:map-point-linear" },
    { value: "waiting_for_return", label: "รอรับกลับ", icon: "solar:clock-circle-linear" },
    { value: "heading_home", label: "กำลังเดินทางกลับ", icon: "solar:home-2-linear" },
    { value: "arrived_home", label: "ถึงบ้านแล้ว", icon: "solar:home-smile-linear" },
    { value: "pending_payment", label: "รอชำระเงิน", icon: "solar:card-linear" },
    { value: "paymented", label: "ชำระเงินแล้ว", icon: "solar:wallet-linear" },
    { value: "success", label: "ปิดงานเรียบร้อย", icon: "solar:shield-check-linear" },
    { value: "cancelled", label: "ยกเลิกแล้ว", icon: "solar:close-circle-linear" },
];

export default function UpcomingLayout({
    allJobs,
    jobs,
    paginatedJobs,
    totalPages,
    currentPage,
    setCurrentPage,
    onStartJob,
    onViewDetail,
    statusFilter,
    setStatusFilter,
    selectedDate,
    setSelectedDate,
    isOparation,
    onCancelJob,
    onRefresh,
    refreshing = false,
}: Props) {
    const [selectedJobId, setSelectedJobId] = useState<Job["booking_id"] | null>(null);
    const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
    const statusDropdownRef = useRef<HTMLDivElement | null>(null);

    const statusCounts = useMemo(() => {
        const counts: Record<string, number> = { all: allJobs.length };
        for (const job of allJobs) {
            counts[job.status] = (counts[job.status] ?? 0) + 1;
        }
        return counts;
    }, [allJobs]);

    const activeStatusMeta = useMemo(() => {
        return STATUS_OPTIONS.find((opt) => opt.value === statusFilter) ?? STATUS_OPTIONS[0];
    }, [statusFilter]);

    useEffect(() => {
        if (!openStatusDropdown) return;

        const onPointerDown = (e: MouseEvent) => {
            const el = statusDropdownRef.current;
            if (!el) return;
            if (el.contains(e.target as Node)) return;
            setOpenStatusDropdown(false);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpenStatusDropdown(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [openStatusDropdown]);

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "accepted":
                return { label: "รับงานแล้ว", color: "" };
            case "in_progress":
                return { label: "กำลังดำเนินงาน", color: "" };
            case "going_pickup":
                return { label: "กำลังไปรับผู้ป่วย", color: "" };
            case "picked_up":
                return { label: "รับผู้ป่วยแล้ว", color: "" };
            case "heading_to_hospital":
                return { label: "กำลังไปโรงพยาบาล", color: "" };
            case "arrived_at_hospital":
                return { label: "ถึงโรงพยาบาลแล้ว", color: "" };
            case "waiting_for_return":
                return { label: "รอรับกลับ", color: "" };
            case "heading_home":
                return { label: "กำลังเดินทางกลับ", color: "" };
            case "arrived_home":
                return { label: "ถึงบ้านแล้ว", color: "" };
            case "pending_payment":
                return { label: "รอชำระเงิน", color: "" };
            case "paymented":
                return { label: "ชำระเงินแล้ว", color: "" };
            case "success":
                return { label: "ปิดงานเรียบร้อย", color: "" };
            case "cancelled":
                return { label: "ยกเลิกแล้ว", color: "" };
            default:
                return { label: "ไม่ระบุสถานะ", color: "" };
        }
    };

    return (
        <div>
            <div className="my-5">
                {/* Filters */}
                <div className="space-y-2">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center">
                            {/* Status (custom dropdown) */}
                            <div ref={statusDropdownRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setOpenStatusDropdown((v) => !v)}
                                    className="flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm hover:bg-slate-50 transition md:min-w-[280px]"
                                    aria-expanded={openStatusDropdown}
                                >
                                    <Icon icon="solar:filter-linear" className="h-5 w-5 text-slate-400" />
                                    <span className="text-sm font-medium text-slate-600">สถานะ</span>
                                    <span className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                                        <Icon icon={activeStatusMeta.icon} className="h-4 w-4 text-slate-400" />
                                        {activeStatusMeta.label}
                                    </span>
                                    <Icon
                                        icon="solar:alt-arrow-down-linear"
                                        className={
                                            "h-5 w-5 text-slate-400 transition-transform " +
                                            (openStatusDropdown ? "rotate-180" : "")
                                        }
                                    />
                                </button>

                                {openStatusDropdown && (
                                    <div className="absolute left-0 right-0 z-50 mt-2 rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                                        <div className="max-h-80 overflow-y-auto">
                                            {STATUS_OPTIONS.map((opt) => {
                                                const isActive = statusFilter === opt.value;
                                                const count = statusCounts[opt.value] ?? 0;
                                                return (
                                                    <button
                                                        key={opt.value}
                                                        type="button"
                                                        className={
                                                            "w-full px-4 py-3 text-left transition flex items-center gap-2 hover:bg-slate-50 " +
                                                            (isActive ? " bg-[#70C5BE]/5" : "")
                                                        }
                                                        onClick={() => {
                                                            setOpenStatusDropdown(false);
                                                            setStatusFilter(opt.value);
                                                        }}
                                                    >
                                                        <Icon icon={opt.icon} className="h-5 w-5 text-slate-400" />
                                                        <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
                                                        <span className="ml-auto inline-flex items-center gap-2">
                                                            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                                                                {count}
                                                            </span>
                                                            {isActive ? (
                                                                <Icon icon="solar:check-circle-linear" className="h-5 w-5 text-emerald-500" />
                                                            ) : null}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Date */}
                            <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
                                <Icon icon="solar:calendar-date-linear" className="h-5 w-5 text-slate-400" />
                                <span className="text-sm font-medium text-slate-600">วัน</span>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="ml-auto bg-transparent text-sm font-semibold text-slate-700 outline-none"
                                />
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            {onRefresh ? (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="px-3 py-2 text-sm font-semibold"
                                    onClick={onRefresh}
                                    disabled={refreshing}
                                    aria-busy={refreshing}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon icon="solar:refresh-linear" className="h-4 w-4" />
                                        <span className="hidden sm:inline">รีเฟรช</span>
                                    </div>
                                </Button>
                            ) : null}
                            <p className="text-xs text-slate-500">ทั้งหมด {allJobs.length} งาน</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative">
                {refreshing ? (
                    <div className="absolute inset-0 z-10 rounded-2xl bg-white/70 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3 text-slate-600">
                            <div className="h-9 w-9 rounded-full border-4 border-slate-200 border-t-[#70C5BE] animate-spin" />
                            <p className="text-sm font-semibold">กำลังรีเฟรชงาน...</p>
                        </div>
                    </div>
                ) : null}

                {!jobs || jobs.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="flex flex-col gap-6 mb-20">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {paginatedJobs.map((job) => {
                                const status = getStatusInfo(job.status);

                                return (
                                    <div className="flex flex-col gap-5" key={job.booking_id}>
                                        <JobCard
                                            className="mt-2"
                                            heightClassName="min-h-[520px]"
                                            badge={
                                                <div className="px-3 py-1 rounded-lg text-[11px] font-bold shadow-sm bg-[#70C5BE]/10">
                                                    <p className="text-[#70C5BE]">{status.label}</p>
                                                </div>
                                            }
                                            topRightAction={
                                                <button
                                                    onClick={() => setSelectedJobId(job.booking_id)}
                                                    className="p-2 text-red-500 cursor-pointer rounded-full hover:bg-red-500 hover:text-white transition-colors"
                                                    title="คืนงานกลับเข้าระบบ"
                                                    type="button"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-bold" className="text-xl" />
                                                </button>
                                            }
                                            scheduleDate={FormatDatetime.formatThaiDate(job.booking_date)}
                                            scheduleTime={FormatDatetime.formatThaiTime(job.start_time)}
                                            pickupAddress={job.pickup_address}
                                            dropoffAddress={job.dropoff_address}
                                            passengerName={`${job.first_name} ${job.last_name}`}
                                            passengerPhone={job.phone_number}
                                            passengerImageSrc={job.profile_img}
                                            actions={
                                                <>
                                                    <div className="flex gap-4 md:flex-col">
                                                        {job.status === "accepted" && isOparation && (
                                                            <div className="flex flex-col gap-4 flex-1">
                                                                <Button
                                                                    className="w-full"
                                                                    onClick={() => onStartJob(job.booking_id)}
                                                                >
                                                                    <div className="flex gap-2 justify-center items-center">
                                                                        <Icon icon="bi:skip-start-fill" width="24" height="24" />
                                                                        เริ่มงาน
                                                                    </div>
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <Button
                                                        className="w-full flex-1"
                                                        variant="secondary"
                                                        onClick={() => onViewDetail(job.booking_id)}
                                                    >
                                                        <div className="flex gap-2 justify-center items-center">
                                                            <Icon icon="fluent:cursor-16-regular" width="16" height="16" />
                                                            รายละเอียดงาน
                                                        </div>
                                                    </Button>
                                                </>
                                            }
                                        />

                                        {selectedJobId === job.booking_id && (
                                            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-100 px-4">
                                                <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4 shadow-xl">
                                                    <div className="flex justify-center">
                                                        <Icon
                                                            icon="mdi:alert-circle"
                                                            className="text-red-500 text-5xl"
                                                        />
                                                    </div>
                                                    <h3 className="font-bold text-lg text-center text-gray-800">
                                                        ยืนยันการคืนงาน?
                                                    </h3>
                                                    <p className="text-center text-gray-600 text-sm">
                                                        งานนี้จะถูกส่งกลับเข้าระบบเพื่อให้คนขับท่านอื่นรับแทน
                                                    </p>
                                                    <div className="flex gap-3 pt-2">
                                                        <Button
                                                            variant="secondary"
                                                            className="w-full"
                                                            onClick={() => setSelectedJobId(null)}
                                                        >
                                                            ยกเลิก
                                                        </Button>
                                                        <Button
                                                            // variant="danger"
                                                            className="w-full bg-red-500 hover:bg-red-600 text-white"
                                                            onClick={() => {
                                                                if (selectedJobId == null) return;
                                                                onCancelJob(selectedJobId);
                                                                setSelectedJobId(null);
                                                            }}
                                                        >
                                                            ยืนยัน
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onChangePage={setCurrentPage}
                            siblingCount={2}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
