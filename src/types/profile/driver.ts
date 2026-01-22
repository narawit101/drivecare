import type { BaseProfile } from "./base";

export interface DriverProfile extends BaseProfile {
    driver_id: string;
    role: "driver";
    status: string;
    citizen_id_img: string;
    driving_license_img: string;
    car_img: string;
    act_img: string;
    car_brand: string;
    car_model: string;
    car_plate: string;
    verified: string;
    city: string;
    vehicle_plate: string;
}
