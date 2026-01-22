import type { DriverDashboardBooking } from "@/types/driver/dashboard";
import type { Job } from "@/types/driver/job";

export type DriverVerifiedEvent = {
    driver_id: number;
    verified: "approved" | "pending_approval" | "rejected";
};

export type DriverStatusEvent = {
    driver_id: number;
    status: "active" | "inactive" | "banned";
};

export type BookingCreatedEvent = {
    booking: DriverDashboardBooking;
};

export type BookingReturnedEvent = {
    booking: DriverDashboardBooking;
};

export type BookingAssignedEvent = {
    booking_id: Job["booking_id"];
    driver_id: number | string;
};

export type BookingAcceptedEvent = {
    booking_id: Job["booking_id"];
    driver_id: number | string;
};

// Admin channel payloads can include a full booking row when available.
export type AdminBookingPoolEvent = {
    booking_id?: Job["booking_id"];
    booking?: Record<string, unknown>;
    type?: string;
    driver_id?: number | string;
};
