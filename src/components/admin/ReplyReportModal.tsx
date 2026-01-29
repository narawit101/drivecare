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
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800">
                            ตอบกลับรายงาน
                        </h2>
                        <button
                            onClick={() => {
                                if (isSubmitting) return;
                                onClose();
                            }}
                            disabled={Boolean(isSubmitting)}
                            className="text-slate-400 hover:text-slate-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Icon icon="solar:close-circle-linear" className="text-2xl" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-slate-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-slate-700 mb-3">ข้อมูลรายงาน</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">รหัสการจอง:</span>
                                    <span className="font-medium text-slate-700">#{report.booking_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">รหัสรายงาน:</span>
                                    <span className="font-medium text-slate-700">#{report.report_id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">ผู้รายงาน:</span>
                                    <span className="font-medium text-slate-700">
                                        {report.reporter_name} ({report.actor_type === "user" ? "ผู้ป่วย" : "คนขับ"})
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">สถานะ:</span>
                                    <div>
                                        {report.is_replied ? (
                                            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-[12px] font-semibold text-emerald-600">
                                                ตอบกลับแล้ว
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-1 text-[12px] font-semibold text-amber-600">
                                                รอตอบกลับ
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">เวลา:</span>
                                    <span className="font-medium text-slate-700">
                                        {FormatDatetime.formatThaiShortDate(report.create_at)} {FormatDatetime.formatThaiTime(report.create_at)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-50 p-4 rounded-lg">
                            <h3 className="font-semibold text-amber-700 mb-2">ข้อความที่รายงาน</h3>
                            <p className="text-sm text-amber-600 whitespace-pre-wrap">
                                {report.message}
                            </p>
                        </div>
                        {report.is_replied === false && (
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                    ข้อความตอบกลับ:
                                </label>
                                <textarea
                                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-[#70C5BE] focus:border-transparent min-h-[120px]"
                                    placeholder="พิมพ์ข้อความตอบกลับ"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                />
                            </div>
                        )}

                        {report.is_replied ? (
                            <div className="text-center py-4">
                                <p className="text-sm text-emerald-600 font-medium">คุณได้ตอบกลับรายงานนี้แล้ว</p>
                            </div>
                        ) : (
                            <div className="flex gap-3 mt-6 items-center justify-center w-full">
                                <Button
                                    variant="secondary"
                                    className="w-full"
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
                                    className="w-full"
                                    disabled={!message || Boolean(isSubmitting)}
                                    onClick={async () => {
                                        if (isSubmitting) return;
                                        await onSubmit(message);
                                    }}
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <Icon icon="solar:loading-linear" className="animate-spin" />
                                            กำลังส่ง...
                                        </div>
                                    ) : (
                                        "ส่งตอบกลับ"
                                    )}
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
