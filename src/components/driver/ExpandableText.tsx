"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
    text: string;
    className?: string;
    clampLines?: number;
    moreLabel?: string;
    lessLabel?: string;
    modalTitle?: string;
    modalCloseLabel?: string;
};

export default function ExpandableText({
    text,
    className,
    clampLines = 2,
    moreLabel = "ดูเพิ่ม",
    lessLabel = "ย่อ",
    modalTitle = "รายละเอียด",
    modalCloseLabel = "ปิด",
}: Props) {
    const contentRef = useRef<HTMLParagraphElement>(null);
    const [isOverflowing, setIsOverflowing] = useState(false);
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    const clampClass = useMemo(() => {
        // Tailwind supports line-clamp-* utilities (project already uses line-clamp in other pages)
        return `line-clamp-${clampLines}`;
    }, [clampLines]);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const el = contentRef.current;
        if (!el) return;

        // Defer measurement after paint to allow line-clamp styles to apply.
        const raf = requestAnimationFrame(() => {
            const overflowing = el.scrollHeight > el.clientHeight + 1;
            setIsOverflowing(overflowing);
        });

        return () => cancelAnimationFrame(raf);
    }, [text, clampLines]);

    useEffect(() => {
        if (!open) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = prevOverflow;
        };
    }, [open]);

    return (
        <div className="space-y-1">
            <p ref={contentRef} className={`${clampClass} ${className ?? ""}`.trim()}>
                {text}
            </p>

            {isOverflowing && (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className="text-xs cursor-pointer font-semibold text-button-primary hover:underline"
                >
                    {moreLabel}
                </button>
            )}

            {open && (
                mounted
                    ? createPortal(
                        <div
                            className="fixed inset-0 z-100 flex items-center justify-center bg-black/40 px-4"
                            role="dialog"
                            aria-modal="true"
                            aria-label={modalTitle}
                            onClick={() => setOpen(false)}
                        >
                            <div
                                className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <h3 className="text-base font-bold text-gray-800">{modalTitle}</h3>
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="rounded-lg cursor-pointer px-3 py-1 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                                    >
                                        {modalCloseLabel}
                                    </button>
                                </div>

                                <div className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{text}</div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setOpen(false)}
                                        className="rounded-xl cursor-pointer bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                                    >
                                        {lessLabel}
                                    </button>
                                </div>
                            </div>
                        </div>,
                        document.body
                    )
                    : null
            )}
        </div>
    );
}
