"use client";

import React, { useMemo } from "react";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
    Filler,
    type ChartOptions,
    type TooltipItem,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Datum = {
    label: string;
    a: number;
    b?: number;
};

type Props = {
    data: Datum[];
    height?: number;
    aColor?: string;
    bColor?: string;
    aFill?: string;
    aLabel?: string;
    bLabel?: string;
};

export default function SimpleLineChart({
    data,
    height = 220,
    aColor = "#16a34a",
    bColor = "#e63946",
    aFill = "rgba(34,197,94,0.14)",
    aLabel = "การจองทั้งหมด",
    bLabel = "ยกเลิก",
}: Props) {
    const parseISODate = (iso: string) => {
        const [y, m, d] = iso.split("-").map((n) => Number(n));
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
    };

    const formatThaiShort = (iso: string) => {
        const date = parseISODate(iso);
        if (!date) return iso;
        return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short" }).format(date);
    };

    const formatThaiFull = (iso: string) => {
        const date = parseISODate(iso);
        if (!date) return iso;
        return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "long", year: "numeric" }).format(date);
    };

    const hasB = useMemo(() => data.some((d) => typeof d.b === "number"), [data]);

    const labels = useMemo(() => data.map((d) => d.label), [data]);
    const aValues = useMemo(() => data.map((d) => d.a), [data]);
    const bValues = useMemo(() => data.map((d) => d.b ?? 0), [data]);

    const maxV = useMemo(() => {
        const values = hasB ? data.flatMap((d) => [d.a, d.b ?? 0]) : data.map((d) => d.a);
        return Math.max(1, ...values);
    }, [data, hasB]);

    const chartData = useMemo(
        () => ({
            labels,
            datasets: [
                {
                    label: aLabel,
                    data: aValues,
                    borderColor: aColor,
                    backgroundColor: aFill,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 2,
                    pointHoverRadius: 5,
                    borderWidth: 2,
                },
                ...(hasB
                    ? [
                        {
                            label: bLabel,
                            data: bValues,
                            borderColor: bColor,
                            backgroundColor: "transparent",
                            fill: false,
                            tension: 0.35,
                            pointRadius: 2,
                            pointHoverRadius: 5,
                            borderWidth: 2,
                        },
                    ]
                    : []),
            ],
        }),
        [aColor, aFill, aLabel, aValues, bColor, bLabel, bValues, hasB, labels]
    );

    const options: ChartOptions<"line"> = useMemo(
        () => ({
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 700,
            },
            interaction: {
                mode: "index",
                intersect: false,
            },
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: true,
                    callbacks: {
                        title: (items: TooltipItem<"line">[]) => {
                            const first = items[0];
                            return first?.label ? `วันที่ ${formatThaiFull(first.label)}` : "";
                        },
                        label: (item: TooltipItem<"line">) => {
                            const datasetLabel = item.dataset.label ?? "";
                            const value = typeof item.parsed.y === "number" ? item.parsed.y : 0;
                            return `${datasetLabel}: ${value.toLocaleString()}`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "วันที่",
                        color: "#70C5BE",
                        font: { size: 11, weight: 500 },
                    },
                    grid: {
                        display: false,
                    },
                    ticks: {
                        maxRotation: 0,
                        autoSkip: true,
                        maxTicksLimit: 10,
                        color: "#70C5BE",
                        font: { size: 11 },
                        callback: (_value, index) => {
                            const label = labels[index] ?? "";
                            return formatThaiShort(label);
                        },
                    },
                },
                y: {
                    beginAtZero: true,
                    suggestedMax: maxV,
                    title: {
                        display: true,
                        text: "จำนวนการจอง",
                        color: "#70C5BE",
                        font: { size: 11, weight: 600 },
                    },
                    grid: {
                        color: "#e2e8f0",
                    },
                    ticks: {
                        color: "#70C5BE",
                        font: { size: 11 },
                        precision: 0,
                    },
                },
            },
        }),
        [labels, maxV]
    );

    return (
        <div className="w-full">
            <div className="flex items-center justify-between gap-4 mb-3">
                <div>
                    <p className="text-sm font-semibold text-button-primary">กราฟแสดงข้อมูลการจอง</p>
                    <p className="text-xs text-slate-500">{hasB ? "" : "จำนวนการจองรายวัน"}</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: aColor }} />
                        {aLabel}
                    </span>
                    {hasB ? (
                        <span className="inline-flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bColor }} />
                            {bLabel}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="w-full overflow-x-auto">
                <div className="min-w-[860px] h-[260px]">
                    <Line data={chartData} options={options} />
                </div>
            </div>

            {/* <div className="mt-2 text-xs text-slate-400 flex items-center justify-end">
                <span>{data.length} วัน</span>
            </div> */}
        </div>
    );
}
