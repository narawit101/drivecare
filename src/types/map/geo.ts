export type GeoPoint = {
    lat: number;
    lon: number;
};

export type AddressLocation = GeoPoint & {
    address: string;
};

// Backward-compatible name used across the app
export type Locations = AddressLocation;
