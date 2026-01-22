export type VerificationStatus = "approved" | "pending_approval" | "rejected";

export type UserStatus = "active" | "inactive" | "banned";

export type UserGroup = "driver" | "user";

export type CityFilter = "ทั้งหมด" | "ขอนแก่น" | "ร้อยเอ็ด" | "มหาสารคาม";

export type StatusFilter = "ทั้งหมด" | UserStatus;
export type VerificationFilter = "ทั้งหมด" | VerificationStatus;

export type AdminUserRowBase = {
    id: number;
    role: UserGroup;

    // for edit modal / updates
    first_name: string;
    last_name: string;
    phone_number: string;

    // for display
    name: string;
    phone: string;
    joinedAt: string;
    avatar: string;
};

export type AdminDriverRow = AdminUserRowBase & {
    role: "driver";
    verification: VerificationStatus;
    status: UserStatus;
    city?: string;
    address?: string;
};

export type AdminCustomerRow = AdminUserRowBase & {
    role: "user";
    address?: string;
};

export type AdminUserRow = AdminDriverRow | AdminCustomerRow;

export type DeleteTarget = {
    id: number;
    name: string;
};

export type EditUserData =
    | {
        id: number;
        role: "user";
        first_name: string;
        last_name: string;
        phone_number: string;
        address: string;
    }
    | {
        id: number;
        role: "driver";
        first_name: string;
        last_name: string;
        phone_number: string;
        status: UserStatus;
        city: string;
    };
