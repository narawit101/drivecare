"use client";

import React, { useState } from "react";
import { Icon } from "@iconify/react";
import * as FormatDatetime from "@/utils/format-datetime";
import { getBookingStatusBadge } from "@/constants/booking-status";
import type { AdminBookingRow } from "@/types/admin/booking-overview";
import AddressModal from "@/components/admin/manager-users/AddressModal";

type Props = {
  loading: boolean;
  submitting: boolean;
  bookings: AdminBookingRow[];
  isEmpty: boolean;
  onOpenManage: (booking: AdminBookingRow) => void;
  onRequestDelete: (booking: AdminBookingRow) => void;
  onChangeStatus: (bookingId: number, nextStatus: string) => void | Promise<void>;
};

const toFullName = (first?: string | null, last?: string | null) => {
  const name = `${first ?? ""} ${last ?? ""}`.trim();
  return name || "ไม่ระบุชื่อ";
};

const toOptionalString = (value: string | Date | null | undefined) => {
  if (!value) return undefined;
  return value instanceof Date ? value.toISOString() : value;
};

const shortenText = (text: string, maxChars = 10) => {
  const t = text.trim();
  if (!t) return "-";
  if (t.length <= maxChars) return t;
  return `${t.slice(0, maxChars)}...`;
};

const getPaymentStatusBadge = (paymentStatus?: string | null) => {
  const s = (paymentStatus ?? "").trim();
  if (s === "waiting_verify") return { label: "รอตรวจสอบ", className: "bg-amber-100 text-amber-700" };
  if (s === "verified") return { label: "ตรวจสอบแล้ว", className: "bg-emerald-100 text-emerald-700" };
  if (s === "rejected") return { label: "ปฏิเสธ", className: "bg-rose-100 text-rose-700" };
  return { label: "ยังไม่มีสลิป", className: "bg-slate-100 text-slate-600" };
};

