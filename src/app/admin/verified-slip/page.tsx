"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Icon } from "@iconify/react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdmin } from "@/context/AdminContext";
import { useRouter } from "next/navigation";
import PastDatetimeContent from "@/utils/past-datetime-content";
import * as FormatDatetime from "@/utils/format-datetime";
import Pusher from "pusher-js";
import { toast } from "react-toastify";
import Button from "@/components/Button";
import { BookingSlip } from "@/types/admin/bookingSlip";
import { StatusFilter } from "@/types/admin/bookingSlip";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Pagination from "@/components/admin/common/Pagination";
import PaymentSlipModal from "@/components/admin/verified-slip/PaymentSlipModal";
import RejectPaymentModal from "@/components/admin/verified-slip/RejectPaymentModal";
import AddressModal from "@/components/admin/manager-users/AddressModal";
import VerifiedSlipTable from "@/components/admin/verified-slip/VerifiedSlipTable";


export default function AdminVerifySlipPage() {
    const { admin, isLoading } = useAdmin();
    const router = useRouter();
    const [bookings, setBookings] = useState<BookingSlip[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<BookingSlip | null>(null);
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [search, setSearch] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>(""); // yyyy-mm-dd
    const [currentPage, setCurrentPage] = useState(1);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [rejecting, setRejecting] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<{
        title: string;
        address: string;
        icon: string;
        iconClassName: string;
    } | null>(null);

    const ITEMS_PER_PAGE = 10;

    // 🔐 Auth guard
    useEffect(() => {
        if (isLoading) return;
        if (!admin) {
            router.replace("/admin/login");
        }
    }, [admin, isLoading, router]);

    useEffect(() => {
        if (!admin) return;

        const pusher = new Pusher(
            process.env.NEXT_PUBLIC_PUSHER_KEY!,
            {
                cluster: "ap1",
                authEndpoint: "/api/pusher/auth",
            }
        );

        const channelName = "private-admin";
        const channel = pusher.subscribe(channelName);

        const handler = (data: any) => {
            console.log("ADMIN REALTIME:", data);

            switch (data.type) {
                case "USER_SUBMIT_SLIP":
                    toast.success("มีสลิปใหม่เข้ามา");
                    fetchSlip();
                    break;
                default:
                    break;
            }
        };

        channel.bind("booking-updated", handler);

        return () => {
            channel.unbind("booking-updated", handler);
            pusher.unsubscribe(channelName);
            pusher.disconnect();
        };
    }, [admin]);


    function renderStatus(status: string) {
        if (status === "waiting_verify") {
            return (
                <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-1 text-[12px] font-semibold text-amber-600 text-center mt-5">
                    รอตรวจสอบ
                </span>
            );
        }
        if (status === "verified") {
            return (
                <span className="text-center inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-1 text-[12px] font-semibold text-emerald-600 mt-5">
                    ตรวจสอบแล้ว
                </span>
            );
        }
        if (status === "rejected") {
            return (
                <span className="inline-flex w-fit items-center rounded-full bg-red-100 px-2 py-1 text-[12px] font-semibold text-red-600 text-center mt-5">
                    ปฏิเสธแล้ว
                </span>
            );
        }
    }

    // 📦 Fetch slip list

    const fetchSlip = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/booking/admin/get-slip", {
                credentials: 'include',
            });
            const data = await res.json();
            setBookings(data.bookings || []);
        } catch (error) {
            console.error("FETCH SLIP ERROR:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!admin) return;
        fetchSlip();
    }, [admin]);


    const filteredBookings = bookings.filter((b) => {
        // status
        if (statusFilter !== "all" && b.payment_status !== statusFilter) {
            return false;
        }
        // date
        if (selectedDate) {
            const bookingDateTH = FormatDatetime.formatToSearchDate(b.booking_date)

            console.log("bookingDateTH:", bookingDateTH, "selectedDate:", selectedDate);
            if (bookingDateTH !== selectedDate) return false;
        }
        // search
        if (search) {
            const keyword = search.toLowerCase();
            return (
                `${b.user_first_name} ${b.user_last_name}`.toLowerCase().includes(keyword) ||
                `${b.driver_first_name} ${b.driver_last_name}`.toLowerCase().includes(keyword) ||
                b.user_phone_number?.includes(keyword) || b.driver_phone_number?.includes(keyword)
                || b.pickup_address?.toLowerCase().includes(keyword) || b.dropoff_address?.toLowerCase().includes(keyword)
                || FormatDatetime.formatThaiDate(b.booking_date).includes(keyword) ||
                FormatDatetime.formatThaiTime(b.start_time).includes(keyword) ||
                FormatDatetime.formatThaiNumericDate(b.booking_date).includes(keyword) ||
                FormatDatetime.formatEngNumericDate(b.booking_date).includes(keyword) ||
                FormatDatetime.formatThaiShortDate(b.booking_date).includes(keyword)
                || b.booking_id.toString().includes(keyword)
            );
        }
        return true;
    });

    const totalItems = filteredBookings.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const paginatedBookings = filteredBookings.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const currentStats = useMemo(() => ({
        waiting: filteredBookings.filter(b => b.payment_status === "waiting_verify").length,
        verified: filteredBookings.filter(b => b.payment_status === "verified").length,
        // rejected: filteredBookings.filter(b => b.payment_status === "rejected").length,
    }), [filteredBookings]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, search, selectedDate]);

    const handleConfirmSlip = async (status: string) => {
        if (!selected) return;
        try {
            setConfirming(true);
            const res = await fetch(`/api/booking/admin/${selected.booking_id}/handle-slip`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ status: status }),
            });

            const data = await res.json();
            if (!res.ok) {
                toast.error(data.message || "เกิดข้อผิดพลาด");
            } else {
                toast.success(data.message || "ยืนยันการชำระเงินเรียบร้อย");
                fetchSlip();
            }
        } catch (error) {
            console.error("HANDLE CONFIRM SLIP ERROR:", error);
        } finally {
            setConfirming(false);
            setSelected(null);
        }
    }

    const handleRejectSlip = async () => {
        if (!selected) return;
        if (!rejectReason.trim()) {
            toast.error("กรุณาระบุเหตุผล");
            return;
        }
        try {
            setRejecting(true);
            const res = await fetch(
                `/api/booking/admin/${selected.booking_id}/handle-slip`,
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        status: "rejected",
                        reason: rejectReason,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "เกิดข้อผิดพลาด");
            }

            toast.success("ปฏิเสธการชำระเงินเรียบร้อย");
            setShowRejectModal(false);
            setRejectReason("");
            setSelected(null);
            fetchSlip();
        } catch (err: any) {
            toast.error(err.message || "ไม่สามารถปฏิเสธได้");
        } finally {
            setRejecting(false);
        }
    };

    const clearFilters = () => {
        setStatusFilter("all");
        setSearch("");
        setSelectedDate("");
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <AdminSidebar activeLabel="ตรวจสอบสลิปการโอนเงิน" />

            <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 md:px-8 md:py-6 text-slate-900">
                {/* Header */}
                <AdminPageHeader
                    title="ตรวจสอบสลิปการโอนเงิน"
                    subtitle="จัดการและตรวจสอบสลิปการโอนเงินจากผู้ป่วย"
                    stats={[
                        {
                            label: "รอตรวจสอบ",
                            value: currentStats.waiting,
                            color: "amber",
                            icon: "solar:clock-circle-bold",
                        },
                        {
                            label: "ตรวจสอบแล้ว",
                            value: currentStats.verified,
                            color: "emerald",
                            icon: "solar:check-circle-bold",
                        },
                    ]}
                    tabs={[
                        { label: "ทั้งหมด", value: "all" },
                        { label: "รอตรวจสอบ", value: "waiting_verify" },
                        { label: "ตรวจสอบแล้ว", value: "verified" },
                        { label: "ปฏิเสธ", value: "rejected" },
                    ]}
                    activeTab={statusFilter}
                    onTabChange={setStatusFilter}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    search={search}
                    onSearchChange={setSearch}
                    onRefresh={fetchSlip}
                    refreshIsLoading={loading}
                    onClear={clearFilters}
                />

                {/* Content */}
                {!loading && paginatedBookings.length === 0 ? (
                    <div className="rounded-lg bg-white p-6 text-center text-slate-500 shadow">
                        ไม่พบรายการสลิปการโอนเงิน
                    </div>
                ) : (
                    <VerifiedSlipTable
                        loading={loading}
                        bookings={paginatedBookings}
                        renderStatus={renderStatus}
                        onOpenSlip={setSelected}
                        onOpenLocation={setSelectedLocation}
                    />
                )}
                <PaymentSlipModal
                    data={selected}
                    onClose={() => {
                        if (confirming) return;
                        setSelected(null);
                    }}
                    onConfirm={() => handleConfirmSlip("verified")}
                    onOpenReject={() => setShowRejectModal(true)}
                    renderStatus={renderStatus}
                    isLoading={confirming}
                />
                <RejectPaymentModal
                    open={showRejectModal}
                    reason={rejectReason}
                    loading={rejecting}
                    onChangeReason={setRejectReason}
                    onCancel={() => {
                        setShowRejectModal(false);
                        setRejectReason("");
                    }}
                    onConfirm={handleRejectSlip}
                />

                {selectedLocation && (
                    <AddressModal
                        title={selectedLocation.title}
                        icon={selectedLocation.icon}
                        iconClassName={selectedLocation.iconClassName}
                        address={selectedLocation.address}
                        onClose={() => setSelectedLocation(null)}
                    />
                )}

                {/* Pagination */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onChangePage={setCurrentPage}
                />

            </main>
        </div>
    );
}
