"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";

type Props = {
    title: string;
    value: React.ReactNode;
    sub?: string;
    icon: string;
    href?: string;
    linkLabel?: string;
    iconBgClassName?: string;
    iconClassName?: string;
    valueClassName?: string;
    loading?: boolean;
    loadingText?: string;
};

export default function MetricCard({
    title,
    value,
    sub,
    icon,
    href,
    linkLabel,
    iconBgClassName = "bg-[#70C5BE]/10",
    iconClassName = "text-button-primary",
    valueClassName = "text-button-primary",
    loading = false,
    loadingText = "กำลังดึงข้อมูล...",
}: Props) {
    const renderedValue = loading ? (
        <span className="inline-flex items-center gap-2 text-slate-400">
            <span
                className="h-5 w-5 rounded-full border-4 border-t-[#70C5BE] border-gray-100 animate-spin"
                aria-hidden
            />
            <span className="text-sm font-medium">{loadingText}</span>
        </span>
    ) : (
        value
    );

    return (
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 ">
                    <p className="text-sm font-bold text-button-primary">{title}</p>
                    <p
                        className={`mt-1 text-2xl font-semibold truncate ${
                            loading ? "text-slate-400" : valueClassName
                        }`}
                    >
                        {renderedValue}
                    </p>
                    {sub ? <p className="mt-1 text-xs text-slate-400">{sub}</p> : null}
                    {href ? (
                        <Link
                            href={href}
                            className="mt-2 inline-flex text-xs font-semibold text-button-primary hover:underline"
                            aria-label={linkLabel ? `${title}: ${linkLabel}` : title}
                        >
                            {linkLabel ?? "ดูเพิ่มเติม"}
                        </Link>
                    ) : null}
                </div>
                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${iconBgClassName}`}>
                    <Icon icon={icon} className={`h-5 w-5 ${iconClassName}`} />
                </div>
            </div>
        </div>
    );
}