export default function BookingOverviewTable({
  loading,
  submitting,
  bookings,
  isEmpty,
  onOpenManage,
  onRequestDelete,
}: Props) {
  const [selectedLocation, setSelectedLocation] = useState<null | {
    title: string;
    address: string;
    icon: string;
    iconClassName: string;
  }>(null);

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-visible flex flex-col">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
          <table className="min-w-full lg:w-full divide-y divide-slate-200 text-sm" style={{ minWidth: "1150px" }}>
            <thead className="bg-[#78C6A0] text-white uppercase tracking-wide">
              <tr>
                <th className="w-[350px] px-4 py-3 text-left text-xs font-semibold uppercase">วัน/เวลาจอง</th>
                <th className="w-[81px] px-4 py-3 text-left text-xs font-semibold uppercase">ผู้ป่วย</th>
                <th className="w-[81px] px-6 py-3 text-left text-xs font-semibold uppercase">คนขับ</th>
                <th className="w-[270px] px-6 py-3 text-left text-xs font-semibold uppercase">จุดรับ</th>
                <th className="w-[270px] px-6 py-3 text-left text-xs font-semibold uppercase">จุดส่ง</th>
                <th className="w-[320px] px-4 py-3 text-left text-xs font-semibold uppercase">สถานะการจอง</th>
                <th className="w-[340px] px-4 py-3 text-left text-xs font-semibold uppercase">การชำระเงิน</th>
                <th className="w-[70px] px-6 py-3 text-center text-xs font-semibold uppercase">จัดการ</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500">
                    <div className="inline-flex items-center gap-2">
                      <Icon icon="line-md:loading-twotone-loop" className="text-2xl text-emerald-500" />
                      กำลังดึงข้อมูล
                    </div>
                  </td>
                </tr>
              )}

              {!loading && isEmpty && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-500">
                    ไม่พบรายการ
                  </td>
                </tr>
              )}

              {!loading &&
                bookings.map((b) => {
                  const userName = toFullName(b.user_first_name, b.user_last_name);
                  const driverName = b.driver_id ? toFullName(b.driver_first_name, b.driver_last_name) : "ยังไม่มีคนขับ";
                  const bookingBadge = getBookingStatusBadge(b.status);
                  const payBadge = getPaymentStatusBadge(b.payment_status);

                  return (
                    <tr key={b.booking_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex flex-col text-xs space-y-1">
                          <span className="text-slate-600 flex items-center gap-1">
                            <Icon icon="solar:calendar-date-linear" className="text-slate-400" />
                            {FormatDatetime.formatThaiShortDate(toOptionalString(b.booking_date))}
                          </span>
                          <span className="text-slate-500 flex items-center gap-1">
                            <Icon icon="solar:clock-circle-linear" className="text-slate-400" />
                            {FormatDatetime.formatThaiTime(toOptionalString(b.start_time))}
                            <span className="font-bold text-[12px]">#{b.booking_id}</span>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            {b.user_profile_img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={b.user_profile_img} alt={userName} className="h-full w-full object-cover" />
                            ) : (
                              <Icon icon="solar:user-circle-bold" className="h-8 w-8 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{userName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Icon icon="solar:phone-linear" className="text-slate-400" />
                              {b.user_phone_number ?? "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                            {b.driver_profile_img ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={b.driver_profile_img} alt={driverName} className="h-full w-full object-cover" />
                            ) : (
                              <Icon icon="solar:user-circle-bold" className="h-8 w-8 text-slate-300" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-800 truncate">{driverName}</div>
                            <div className="text-xs text-slate-500 flex items-center gap-1">
                              <Icon icon="solar:phone-linear" className="text-slate-400" />
                              {b.driver_phone_number ?? "-"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2 max-w-[300px]">
                          <Icon icon="solar:map-point-linear" className="text-emerald-500 mt-0.5 shrink-0" />
                          {b.pickup_address ? (
                            <button
                              type="button"
                              className="text-left text-slate-700 line-clamp-2 hover:underline hover:text-button-primary transition cursor-pointer"
                              title="กดเพื่อดูจุดรับ"
                              onClick={() =>
                                setSelectedLocation({
                                  title: "จุดรับ",
                                  address: b.pickup_address ?? "-",
                                  icon: "solar:map-point-linear",
                                  iconClassName: "text-emerald-500",
                                })
                              }
                            >
                              {shortenText(b.pickup_address, 20)}
                            </button>
                          ) : (
                            <span className="text-slate-700">-</span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2 max-w-[300px]">
                          <Icon icon="solar:flag-linear" className="text-rose-500 mt-0.5 shrink-0" />
                          {b.dropoff_address ? (
                            <button
                              type="button"
                              className="text-left hover:text-button-primary transition text-slate-700 line-clamp-2 hover:underline cursor-pointer"
                              title="กดเพื่อดูจุดส่ง"
                              onClick={() =>
                                setSelectedLocation({
                                  title: "จุดส่ง",
                                  address: b.dropoff_address ?? "-",
                                  icon: "solar:flag-linear",
                                  iconClassName: "text-rose-500",
                                })
                              }
                            >
                              {shortenText(b.dropoff_address, 20)}
                            </button>
                          ) : (
                            <span className="text-slate-700">-</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center gap-2">
                          <span
                            className={`inline-flex text-center items-center rounded-full px-2 py-1 text-[10px] font-semibold ${bookingBadge.className}`}
                          >
                            {bookingBadge.label}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex text-center items-center rounded-full px-2 py-1 text-[10px] font-semibold ${payBadge.className}`}
                        >
                          {payBadge.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-[#70C5BE] transition"
                            title="จัดการ"
                            onClick={() => onOpenManage(b)}
                          >
                            <Icon icon="solar:settings-linear" className="text-lg" />
                          </button>

                          <button
                            type="button"
                            disabled={submitting}
                            className="inline-flex items-center justify-center rounded-full p-2 text-rose-500 hover:bg-rose-50 transition disabled:opacity-60"
                            title="ลบการจอง"
                            onClick={() => onRequestDelete(b)}
                          >
                            <Icon icon="solar:trash-bin-trash-linear" className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLocation ? (
        <AddressModal
          title={selectedLocation.title}
          icon={selectedLocation.icon}
          iconClassName={selectedLocation.iconClassName}
          address={selectedLocation.address}
          onClose={() => setSelectedLocation(null)}
        />
      ) : null}
    </>
  );
}
