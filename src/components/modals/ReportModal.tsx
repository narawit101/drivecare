"use client";

import { useState, useRef, useEffect } from "react";
import Button from "@/components/Button";
import { Icon } from "@iconify/react";
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
    const [openDropdown, setOpenDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!openDropdown) return;

        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const el = dropdownRef.current;
            if (!el) return;
            const target = e.target as Node | null;
            if (target && el.contains(target)) return;
            setOpenDropdown(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("touchstart", onPointerDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("touchstart", onPointerDown);
        };
    }, [openDropdown]);

    const getSelectedLabel = () => {
        if (!reportType) return "เลือกประเภทปัญหา";
        const selected = reportTypes.find(r => r.value === reportType);
        return selected?.label || "เลือกประเภทปัญหา";
    };

    const handleSelect = (value: string) => {
        setReportType(value);
        setOpenDropdown(false);
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/40">
            <div className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl">
                <h3 className="text-xl font-bold mb-8 text-center">
                    {title}
                </h3>

                <div className="flex flex-col gap-6">
                    {/* Custom Dropdown */}
                    <div ref={dropdownRef} className="relative">
                        <button
                            type="button"
                            onClick={() => setOpenDropdown((v) => !v)}
                            className="w-full border-2 border-gray-200 focus:border-[#70C5BE] outline-none rounded-md p-3 text-left flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
                        >
                            <span className={reportType ? "text-gray-900" : "text-gray-500"}>
                                {getSelectedLabel()}
                            </span>
                            <Icon
                                icon="solar:alt-arrow-down-linear"
                                className={`w-5 h-5 text-gray-400 transition-transform ${openDropdown ? "rotate-180" : ""}`}
                            />
                        </button>

                        {openDropdown && (
                            <div className="absolute left-0 right-0 z-50 mt-2 rounded-lg border border-gray-200 bg-white shadow-lg max-h-60 overflow-y-auto">
                                {reportTypes.length === 0 ? (
                                    <div className="px-4 py-3 text-gray-500 text-sm">
                                        ไม่มีประเภทปัญหา
                                    </div>
                                ) : (
                                    reportTypes.map((r) => (
                                        <button
                                            key={r.value}
                                            type="button"
                                            className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${reportType === r.value ? "bg-[#70C5BE]/10" : ""
                                                }`}
                                            onClick={() => handleSelect(r.value)}
                                        >
                                            <span className="text-sm text-gray-900">{r.label}</span>
                                            {reportType === r.value && (
                                                <Icon icon="solar:check-circle-linear" className="w-5 h-5 text-[#70C5BE]" />
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

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
