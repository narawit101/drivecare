import type { DriverProfile, UserProfile } from "@/types/profile";

export type DriverProfileFormData = Pick<
    DriverProfile,
    "first_name" | "last_name" | "phone_number" | "car_brand" | "car_model" | "car_plate" | "city"
>;

export type DriverFormField = keyof DriverProfileFormData;

export type DriverImageField =
    | "profile_img"
    | "citizen_id_img"
    | "driving_license_img"
    | "car_img"
    | "act_img";

export type UserProfileFormData = Pick<UserProfile, "first_name" | "last_name" | "phone_number" | "address">;
export type UserFormField = keyof UserProfileFormData;
