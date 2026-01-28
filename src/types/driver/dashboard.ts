import type { Job } from "@/types/driver/job";

export type DriverDashboardBooking = Job & {
  create_at: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
};
