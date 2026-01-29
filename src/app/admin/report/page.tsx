"use client";

import React from "react";
import { Icon } from "@iconify/react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdmin } from "@/context/AdminContext";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import PastDatetimeContent from "@/utils/past-datetime-content";
import * as FormatDatetime from "@/utils/format-datetime";
import Pusher from "pusher-js";
import { toast } from "react-toastify";
import Button from "@/components/Button";
import ReplyReportModal from "@/components/admin/ReplyReportModal";
import ModalAssignmentAccept from "@/components/admin/report/modal-assignmemt-accept";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Pagination from "@/components/admin/common/Pagination";
import AddressModal from "@/components/admin/manager-users/AddressModal";
import ReportTable from "@/components/admin/report/ReportTable";

import {
    AdminReportResponse,
    ReportStatusFilter,
    ReportRow,
} from "@/types/admin/report";
import { flattenReports } from "@/utils/report";
import { getAllReportTypes } from "@/utils/format-report-type";

export default function AdminReportPage() {
    const { admin, isLoading } = useAdmin();
    const router = useRouter();
    const [rows, setRows] = useState<ReportRow[]>([]);
    const [reports, setReports] = useState<ReportRow[]>([]);
    const [loading, setLoading] = useState(true);

    const [statusFilter, setStatusFilter] =
        useState<ReportStatusFilter>("all");

    const [search, setSearch] = useState<string>("");
    const [selectedDate, setSelectedDate] = useState<string>(""); // yyyy-mm-dd
    const [reportTypeFilter, setReportTypeFilter] = useState<string>("");

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [selectedReport, setSelectedReport] =
        useState<ReportRow | null>(null);

    const [assignModalReport, setAssignModalReport] =
        useState<ReportRow | null>(null);

    const [replySubmitting, setReplySubmitting] = useState(false);

    const [messageModal, setMessageModal] = useState<null | {
        title: string;
        message: string;
    }>(null);

    useEffect(() => {
        if (isLoading) return;
        if (!admin) {
            router.replace('/admin/login')
        }
    }, [admin, isLoading])

    const fetchReports = async () => {
        setLoading(true);
        try {

            const res = await fetch('/api/reports/admin/fetch-reports-with-reporter', {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
            );
            if (!res.ok) {
                console.error("Failed to fetch reports");
                return;
            }
            const data: AdminReportResponse = await res.json();
            const flattened = flattenReports(data.data);
            setRows(flattened);
            console.log("FLATTENED REPORTS:", flattened);
            setReports(flattened);
            setLoading(false);
        } catch (error) {
            console.error("FETCH REPORTS ERROR:", error);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (!admin) return;

        const pusher = new Pusher(
            process.env.NEXT_PUBLIC_PUSHER_KEY!,
            {
                cluster: "ap1",
                authEndpoint: "/api/pusher/auth",
                // 🔥 สำคัญ
                // authTransport: "ajax",
                // ❌ ไม่ต้องส่ง headers ใด ๆ
                // cookie จะถูกส่งไปเอง
            }
        );

        const channelName = "private-admin";
        const channel = pusher.subscribe(channelName);

        const handler = (data: any) => {
            console.log("ADMIN REALTIME:", data);
            if (data.type === "REPORT_FROM_DRIVER") {
                toast.info("มีรายงานปัญหาใหม่จากคนขับ");
                fetchReports();
            }
            if (data.type === "REPORT_FROM_USER") {
                toast.info("มีรายงานปัญหาใหม่จากผู้ป่วย");
                fetchReports();
                ;
            }
        };
        channel.bind("report-created", handler);

        return () => {
            channel.unbind("report-created", handler);
            pusher.unsubscribe(channelName);
            pusher.disconnect();
        };
    }, [admin]);

    const filteredReports = reports.filter((r) => {
        // 🔹 status
        if (statusFilter === "replied" && r.is_replied !== true) return false;
        if (statusFilter === "unreplied" && r.is_replied !== false) return false;

        // 🔹 report type
        if (reportTypeFilter && r.report_type !== reportTypeFilter) return false;

        // 🔹 date
        if (selectedDate) {
            const bookingDateTH = FormatDatetime.formatToSearchDate(r.booking_date)
            const reportDate = FormatDatetime.formatToSearchDate(r.create_at);

            // en-CA => yyyy-mm-dd
            console.log("bookingDateTH:", bookingDateTH, "selectedDate:", selectedDate);
            if (bookingDateTH !== selectedDate && reportDate !== selectedDate) return false;
        }

        // 🔹 search
        if (search) {
            const keyword = search.toLowerCase();
            return (
                r.message.toLowerCase().includes(keyword) ||
                r.user_name.toLowerCase().includes(keyword) ||
                r.driver_name.toLowerCase().includes(keyword) ||
                r.user_phone.includes(keyword) ||
                r.driver_phone.includes(keyword) ||
                r.booking_id.toString().includes(keyword) ||
                FormatDatetime.formatThaiDate(r.booking_date).includes(keyword) ||
                FormatDatetime.formatThaiTime(r.booking_time).includes(keyword) ||
                FormatDatetime.formatThaiNumericDate(r.booking_date).includes(keyword) ||
                FormatDatetime.formatEngNumericDate(r.booking_date).includes(keyword) ||
                FormatDatetime.formatThaiShortDate(r.booking_date).includes(keyword) ||
                FormatDatetime.formatThaiShortDate(r.create_at).includes(keyword) ||
                FormatDatetime.formatThaiDate(r.create_at).includes(keyword) ||
                FormatDatetime.formatThaiTime(r.create_at).includes(keyword) ||
                FormatDatetime.formatThaiNumericDate(r.create_at).includes(keyword) ||
                FormatDatetime.formatEngNumericDate(r.create_at).includes(keyword) ||
                FormatDatetime.formatThaiShortDate(r.create_at).includes(keyword)
            );
        }

        return true;
    });


    const totalItems = filteredReports.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const currentStats = useMemo(() => ({
        waiting: filteredReports.filter(r => !r.is_replied).length,
        replied: filteredReports.filter(r => r.is_replied).length,
    }), [filteredReports]);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, search, selectedDate]);

    const submitReply = async (message: string) => {
        if (!selectedReport) return;
        try {
            setReplySubmitting(true);
            const res = await fetch("/api/reports/admin/reply-report", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include",
                body: JSON.stringify({
                    report_id: selectedReport.report_id,
                    message,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                toast.success(data.message || "ตอบรายงานสำเร็จ");
                await fetchReports();
            } else {
                toast.error(data.message || "ตอบรายงานไม่สำเร็จ");
                console.error("Failed to reply to report");
                return;
            }
        } catch (error) {
            console.error("REPLY REPORT ERROR:", error);
        } finally {
            setReplySubmitting(false);
            setSelectedReport(null);
        }
    }

    return (
        <div className="flex min-h-screen bg-slate-100">
            <AdminSidebar activeLabel="รายงานปัญหา" />

            <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 md:px-8 md:py-6 text-slate-900">
                <AdminPageHeader
                    title="การรายงานปัญหา"
                    subtitle="จัดการการรายงานของระบบ"
                    stats={[
                        {
                            label: "รอตอบกลับ",
                            value: currentStats.waiting,
                            color: "amber",
                            icon: "solar:clock-circle-bold",
                        },
                        {
                            label: "ตอบกลับแล้ว",
                            value: currentStats.replied,
                            color: "emerald",
                            icon: "solar:check-circle-bold",
                        },
                    ]}
                    tabs={[
                        { label: "ทั้งหมด", value: "all" },
                        { label: "รอตอบกลับ", value: "unreplied" },
                        { label: "ตอบกลับแล้ว", value: "replied" },
                    ]}
                    activeTab={statusFilter}
                    onTabChange={setStatusFilter}
                    selectedDate={selectedDate}
                    onDateChange={setSelectedDate}
                    search={search}
                    onSearchChange={setSearch}
                    reportTypeFilter={reportTypeFilter}
                    onReportTypeFilterChange={setReportTypeFilter}
                    onRefresh={fetchReports}
                    refreshIsLoading={loading}
                    onClear={() => {
                        setSearch("");
                        setSelectedDate("");
                        setStatusFilter("all");
                        setReportTypeFilter("");
                    }}
                />

                {!loading && filteredReports.length === 0 ? (
                    <section className="flex flex-wrap items-center gap-4 rounded-xl p-4 shadow-sm justify-center bg-white text-center">
                        <p className="text-slate-500 text-center flex items-center justify-center">ยังไม่มีรายงาน</p>
                    </section>
                ) : (
                    <section className="flex  flex-wrap items-center gap-4 rounded-xl  shadow-sm ">
                        <ReportTable
                            loading={loading}
                            reports={paginatedReports}
                            onOpenMessage={(r) =>
                                setMessageModal({
                                    title: "ข้อความรายงาน",
                                    message: r.message,
                                })
                            }
                            onSelectReport={setSelectedReport}
                            onOpenAssignModal={setAssignModalReport}
                        />
                    </section>
                )}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    itemsPerPage={ITEMS_PER_PAGE}
                    onChangePage={setCurrentPage}
                />
            </main>
            {selectedReport && (
                <ReplyReportModal
                    open
                    report={selectedReport}
                    onClose={() => {
                        if (replySubmitting) return;
                        setSelectedReport(null);
                    }}
                    onSubmit={(msg) => submitReply(msg)}
                    isSubmitting={replySubmitting}
                />
            )}

            {messageModal && (
                <AddressModal
                    address={messageModal.message}
                    title={messageModal.title}
                    icon="solar:document-text-linear"
                    iconClassName="text-[#70C5BE]"
                    onClose={() => setMessageModal(null)}
                />
            )}

            {assignModalReport && (
                <ModalAssignmentAccept
                    isOpen={true}
                    onClose={() => setAssignModalReport(null)}
                    reportData={assignModalReport}
                    fetchReports={fetchReports}
                />
            )}
        </div>
    );
}


