"use client";

import { Icon } from "@iconify/react";

type Page = number | "...";

type PaginationProps = {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onChangePage: (page: number | ((p: number) => number)) => void;
};

function getPageNumbers(current: number, total: number): Page[] {
    const delta = 2;
    const range: Page[] = [];

    if (total <= 1) return [1]; // ⭐ สำคัญ: มีหน้าเดียวก็ยังแสดง 1

    const left = Math.max(2, current - delta);
    const right = Math.min(total - 1, current + delta);

    range.push(1);

    if (left > 2) range.push("...");

    for (let i = left; i <= right; i++) {
        range.push(i);
    }

    if (right < total - 1) range.push("...");

    range.push(total);

    return range;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onChangePage,
}: PaginationProps) {
    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <div className="flex items-center flex-col md:flex-row md:justify-between px-4 py-4 text-sm text-slate-500">
            {/* Summary */}
            <span className="mb-2 md:mb-0">
                แสดง {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, totalItems)} จาก {totalItems} รายการ
            </span>

            {/* Controls */}
            <nav className="flex items-center gap-1 flex-wrap">
                {/* First */}
                <button
                    disabled={currentPage === 1}
                    onClick={() => onChangePage(1)}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-40"
                >
                    <Icon icon="solar:double-alt-arrow-left-linear" className="w-5 h-5" />
                </button>

                {/* Prev */}
                <button
                    disabled={currentPage === 1}
                    onClick={() => onChangePage(p => Math.max(1, p as number - 1))}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-40"
                >
                    <Icon icon="solar:arrow-left-linear" className="w-5 h-5" />
                </button>

                {/* Pages */}
                {pages.map((page, index) =>
                    page === "..." ? (
                        <span key={`dots-${index}`} className="px-2 text-slate-400">
                            …
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onChangePage(page)}
                            className={`h-8 min-w-8 px-3 rounded-full text-sm font-medium transition
                ${page === currentPage
                                    ? "bg-[#70C5BE] text-white"
                                    : "border border-slate-200 text-slate-600 hover:border-[#70C5BE] hover:text-[#70C5BE]"
                                }`}
                        >
                            {page}
                        </button>
                    )
                )}

                {/* Next */}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() =>
                        onChangePage(p => Math.min(totalPages, p as number + 1))
                    }
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-40"
                >
                    <Icon icon="solar:arrow-right-linear" className="w-5 h-5" />
                </button>

                {/* Last */}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onChangePage(totalPages)}
                    className="p-1 text-slate-400 hover:text-slate-600 disabled:opacity-40"
                >
                    <Icon icon="solar:double-alt-arrow-right-linear" className="w-5 h-5" />
                </button>
            </nav>
        </div>
    );
}
