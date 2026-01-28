export type JobStatusKey =
    | "going_pickup"
    | "picked_up"
    | "heading_to_hospital"
    | "arrived_at_hospital"
    | "waiting_for_return"
    | "heading_home"
    | "arrived_home"
    | "pending_payment";

export type StatusItem = {
    key: JobStatusKey;
    label: string;
    icon?: string;
};
export const STATUS_LIST: StatusItem[] = [
    { key: "going_pickup", label: "กำลังเดินทางไปรับผู้ป่วย", icon: "mdi:car" },
    { key: "picked_up", label: "รับผู้ป่วยแล้ว", icon: "mdi:account-check" },
    { key: "heading_to_hospital", label: "ไปโรงพยาบาล", icon: "mdi:hospital" },
    { key: "arrived_at_hospital", label: "ถึงโรงพยาบาล", icon: "mdi:hospital-box" },
    { key: "waiting_for_return", label: "รอรับกลับ", icon: "mdi:clock-outline" },
    { key: "heading_home", label: "กำลังกลับ", icon: "mdi:home-map-marker" },
    { key: "arrived_home", label: "ถึงบ้านแล้ว", icon: "si:home-fill" },
    { key: "pending_payment", label: "รอชำระเงิน", icon: "mdi:cash-clock" },
];
