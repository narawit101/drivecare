"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Button from "@/components/Button";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";

import type {
    ActiveDriverRow,
    AssignJobSummary,
} from "@/types/admin/job-assignment";

export type { ActiveDriverRow, AssignJobSummary };

type Props = {
    open: boolean;
    job: AssignJobSummary;
    drivers: ActiveDriverRow[];
    loadingDrivers: boolean;
    submitting: boolean;
    onClose: () => void;
    onSubmit: (driverId: number) => void | Promise<void>;
};

const toDriverName = (d: ActiveDriverRow) => {
    const name = `${d.first_name ?? ""} ${d.last_name ?? ""}`.trim();
    return name || "ไม่ระบุชื่อ";
};

const getDriverStatusBadge = (status?: string | null) => {
    if (status === "active") {
        return {
            label: "ออนไลน์",
            className: "bg-emerald-100 text-emerald-700",
        };
    }
    if (status === "inactive") {
        return {
            label: "ออฟไลน์",
            className: "bg-slate-100 text-slate-600",
        };
    }
    if (status === "banned") {
        return {
            label: "แบน",
            className: "bg-rose-100 text-rose-700",
        };
    }
    return {
        label: "ไม่ทราบสถานะ",
        className: "bg-slate-100 text-slate-600",
    };
};

