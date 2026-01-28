"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Pusher from "pusher-js";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdmin } from "@/context/AdminContext";
import { useRouter } from "next/navigation";
import MetricCard from "@/components/admin/dashboard/MetricCard";
import SimpleLineChart from "@/components/admin/dashboard/SimpleLineChart";
import DonutCard from "@/components/admin/dashboard/DonutCard";
import ReportAnalyticsCard from "@/components/admin/dashboard/ReportAnalyticsCard";
import DashboardHeaderAdmin from "@/components/admin/dashboard/DashboardHeaderAdmin";
import type { AdminDashboardResponse } from "@/types/admin/dashboard";
import { toast } from "react-toastify";

export default function AdminDashboardPage() {
  const { admin, isLoading } = useAdmin();

  const router = useRouter();
  useEffect(() => {
    if (isLoading) return;
    if (!admin) {
      router.replace('/admin/login')
    }
  }, [admin, isLoading])

  const defaults = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const month = `${y}-${m}`;
    const startOfMonth = `${y}-${m}-01`;
    const endOfMonthDate = new Date(y, now.getMonth() + 1, 0);
    const endOfMonth = `${endOfMonthDate.getFullYear()}-${String(endOfMonthDate.getMonth() + 1).padStart(2, "0")}-${String(
      endOfMonthDate.getDate()
    ).padStart(2, "0")}`;
    return { month, startOfMonth, endOfMonth };
  }, []);

  const [filterMode, setFilterMode] = useState<"month" | "range">("month");
  const [month, setMonth] = useState<string>(defaults.month);
  const [start, setStart] = useState<string>(defaults.startOfMonth);
  const [end, setEnd] = useState<string>(defaults.endOfMonth);

  const [data, setData] = useState<AdminDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const clearFilters = () => {
    setFilterMode("month");
    setMonth(defaults.month);
    setStart(defaults.startOfMonth);
    setEnd(defaults.endOfMonth);
  };

  const isRangeValid = useMemo(() => {
    if (filterMode !== "range") return true;
    if (!start || !end) return false;
    return end >= start;
  }, [end, filterMode, start]);

  const fetchDashboard = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (filterMode === "range" && (!start || !end || end < start)) return;

      try {
        if (!silent) setLoading(true);

        const qs =
          filterMode === "month"
            ? `month=${encodeURIComponent(month)}`
            : `start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`;

        const res = await fetch(`/api/admin/dashboard?${qs}`, {
          credentials: "include",
        });
        const json = await res.json();

        if (!res.ok) {
          setData(null);
          return;
        }

        setData(json as AdminDashboardResponse);
      } catch {
        setData(null);
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [end, filterMode, month, start]
  );

  const fetchDashboardRef = useRef(fetchDashboard);
  useEffect(() => {
    fetchDashboardRef.current = fetchDashboard;
  }, [fetchDashboard]);

  useEffect(() => {
    if (!isRangeValid) return;
    fetchDashboard();
  }, [fetchDashboard, isRangeValid]);

  // Realtime (Admin): mirror notifications from other admin pages.
  useEffect(() => {
    if (!admin) return;

    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    if (!key) return;

    const pusher = new Pusher(key, {
      cluster: "ap1",
      authEndpoint: "/api/pusher/auth",
      // admin uses cookie admin_token
    });

    const channelName = "private-admin";
    const channel = pusher.subscribe(channelName);

    const refreshDashboard = () => {
      // silent refresh for better UX (no spinner)
      fetchDashboardRef.current({ silent: true });
    };

    const onBookingCreated = () => {
      toast.info("มีการจองเข้ามาใหม่");
      refreshDashboard();
    };

    const onBookingReturned = () => {
      toast.info("มีงานถูกคืนเข้าระบบ");
      refreshDashboard();
    };

    const onBookingAssigned = () => {
      // keep metrics in sync (pending jobs can change)
      refreshDashboard();
    };

    const onBookingUpdated = (payload: any) => {
      const t = String(payload?.type ?? "").toUpperCase();

      if (t === "USER_SUBMIT_SLIP") {
        toast.info("มีสลิปใหม่เข้ามา");
      } else if (t === "REPORT_FROM_DRIVER") {
        toast.info("มีรายงานปัญหาใหม่จากคนขับ");
      } else if (t === "REPORT_FROM_USER") {
        toast.info("มีรายงานปัญหาใหม่จากผู้ป่วย");
      } else if (t === "USER_CANCEL_BOOKING") {
        toast.warning("มีการยกเลิกการจอง");
      } else if (t === "DRIVER_FINISH_JOB") {
        toast.success("คนขับปิดงานเรียบร้อย");
      }

      refreshDashboard();
    };

    const onReportCreated = (payload: any) => {
      const t = String(payload?.type ?? "").toUpperCase();
      if (t === "REPORT_FROM_DRIVER") toast.info("มีรายงานปัญหาใหม่จากคนขับ");
      else if (t === "REPORT_FROM_USER") toast.info("มีรายงานปัญหาใหม่จากผู้ป่วย");
      refreshDashboard();
    };

    channel.bind("booking.created", onBookingCreated);
    channel.bind("booking.returned", onBookingReturned);
    channel.bind("booking.assigned", onBookingAssigned);
    channel.bind("booking-updated", onBookingUpdated);
    channel.bind("report-created", onReportCreated);

    return () => {
      channel.unbind("booking.created", onBookingCreated);
      channel.unbind("booking.returned", onBookingReturned);
      channel.unbind("booking.assigned", onBookingAssigned);
      channel.unbind("booking-updated", onBookingUpdated);
      channel.unbind("report-created", onReportCreated);
      pusher.unsubscribe(channelName);
      pusher.disconnect();
    };
  }, [admin]);

  const dailyChart = useMemo(() => {
    const rows = data?.daily ?? [];
    return rows.map((r) => ({
      label: r.date,
      a: r.bookings_total,
      b: r.bookings_cancelled,
    }));
  }, [data]);

  const revenueLabel = useMemo(() => {
    const value = data?.totals?.revenue_verified ?? 0;
    return `฿${value.toLocaleString()}`;
  }, [data]);

  const formatThaiFullDate = (iso: string) => {
    const [y, m, d] = iso.split("-").map((n) => Number(n));
    if (!y || !m || !d) return iso;
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const rangeText = useMemo(() => {
    if (!data) return "";
    return `${formatThaiFullDate(data.range.start)} ถึง ${formatThaiFullDate(data.range.end)}`;
  }, [data]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar activeLabel="หน้าแรก" />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
        <DashboardHeaderAdmin
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          month={month}
          setMonth={setMonth}
          start={start}
          setStart={setStart}
          end={end}
          setEnd={setEnd}
          onClearFilters={clearFilters}
          onRefresh={() => fetchDashboard({ silent: false })}
          loading={loading}
        />

        {filterMode === "range" && !isRangeValid ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700">
            ช่วงวันที่ไม่ถูกต้อง: วันสิ้นสุดต้องไม่ก่อนวันเริ่มต้น
          </div>
        ) : null}

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
          <MetricCard
            title="รายได้ (เฉพาะสลิปที่ยืนยันแล้ว)"
            value={data ? revenueLabel : "-"}
            loading={loading}
            sub={data ? rangeText : ""}
            icon="tdesign:money"
            valueClassName="text-green-600"
          />
          <MetricCard
            title="การจองทั้งหมด"
            value={data ? (data.totals.bookings_total ?? 0).toLocaleString() : "-"}
            loading={loading}
            sub={data ? rangeText : ""}
            icon="solar:book-2-line-duotone"
          />
          <MetricCard
            title="การจองที่ยกเลิก"
            value={data ? (data.totals.bookings_cancelled ?? 0).toLocaleString() : "-"}
            loading={loading}
            sub={data ? rangeText : ""}
            icon="solar:close-circle-linear"
          />
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
          <MetricCard
            title="งานรอมอบหมาย"
            value={data ? (data.totals.bookings_pending ?? 0).toLocaleString() : "-"}
            loading={loading}
            sub={data ? rangeText : ""}
            icon="solar:clipboard-outline"
            href="/admin/job-assignment"
            linkLabel="จัดสรรงาน"
          />
          <MetricCard
            title="จำนวนผู้ป่วยทั้งหมด"
            value={data ? (data.totals.users_total ?? 0).toLocaleString() : "-"}
            loading={loading}
            sub=""
            icon="iconoir:user-love"
            href="/admin/manager-users?group=user"
            linkLabel="จัดการผู้ป่วย"
          />
          <MetricCard
            title="จำนวนคนขับทั้งหมด"
            value={data ? (data.totals.drivers_total ?? 0).toLocaleString() : "-"}
            loading={loading}
            sub=""
            icon="la:user-tie"
            href="/admin/manager-users?group=driver"
            linkLabel="จัดการผู้ขับ"
          />
        </section>
        <section className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5 mb-6">
          {loading ? (
            <div className="animate-pulse flex flex-col items-center h-50 justify-center">
              <div className="w-5 h-5 rounded-full border-4 border-t-[#70C5BE] border-gray-100 animate-spin"></div>
              <p className="mt-4 text-gray-400 font-medium">กำลังดึงข้อมูล</p>
            </div>
          ) : data ? (
            <SimpleLineChart
              data={dailyChart}
              aLabel="การจองทั้งหมด"
              bLabel="ยกเลิก"
              aColor="#70C5BE"
              aFill="rgba(112, 197, 190, 0.18)"
              bColor="#e63946"
            />
          ) : (
            <div className="py-16 text-center text-slate-500">ไม่สามารถดึงข้อมูลได้</div>
          )}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DonutCard
            title="สถานะการตรวจสอบสลิป"
            subtitle={data ? rangeText : undefined}
            href="/admin/verified-slip"
            linkLabel="จัดการสลิป"
            loading={loading}
            aLabel="ตรวจสอบแล้ว"
            aValue={data?.totals.slips_checked ?? 0}
            bLabel="ยังไม่ตรวจสอบ"
            bValue={data?.totals.slips_unchecked ?? 0}
            aColor="#70C5BE"
            bColor="#94a3b8"
          />

          <ReportAnalyticsCard
            answered={data?.totals.reports_answered ?? 0}
            unanswered={data?.totals.reports_unanswered ?? 0}
            loading={loading}
            href="/admin/report"
            linkLabel="จัดการรายงาน"
          />
        </section>
      </main>
    </div>
  );
}