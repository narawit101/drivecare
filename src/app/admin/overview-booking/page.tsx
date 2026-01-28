"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import Pusher from "pusher-js";
import { Icon } from "@iconify/react";

import * as FormatDatetime from "@/utils/format-datetime";
import BookingManageModal from "@/components/admin/overview-booking/BookingManageModal";
import { toast } from "react-toastify";
import { BOOKING_STATUS_OPTIONS, getBookingStatusBadge, type BookingStatus } from "@/constants/booking-status";
import ConfirmDeleteModal from "@/components/admin/manager-users/ConfirmDeleteModal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Pagination from "@/components/admin/common/Pagination";
import BookingOverviewTable from "@/components/admin/overview-booking/BookingOverviewTable";
import type { AdminBookingRow } from "@/types/admin/booking-overview";
import Button from "@/components/Button";

type BookingStatusFilter = "all" | BookingStatus;

type SortMode = "created_desc" | "schedule_asc";

type StatusOption = { value: BookingStatusFilter; label: string; icon: string };

const STATUS_OPTIONS: StatusOption[] = [
  { value: "all", label: "ทุกสถานะ", icon: "solar:layers-linear" },
  ...BOOKING_STATUS_OPTIONS,
];

const toFullName = (first?: string | null, last?: string | null) => {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name || "ไม่ระบุชื่อ";
};

// booking status badge is now exact (no grouping) via getBookingStatusBadge() from constants

const toOptionalString = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
};

