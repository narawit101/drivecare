"use client";

import React from "react";
import { Icon } from "@iconify/react";

type Props = {
    title?: string;
    description?: string;
    icon?: string;
    className?: string;
};

export default function EmptyState({
    title = "ไม่พบรายการงานในขณะนี้",
    description,
    icon = "solar:document-list-linear",
    className = "",
}: Props) {
    return (
        <div className={`bg-white rounded-3xl p-20 text-center border border-dashed ${className}`.trim()}>
            <Icon
                icon={icon}
                className="mx-auto text-5xl text-slate-200 mb-3"
            />
            <p className="text-slate-500 font-semibold">{title}</p>
            {description ? (
                <p className="text-slate-400 text-sm mt-1">{description}</p>
            ) : null}
        </div>
    );
}
