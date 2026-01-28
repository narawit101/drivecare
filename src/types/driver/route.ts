export type MapRoute = {
    startLat: number;
    startLon: number;
    endLat: number;
    endLon: number;
};

export type DisplayRoute = {
    startAddress: string;
    endAddress: string;
    isReturn: boolean;
};

export type MapPoint = {
    lat: number;
    lon: number;
};

export type MapRenderRoute = {
    start: MapPoint;
    end: MapPoint;
};

export type RouteLabel = {
    startLabel: string;
    endLabel: string;
};