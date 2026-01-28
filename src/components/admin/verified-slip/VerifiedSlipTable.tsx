"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Button from "@/components/Button";
import PastDatetimeContent from "@/utils/past-datetime-content";
import * as FormatDatetime from "@/utils/format-datetime";
import type { BookingSlip } from "@/types/admin/bookingSlip";

type SelectedLocation = {
    title: string;
    address: string;
    icon: string;
    iconClassName: string;
};

type Props = {
    bookings: BookingSlip[];
    loading?: boolean;
    renderStatus: (status: string) => React.ReactNode;
    onOpenSlip: (booking: BookingSlip) => void;
    onOpenLocation: (location: SelectedLocation) => void;
};

export default function VerifiedSlipTable({
    bookings,
    loading = false,
    renderStatus,
    onOpenSlip,
    onOpenLocation,
}: Props) {
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
                className="min-w-full table-fixed divide-y divide-slate-200 text-sm"
                style={{ minWidth: "1100px" }}
            >
                <thead className="bg-[#78C6A0] text-white ">
                    <tr>
                        <th className="w-[170px] px-4 py-3 text-left text-xs font-semibold uppercase">วัน/เวลาจอง</th>
                        <th className="w-[170px] px-4 py-3 text-left text-xs font-semibold uppercase">ผู้ป่วย</th>
                        <th className="w-[170px] px-4 py-3 text-left text-xs font-semibold uppercase">คนขับ</th>
                        <th className="w-[280px] px-4 py-3 text-left text-xs font-semibold uppercase">จุดรับ</th>
                        <th className="w-[280px] px-4 py-3 text-left text-xs font-semibold uppercase">จุดส่ง</th>
                        <th className="w-[130px] px-4 py-3 text-left text-xs font-semibold uppercase">ยอดเงิน</th>
                        <th className="w-[200px] px-4 py-3 text-center text-xs font-semibold uppercase">สถานะ</th>
                        <th className="w-[320px] px-4 py-3 text-center text-xs font-semibold uppercase">จัดการ</th>
                    </tr>
                </thead>

                <tbody>
                    {bookings.map((item) => (
                        <tr
                            key={item.booking_id}
                            className="border-b border-slate-100 hover:bg-slate-50"
                        >
                            <td className="px-4 py-3">
                                <div className="flex flex-col gap-2">
                                    <span className="font-medium text-slate-700 flex items-center gap-2">
                                        <Icon icon="solar:calendar-linear" className="text-slate-400" />
                                        <span className="truncate">{FormatDatetime.formatThaiDate(item.booking_date)}</span>
                                    </span>
                                    <span className="text-slate-500 flex items-center gap-2 text-xs">
                                        <Icon icon="solar:clock-circle-linear" className="text-slate-400" />
                                        <span className="truncate">{FormatDatetime.formatThaiTime(item.start_time)}</span>
                                        <span className="font-bold text-[12px]">#{item.booking_id}</span>
                                    </span>
                                </div>
                            </td>

                            <td className="px-4 py-3">
                                <p className="font-medium line-clamp-2">
                                    {item.user_first_name} {item.user_last_name}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Icon icon="solar:phone-linear" />
                                    {item.user_phone_number}
                                </p>
                            </td>

                            <td className="px-4 py-3">
                                <p className="font-medium line-clamp-2">
                                    {item.driver_first_name} {item.driver_last_name}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                    <Icon icon="solar:phone-linear" />
                                    {item.driver_phone_number}
                                </p>
                            </td>

                            <td className="px-4 py-3">
                                <div className="flex items-start gap-1">
                                    <Icon
                                        icon="solar:map-point-linear"
                                        className="text-emerald-500 min-w-4 mt-0.5"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onOpenLocation({
                                                title: "จุดรับ",
                                                address: item.pickup_address ?? "-",
                                                icon: "solar:map-point-linear",
                                                iconClassName: "text-emerald-500",
                                            })
                                        }
                                        className="min-w-0 text-left text-slate-700 hover:text-[#70C5BE] hover:underline transition"
                                        title={item.pickup_address}
                                    >
                                        <span className="line-clamp-2">{item.pickup_address}</span>
                                    </button>
                                </div>
                            </td>

                            <td className="px-4 py-3">
                                <div className="flex items-start gap-1">
                                    <Icon icon="solar:flag-linear" className="text-rose-500 min-w-4 mt-0.5" />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onOpenLocation({
                                                title: "จุดส่ง",
                                                address: item.dropoff_address ?? "-",
                                                icon: "solar:flag-linear",
                                                iconClassName: "text-rose-500",
                                            })
                                        }
                                        className="min-w-0 text-left text-slate-700 hover:text-[#70C5BE] hover:underline transition"
                                        title={item.dropoff_address}
                                    >
                                        <span className="line-clamp-2">{item.dropoff_address}</span>
                                    </button>
                                </div>
                            </td>

                            <td className="px-4 py-3 text-emerald-600 font-semibold text-center">
                                ฿ {Number(item.total_price).toLocaleString()}
                            </td>

                            <td className="px-3 py-3 flex my-auto items-center justify-center">{renderStatus(item.payment_status)}</td>

                            <td className="px-4 py-3 text-center">
                                <div className="flex flex-col gap-1 items-center text-sm text-center">
                                    <Button variant="primary" onClick={() => onOpenSlip(item)}>
                                        <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-center">
                                            <Icon icon="solar:eye-bold" />
                                            ดูสลิป
                                        </div>
                                        <p className="mt-1 text-[10px] text-white italic">
                                            อัพโหลด: {PastDatetimeContent.getContent(item.payment_at)}
                                        </p>
                                    </Button>

                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