export default function AssignDriverModal({
    open,
    job,
    drivers,
    loadingDrivers,
    submitting,
    onClose,
    onSubmit,
}: Props) {
    const [selectedDriverId, setSelectedDriverId] = useState<number | "">("");
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const selectedDriver = useMemo(() => {
        if (selectedDriverId === "") return null;
        return drivers.find((d) => d.driver_id === selectedDriverId) ?? null;
    }, [drivers, selectedDriverId]);

    useEscapeToClose(open && !submitting, () => {
        if (submitting) return;
        setOpenDropdown(false);
        onClose();
    });

    useEffect(() => {
        if (!openDropdown) return;

        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const el = dropdownRef.current;
            if (!el) return;
            const target = e.target as Node | null;
            if (target && el.contains(target)) return;
            setOpenDropdown(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("touchstart", onPointerDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("touchstart", onPointerDown);
        };
    }, [openDropdown]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl animate-in zoom-in-95 duration-200 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <h3 className="text-lg font-bold text-button-primary">มอบหมายงานให้คนขับ</h3>
                    <button
                        type="button"
                        onClick={() => {
                            if (submitting) return;
                            onClose();
                        }}
                        disabled={submitting}
                        className="rounded-full p-1 hover:bg-slate-100 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label="close"
                    >
                        <Icon icon="solar:close-circle-linear" className="h-7 w-7 text-slate-400" />
                    </button>
                </div>

                <div className="px-10 pb-15 pt-5 space-y-5">
                    {/* Driver select */}
                    <div>
                        <p className="text-sm font-semibold text-slate-700 mb-2">
                            เลือกคนขับที่ต้องการ{" "}
                            <span className="font-normal text-slate-400">
                                (จะสามารถเลือกได้เฉพาะคนขับที่ออนไลน์เท่านั้น)
                            </span>
                        </p>
                        <div ref={dropdownRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setOpenDropdown((v) => !v)}
                                disabled={loadingDrivers || submitting}
                                aria-haspopup="listbox"
                                aria-expanded={openDropdown}
                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                        {selectedDriver?.profile_img ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={selectedDriver.profile_img}
                                                alt={toDriverName(selectedDriver)}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <Icon icon="solar:user-circle-bold" className="h-9 w-9 text-slate-300" />
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="min-w-0 flex items-center gap-2">
                                                <p className="font-semibold text-slate-800 truncate">
                                                    {selectedDriver ? toDriverName(selectedDriver) : "เลือกคนขับ"}
                                                </p>
                                                {selectedDriver?.status === "active" ? (
                                                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 shrink-0">
                                                        ออนไลน์
                                                    </span>
                                                ) : selectedDriver?.status === "inactive" ? (
                                                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500 shrink-0">
                                                        ออฟไลน์
                                                    </span>
                                                ) : null
                                                }
                                            </div>
                                            <span className="text-slate-400 shrink-0">
                                                <Icon
                                                    icon="solar:alt-arrow-down-linear"
                                                    className={`h-5 w-5 transition-transform ${openDropdown ? "rotate-180" : ""}`}
                                                />
                                            </span>
                                        </div>

                                        <p className="text-sm text-slate-500 flex items-center gap-1">
                                            <Icon icon="solar:phone-linear" className="text-slate-400" />
                                            <span className="truncate">{selectedDriver?.phone_number ?? "-"}</span>
                                        </p>
                                    </div>
                                </div>
                            </button>

                            {openDropdown && !loadingDrivers && (
                                <div
                                    role="listbox"
                                    aria-label="รายการคนขับ"
                                    className="absolute left-0 right-0 z-50 mt-2 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                                >
                                    <div className="max-h-80 overflow-y-auto">
                                        {drivers.length === 0 ? (
                                            <div className="px-4 py-4 text-sm text-slate-500">ไม่พบคนขับที่ออนไลน์</div>
                                        ) : (
                                            drivers.map((d) => {
                                                const isSelected = selectedDriverId !== "" && d.driver_id === selectedDriverId;
                                                const statusBadge = getDriverStatusBadge(d.status);
                                                const isSelectable = d.status === "active";
                                                return (
                                                    <button
                                                        key={d.driver_id}
                                                        type="button"
                                                        role="option"
                                                        aria-selected={isSelected}
                                                        disabled={!isSelectable}
                                                        onClick={() => {
                                                            if (!isSelectable) return;
                                                            setSelectedDriverId(d.driver_id);
                                                            setOpenDropdown(false);
                                                        }}
                                                        className={`w-full px-4 py-3 text-left flex items-center gap-3 transition-colors ${isSelectable ? "hover:bg-slate-50" : "opacity-60 cursor-not-allowed"} ${isSelected ? "bg-slate-50" : ""}`}
                                                    >
                                                        <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                                            {d.profile_img ? (
                                                                // eslint-disable-next-line @next/next/no-img-element
                                                                <img
                                                                    src={d.profile_img}
                                                                    alt={toDriverName(d)}
                                                                    className="h-full w-full object-cover"
                                                                />
                                                            ) : (
                                                                <Icon
                                                                    icon="solar:user-circle-bold"
                                                                    className="h-8 w-8 text-slate-300"
                                                                />
                                                            )}
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="font-semibold text-slate-800 truncate">
                                                                    {toDriverName(d)}
                                                                </p>
                                                                <span
                                                                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold shrink-0 ${statusBadge.className}`}
                                                                >
                                                                    {statusBadge.label}
                                                                </span>
                                                            </div>
                                                            <p className="text-sm text-slate-500 flex items-center gap-1">
                                                                <Icon icon="solar:phone-linear" className="text-slate-400" />
                                                                <span className="truncate">{d.phone_number ?? "-"}</span>
                                                            </p>
                                                        </div>

                                                        {/* <div className="shrink-0 text-slate-300">
                                                            <Icon icon="solar:alt-arrow-right-linear" className="h-5 w-5" />
                                                        </div> */}
                                                    </button>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {loadingDrivers && (
                            <p className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                                <Icon icon="solar:loading-linear" className="animate-spin" />
                                กำลังโหลดรายชื่อคนขับ...
                            </p>
                        )}
                    </div>

                    {/* Booking details */}
                    <div className="rounded-xl bg-slate-50 p-5">
                        <div className="flex items-center gap-2 text-slate-700 font-semibold mb-4">
                            <Icon icon="solar:info-circle-linear" className="text-sky-500" />
                            รายละเอียดการจอง
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <div className="flex flex-col gap-2">
                                    <p className=" text-slate-400">Booking ID</p>
                                    <p className="font-semibold text-slate-700">#{job.bookingId}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-col gap-2">
                                    <p className=" text-slate-400">วันที่และเวลา</p>
                                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-semibold text-slate-700">
                                        <span className="inline-flex items-center gap-2">
                                            <Icon icon="solar:calendar-date-linear" className="text-slate-400" />
                                            {job.dateLabel}
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <Icon icon="solar:clock-circle-linear" className="text-slate-400" />
                                            {job.timeLabel}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-col gap-2">
                                    <p className=" text-slate-400">จุดรับ</p>
                                    <p className="font-semibold text-slate-700 line-clamp-2 flex items-start gap-2">
                                        <Icon
                                            icon="solar:map-point-linear"
                                            className="text-emerald-500 mt-0.5 shrink-0"
                                        />
                                        <span className="min-w-0">{job.pickup}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex flex-col gap-2">
                                    <p className=" text-slate-400">จุดส่ง</p>
                                    <p className="font-semibold text-slate-700 line-clamp-2 flex items-start gap-2">
                                        <Icon
                                            icon="solar:flag-linear"
                                            className="text-rose-500 mt-0.5 shrink-0"
                                        />
                                        <span className="min-w-0">{job.dropoff}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={onClose}

                        disabled={submitting}
                    >
                        ยกเลิก
                    </Button>

                    <Button
                        variant="primary"
                        type="button"
                        buttonIsLoading={submitting}
                        onClick={async () => {
                            if (submitting) return;
                            if (selectedDriverId === "") return;
                            await onSubmit(selectedDriverId);
                        }}
                        disabled={submitting || loadingDrivers || selectedDriverId === ""}
                        className="disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        ยืนยันการมอบหมาย
                    </Button>
                </div>
            </div>
        </div>
    );
}
