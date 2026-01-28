"use client";
import { useRef, useCallback } from "react";
import { Locations } from "./location";
import type { GeoPoint } from "@/types/map/geo";
import type { LongdoMap } from "@/types/map/longdo";

export function useLongdoMap() {
  const mapRef = useRef<LongdoMap | null>(null);

  const initMap = useCallback((elementId: string) => {
    if (mapRef.current || !window.longdo) return;

    const map = new window.longdo.Map({
      placeholder: document.getElementById(elementId),
      zoom: 14,
      location: { lon: 100.56, lat: 13.74 },
    });

    mapRef.current = map;
  }, []);

  const addMarker = (location: Locations, title?: string) => {
    if (!mapRef.current || !window.longdo) return;

    const marker = new window.longdo.Marker(
      { lon: location.lon, lat: location.lat },
      { title }
    );
    mapRef.current.Overlays.add(marker);
    mapRef.current.location();
  };

  const renderRoute = (start: GeoPoint, end: GeoPoint) => {
    if (!mapRef.current || !window.longdo) return;

    const map = mapRef.current;

    // 1. เคลียร์ข้อมูลเดิม
    map.Route.clear();
    map.Overlays.clear();

    // 2. เพิ่มพิกัด (ส่งแค่ Object พิกัดเข้าไปตรงๆ จะเสถียรกว่า)
    map.Route.add({ lon: start.lon, lat: start.lat });
    map.Route.add({ lon: end.lon, lat: end.lat });

    // 3. สั่งค้นหาเส้นทาง (เรียกครั้งเดียวพอครับ)
    map.Route.search();
  };

  const clearRoute = () => {
    if (!mapRef.current || !window.longdo) return;
    mapRef.current.Route.clear();
    mapRef.current.Overlays.clear();
  };

  return { initMap, addMarker, renderRoute, clearRoute, mapRef };
}
