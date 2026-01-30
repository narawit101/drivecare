"use client";

import { Icon } from "@iconify/react";
import { toast } from "react-toastify";

import Button from "@/components/Button";
import LongdoMap from "@/services/map/LongdoMap";
import DistanceEta from "@/components/driver/DistanceEta";

import type { MapPoint, MapRenderRoute } from "@/types/driver/route";

interface Props {
    initMap: (map: string) => void;
    onMapReady: () => void;
    mapReady: boolean;
    showMyLocation: () => void;
    openGoogleMap: (start: MapPoint, end: MapPoint) => void;
    mapRoute: MapRenderRoute | null;
    routeMetrics?: { distanceKm: number; durationMin: number } | null;

    wrapperClassName?: string;
    innerClassName?: string;
}

export default function DriverMapWithActions({
    initMap,
    onMapReady,
    mapReady,
    showMyLocation,
    openGoogleMap,
    mapRoute,
    routeMetrics,
    wrapperClassName,
    innerClassName,
}: Props) {
    return (
        <div className={wrapperClassName ?? "shadow-[0_0_20px_rgba(120,198,160,0.3)] mt-2 rounded-xl"}>
            <div className={innerClassName ?? "relative rounded-xl overflow-hidden p-2 sm:p-4"}>
                {!mapReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                        กำลังโหลดแผนที่...
                    </div>
                )}

                <LongdoMap initMap={initMap} onReady={onMapReady} />

                {/*
          Mobile: flows below map (no overlap)
          md+: overlays inside map
        */}
                <div
                    className="
            mt-3
            w-full
            z-20

            md:mt-0
            md:absolute
            md:top-65
            md:right-4
          "
                >
                    <div className="flex gap-2 md:gap-3 items-stretch md:items-center justify-center flex-col md:flex-row text-sm md:text-base">
                        <div className="md:mr-2 flex justify-center w-full md:w-auto">
                            <DistanceEta
                                from={mapRoute?.start}
                                to={mapRoute?.end}
                                distanceMeters={routeMetrics ? routeMetrics.distanceKm * 1000 : undefined}
                                durationMinutes={routeMetrics ? routeMetrics.durationMin : undefined}
                            />
                        </div>

                            <Button onClick={showMyLocation} className="w-full md:w-auto py-2 px-3">
                                <div className="flex gap-2 items-center justify-center">
                                    <Icon icon="solar:map-point-wave-bold" className="text-xl animate-pulse" />
                                    <p className="text-[14px]">ตำแหน่งของฉัน</p>
                                </div>
                            </Button>

                        <Button
                            variant="secondary"
                            className="w-full md:w-auto p-2"
                            onClick={() => {
                                if (!mapRoute) {
                                    toast.info("กำลังรอตำแหน่งปัจจุบัน");
                                    return;
                                }
                                openGoogleMap(mapRoute.start, mapRoute.end);
                            }}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Icon icon="solar:map-outline" width="24" height="24" />
                                <p className="text-[12px]">เปิดใน Google Maps</p>
                            </div>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
