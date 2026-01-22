"use client";
import { useRef, useCallback, useState } from "react";
import { toast } from "react-toastify";
import type { GeoPoint } from "@/types/map/geo";
import type { LongdoMap, LongdoMarker } from "@/types/map/longdo";

export function useLongdoMapDriver() {
    const mapRef = useRef<LongdoMap | null>(null);
    const currentLocationRef = useRef<GeoPoint | null>(null);
    const myLocationMarkerRef = useRef<LongdoMarker | null>(null);
    const [locationReady, setLocationReady] = useState(false);


    const initMap = useCallback((elementId: string) => {
        if (!window.longdo?.Map) return;

        const container = document.getElementById(elementId);
        if (!container) return;

        // 🔥 ถ้ามี map เก่า → ทิ้งทันที (ห้าม resize)
        if (mapRef.current) {
            try {
                mapRef.current = null;
            } catch { }
        }

        const map = new window.longdo.Map({
            placeholder: container,
            zoom: 14,
        });

        mapRef.current = map;

        // ป้องกัน map ขาว
        setTimeout(() => {
            map.resize();
        }, 0);
    }, []);

    const resizeMap = () => {
        if (mapRef.current) {
            mapRef.current.resize();
        }
    };

    const showMyLocation = () => {
        if (!mapRef.current || !window.longdo) return;

        if (!navigator.geolocation) {
            toast.error("เบราว์เซอร์ไม่รองรับ GPS");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const map = mapRef.current;
                if (!map || !window.longdo) return;

                const lat = pos.coords.latitude;
                const lon = pos.coords.longitude;

                currentLocationRef.current = { lat, lon };
                setLocationReady(true); // 🔥 บอกว่า location พร้อมแล้ว

                if (myLocationMarkerRef.current) {
                    map.Overlays.remove(myLocationMarkerRef.current);
                }

                const marker = new window.longdo.Marker(
                    { lat, lon },
                    { title: "ตำแหน่งของฉัน" }
                );

                myLocationMarkerRef.current = marker;

                map.Overlays.add(marker);
                map.location({ lat, lon }, true);
            },
            () => toast.error("ไม่สามารถดึงตำแหน่งได้")
        );
    };

    const renderRoute = (
        start: GeoPoint,
        end: GeoPoint
    ) => {
        if (!mapRef.current) return;

        const map = mapRef.current;

        map.Route.clear();

        map.Route.add(start);
        map.Route.add(end);

        map.Route.search();
    };

    const calculateDistance = (
        start: GeoPoint,
        end: GeoPoint
    ): Promise<{ distanceKm: number; durationMin: number }> => {
        return new Promise((resolve) => {
            if (!mapRef.current) {
                resolve({ distanceKm: 0, durationMin: 0 });
                return;
            }

            const map = mapRef.current;
            map.Route.clear();

            map.Route.add(start);
            map.Route.add(end);

            map.Route.search(() => {
                const distanceKm =
                    Math.round((map.Route.distance() / 1000) * 10) / 10;
                const durationMin = Math.ceil(map.Route.interval() / 60);

                resolve({ distanceKm, durationMin });
            });
        });
    };

    return {
        initMap,
        resizeMap,
        renderRoute,
        showMyLocation,
        calculateDistance,
        mapRef,
        currentLocationRef,
        locationReady,
    };
}
