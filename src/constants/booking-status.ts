export const BOOKING_STATUSES = [
    "pending",
    "accepted",
    "in_progress",
    "going_pickup",
    "picked_up",
    "heading_to_hospital",
    "arrived_at_hospital",
    "waiting_for_return",
    "heading_home",
    "arrived_home",
    "pending_payment",
    "paymented",
    "success",
    "cancelled",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export type BookingStatusOption = {
    value: BookingStatus;
    label: string;
    icon: string;
};

export type BookingStatusBadge = {
    value: BookingStatus;
    label: string;
    icon: string;
    className: string;
};

const META: Record<BookingStatus, Omit<BookingStatusBadge, "value">> = {
    pending: {
        label: "รอมอบหมาย",
        icon: "solar:clock-circle-linear",
        className: "bg-slate-100 text-slate-700",
    },
    accepted: {
        label: "รับงานแล้ว",
        icon: "solar:checklist-linear",
        className: "bg-emerald-100 text-emerald-700",
    },
    in_progress: {
        label: "กำลังดำเนินงาน",
        icon: "fluent-mdl2:processing",
        className: "bg-sky-100 text-sky-700",
    },
    going_pickup: {
        label: "กำลังไปรับผู้ป่วย",
        icon: "mdi:car",
        className: "bg-sky-100 text-sky-700",
    },
    picked_up: {
        label: "รับผู้ป่วยแล้ว",
        icon: "mdi:account-check",
        className: "bg-sky-100 text-sky-700",
    },
    heading_to_hospital: {
        label: "กำลังไปโรงพยาบาล",
        icon: "solar:hospital-linear",
        className: "bg-sky-100 text-sky-700",
    },
    arrived_at_hospital: {
        label: "ถึงโรงพยาบาลแล้ว",
        icon: "solar:map-point-linear",
        className: "bg-sky-100 text-sky-700",
    },
    waiting_for_return: {
        label: "รอรับกลับ",
        icon: "solar:clock-circle-linear",
        className: "bg-sky-100 text-sky-700",
    },
    heading_home: {
        label: "กำลังเดินทางกลับ",
        icon: "solar:home-2-linear",
        className: "bg-sky-100 text-sky-700",
    },
    arrived_home: {
        label: "ถึงบ้านแล้ว",
        icon: "solar:home-smile-linear",
        className: "bg-sky-100 text-sky-700",
    },
    pending_payment: {
        label: "รอชำระเงิน",
        icon: "solar:card-linear",
        className: "bg-amber-100 text-amber-700",
    },
    paymented: {
        label: "ชำระเงินแล้ว",
        icon: "solar:wallet-linear",
        className: "bg-emerald-100 text-emerald-700",
    },
    success: {
        label: "ปิดงานเรียบร้อย",
        icon: "solar:shield-check-linear",
        className: "bg-emerald-100 text-emerald-700",
    },
    cancelled: {
        label: "ยกเลิกแล้ว",
        icon: "solar:close-circle-linear",
        className: "bg-rose-100 text-rose-700",
    },
};

export const BOOKING_STATUS_OPTIONS: BookingStatusOption[] = BOOKING_STATUSES.map((value) => ({
    value,
    label: META[value].label,
    icon: META[value].icon,
}));

export function getBookingStatusBadge(status?: string | null): {
    label: string;
    icon: string;
    className: string;
    value?: BookingStatus;
} {
    const s = (status ?? "").trim() as BookingStatus;
    const meta = (META as Partial<typeof META>)[s];
    if (!meta) {
        return {
            label: s || "ไม่ทราบสถานะ",
            icon: "solar:question-circle-linear",
            className: "bg-slate-100 text-slate-700",
        };
    }
    return { ...meta, value: s };
}

export function getBookingStatusLabel(status?: string | null): string {
    return getBookingStatusBadge(status).label;
}
