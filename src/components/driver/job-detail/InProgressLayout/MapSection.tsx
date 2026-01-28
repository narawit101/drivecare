import DriverMapWithActions from "@/components/driver/map/DriverMapWithActions";
import type { MapPoint, MapRenderRoute } from "@/types/driver/route";


interface MapSectionProps {
    initMap: (map: string) => void;
    onMapReady: () => void;
    mapReady: boolean;
    showMyLocation: () => void;
    openGoogleMap: (start: MapPoint, end: MapPoint) => void;
    mapRoute: MapRenderRoute | null;
    routeMetrics?: { distanceKm: number; durationMin: number } | null;
}

export default function MapSection({
    initMap,
    onMapReady,
    mapReady,
    showMyLocation,
    openGoogleMap,
    mapRoute,
    routeMetrics,
}: MapSectionProps) {
    return (
        <DriverMapWithActions
            initMap={initMap}
            onMapReady={onMapReady}
            mapReady={mapReady}
            showMyLocation={showMyLocation}
            openGoogleMap={openGoogleMap}
            mapRoute={mapRoute}
            routeMetrics={routeMetrics}
        />
    );
}
