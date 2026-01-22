"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";

type Props = {
    children: React.ReactNode;
    minDurationMs?: number;
    fadeMs?: number;
};

export default function AdminRouteLoader({ children, minDurationMs = 200, fadeMs = 180 }: Props) {
    const pathname = usePathname();
    const disabled = pathname === "/admin/login";
    const timerRef = useRef<number | null>(null);
    const fadeRef = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const [mounted, setMounted] = useState(() => !disabled);
    const [visible, setVisible] = useState(false);

    const start = () => {
        setMounted(true);

        if (timerRef.current) window.clearTimeout(timerRef.current);
        if (fadeRef.current) window.clearTimeout(fadeRef.current);
        if (rafRef.current) window.cancelAnimationFrame(rafRef.current);

        // ensure transition runs
        setVisible(false);
        rafRef.current = window.requestAnimationFrame(() => {
            setVisible(true);
        });

        timerRef.current = window.setTimeout(() => {
            setVisible(false);
            fadeRef.current = window.setTimeout(() => {
                setMounted(false);
            }, fadeMs);
        }, minDurationMs);
    };

    useEffect(() => {
        if (disabled) {
            setVisible(false);
            setMounted(false);
            return;
        }

        start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [disabled, pathname]);

    useEffect(() => {
        return () => {
            if (timerRef.current) window.clearTimeout(timerRef.current);
            if (fadeRef.current) window.clearTimeout(fadeRef.current);
            if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
        };
    }, []);

    return (
        <>
            {children}
            {!disabled && mounted ? (
                <div
                    className={
                        "fixed inset-0 z-500 flex items-center justify-center  transition-opacity" +
                        (visible ? " opacity-100" : " opacity-0 pointer-events-none")
                    }
                    style={{ transitionDuration: `${fadeMs}ms`, backgroundColor: "rgba(255,255,255,0.70)" }}
                >
                    <div className="flex flex-col items-center gap-3">
                        <Image
                            src="/images/drive_care.png"
                            alt="Paphop"
                            width={72}
                            height={72}
                            priority
                            className="h-16 w-16 object-contain"
                        />
                        <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#70C5BE] animate-bounce [animation-delay:-0.2s]" />
                            <span className="h-2 w-2 rounded-full bg-[#70C5BE] animate-bounce [animation-delay:-0.1s]" />
                            <span className="h-2 w-2 rounded-full bg-[#70C5BE] animate-bounce" />
                        </div>
                        {/* <p className="text-sm font-semibold text-button-primary">กำลังโหลด…</p> */}
                    </div>
                </div>
            ) : null}
        </>
    );
}
