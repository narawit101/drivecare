"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import Pusher from "pusher-js";

import Button from "@/components/Button";
import AddressModal from "@/components/admin/manager-users/AddressModal";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";
import ConfirmActionModal from "@/components/admin/common/ConfirmActionModal";
import Timeline from "@/components/driver/job-detail/timeline/Timeline";
import type { TimelineItemType } from "@/types/driver/timeline";
import { BOOKING_STATUS_OPTIONS, getBookingStatusBadge as getStatusBadge, getBookingStatusLabel } from "@/constants/booking-status";
import type { AdminBookingRow } from "@/types/admin/booking-overview";

export type { AdminBookingRow };

type Props = {
    open: boolean;
    booking: AdminBookingRow | null;
    submitting: boolean;
    onClose: () => void;
    onChangeStatus: (bookingId: number, nextStatus: string) => Promise<void>;
    onCloseJob: (bookingId: number) => Promise<void>;
};

type InnerProps = Omit<Props, "booking"> & {
    booking: AdminBookingRow;
};

type Badge = { label: string; className: string; icon: string };

const getPaymentStatusBadge = (paymentStatus?: string | null): Badge => {
    const s = (paymentStatus ?? "").trim();
    if (s === "waiting_verify") {
        return { label: "รอตรวจสอบ", className: "bg-amber-100 text-amber-700", icon: "solar:shield-warning-linear" };
    }
    if (s === "verified") {
        return { label: "ตรวจสอบแล้ว", className: "bg-emerald-100 text-emerald-700", icon: "solar:verified-check-linear" };
    }
    if (s === "rejected") {
        return { label: "ปฏิเสธ", className: "bg-rose-100 text-rose-700", icon: "solar:close-circle-linear" };
    }
    return { label: "ยังไม่มีสลิป", className: "bg-slate-100 text-slate-600", icon: "solar:document-linear" };
};

const STATUS_OPTIONS: Array<{ value: string; label: string; icon: string }> = BOOKING_STATUS_OPTIONS
    // pending: server blocks setting back to pending
    .filter((opt) => opt.value !== "pending")
    // success: close job uses a dedicated button
    .filter((opt) => opt.value !== "success")
    // cancelled: use a dedicated button + confirm modal
    .filter((opt) => opt.value !== "cancelled");

export default function BookingManageModal({
    open,
    booking,
    submitting,
    onClose,
    onChangeStatus,
    onCloseJob,
}: Props) {
    // Important: keep this component hook-less so we can safely short-circuit.
    // The hook logic lives in the inner component which only mounts when open && booking.
    if (!open || !booking) return null;

    return (
        <BookingManageModalInner
            open={open}
            booking={booking}
            submitting={submitting}
            onClose={onClose}
            onChangeStatus={onChangeStatus}
            onCloseJob={onCloseJob}
        />
    );
}

