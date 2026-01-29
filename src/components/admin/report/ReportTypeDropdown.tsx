"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "@iconify/react";
import { USER_REPORT_TYPES, DRIVER_REPORT_TYPES } from "@/constants/reports/report-types";

type Props = {
    value: string;
    onChange: (value: string) => void;
    className?: string;
};

export default function ReportTypeDropdown({ value, onChange, className = "" }: Props) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: MouseEvent | TouchEvent) => {
            const el = dropdownRef.current;
            if (!el) return;
            const target = e.target as Node | null;
            if (target && el.contains(target)) return;
            setOpen(false);
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("touchstart", onPointerDown);

        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("touchstart", onPointerDown);
        };
    }, [open]);

    const getSelectedLabel = () => {
        if (!value) return "ทุกประเภทรายงาน";
        
        // Check in user report types
        const userType = USER_REPORT_TYPES.find(type => type.value === value);
        if (userType) return userType.label;
        
        // Check in driver report types  
        const driverType = DRIVER_REPORT_TYPES.find(type => type.value === value);
        if (driverType) return driverType.label;
        
        return "ทุกประเภทรายงาน";
    };

    const handleSelect = (typeValue: string) => {
        onChange(typeValue);
        setOpen(false);
    };

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className=" w-full rounded-lg border border-gray-200 bg-white py-3 pl-4 pr-10 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition focus:outline-none focus:ring-1 focus:ring-[#70C5BE] appearance-none cursor-pointer text-left"
            >
                {getSelectedLabel()}
            </button>
            <Icon
                icon="solar:alt-arrow-down-linear"
                className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
            />

            {open && (
                <div className="absolute left-0 z-50 mt-2 min-w-[280px] rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                    <div className="max-h-80 overflow-y-auto">
                        {/* All Reports */}
                        <button
                            type="button"
                            className={`w-full px-4 py-3 text-left transition flex items-center gap-2 hover:bg-slate-50 ${!value ? "bg-[#70C5BE]/5" : ""}`}
                            onClick={() => handleSelect("")}
                        >
                            <span className="text-sm font-semibold text-slate-700">ทุกประเภทรายงาน</span>
                            {!value && (
                                <Icon icon="solar:check-circle-linear" className="ml-auto h-5 w-5 text-emerald-500" />
                            )}
                        </button>

                        {/* Divider */}
                        <div className="border-t border-slate-200 my-1"></div>

                        {/* User Reports */}
                        <div className="px-4 py-2 bg-slate-50">
                            <span className="text-xs font-semibold text-slate-500 uppercase">ผู้ป่วยรายงานคนขับ</span>
                        </div>
                        {USER_REPORT_TYPES.filter(type => type.value !== "OTHER").map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                className={`w-full px-4 py-3 text-left transition flex items-center gap-2 hover:bg-slate-50 ${value === type.value ? "bg-[#70C5BE]/5" : ""}`}
                                onClick={() => handleSelect(type.value)}
                            >
                                <span className="text-sm font-semibold text-slate-700">{type.label}</span>
                                {value === type.value && (
                                    <Icon icon="solar:check-circle-linear" className="ml-auto h-5 w-5 text-emerald-500" />
                                )}
                            </button>
                        ))}

                        {/* Divider */}
                        <div className="border-t border-slate-200 my-1"></div>

                        {/* Driver Reports */}
                        <div className="px-4 py-2 bg-slate-50">
                            <span className="text-xs font-semibold text-slate-500 uppercase">คนขับรายงานผู้ป่วย</span>
                        </div>
                        {DRIVER_REPORT_TYPES.filter(type => type.value !== "OTHER").map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                className={`w-full px-4 py-3 text-left transition flex items-center gap-2 hover:bg-slate-50 ${
                                    value === type.value ? "bg-[#70C5BE]/5" : ""
                                } ${
                                    type.value === "JOB_CANCEL" 
                                        ? "bg-rose-50 hover:bg-rose-100 border-l-4 border-rose-500" 
                                        : ""
                                }`}
                                onClick={() => handleSelect(type.value)}
                            >
                                <span className={`text-sm font-semibold ${
                                    type.value === "JOB_CANCEL" 
                                        ? "text-rose-700" 
                                        : "text-slate-700"
                                }`}>
                                    {type.label}
                                </span>
                                {value === type.value && (
                                    < div className={`ml-auto h-5 w-5 ${
                                        type.value === "JOB_CANCEL" 
                                            ? "text-rose-500" 
                                            : "text-emerald-500"
                                    }`} />
                                )}
                                {type.value === "JOB_CANCEL" && (
                                    <Icon icon="solar:danger-triangle-bold" className="ml-auto h-5 w-5 text-rose-500" />
                                )}
                            </button>
                        ))}

                        {/* Divider */}
                        <div className="border-t border-slate-200 my-1"></div>

                        {/* Other - Single Option */}
                        <button
                            type="button"
                            className={`w-full px-4 py-3 text-left transition flex items-center gap-2 hover:bg-slate-50 ${value === "OTHER" ? "bg-[#70C5BE]/5" : ""}`}
                            onClick={() => handleSelect("OTHER")}
                        >
                            <span className="text-sm font-semibold text-slate-700">อื่น ๆ</span>
                            {value === "OTHER" && (
                                <Icon icon="solar:check-circle-linear" className="ml-auto h-5 w-5 text-emerald-500" />
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
