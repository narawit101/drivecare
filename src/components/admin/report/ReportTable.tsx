"use client";

import React from "react";
import { Icon } from "@iconify/react";
import PastDatetimeContent from "@/utils/past-datetime-content";
import * as FormatDatetime from "@/utils/format-datetime";
import Button from "@/components/Button";
import { formatReportType } from "@/utils/format-report-type";

import type { ReportRow } from "@/types/admin/report";

type Props = {
  reports: ReportRow[];
  loading?: boolean;
  onOpenMessage: (report: ReportRow) => void;
  onSelectReport: (report: ReportRow) => void;
  onOpenAssignModal: (report: ReportRow) => void;
};

export default function ReportTable({ reports, loading = false, onOpenMessage, onSelectReport, onOpenAssignModal  }: Props) {
  // Sort reports by create_at to ensure correct chronological order
  const sortedReports = [...reports].sort(
    (a, b) => new Date(b.create_at).getTime() - new Date(a.create_at).getTime()
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow overflow-x-auto w-full">
        <div className="py-16 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-5 h-5 rounded-full border-4 border-t-[#70C5BE] border-gray-100 animate-spin"></div>
            <p className="mt-4 text-gray-400 font-medium">กำลังดึงข้อมูล...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow  overflow-x-auto w-full ">
      <table
        className="min-w-full lg:w-full divide-y divide-slate-200 text-sm"
        style={{ minWidth: "1000px" }}
      >
        <thead className="bg-[#78C6A0] text-white ">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">เวลารายงาน</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">วัน/เวลาที่จอง</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ผู้รายงาน</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ประเภทรายงาน</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ข้อความ</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase">สถานะ</th>
            <th className="px-4 py-3 text-center text-xs font-semibold uppercase">จัดการ</th>
          </tr>
        </thead>

        <tbody>
          {sortedReports.map((r) => (
            <tr key={r.report_id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-slate-700 flex items-center gap-2">
                    <Icon icon="solar:calendar-linear" className="text-slate-400" />
                    {FormatDatetime.formatThaiShortDate(r.create_at)}
                  </span>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <Icon icon="solar:clock-circle-linear" className="text-slate-400" />
                    <span>{FormatDatetime.formatThaiTime(r.create_at)}</span>
                    <span className="text-slate-500/70">({PastDatetimeContent.getContent(r.create_at)})</span>
                  </div>
                </div>
              </td>

              <td className="px-4 py-3">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-slate-700 flex items-center gap-2">
                    <Icon icon="solar:calendar-linear" className="text-slate-400" />
                    {FormatDatetime.formatThaiDate(r.booking_date)}
                  </span>
                  <span className="text-slate-500 flex items-center text-xs gap-2">
                    <Icon icon="solar:clock-circle-linear" className="text-slate-400" />
                    {FormatDatetime.formatThaiTime(r.booking_time)}
                    <span className="font-bold text-[12px]">#{r.booking_id}</span>

                  </span>

                </div>
              </td>

              <td className="px-4 py-3 ">
                <p className="font-medium">{r.reporter_name}</p>
                <p className="text-xs text-slate-500">{r.actor_type === "user" ? "ผู้ป่วย" : "คนขับ"}</p>
              </td>

              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                  {formatReportType(r.report_type)}
                </span>
              </td>

              <td className="line-clamp-3 max-w-40 mt-1 flex items-center justify-center pt-5">
                <button
                  type="button"
                  onClick={() => onOpenMessage(r)}
                  className="block w-full text-left text-slate-700 hover:text-[#70C5BE] hover:underline transition line-clamp-3"
                >
                  {r.message}
                </button>
              </td>

              <td className="px-4 py-3 text-center">
                {r.is_replied ? (
                  <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-1 text-[12px] font-semibold text-emerald-600">
                    ตอบกลับแล้ว
                  </span>
                ) : (
                  <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-1 text-[12px] font-semibold text-amber-600">
                    รอตอบกลับ
                  </span>
                )}
              </td>

              <td className="px-4 py-3 text-center ">
                <div className="flex items-center justify-center gap-2">
                  {r.report_type === "JOB_CANCEL" && !r.is_replied && (
                    <Button
                      className="bg-[#70C5BE] hover:bg-[#5bb1aa] text-white"
                      onClick={() => onOpenAssignModal(r)}
                    >
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Icon icon="solar:clipboard-list-bold" width="16" height="16" />
                        มอบหมายงาน
                      </div>
                    </Button>
                  )}
                  {!r.is_replied && r.report_type !== "JOB_CANCEL" ? (
                    <Button className="" onClick={() => onSelectReport(r)}>
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Icon icon="fa:mail-reply-all" width="16" height="16" />
                        ตอบกลับ
                      </div>
                    </Button>
                  ) : r.is_replied && r.report_type !== "JOB_CANCEL" ? (
                    <Button variant="secondary" onClick={() => onSelectReport(r)}>
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Icon icon="mdi:history" width="16" height="16" />
                        ดูประวัติ
                      </div>
                    </Button>
                  ) : r.is_replied && r.report_type === "JOB_CANCEL" ? (
                    <Button variant="secondary" onClick={() => onSelectReport(r)}>
                      <div className="flex items-center gap-2 text-sm font-bold">
                        <Icon icon="mdi:history" width="16" height="16" />
                        ดูประวัติ
                      </div>
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