function BookingManageModalInner({ open, booking, submitting, onClose, onChangeStatus, onCloseJob }: InnerProps) {
    const [openDropdown, setOpenDropdown] = useState(false);
    const [dropdownMaxHeight, setDropdownMaxHeight] = useState<number | null>(null);
    const [addressModal, setAddressModal] = useState<null | { title: string; address: string }>(null);
    const [timeline, setTimeline] = useState<TimelineItemType[]>([]);
    const [loadingTimeline, setLoadingTimeline] = useState(false);
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const modalBodyRef = useRef<HTMLDivElement | null>(null);
    const dropdownPanelRef = useRef<HTMLDivElement | null>(null);
    const dropdownButtonRef = useRef<HTMLButtonElement | null>(null);
    const timelineScrollRef = useRef<HTMLDivElement | null>(null);

    useEscapeToClose(open, () => {
        setOpenDropdown(false);
        setAddressModal(null);
        setShowCloseConfirm(false);
        setShowCancelConfirm(false);
        onClose();
    });

    const fullUserName = useMemo(() => {
        if (!booking) return "-";
        const name = `${booking.user_first_name ?? ""} ${booking.user_last_name ?? ""}`.trim();
        return name || "ไม่ระบุชื่อ";
    }, [booking]);

    const fullDriverName = useMemo(() => {
        if (!booking.driver_id) return "ยังไม่มีคนขับ";
        const name = `${booking.driver_first_name ?? ""} ${booking.driver_last_name ?? ""}`.trim();
        return name || "ไม่ระบุชื่อ";
    }, [booking]);

    const currentStatus = (booking.status ?? "").trim();
    const isPending = currentStatus === "pending";
    const isClosed = currentStatus === "success";
    const isCancelled = currentStatus === "cancelled";
    const hasDriver = Boolean(booking.driver_id);
    const canUpdateStatus = hasDriver && !isPending && !isClosed && !isCancelled;
    const currentStatusLabel = currentStatus ? getBookingStatusLabel(currentStatus) : "-";

    const bookingBadge = getStatusBadge(booking.status);
    const paymentBadge = getPaymentStatusBadge(booking.payment_status);

    const fetchTimeline = async () => {
        try {
            setLoadingTimeline(true);
            const res = await fetch(`/api/booking/admin/bookings/${booking.booking_id}/log-time-line`, {
                credentials: "include",
            });
            const data = await res.json();
            if (!res.ok) {
                setTimeline([]);
                return;
            }
            setTimeline((data?.timeline ?? []) as TimelineItemType[]);
        } catch {
            setTimeline([]);
        } finally {
            setLoadingTimeline(false);
        }
    };

    const scrollTimelineToBottom = (behavior: ScrollBehavior = "smooth") => {
        const el = timelineScrollRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior });
    };

    // Realtime: refresh timeline when any actor updates this booking (driver/user/admin)
    useEffect(() => {
        if (!open) return;

        const pusherKey = process.env.NEXT_PUBLIC_PUSHER_KEY;
        if (!pusherKey) return;

        const pusher = new Pusher(pusherKey, {
            cluster: "ap1",
            authEndpoint: "/api/pusher/auth",
            // admin uses cookie (admin_token)
        });

        const channel = pusher.subscribe("private-admin");

        const getBookingIdFromPayload = (payload: any): number | null => {
            const id = payload?.booking_id ?? payload?.bookingId ?? payload?.booking?.booking_id ?? payload?.report?.booking_id;
            const num = typeof id === "string" ? Number(id) : typeof id === "number" ? id : NaN;
            return Number.isFinite(num) ? num : null;
        };

        const onAnyBookingEvent = (payload: any) => {
            const eventBookingId = getBookingIdFromPayload(payload);
            if (eventBookingId !== booking.booking_id) return;
            fetchTimeline();
        };

        channel.bind("booking-updated", onAnyBookingEvent);
        channel.bind("booking.returned", onAnyBookingEvent);
        channel.bind("report-created", onAnyBookingEvent);

        return () => {
            channel.unbind("booking-updated", onAnyBookingEvent);
            channel.unbind("booking.returned", onAnyBookingEvent);
            channel.unbind("report-created", onAnyBookingEvent);
            pusher.unsubscribe("private-admin");
            pusher.disconnect();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, booking.booking_id]);

    useEffect(() => {
        if (!open) return;
        fetchTimeline();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, booking.booking_id]);

    // After timeline finishes loading, jump to the latest item.
    useEffect(() => {
        if (!open) return;
        if (loadingTimeline) return;
        // Wait for DOM paint after Timeline renders
        const raf = window.requestAnimationFrame(() => scrollTimelineToBottom("auto"));
        return () => window.cancelAnimationFrame(raf);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, loadingTimeline, timeline.length]);

    // Let the dropdown "pull up" and stretch to the visible space above the button in the modal body.
    useEffect(() => {
        if (!openDropdown) {
            setDropdownMaxHeight(null);
            return;
        }

        const recalc = () => {
            const bodyEl = modalBodyRef.current;
            const btnEl = dropdownButtonRef.current;
            if (!bodyEl || !btnEl) return;

            const bodyRect = bodyEl.getBoundingClientRect();
            const btnRect = btnEl.getBoundingClientRect();

            const paddingTop = 12;
            const available = Math.floor(btnRect.top - bodyRect.top - paddingTop);
            setDropdownMaxHeight(Math.max(180, available));
        };

        const raf = window.requestAnimationFrame(() => {
            recalc();
            dropdownButtonRef.current?.scrollIntoView({ block: "nearest" });
        });
        window.addEventListener("resize", recalc);
        const bodyEl = modalBodyRef.current;
        bodyEl?.addEventListener("scroll", recalc, { passive: true } as any);

        return () => {
            window.cancelAnimationFrame(raf);
            window.removeEventListener("resize", recalc);
            bodyEl?.removeEventListener("scroll", recalc as any);
        };
    }, [openDropdown]);

    const handleSelectStatus = async (value: string) => {
        setOpenDropdown(false);
        if (value === "pending") return;
        await onChangeStatus(booking.booking_id, value);
        await fetchTimeline();
    };

    return (
        <>
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="w-full max-w-5xl max-h-[calc(100vh-2rem)] rounded-2xl bg-white shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-[#70C5BE]/10 flex items-center justify-center">
                                <Icon icon="solar:clipboard-text-linear" className="h-6 w-6 text-[#70C5BE]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-button-primary">จัดการการจอง</h3>
                                <p className="text-xs text-slate-500">Booking #{booking.booking_id}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full p-1 hover:bg-slate-100 transition-colors cursor-pointer"
                            aria-label="close"
                        >
                            <Icon icon="solar:close-circle-linear" className="h-7 w-7 text-slate-400" />
                        </button>
                    </div>

                    <div ref={modalBodyRef} className="p-6 overflow-y-auto flex-1 min-h-0">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div className="lg:col-span-2 space-y-5">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                                        <p className="text-xs text-slate-500">ผู้ป่วย</p>
                                        <p className="font-semibold text-slate-800">{fullUserName}</p>
                                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                            <Icon icon="solar:phone-linear" className="text-slate-400" />
                                            {booking.user_phone_number ?? "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
                                        <p className="text-xs text-slate-500">คนขับ</p>
                                        <p className="font-semibold text-slate-800">{fullDriverName}</p>
                                        <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                                            <Icon icon="solar:phone-linear" className="text-slate-400" />
                                            {booking.driver_phone_number ?? "-"}
                                        </p>
                                    </div>

                                    <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 md:col-span-2">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-xs text-slate-500">จุดรับ</p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAddressModal({
                                                            title: "จุดรับ",
                                                            address: booking.pickup_address ?? "-",
                                                        })
                                                    }
                                                    className="mt-1 w-full text-left rounded-lg bg-white border border-slate-200 px-3 py-2 hover:bg-slate-50 transition"
                                                >
                                                    <span className="flex items-start gap-2 text-slate-700">
                                                        <Icon icon="solar:map-point-linear" className="text-emerald-500 mt-0.5" />
                                                        <span className="line-clamp-2">{booking.pickup_address ?? "-"}</span>
                                                    </span>
                                                </button>
                                            </div>

                                            <div>
                                                <p className="text-xs text-slate-500">จุดส่ง</p>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setAddressModal({
                                                            title: "จุดส่ง",
                                                            address: booking.dropoff_address ?? "-",
                                                        })
                                                    }
                                                    className="mt-1 w-full text-left rounded-lg bg-white border border-slate-200 px-3 py-2 hover:bg-slate-50 transition"
                                                >
                                                    <span className="flex items-start gap-2 text-slate-700">
                                                        <Icon icon="solar:flag-linear" className="text-rose-500 mt-0.5" />
                                                        <span className="line-clamp-2">{booking.dropoff_address ?? "-"}</span>
                                                    </span>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <p className="text-xs text-slate-500 mb-2">สถานะการจอง</p>
                                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${bookingBadge.className}`}>
                                            <Icon icon={bookingBadge.icon} className="h-4 w-4" />
                                            {bookingBadge.label}
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-slate-200 p-4">
                                        <p className="text-xs text-slate-500 mb-2">สถานะการชำระเงิน</p>
                                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${paymentBadge.className}`}>
                                            <Icon icon={paymentBadge.icon} className="h-4 w-4" />
                                            {paymentBadge.label}
                                        </span>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-slate-200 p-4">
                                    <p className="text-sm font-semibold text-slate-700 mb-3">การจัดการ</p>

                                    <div className="grid grid-cols-1 gap-3">
                                        <div className="relative">
                                            <button
                                                ref={dropdownButtonRef}
                                                type="button"
                                                disabled={submitting || !canUpdateStatus}
                                                onClick={() => setOpenDropdown((v) => !v)}
                                                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:bg-slate-50 transition disabled:opacity-60"
                                                aria-expanded={openDropdown}
                                                aria-controls="admin-booking-status-dropdown"
                                                title={
                                                    !canUpdateStatus
                                                        ? isClosed
                                                            ? "งานนี้ปิดงานแล้ว เปลี่ยนสถานะไม่ได้"
                                                            : isCancelled
                                                                ? "งานนี้ถูกยกเลิกแล้ว เปลี่ยนสถานะไม่ได้"
                                                                : "งานสถานะรอมอบหมาย/ยังไม่มีคนขับ เปลี่ยนสถานะไม่ได้"
                                                        : undefined
                                                }
                                            >
                                                <span className="flex items-center justify-between">
                                                    <span className="flex flex-col">
                                                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                            <Icon icon="solar:shuffle-linear" className="text-slate-400" />
                                                            เปลี่ยนสถานะ
                                                        </span>
                                                        <span className="mt-1 text-xs text-slate-500">สถานะปัจจุบัน: {currentStatusLabel}</span>
                                                    </span>
                                                    <Icon
                                                        icon="solar:alt-arrow-down-linear"
                                                        className={`h-5 w-5 text-slate-400 transition-transform ${openDropdown ? "rotate-180" : ""}`}
                                                    />
                                                </span>
                                            </button>

                                            {openDropdown && (
                                                <div
                                                    ref={dropdownPanelRef}
                                                    id="admin-booking-status-dropdown"
                                                    className="absolute left-0 right-0 z-50 bottom-full mb-2 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                                                >
                                                    <div
                                                        className="overflow-y-auto"
                                                        style={dropdownMaxHeight ? { maxHeight: `${dropdownMaxHeight}px` } : undefined}
                                                    >
                                                        {STATUS_OPTIONS.map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                disabled={opt.value === "pending"}
                                                                className={
                                                                    "w-full px-4 py-3 text-left transition flex items-center gap-2 " +
                                                                    (opt.value === "pending"
                                                                        ? "cursor-not-allowed opacity-60"
                                                                        : "hover:bg-slate-50") +
                                                                    (opt.value === currentStatus ? " bg-[#70C5BE]/5" : "")
                                                                }
                                                                onClick={() => handleSelectStatus(opt.value)}
                                                            >
                                                                <Icon icon={opt.icon} className="h-5 w-5 text-slate-400" />
                                                                <span className="text-sm font-semibold text-slate-700">{opt.label}</span>
                                                                {opt.value === currentStatus ? (
                                                                    <Icon icon="solar:check-circle-linear" className="ml-auto h-5 w-5 text-emerald-500" />
                                                                ) : (
                                                                    <span className="ml-auto text-xs text-slate-400">{opt.value}</span>
                                                                )}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <Button
                                            variant="primary"
                                            disabled={submitting || !canUpdateStatus || isClosed || isCancelled}
                                            onClick={() => setShowCloseConfirm(true)}
                                            className="w-full"
                                            title={isClosed ? "งานนี้ปิดงานแล้ว" : isCancelled ? "งานนี้ถูกยกเลิกแล้ว" : undefined}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <Icon icon="solar:shield-check-linear" />
                                                ปิดงาน
                                            </span>
                                        </Button>

                                        <Button
                                            variant="reject"
                                            disabled={submitting || !canUpdateStatus || isClosed || isCancelled}
                                            onClick={() => setShowCancelConfirm(true)}
                                            className="w-full"
                                            title={isClosed ? "งานนี้ปิดงานแล้ว" : isCancelled ? "งานนี้ถูกยกเลิกแล้ว" : undefined}
                                        >
                                            <span className="flex items-center justify-center gap-2">
                                                <Icon icon="solar:close-circle-linear" />
                                                ยกเลิกงาน
                                            </span>
                                        </Button>
                                    </div>

                                    {/* {isClosed && (
                                        <div className="mt-3 text-xs text-slate-500">* งานนี้ปิดงานแล้ว ไม่สามารถปิดงานซ้ำได้</div>
                                    )} */}

                                    {!canUpdateStatus && (
                                        <div className="mt-3 text-xs text-rose-500">
                                            {isClosed
                                                ? "* งานนี้ปิดงานแล้ว เปลี่ยนสถานะไม่ได้"
                                                : isCancelled
                                                    ? "* งานนี้ถูกยกเลิกแล้ว ดำเนินการต่อไม่ได้"
                                                    : "* งานสถานะรอมอบหมาย/ยังไม่มีคนขับ เปลี่ยนสถานะไม่ได้"}
                                        </div>
                                    )}

                                    {/* <div className="mt-3 text-xs text-slate-500">
                                        * ปุ่ม “ปิดงาน” จะตั้งสถานะเป็น <span className="font-semibold">success</span>
                                    </div> */}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 p-4 flex max-h-[520px] flex-col">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-slate-700">ประวัติการดำเนินงาน</p>
                                    <button
                                        type="button"
                                        onClick={fetchTimeline}
                                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                                        disabled={loadingTimeline}
                                        title="รีเฟรชไทม์ไลน์"
                                    >
                                        <Icon icon="solar:refresh-linear" className={loadingTimeline ? "animate-spin" : ""} />
                                        รีเฟรช
                                    </button>
                                </div>

                                <div ref={timelineScrollRef} className="flex-1 min-h-0 overflow-y-auto pr-1">
                                    {loadingTimeline ? (
                                        <p className="text-center text-sm text-slate-400">กำลังโหลดข้อมูล</p>
                                    ) : (
                                        <Timeline items={timeline} emptyText="ไม่มีข้อมูลไทม์ไลน์" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white shrink-0">
                        <Button variant="secondary" type="button" onClick={onClose} disabled={submitting}>
                            ปิด
                        </Button>
                    </div>
                </div>
            </div>

            {addressModal && (
                <AddressModal
                    title={addressModal.title}
                    address={addressModal.address}
                    onClose={() => setAddressModal(null)}
                    icon={addressModal.title === "จุดรับ" ? "solar:map-point-linear" : "solar:flag-linear"}
                    iconClassName={addressModal.title === "จุดรับ" ? "text-emerald-500" : "text-rose-500"}
                />
            )}

            <ConfirmActionModal
                open={showCloseConfirm}
                title="ยืนยันการปิดงาน"
                description={
                    <>
                        ต้องการปิดงาน <span className="font-semibold text-slate-800">Booking #{booking.booking_id}</span> ใช่หรือไม่?
                        <br />
                        เมื่อปิดงานแล้วจะไม่สามารถเปลี่ยนสถานะต่อได้
                    </>
                }
                confirmText="ปิดงาน"
                confirmVariant="primary"
                onCancel={() => setShowCloseConfirm(false)}
                onConfirm={async () => {
                    setShowCloseConfirm(false);
                    setOpenDropdown(false);
                    await onCloseJob(booking.booking_id);
                }}
            />

            <ConfirmActionModal
                open={showCancelConfirm}
                title="ยืนยันการยกเลิกงาน"
                description={
                    <>
                        ต้องการยกเลิกงาน <span className="font-semibold text-slate-800">Booking #{booking.booking_id}</span> ใช่หรือไม่?
                        <br />
                        เมื่อยกเลิกแล้วจะไม่สามารถดำเนินการต่อได้
                    </>
                }
                confirmText="ยกเลิกงาน"
                confirmVariant="danger"
                onCancel={() => setShowCancelConfirm(false)}
                onConfirm={async () => {
                    setShowCancelConfirm(false);
                    setOpenDropdown(false);
                    await onChangeStatus(booking.booking_id, "cancelled");
                    await fetchTimeline();
                }}
            />
        </>
    );
}
