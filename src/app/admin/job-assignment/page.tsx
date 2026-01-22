"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import Pusher from "pusher-js";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AddressModal from "@/components/admin/manager-users/AddressModal";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import Button from "@/components/Button";
import Pagination from "@/components/admin/common/Pagination";
import JobAssignmentMobileCards from "@/components/admin/job-assignment/JobAssignmentMobileCards";
import JobAssignmentTable from "@/components/admin/job-assignment/JobAssignmentTable";
import AssignDriverModal, {
  ActiveDriverRow,
  AssignJobSummary,
} from "@/components/admin/job-assignment/AssignDriverModal";
import { toast } from "react-toastify";
import { useAdmin } from "@/context/AdminContext";
import { useRouter } from "next/navigation";
import * as FormatDatetime from "@/utils/format-datetime";
import type { AdminBookingPoolEvent, BookingAssignedEvent } from "@/types/realtime/pusher";
import type { ApiNullDriverBookingRow, JobAssignmentJob } from "@/types/admin/job-assignment";

type SortMode = "schedule_asc" | "created_desc";



export default function JobAssignmentPage() {
  const { admin, isLoading } = useAdmin();
  const router = useRouter();
  const [jobs, setJobs] = useState<JobAssignmentJob[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(""); // yyyy-mm-dd
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortMode, setSortMode] = useState<SortMode>("created_desc");
  const [addressModal, setAddressModal] = useState<null | {
    title: string;
    address: string;
    icon: string;
    iconClassName: string;
  }>(null);

  const [drivers, setDrivers] = useState<ActiveDriverRow[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobAssignmentJob | null>(null);

  const openAddressModal = (type: "pickup" | "dropoff", address: string) => {
    if (type === "pickup") {
      setAddressModal({
        title: "จุดรับ",
        address,
        icon: "solar:map-point-linear",
        iconClassName: "text-emerald-500",
      });
      return;
    }

    setAddressModal({
      title: "จุดส่ง",
      address,
      icon: "solar:flag-linear",
      iconClassName: "text-rose-500",
    });
  };

  useEffect(() => {
    if (isLoading) return;
    if (!admin) {
      router.replace("/admin/login");
    }
  }, [admin, isLoading, router]);

  const fetchJobs = useCallback(async (mode?: SortMode) => {
    if (!admin) return;

    try {
      setLoadingJobs(true);

      const sort = mode ?? sortMode;

      const res = await fetch(
        `/api/admin/job-assignment/get-job-null-driver?sort=${sort}`,
        {
          credentials: "include",
        }
      );

      if (res.status === 404) {
        setJobs([]);
        return;
      }

      const data = (await res.json()) as {
        count?: number;
        booking?: ApiNullDriverBookingRow[];
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถดึงรายการงานได้");
      }

      const rows = data.booking ?? [];
      const mapped: JobAssignmentJob[] = rows.map((row) => {
        const bookingDateRaw = row.booking_date ?? undefined;
        const startTimeRaw = row.start_time ?? undefined;
        const createdAtRaw = row.create_at ?? undefined;

        return {
          id: String(row.booking_id),
          customerName:
            `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
            row.name ||
            "ไม่ระบุชื่อ",
          customerPhone: row.phone_number ?? "-",
          pickup: row.pickup_address ?? "-",
          destination: row.dropoff_address ?? "-",
          date: bookingDateRaw ? FormatDatetime.formatThaiDate(bookingDateRaw) : "-",
          time: startTimeRaw ? FormatDatetime.formatThaiTime(startTimeRaw) : "-",
          whenRaw: bookingDateRaw ?? createdAtRaw ?? undefined,
          bookingDateRaw,
          startTimeRaw,
          createdAtRaw,
        };
      });

      setJobs(mapped);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "ไม่สามารถดึงรายการงานได้");
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, [admin, sortMode]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Realtime: รับ event จาก server (create/return/assign) แล้วอัปเดต state ทันที (ไม่ refetch)
  useEffect(() => {
    if (!admin) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: "ap1",
      authEndpoint: "/api/pusher/auth",
      // ใช้ cookie admin_token ในการ auth
    });

    const channel = pusher.subscribe("private-admin");

    const toJobFromBooking = (booking: Record<string, unknown>): JobAssignmentJob | null => {
      const bookingId = booking.booking_id;
      if (bookingId == null) return null;

      const firstName = (booking.first_name as string | null | undefined) ?? "";
      const lastName = (booking.last_name as string | null | undefined) ?? "";
      const name = (booking.name as string | null | undefined) ?? "";
      const phone = (booking.phone_number as string | null | undefined) ?? "-";
      const pickup = (booking.pickup_address as string | null | undefined) ?? "-";
      const dropoff = (booking.dropoff_address as string | null | undefined) ?? "-";

      const bookingDateRaw = (booking.booking_date as string | null | undefined) ?? undefined;
      const startTimeRaw = (booking.start_time as string | null | undefined) ?? undefined;
      const createdAtRaw = (booking.create_at as string | null | undefined) ?? undefined;

      return {
        id: String(bookingId),
        customerName: `${firstName} ${lastName}`.trim() || name || "ไม่ระบุชื่อ",
        customerPhone: phone,
        pickup,
        destination: dropoff,
        date: bookingDateRaw ? FormatDatetime.formatThaiDate(bookingDateRaw) : "-",
        time: startTimeRaw ? FormatDatetime.formatThaiTime(startTimeRaw) : "-",
        whenRaw: bookingDateRaw ?? createdAtRaw ?? undefined,
        bookingDateRaw,
        startTimeRaw,
        createdAtRaw,
      };
    };

    const upsertPendingJob = (payload: AdminBookingPoolEvent) => {
      if (!payload.booking) return;
      const job = toJobFromBooking(payload.booking);
      if (!job) return;

      setJobs((prev) => {
        const exists = prev.some((j) => j.id === job.id);
        if (exists) {
          return prev.map((j) => (j.id === job.id ? job : j));
        }
        // ใส่เข้ามาด้านบน (งานใหม่/งานคืน)
        return [job, ...prev];
      });
    };

    const removePendingJob = (payload: BookingAssignedEvent) => {
      setJobs((prev) => prev.filter((j) => j.id !== String(payload.booking_id)));
    };

    const onReturned = (payload: AdminBookingPoolEvent) => {
      toast.info("มีงานถูกคืนเข้าระบบ");
      upsertPendingJob(payload);
    };

    const onCreated = (payload: AdminBookingPoolEvent) => {
      toast.info("มีการจองเข้ามาใหม่");
      upsertPendingJob(payload);
    };

    channel.bind("booking.created", onCreated);
    channel.bind("booking.returned", onReturned);
    channel.bind("booking.assigned", removePendingJob);

    return () => {
      pusher.unsubscribe("private-admin");
      pusher.disconnect();
    };
  }, [admin]);

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);

      const res = await fetch("/api/admin/job-assignment/get-active-driver", {
        credentials: "include",
      });

      if (res.status === 404) {
        setDrivers([]);
        return;
      }

      const data = (await res.json()) as {
        users?: ActiveDriverRow[];
        message?: string;
      };

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถดึงรายชื่อคนขับได้");
      }

      setDrivers(data.users ?? []);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "ไม่สามารถดึงรายชื่อคนขับได้");
      setDrivers([]);
    } finally {
      setLoadingDrivers(false);
    }
  };


  const sortedJobs = useMemo(() => {
    const parseDateMs = (value: unknown) => {
      const ms = Date.parse(String(value ?? ""));
      return Number.isNaN(ms) ? 0 : ms;
    };

    const parseTimeToSeconds = (time: unknown) => {
      const raw = String(time ?? "").trim();
      // Supports both "HH:mm(:ss)" and "yyyy-MM-dd HH:mm:ss".
      const m = raw.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
      if (!m) return 0;
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      const ss = Number(m[3] ?? 0);
      return hh * 3600 + mm * 60 + ss;
    };

    const list = [...jobs];

    list.sort((a, b) => {
      if (sortMode === "created_desc") {
        const diff = parseDateMs(b.createdAtRaw) - parseDateMs(a.createdAtRaw);
        if (diff !== 0) return diff;
        return Number(b.id) - Number(a.id);
      }

      const dateDiff = parseDateMs(a.bookingDateRaw) - parseDateMs(b.bookingDateRaw);
      if (dateDiff !== 0) return dateDiff;

      const timeDiff = parseTimeToSeconds(a.startTimeRaw) - parseTimeToSeconds(b.startTimeRaw);
      if (timeDiff !== 0) return timeDiff;

      const createdDiff = parseDateMs(a.createdAtRaw) - parseDateMs(b.createdAtRaw);
      if (createdDiff !== 0) return createdDiff;

      return Number(a.id) - Number(b.id);
    });

    return list;
  }, [jobs, sortMode]);

  const filteredJobs = useMemo(() => {
    return sortedJobs.filter((job) => {
      if (selectedDate) {
        const jobDate = job.bookingDateRaw
          ? FormatDatetime.formatToSearchDate(job.bookingDateRaw)
          : (job.whenRaw ? FormatDatetime.formatToSearchDate(job.whenRaw) : "");
        if (jobDate !== selectedDate) return false;
      }

      if (search) {
        const keyword = search.toLowerCase();
        const haystack = [
          job.id,
          job.customerName,
          job.customerPhone,
          job.pickup,
          job.destination,
          job.date,
          job.time,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [sortedJobs, search, selectedDate]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDate]);

  const totalItems = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  // Clamp page when total pages shrink (e.g., realtime remove or filter)
  useEffect(() => {
    setCurrentPage((p) => Math.min(Math.max(1, p), totalPages));
  }, [totalPages]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedJobs = useMemo(
    () => filteredJobs.slice(startIndex, startIndex + itemsPerPage),
    [filteredJobs, startIndex]
  );

  const clearFilters = () => {
    setSearch("");
    setSelectedDate("");
  };

  const handleChangeSortMode = (mode: SortMode) => {
    if (mode === sortMode) return;
    setSortMode(mode);
    setCurrentPage(1);
    fetchJobs(mode);
  };

  const handleOpenAssignModal = (job: JobAssignmentJob) => {
    setSelectedJob(job);
    setAssignOpen(true);
    fetchDrivers();
  };

  const handleCloseAssign = () => {
    setAssignOpen(false);
    setSelectedJob(null);
  };

  const handleSubmitAssign = async (driverId: number) => {
    if (!selectedJob) return;
    try {
      setAssignSubmitting(true);

      const res = await fetch("/api/admin/job-assignment/assign-driver", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          booking_id: selectedJob.id,
          driver_id: driverId,
        }),
      });

      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        throw new Error(data.message || "ไม่สามารถมอบหมายงานได้");
      }

      toast.success(data.message || "มอบหมายงานสำเร็จ");
      handleCloseAssign();

      // อัปเดต state ทันที (ไม่ refetch)
      setJobs((prev) => prev.filter((j) => j.id !== selectedJob.id));
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "ไม่สามารถมอบหมายงานได้");
    } finally {
      setAssignSubmitting(false);
    }
  };


  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <AdminSidebar activeLabel="จัดสรรงานให้ผู้ขับ" />
      <main className="flex flex-1 flex-col gap-6 overflow-y-auto px-4 py-4 md:px-8 md:py-6 text-slate-900">
        <AdminPageHeader
          title="การมอบหมายงาน"
          subtitle="จัดการและมอบหมายงานให้กับผู้ขับขี่"
          stats={[
            {
              label: "งานทั้งหมด",
              value: filteredJobs.length,
              color: "emerald",
              icon: "solar:clipboard-list-bold",
            }
          ]}
          tabs={[{ label: "ทั้งหมด", value: "all" }]}
          activeTab="all"
          onTabChange={() => { }}
          showTabs={false}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          search={search}
          onSearchChange={setSearch}
          extraFilters={
            <div className="flex items-center gap-2">
              <div className="text-button-primary flex gap-2 items-center">
                <span className="font-bold">เรียงตาม:</span>
                <Icon icon="si:sort-fill" width="24" height="24" />
              </div>
              <Button
                type="button"
                variant={sortMode === "created_desc" ? "primary" : "secondary"}
                className="px-3 py-2 text-sm font-semibold"
                onClick={() => handleChangeSortMode("created_desc")}
                aria-pressed={sortMode === "created_desc"}
              >
                งานเข้ามาใหม่
              </Button>
              <Button
                type="button"
                variant={sortMode === "schedule_asc" ? "primary" : "secondary"}
                className="px-3 py-2 text-sm font-semibold"
                onClick={() => handleChangeSortMode("schedule_asc")}
                aria-pressed={sortMode === "schedule_asc"}
              >
                วัน/เวลานัด
              </Button>
            </div>
          }
          onRefresh={() => {
            fetchJobs();
            fetchDrivers();
          }}
          refreshIsLoading={loadingJobs || loadingDrivers}
          onClear={clearFilters}
        />

        {/* --- Job List (Mobile Cards) --- */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          <JobAssignmentMobileCards
            loading={loadingJobs}
            jobs={pagedJobs}
            onOpenAssign={handleOpenAssignModal}
            onOpenAddressModal={openAddressModal}
          />
        </div>

        {/* --- Job Table (Desktop) --- */}
        <section className="hidden md:block">
          <JobAssignmentTable
            loading={loadingJobs}
            jobs={pagedJobs}
            onOpenAssign={handleOpenAssignModal}
            onOpenAddressModal={openAddressModal}
          />
        </section>

        {!loadingJobs && totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onChangePage={setCurrentPage}
          />
        )}

        {addressModal && (
          <AddressModal
            address={addressModal.address}
            title={addressModal.title}
            icon={addressModal.icon}
            iconClassName={addressModal.iconClassName}
            onClose={() => setAddressModal(null)}
          />
        )}

        {selectedJob && (
          <AssignDriverModal
            open={assignOpen}
            job={
              {
                bookingId: selectedJob.id,
                dateLabel: selectedJob.date,
                timeLabel: selectedJob.time,
                pickup: selectedJob.pickup,
                dropoff: selectedJob.destination,
              } satisfies AssignJobSummary
            }
            drivers={drivers}
            loadingDrivers={loadingDrivers}
            submitting={assignSubmitting}
            onClose={handleCloseAssign}
            onSubmit={handleSubmitAssign}
          />
        )}

      </main>
    </div>
  );
}