export default function BookingOverviewPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatusFilter>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("created_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [bookings, setBookings] = useState<AdminBookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<AdminBookingRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminBookingRow | null>(null);

  const selectedRef = useRef<AdminBookingRow | null>(null);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const sortModeRef = useRef<SortMode>(sortMode);
  useEffect(() => {
    sortModeRef.current = sortMode;
  }, [sortMode]);

  // If user is viewing a specific date, default to schedule-based sorting
  useEffect(() => {
    if (!selectedDate) return;
    setSortMode((prev) => (prev === "created_desc" ? "schedule_asc" : prev));
  }, [selectedDate]);

  const fetchBookings = useCallback(async (options?: { silent?: boolean; sort?: SortMode }) => {
    const silent = options?.silent ?? false;
    try {
      if (!silent) setLoading(true);
      const sort = options?.sort ?? sortModeRef.current;
      const res = await fetch(`/api/booking/admin/get-bookings?sort=${encodeURIComponent(sort)}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "ไม่สามารถดึงรายการจองได้");
        setBookings([]);
        return;
      }
      setBookings((data?.booking ?? []) as AdminBookingRow[]);
    } catch {
      toast.error("ไม่สามารถดึงรายการจองได้");
      setBookings([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Realtime: update table + modal state when status/payment/report changes
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!key) return;

    const pusher = new Pusher(key, {
      cluster: "ap1",
      authEndpoint: "/api/pusher/auth",
      // admin uses cookie admin_token
    });

    const channel = pusher.subscribe("private-admin");

    const getBookingIdFromPayload = (payload: any): number | null => {
      const id = payload?.booking_id ?? payload?.bookingId ?? payload?.booking?.booking_id ?? payload?.report?.booking_id;
      const num = typeof id === "string" ? Number(id) : typeof id === "number" ? id : NaN;
      return Number.isFinite(num) ? num : null;
    };

    const applyPatch = (bookingId: number, patch: Partial<AdminBookingRow>) => {
      setBookings((prev) => prev.map((b) => (b.booking_id === bookingId ? { ...b, ...patch } : b)));
      setSelected((prev) => (prev && prev.booking_id === bookingId ? { ...prev, ...patch } : prev));
    };

    const toastIfModalOpen = (bookingId: number, message: string, type: "info" | "success" | "warning" = "info") => {
      const s = selectedRef.current;
      if (!s) return;
      if (s.booking_id !== bookingId) return;
      if (type === "success") toast.success(message);
      else if (type === "warning") toast.warning(message);
      else toast.info(message);
    };

    const onBookingUpdated = (payload: any) => {
      const bookingId = getBookingIdFromPayload(payload);
      if (!bookingId) return;

      const prevSelected = selectedRef.current;
      const nextStatus = (payload?.status ?? payload?.booking?.status) as string | undefined;
      const nextPaymentStatus = (payload?.payment_status ?? payload?.booking?.payment_status) as string | undefined;
      const nextDriverId = (payload?.driver_id ?? payload?.booking?.driver_id) as number | null | undefined;

      const patch: Partial<AdminBookingRow> = {};
      if (nextStatus != null) patch.status = nextStatus;
      if (nextPaymentStatus != null) patch.payment_status = nextPaymentStatus;
      if (nextDriverId !== undefined) patch.driver_id = nextDriverId;
      if (Object.keys(patch).length > 0) applyPatch(bookingId, patch);

      const statusLabel = getBookingStatusBadge(nextStatus ?? undefined).label;
      const t = String(payload?.type ?? "").toUpperCase();
      if (t === "USER_CREATE" || String(payload?.event ?? "") === "booking.created") {
        // best-effort notice; list will refetch below
        toast.info("มีการจองเข้ามาใหม่");
      }
      if (t === "ADMIN_STATUS_UPDATE") toastIfModalOpen(bookingId, `แอดมินอัปเดตสถานะเป็น ${statusLabel}`);
      else if (t === "DRIVER_STATUS_UPDATE") toastIfModalOpen(bookingId, `คนขับอัปเดตสถานะเป็น ${statusLabel}`);
      else if (t === "DRIVER_WAITING_PAYMENT") toastIfModalOpen(bookingId, "คนขับเปลี่ยนสถานะเป็นรอชำระเงิน");
      else if (t === "DRIVER_FINISH_JOB") toastIfModalOpen(bookingId, "คนขับปิดงานเรียบร้อย", "success");
      else if (t === "USER_CANCEL_BOOKING") toastIfModalOpen(bookingId, "ผู้ป่วยยกเลิกงานนี้แล้ว", "warning");
      else if (t === "USER_SUBMIT_SLIP") toastIfModalOpen(bookingId, "ผู้ป่วยส่งสลิปชำระเงินแล้ว");
      else if (t === "ADMIN_VERIFY_PAYMENT") toastIfModalOpen(bookingId, "แอดมินยืนยันการชำระเงินแล้ว", "success");
      else if (t === "ADMIN_REJECT_PAYMENT") toastIfModalOpen(bookingId, "แอดมินปฏิเสธการชำระเงิน", "warning");
      else {
        const prevStatus = (prevSelected?.booking_id === bookingId ? (prevSelected.status ?? "").trim() : "") || undefined;
        const next = (nextStatus ?? "").trim() || undefined;
        if (prevSelected?.booking_id === bookingId && next && next !== prevStatus) {
          toastIfModalOpen(bookingId, `สถานะถูกอัปเดตเป็น ${getBookingStatusBadge(next).label}`);
        }
      }

      // Keep data in sync (best-effort)
      fetchBookings({ silent: true });
    };

    channel.bind("booking-updated", onBookingUpdated);
    channel.bind("booking.created", onBookingUpdated);
    channel.bind("booking.returned", onBookingUpdated);
    channel.bind("report-created", onBookingUpdated);

    return () => {
      channel.unbind("booking-updated", onBookingUpdated);
      channel.unbind("booking.created", onBookingUpdated);
      channel.unbind("booking.returned", onBookingUpdated);
      channel.unbind("report-created", onBookingUpdated);
      pusher.unsubscribe("private-admin");
      pusher.disconnect();
    };
  }, [fetchBookings]);

  const dateFilteredBookings = useMemo(() => {
    if (!selectedDate) return bookings;
    return bookings.filter((b) => {
      const iso = toOptionalString(b.booking_date);
      if (!iso) return false;
      return FormatDatetime.formatToSearchDate(iso) === selectedDate;
    });
  }, [bookings, selectedDate]);

  const searchFilteredBookings = useMemo(() => {
    const lowerSearch = searchTerm.trim().toLowerCase();
    if (!lowerSearch) return dateFilteredBookings;

    return dateFilteredBookings.filter((b) => {
      const bookingDateIso = toOptionalString(b.booking_date);
      const startTimeIso = toOptionalString(b.start_time);
      const thaiDate = FormatDatetime.formatThaiDate(bookingDateIso);
      const thaiShortDate = FormatDatetime.formatThaiShortDate(bookingDateIso);
      const thaiNumericDate = FormatDatetime.formatThaiNumericDate(bookingDateIso);
      const engNumericDate = FormatDatetime.formatEngNumericDate(bookingDateIso);
      const searchDate = bookingDateIso ? FormatDatetime.formatToSearchDate(bookingDateIso) : "";

      const thaiTime = FormatDatetime.formatThaiTime(startTimeIso);
      const thaiTimeNoSuffix = thaiTime.replace(/\s*น\.$/, "");

      const userName = toFullName(b.user_first_name, b.user_last_name).toLowerCase();
      const driverName = b.driver_id ? toFullName(b.driver_first_name, b.driver_last_name).toLowerCase() : "";
      const pickup = (b.pickup_address ?? "").toLowerCase();
      const dropoff = (b.dropoff_address ?? "").toLowerCase();
      const bookingId = String(b.booking_id);

      const bookingBadge = getBookingStatusBadge(b.status);

      return (
        bookingId.includes(lowerSearch) ||
        userName.includes(lowerSearch) ||
        (b.user_phone_number ?? "").includes(lowerSearch) ||
        driverName.includes(lowerSearch) ||
        (b.driver_phone_number ?? "").includes(lowerSearch) ||
        pickup.includes(lowerSearch) ||
        dropoff.includes(lowerSearch) ||
        (b.status ?? "").toLowerCase().includes(lowerSearch) ||
        (b.payment_status ?? "").toLowerCase().includes(lowerSearch) ||
        bookingBadge.label.toLowerCase().includes(lowerSearch) ||
        thaiDate.toLowerCase().includes(lowerSearch) ||
        thaiShortDate.toLowerCase().includes(lowerSearch) ||
        thaiNumericDate.toLowerCase().includes(lowerSearch) ||
        engNumericDate.toLowerCase().includes(lowerSearch) ||
        searchDate.toLowerCase().includes(lowerSearch) ||
        thaiTime.toLowerCase().includes(lowerSearch) ||
        thaiTimeNoSuffix.toLowerCase().includes(lowerSearch)
      );
    });
  }, [dateFilteredBookings, searchTerm]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: searchFilteredBookings.length };
    for (const b of searchFilteredBookings) {
      const s = (b.status ?? "").trim();
      if (!s) continue;
      counts[s] = (counts[s] ?? 0) + 1;
    }
    return counts;
  }, [searchFilteredBookings]);

  const filteredBookings = useMemo(() => {
    return searchFilteredBookings.filter((b) => {
      return statusFilter === "all" ? true : (b.status ?? "").trim() === statusFilter;
    });
  }, [searchFilteredBookings, statusFilter]);

  const sortedBookings = useMemo(() => {
    const items = [...filteredBookings];

    const toTime = (value: string | Date | null | undefined) => {
      const iso = toOptionalString(value);
      if (!iso) return null;
      const t = new Date(iso).getTime();
      return Number.isFinite(t) ? t : null;
    };

    if (sortMode === "created_desc") {
      items.sort((a, b) => {
        const at = toTime(a.create_at);
        const bt = toTime(b.create_at);
        if (at != null && bt != null && at !== bt) return bt - at;
        if (at == null && bt != null) return 1;
        if (at != null && bt == null) return -1;
        return b.booking_id - a.booking_id;
      });
      return items;
    }

    // schedule_asc
    items.sort((a, b) => {
      const ad = toTime(a.booking_date);
      const bd = toTime(b.booking_date);
      if (ad != null && bd != null && ad !== bd) return ad - bd;
      if (ad == null && bd != null) return 1;
      if (ad != null && bd == null) return -1;

      const ast = toTime(a.start_time);
      const bst = toTime(b.start_time);
      if (ast != null && bst != null && ast !== bst) return ast - bst;
      if (ast == null && bst != null) return 1;
      if (ast != null && bst == null) return -1;

      const ac = toTime(a.create_at);
      const bc = toTime(b.create_at);
      if (ac != null && bc != null && ac !== bc) return ac - bc;
      if (ac == null && bc != null) return 1;
      if (ac != null && bc == null) return -1;

      return a.booking_id - b.booking_id;
    });

    return items;
  }, [filteredBookings, sortMode]);

  const selectedStatusLabel = useMemo(() => {
    if (statusFilter === "all") return "ทั้งหมด";
    return STATUS_OPTIONS.find((opt) => opt.value === statusFilter)?.label ?? "ทั้งหมด";
  }, [statusFilter]);

  const headerStats = useMemo(
    () => [
      {
        label: selectedStatusLabel,
        value: filteredBookings.length,
        color: "emerald" as const,
        icon: "solar:clipboard-list-bold",
      },
    ],
    [filteredBookings.length, selectedStatusLabel]
  );

  const headerTabs = useMemo(
    () =>
      STATUS_OPTIONS.map((opt) => ({
        value: opt.value,
        label: `${opt.label} ${statusCounts[opt.value] ?? 0}`,
        icon: opt.icon,
      })),
    [statusCounts]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm, selectedDate, sortMode]);

  const totalItems = sortedBookings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedBookings.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, sortedBookings, ITEMS_PER_PAGE]);

  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const updateBookingStatus = async (bookingId: number, nextStatus: string) => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/booking/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "เปลี่ยนสถานะไม่สำเร็จ");
        return;
      }
      toast.success("เปลี่ยนสถานะสำเร็จ");
      await fetchBookings();
      setSelected((prev) => {
        if (!prev) return prev;
        if (prev.booking_id !== bookingId) return prev;
        return { ...prev, status: nextStatus };
      });
    } catch {
      toast.error("เปลี่ยนสถานะไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const closeJob = async (bookingId: number) => {
    await updateBookingStatus(bookingId, "success");
  };

  const deleteBooking = async (bookingId: number): Promise<boolean> => {
    try {
      setSubmitting(true);
      const res = await fetch(`/api/booking/admin/bookings/${bookingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.message || "ลบการจองไม่สำเร็จ");
        return false;
      }
      toast.success("ลบการจองสำเร็จ");
      await fetchBookings();
      setSelected(null);
      return true;
    } catch {
      toast.error("ลบการจองไม่สำเร็จ");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar activeLabel="รายการจอง" />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <AdminPageHeader<BookingStatusFilter>
          title="ภาพรวมการจอง"
          subtitle="ตรวจสอบสถานะและจัดการการจองทั้งหมดในระบบ"
          stats={headerStats}
          tabs={headerTabs}
          activeTab={statusFilter}
          onTabChange={setStatusFilter}
          tabsVariant="dropdown"
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          search={searchTerm}
          onSearchChange={setSearchTerm}
          extraFilters={
            <div className="flex items-center gap-3 mb-2">
              <div className="text-button-primary flex gap-2 items-center">
                <span className="font-bold">เรียงตาม:</span>
                <Icon icon="si:sort-fill" width="24" height="24" />
              </div>
              <Button
                type="button"
                variant={sortMode === "created_desc" ? "primary" : "secondary"}
                onClick={() => {
                  setSortMode("created_desc");
                  fetchBookings({ sort: "created_desc" });
                }}
                className="px-3 py-1.5 text-sm font-semibold"
                aria-pressed={sortMode === "created_desc"}
              >
                งานเข้ามาใหม่
              </Button>
              <Button
                type="button"
                variant={sortMode === "schedule_asc" ? "primary" : "secondary"}
                onClick={() => {
                  setSortMode("schedule_asc");
                  fetchBookings({ sort: "schedule_asc" });
                }}
                className="px-3 py-1.5 text-sm font-semibold"
                aria-pressed={sortMode === "schedule_asc"}
              >
                ตามวัน/เวลานัด
              </Button>
            </div>
          }
          onRefresh={() => fetchBookings()}
          refreshIsLoading={loading}
          onClear={() => {
            setSearchTerm("");
            setSelectedDate("");
            setStatusFilter("all");
            setSortMode("created_desc");
          }}
        />

        <BookingOverviewTable
          loading={loading}
          submitting={submitting}
          bookings={paginatedBookings}
          isEmpty={sortedBookings.length === 0}
          onOpenManage={setSelected}
          onRequestDelete={setDeleteTarget}
          onChangeStatus={updateBookingStatus}
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          itemsPerPage={ITEMS_PER_PAGE}
          onChangePage={setCurrentPage}
        />
      </main>

      <BookingManageModal
        open={Boolean(selected)}
        booking={selected}
        submitting={submitting}
        onClose={() => setSelected(null)}
        onChangeStatus={updateBookingStatus}
        onCloseJob={closeJob}
      />

      {deleteTarget && (
        <ConfirmDeleteModal
          name={`การจอง #${deleteTarget.booking_id}`}
          isLoading={submitting}
          onCancel={() => {
            if (submitting) return;
            setDeleteTarget(null);
          }}
          onConfirm={async () => {
            const id = deleteTarget.booking_id;
            const ok = await deleteBooking(id);
            if (ok) setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}
