export type AdminBookingRow = {
  booking_id: number;
  booking_date: string | Date | null;
  start_time: string | Date | null;
  status: string | null;
  create_at: string | Date | null;
  payment_status: string | null;

  user_id: number;
  user_first_name: string | null;
  user_last_name: string | null;
  user_phone_number: string | null;
  user_profile_img: string | null;

  driver_id: number | null;
  driver_first_name: string | null;
  driver_last_name: string | null;
  driver_phone_number: string | null;
  driver_profile_img: string | null;

  pickup_address: string | null;
  dropoff_address: string | null;
};
