"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Icon } from "@iconify/react";
import type { BookingReport, ReportRow } from "@/types/admin/report";
import type { ActiveDriverRow } from "@/types/admin/job-assignment";
import { formatReportType } from "@/utils/format-report-type";
import { toast } from "react-toastify";
import Button from "@/components/Button";
import * as FormatDatetime from "@/utils/format-datetime";



type Props = {
    isOpen: boolean;
    onClose: () => void;
    reportData: ReportRow | null;
    fetchReports: () => Promise<void>;
};

export default function ModalAssignmentAccept({
    isOpen,
    onClose,
    reportData,
    fetchReports,
}: Props) {
    const [drivers, setDrivers] = useState<ActiveDriverRow[]>([]);
    const [selectedDriverId, setSelectedDriverId] = useState<number | "">("");
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const selectedDriver = useMemo(() => {
        if (selectedDriverId === "") return null;
        return drivers.find((d) => d.driver_id === selectedDriverId) ?? null;
    }, [drivers, selectedDriverId]);

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

    useEffect(() => {
        if (isOpen) {
            fetchDrivers();
        }
    }, [isOpen]);

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

    const fetchDrivers = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/admin/job-assignment/get-active-driver", {
                credentials: "include",
            });

            if (response.ok) {
                const data = await response.json();
                let allDrivers = data.users || [];

                // Filter out the driver who reported if it's a driver report
                if (reportData?.actor_type === "driver" && reportData.actor_id) {
                    allDrivers = allDrivers.filter((driver: ActiveDriverRow) => {
                        return driver.driver_id !== reportData.actor_id;
                    });
                }

                setDrivers(allDrivers);
            } else {
                console.error("Failed to fetch drivers");
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
        } finally {
            setLoading(false);
        }
    };

    const submitReply = async (message: string) => {
        if (!reportData) return;
        try {
            const res = await fetch("/api/reports/admin/reply-report", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    report_id: reportData.report_id,
                    message,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "ตอบรายงานสำเร็จ");
            } else {
                toast.error(data.message || "ตอบรายงานไม่สำเร็จ");
                console.error("Failed to reply to report");
            }
        } catch (error) {
            console.error("REPLY REPORT ERROR:", error);
        }
    }

    const handleSubmit = async () => {
        if (selectedDriverId === "" || !reportData) return;

        setSubmitting(true);
        try {
            const response = await fetch("/api/admin/job-assignment/direct-assign-driver", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    booking_id: reportData.booking_id,
                    driver_id: selectedDriverId,
                }),
            });

            if (response.ok) {
                toast.success("มอบหมายงานสำเร็จ");

                // Send reply to notify about assignment
                const selectedDriver = drivers.find(d => d.driver_id === selectedDriverId);
                const driverName = selectedDriver ? `${selectedDriver.first_name} ${selectedDriver.last_name}` : "คนขับ";
                const replyMessage = `แอดมินได้มอบหมายงานให้กับคนขับท่านอื่นแล้ว`;

                await submitReply(replyMessage);

                onClose();
                setSelectedDriverId("");
                fetchReports();
            } else {
                const errorData = await response.json();
                toast.error(errorData.message || "ไม่สามารถมอบหมายงานได้");
            }
        } catch (error) {
            console.error("Error assigning driver:", error);
            toast.error("เกิดข้อผิดพลาดในการมอบหมายงาน");
        } finally {
            setSubmitting(false);
        }
    };



    if (!isOpen || !reportData) return null;

    return (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">
                            มอบหมายงาน #{reportData.booking_id}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <Icon icon="solar:close-circle-linear" className="text-2xl" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-slate-700 mb-3">ข้อมูลงาน</h3>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">วันที่:</span>
                                    <span className="font-medium text-slate-700">{FormatDatetime.formatThaiDate(reportData.booking_date)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">เวลา:</span>
                                    <span className="font-medium text-slate-700">{FormatDatetime.formatThaiTime(reportData.booking_time)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">ผู้ป่วย:</span>
                                    <span className="font-medium text-slate-700">{reportData.user_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">เบอร์โทรผู้ป่วย:</span>
                                    <span className="font-medium text-slate-700">{reportData.user_phone}</span>
                                </div>
                                {reportData.driver_name && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">คนขับ:</span>
                                        <span className="font-medium text-slate-700">{reportData.driver_name}</span>
                                    </div>
                                )}
                                {reportData.driver_phone && (
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">เบอร์โทรคนขับ:</span>
                                        <span className="font-medium text-slate-700">{reportData.driver_phone}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-rose-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-rose-700 mb-2">รายงานปัญหา</h3>
                            <p className="text-sm text-rose-600">
                                <span className="font-medium">ประเภท:</span> {formatReportType(reportData.report_type)}
                            </p>
                            <p className="text-sm text-rose-600 mt-1">{reportData.message}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                เลือกคนขับ:
                                <span className="font-normal text-slate-400">
                                    (จะสามารถเลือกได้เฉพาะคนขับที่ออนไลน์เท่านั้น)
                                </span>
                            </label>
                            <div ref={dropdownRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setOpenDropdown((v) => !v)}
                                    disabled={loading || submitting}
                                    aria-haspopup="listbox"
                                    aria-expanded={openDropdown}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                                            {selectedDriver?.profile_img ? (
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

                                {openDropdown && !loading && (
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
                                                        </button>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {loading && (
                                <p className="mt-2 text-xs text-slate-500 flex items-center gap-2">
                                    <Icon icon="solar:loading-linear" className="animate-spin" />
                                    กำลังโหลดรายชื่อคนขับ...
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-3 mt-6 items-center justify-center w-full">
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={onClose}
                        >
                            ยกเลิก
                        </Button>
                        <Button
                            className="w-full"
                            onClick={handleSubmit}
                            disabled={selectedDriverId === "" || submitting}
                        >
                            {submitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <Icon icon="solar:loading-linear" className="animate-spin" />
                                    กำลังมอบหมาย...
                                </div>
                            ) : (
                                "ยอมรับการมอบหมาย"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}