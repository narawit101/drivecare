export type AuthFormElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export type RegisterUserFormData = {
    firstName: string;
    lastName: string;
    phone_number: string;
    address: string;
    role: "user";
};

export type DriverRegisterStep = 1 | 2 | 3;

export type RegisterDriverFormData = {
    firstName: string;
    lastName: string;
    phone_number: string;
    status: "inactive" | "active";
    car_brand: string;
    car_model: string;
    car_plate: string;
    verified: "pending_approval" | "approved" | "rejected";
    city: string;
    role: "driver";
};

export type DriverRegisterFileField =
    | "profile_img"
    | "citizen_id_img"
    | "driving_license_img"
    | "car_img"
    | "act_img";

export type DriverRegisterFiles = Record<DriverRegisterFileField, File | null>;
export type DriverRegisterPreviews = Record<DriverRegisterFileField, string>;
