"use client";

import Button from "@/components/Button";
import { ReportType } from "@/types/report";


interface ReportModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: () => void;
    reportType: string;
    setReportType: (v: string) => void;
    message: string;
    setMessage: (v: string) => void;
    reportTypes: ReportType[];
    title?: string;
}

export default function ReportModal({
    open,
    onClose,
    onSubmit,
    reportType,
    setReportType,
    message,
    setMessage,
    reportTypes,
    title = "แจ้งปัญหา",
}: ReportModalProps) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-8 text-center">
                    {title}
                </h3>

                <div className="flex flex-col gap-6">
                    <select
                        className="w-full border-2 border-gray-200 focus:border-[#70C5BE] outline-none rounded-md p-2"
                        value={reportType}
                        onChange={(e) => setReportType(e.target.value)}
                    >
                        <option value="">เลือกประเภทปัญหา</option>
                        {reportTypes.map((r) => (
                            <option  key={r.value} value={r.value}>
                                {r.label}
                            </option>
                        ))}
                    </select>

                    <textarea
                        className="w-full border-2 border-gray-200 rounded-md focus:border-[#70C5BE] outline-none p-2 min-h-[140px]"
                        rows={4}
                        maxLength={220}
                        placeholder="อธิบายรายละเอียดเพิ่มเติม จำกัด 220 ตัวอักษร"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <div className="flex gap-3 mt-8">
                    <Button
                        className="flex-1"
                        variant="secondary"
                        onClick={onClose}
                    >
                        ยกเลิก
                    </Button>

                    <Button
                        className="flex-1"
                        variant="primary"
                        onClick={onSubmit}
                        disabled={!reportType || !message}
                    >
                        ส่งรายงาน
                    </Button>
                </div>
            </div>
        </div>
    );
}
