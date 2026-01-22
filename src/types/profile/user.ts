import type { BaseProfile } from "./base";

export interface UserProfile extends BaseProfile {
    user_id: string;
    role: "user";
}
