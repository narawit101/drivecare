"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

type Props = {
    title: string;
    subtitle?: string;
    href?: string;
    linkLabel?: string;
    aLabel: string;
    aValue: number;
    bLabel: string;
    bValue: number;
    aColor?: string;
    bColor?: string;
    loading?: boolean;
    loadingText?: string;
};

export default function DonutCard({
    title,
    subtitle,
    href,
    linkLabel,
    aLabel,
    aValue,
    bLabel,
    bValue,
    aColor = "#10b981",
    bColor = "#f59e0b",
    loading = false,
    loadingText = "กำลังดึงข้อมูล...",
}: Props) {
    const total = aValue + bValue;
    const aPct = total > 0 ? aValue / total : 0;
    const showA = aValue > 0;
    const showB = bValue > 0;

    const { dashA, dashB } = useMemo(() => {
        const r = 44;
        const c = 2 * Math.PI * r;
        const dashA = `${(aPct * c).toFixed(2)} ${(c - aPct * c).toFixed(2)}`;
        const dashB = `${((1 - aPct) * c).toFixed(2)} ${(c - (1 - aPct) * c).toFixed(2)}`;
        return { dashA, dashB };
    }, [aPct]);

    return (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-button-primary">{title}</p>
                    {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
                </div>
                <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-[#70C5BE]/10">
                    <Icon icon="solar:verified-check-outline" className="h-5 w-5 text-button-primary" />
                </div>
            </div>

            {loading ? (
                <div className="mt-6 animate-pulse flex flex-col items-center justify-center min-h-[220px]">
                    <div className="w-5 h-5 rounded-full border-4 border-t-[#70C5BE] border-gray-100 animate-spin" />
                    <p className="mt-4 text-gray-400 font-medium text-sm">{loadingText}</p>
                </div>
            ) : (
                <div className="mt-12 flex items-center gap-5 justify-center">
                    <div className="shrink-0">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                            <circle cx="60" cy="60" r="44" stroke="#e2e8f0" strokeWidth="12" fill="none" />

                            {/* A */}
                            {showA ? (
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="44"
                                    stroke={aColor}
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={dashA}
                                    strokeLinecap="round"
                                    transform="rotate(-90 60 60)"
                                    style={{ transition: "stroke-dasharray 700ms ease" }}
                                />
                            ) : null}

                            {/* B */}
                            {showB ? (
                                <circle
                                    cx="60"
                                    cy="60"
                                    r="44"
                                    stroke={bColor}
                                    strokeWidth="12"
                                    fill="none"
                                    strokeDasharray={dashB}
                                    strokeLinecap="round"
                                    transform={`rotate(${(-90 + aPct * 360).toFixed(2)} 60 60)`}
                                    opacity={0.95}
                                    style={{ transition: "stroke-dasharray 700ms ease" }}
                                />
                            ) : null}

                            <text
                                x="60"
                                y="56"
                                textAnchor="middle"
                                fontSize="18"
                                fontWeight="700"
                                fill="currentColor"
                                className="text-button-primary"
                            >
                                {total.toLocaleString()}
                            </text>
                            <text x="60" y="74" textAnchor="middle" fontSize="10" fill="#64748b">
                                รวม
                            </text>
                        </svg>
                    </div>

                    <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: aColor }} />
                                {aLabel}
                            </span>
                            <span className="text-sm font-semibold text-button-primary">{aValue.toLocaleString()}</span>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                            <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                                {showB ? (
                                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bColor }} />
                                ) : (
                                    <span className="h-2.5 w-2.5 rounded-full border border-slate-300 bg-transparent" />
                                )}
                                {bLabel}
                            </span>
                            <span className="text-sm font-semibold text-button-primary">{bValue.toLocaleString()}</span>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-xs text-slate-500">
                            {total > 0 ? `ตรวจสอบแล้ว ${(aPct * 100).toFixed(0)}%` : "ยังไม่มีข้อมูล"}
                        </div>
                    </div>
                </div>
            )}

            {!loading && href ? (
                <div className="mt-3 flex justify-end">
                    <Link
                        href={href}
                        className="inline-flex items-center  bg-slate-50 px-3 py-1 text-xs font-semibold text-button-primary hover:underline"
                        aria-label={linkLabel ?? "ไปหน้าจัดการ"}
                    >
                        {linkLabel ?? "จัดการ"}
                    </Link>
                </div>
            ) : null}
        </div>
    );
}
