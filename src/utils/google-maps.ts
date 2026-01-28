import type { MapPoint } from "@/types/driver/route";

export type GoogleMapsTravelMode = "driving" | "walking" | "bicycling" | "transit";

export function buildGoogleMapsDirectionsUrl(
  start: MapPoint,
  end: MapPoint,
  travelMode: GoogleMapsTravelMode = "driving"
): string {
  const origin = `${start.lat},${start.lon}`;
  const destination = `${end.lat},${end.lon}`;

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", origin);
  url.searchParams.set("destination", destination);
  url.searchParams.set("travelmode", travelMode);

  return url.toString();
}

export function openGoogleMapsDirections(
  start: MapPoint,
  end: MapPoint,
  travelMode: GoogleMapsTravelMode = "driving"
): void {
  const url = buildGoogleMapsDirectionsUrl(start, end, travelMode);

  if (typeof window === "undefined") return;
  window.open(url, "_blank", "noopener,noreferrer");
}

export function openGoogleMapsDirectionsSafe(
  start?: MapPoint | null,
  end?: MapPoint | null,
  travelMode: GoogleMapsTravelMode = "driving"
): boolean {
  if (!start || !end) return false;
  openGoogleMapsDirections(start, end, travelMode);
  return true;
}
