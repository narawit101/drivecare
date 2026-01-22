export type { UserRole, BaseProfile } from "./profile/base";
export type { UserProfile } from "./profile/user";
export type { DriverProfile } from "./profile/driver";

// รวมร่างเป็น Type เดียวที่ใช้ใน Context
export type AnyUserProfile = import("./profile/user").UserProfile | import("./profile/driver").DriverProfile;