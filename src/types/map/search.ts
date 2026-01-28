import type { GeoPoint } from "./geo";

export type LongdoSearchItem = GeoPoint & {
    name: string;
    address: string;
    distance?: number;
};

export type LongdoSearchResponse = {
    data?: LongdoSearchItem[];
};

export type SelectedLocation = GeoPoint & {
    address: string;
    distance?: number;
};
