export type UserRole = "user" | "driver";

// ฟิลด์ร่วม
export interface BaseProfile {
    first_name: string;
    last_name: string;
    name: string;
    phone_number: string;
    address: string;
    role: UserRole;
    profile_img: string;
    create_at: string;
}
