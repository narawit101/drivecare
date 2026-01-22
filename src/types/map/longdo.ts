import type { GeoPoint } from "./geo";

export type LongdoMarker = unknown;

export type LongdoMap = {
    resize: () => void;
    zoom: (level?: number) => number | void;
    location: (location?: GeoPoint, animate?: boolean) => unknown;
    Overlays: {
        add: (overlay: unknown) => void;
        remove: (overlay: unknown) => void;
        clear: () => void;
    };
    Route: {
        clear: () => void;
        add: (location: GeoPoint) => void;
        search: (cb?: () => void) => void;
        distance: () => number;
        interval: () => number;
    };
};

export type LongdoGlobal = {
    Map: new (options: {
        placeholder: HTMLElement | null;
        zoom?: number;
        location?: GeoPoint;
    }) => LongdoMap;
    Marker: new (location: GeoPoint, options?: { title?: string }) => LongdoMarker;
};

declare global {
    interface Window {
        longdo?: LongdoGlobal;
    }
}

export { };
