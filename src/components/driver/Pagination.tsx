"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { getPaginationRange } from "@/utils/pagination";

interface Props {
    currentPage: number;
    totalPages: number;
    onChangePage: (page: number) => void;
    siblingCount?: number;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onChangePage,
    siblingCount = 2,
    className,
}: Props) {
    if (totalPages <= 1) return null;

    const range = getPaginationRange(currentPage, totalPages, siblingCount);

    return (
        <div className={className ?? "flex justify-center items-center gap-2 pb-5 mt-5"}>
            <button
                onClick={() => onChangePage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
                aria-label="Previous page"
            >
                <Icon icon="solar:alt-arrow-left-linear" className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
                {range.map((page, index) => (
                    <button
                        key={`${page}-${index}`}
                        onClick={() => typeof page === "number" && onChangePage(page)}
                        disabled={page === "..."}
                        className={`px-4 py-2 cursor-pointer rounded-md text-sm font-medium transition-colors
                            ${currentPage === page
                                ? "bg-[#70C5BE] text-white"
                                : page === "..."
                                    ? "cursor-default text-gray-400"
                                    : "hover:bg-gray-100 text-gray-600"
                            }`}
                    >
                        {page}
                    </button>
                ))}
            </div>

            <button
                onClick={() => onChangePage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-100"
                aria-label="Next page"
            >
                <Icon icon="solar:alt-arrow-right-linear" className="w-5 h-5" />
            </button>
        </div>
    );
}
