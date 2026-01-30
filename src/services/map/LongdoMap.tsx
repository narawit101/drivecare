"use client";

import Script from "next/script";
import { useEffect } from "react";

// Ensure global typings for `window.longdo` are included
import type { } from "@/types/map/longdo";

type Props = {
    initMap: (elementId: string) => void;
    onReady?: () => void;
};

export default function LongdoMap({ initMap, onReady }: Props) {
    useEffect(() => {
        const timer = setInterval(() => {
            if (window.longdo?.Map && document.getElementById("map")) {
                initMap("map");
                onReady?.();
                clearInterval(timer);
            }
        }, 100);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative w-full h-[520px] md:h-[300px] bg-slate-100 rounded-xl overflow-hidden">
            <Script
                src={`https://api.longdo.com/map/?key=${process.env.NEXT_PUBLIC_LONGDO_MAP_KEY}`}
                strategy="afterInteractive"
            />
            <div id='map'
                className="w-full h-full rounded-xl" />
        </div>
    );
}
