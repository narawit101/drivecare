"use client";

import React from "react";

type ConsentCheckboxProps = {
    checked: boolean;
    onCheckedChange: (checked: boolean) => void;
    text: React.ReactNode;
    actionLabel?: string;
    onAction?: () => void;
};

export default function ConsentCheckbox({
    checked,
    onCheckedChange,
    text,
    actionLabel,
    onAction,
}: ConsentCheckboxProps) {
    return (
        <label className="flex items-start gap-3 cursor-pointer select-none">
            <span className="relative mt-0.5">
                <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={checked}
                    onChange={(e) => onCheckedChange(e.target.checked)}
                />
                <span
                    className="flex h-5 w-5 items-center justify-center rounded-md border-2 border-gray-300 bg-white shadow-sm transition-all peer-checked:border-[#70C5BE] peer-checked:bg-[#70C5BE] peer-focus-visible:ring-2 peer-focus-visible:ring-[#70C5BE]/40 peer-focus-visible:ring-offset-2"
                    aria-hidden="true"
                >
                    <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5 text-white opacity-0 transition-opacity peer-checked:opacity-100"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M20 6 9 17l-5-5" />
                    </svg>
                </span>
            </span>

            <span className="text-sm text-gray-700 leading-relaxed">
                <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-1">
                    <span>{text}</span>
                    {actionLabel && onAction ? (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onAction();
                            }}
                            className="text-[#70C5BE] font-semibold hover:underline"
                        >
                            {actionLabel}
                        </button>
                    ) : null}
                </span>
            </span>
        </label>
    );
}
