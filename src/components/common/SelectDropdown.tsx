"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react";

export type SelectOption<T extends string> = {
    label: string;
    value: T;
    disabled?: boolean;
};

type Props<T extends string> = {
    value: T;
    options: SelectOption<T>[];
    onChange: (value: T) => void;

    placeholder?: string;
    disabled?: boolean;

    borderMode?: "always" | "focus";

    buttonClassName?: string;
    menuClassName?: string;
    optionClassName?: string;
};

export default function SelectDropdown<T extends string>({
    value,
    options,
    onChange,
    placeholder = "เลือก",
    disabled = false,
    borderMode = "always",
    buttonClassName = "",
    menuClassName = "",
    optionClassName = "",
}: Props<T>) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);

    const selected = useMemo(() => options.find((o) => o.value === value), [options, value]);
    const selectedLabel = selected?.label ?? "";

    const [open, setOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(() => {
        const idx = options.findIndex((o) => o.value === value);
        return idx >= 0 ? idx : 0;
    });

    useEffect(() => {
        const idx = options.findIndex((o) => o.value === value);
        if (idx >= 0) setActiveIndex(idx);
    }, [options, value]);

    useEffect(() => {
        if (!open) return;

        const onPointerDown = (e: MouseEvent) => {
            const el = containerRef.current;
            if (!el) return;
            if (el.contains(e.target as Node)) return;
            setOpen(false);
        };

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKeyDown);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKeyDown);
        };
    }, [open]);

    const clampIndex = (i: number) => {
        if (options.length === 0) return 0;
        if (i < 0) return options.length - 1;
        if (i >= options.length) return 0;
        return i;
    };

    const moveActive = (delta: number) => {
        if (options.length === 0) return;

        let next = clampIndex(activeIndex + delta);
        // skip disabled options
        for (let guard = 0; guard < options.length; guard++) {
            if (!options[next]?.disabled) break;
            next = clampIndex(next + delta);
        }
        setActiveIndex(next);
    };

    const selectIndex = (idx: number) => {
        const opt = options[idx];
        if (!opt || opt.disabled) return;
        onChange(opt.value);
        setOpen(false);
        buttonRef.current?.focus();
    };

    const onButtonKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) return;

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            setOpen(true);
            moveActive(e.key === "ArrowDown" ? 1 : -1);
            return;
        }

        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((v) => !v);
        }
    };

    const onMenuKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            moveActive(1);
            return;
        }
        if (e.key === "ArrowUp") {
            e.preventDefault();
            moveActive(-1);
            return;
        }
        if (e.key === "Enter") {
            e.preventDefault();
            selectIndex(activeIndex);
            return;
        }
        if (e.key === "Escape") {
            e.preventDefault();
            setOpen(false);
            buttonRef.current?.focus();
        }
    };

    return (
        <div ref={containerRef} className="relative">
            <button
                ref={buttonRef}
                type="button"
                disabled={disabled}
                onClick={() => {
                    if (disabled) return;
                    setOpen((v) => !v);
                }}
                onKeyDown={onButtonKeyDown}
                className={
                    "inline-flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition focus:outline-none focus:ring-1 focus:ring-[#70C5BE] disabled:cursor-not-allowed disabled:opacity-60 " +
                    (borderMode === "focus"
                        ? "border border-transparent focus:border-[#70C5BE] "
                        : "border border-slate-200 ") +
                    buttonClassName
                }
                aria-haspopup="listbox"
                aria-expanded={open}
            >
                <span className="truncate">{selectedLabel || placeholder}</span>
                <Icon
                    icon="solar:alt-arrow-down-linear"
                    className={"h-4 w-4 text-slate-400 transition-transform " + (open ? "rotate-180" : "")}
                />
            </button>

            {open ? (
                <div
                    role="listbox"
                    tabIndex={-1}
                    onKeyDown={onMenuKeyDown}
                    className={
                        "absolute left-0 z-50 mt-2 min-w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl " +
                        menuClassName
                    }
                >
                    <div className="max-h-72 overflow-y-auto py-1">
                        {options.map((opt, idx) => {
                            const isSelected = opt.value === value;
                            const isActive = idx === activeIndex;
                            const isDisabled = !!opt.disabled;

                            return (
                                <button
                                    key={opt.value}
                                    type="button"
                                    role="option"
                                    aria-selected={isSelected}
                                    disabled={isDisabled}
                                    onMouseEnter={() => setActiveIndex(idx)}
                                    onClick={() => selectIndex(idx)}
                                    className={
                                        "w-full px-3 py-2 text-left text-sm transition flex items-center gap-2 " +
                                        (isDisabled
                                            ? "text-slate-300 cursor-not-allowed"
                                            : "text-slate-700 hover:bg-slate-50") +
                                        (isActive ? " bg-[#70C5BE]/5" : "") +
                                        " " +
                                        optionClassName
                                    }
                                >
                                    <span className="truncate">{opt.label}</span>
                                    {isSelected ? (
                                        <Icon icon="solar:check-circle-linear" className="ml-auto h-5 w-5 text-emerald-500" />
                                    ) : null}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
