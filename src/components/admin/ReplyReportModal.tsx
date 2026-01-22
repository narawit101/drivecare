"use client";
import React, { useState } from "react";
import Button from "@/components/Button";
import * as FormatDatetime from "@/utils/format-datetime";
import { ReportRow } from "@/types/admin/report";
import { Icon } from "@iconify/react";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";

type Props = {
    open: boolean;
    report: ReportRow;
    onClose: () => void;
    onSubmit: (message: string) => void | Promise<void>;
    isSubmitting?: boolean;
};

export default function ReplyReportModal({
    open,
    report,
    onClose,
    onSubmit,
    isSubmitting,
}: Props) {
    const [message, setMessage] = useState("");

    useEscapeToClose(open && !isSubmitting, () => {
        setMessage("");
        onClose();
    });

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="absolute bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">

                {/* Header */}
                <div className="flex justify-between">
                    <p className="text-xl font-bold mb-4 text-[#70C5BE]">
                        ตอบกลับรายงาน
                    </p>
                    <div>
                        <button
                            onClick={() => {
                                if (isSubmitting) return;
                                onClose();
                            }}
                            disabled={Boolean(isSubmitting)}
                            className="absolute cursor-pointer right-4 top-4 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Icon icon="solar:close-circle-linear" className="text-xl" />
                        </button>
                    </div>
                </div>

                {/* รายละเอียด */}
                <div className="space-y-2 text-sm mb-4">
                    <p>
                        <span className="text-base text-slate-500 mb-4">รหัสการจอง (Booking ID)</span>{" "}
                        <span className="font-semibold text-slate-800">#{report.booking_id}</span>
                    </p>
                    <p>
                        <span className="text-base text-slate-500 mb-4">รหัสรายงาน (Report ID)</span>{" "}
                        <span className="font-semibold text-slate-800">#{report.report_id}</span>
                    </p>
                    <p>
                        <span className="text-base text-slate-500 mb-4">ผู้รายงาน:</span>{" "}
                        <span className="font-semibold text-slate-800">
                            {report.actor_type === "user"
                                ? ` ${report.user_name}`
                                : ` ${report.driver_name}`} {""}
                            {report.actor_type === "user" ? "(ผู้ป่วย)" : "(คนขับ)"}
                        </span>
                    </p>
                    <p>
                        <span className="text-base text-slate-500 mb-4">สถานะ:</span>{" "}
                        {report.is_replied ? (
                            <span className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-2 py-1 text-[12px] font-semibold text-emerald-600">
                                ตอบกลับแล้ว
                            </span>
                        ) : (
                            <span className="inline-flex w-fit items-center rounded-full bg-amber-100 px-2 py-1 text-[12px] font-semibold text-amber-600">
                                รอตอบกลับ
                            </span>
                        )}
                    </p>
                    <p className="text-base text-slate-500 mb-4">
                        เวลา:{" "}
                        {FormatDatetime.formatThaiShortDate(report.create_at)}{" "}
                        {FormatDatetime.formatThaiTime(report.create_at)}
                    </p>
                </div>

                {/* ข้อความต้นฉบับ */}
                <div className="mb-4 rounded-lg bg-slate-50 p-3">
                    <p className="text-base text-slate-600 mb-1 font-bold">ข้อความที่รายงาน</p>
                    <p className="text-slate-800 whitespace-pre-wrap text-sm">
                        {report.message}
                    </p>
                </div>
                {report.is_replied === false && (
                    <>
                        {/* ช่องตอบ */}
                        < textarea
                            className="w-full border-2 border-gray-200 focus:border-[#70C5BE]
                outline-none rounded-md p-3 min-h-[120px]"
                            placeholder="พิมพ์ข้อความตอบกลับ"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </>
                )}

                {report.is_replied ? (
                    <p className="text-sm text-center text-emerald-600 mt-2">คุณได้ตอบกลับรายงานนี้แล้ว</p>
                ) : (
                    <>{/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                disabled={Boolean(isSubmitting)}
                                onClick={() => {
                                    if (isSubmitting) return;
                                    setMessage("");
                                    onClose();
                                }}
                            >
                                ยกเลิก
                            </Button>

                            <Button
                                variant="primary"
                                className="flex-1"
                                disabled={!message || Boolean(isSubmitting)}
                                buttonIsLoading={Boolean(isSubmitting)}
                                onClick={async () => {
                                    if (isSubmitting) return;
                                    await onSubmit(message);
                                }}
                            >
                                ส่งตอบกลับ
                            </Button>
                        </div>
                    </>
                )}

            </div>
        </div >
    );
}
