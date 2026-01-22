export type BookingSlip = {
    booking_id: number;
    booking_date: string;
    start_time: string;
    status: string;
    payment_status: string;
    payment_at: string;
    total_price: string;
    slip_img: string;
    payment_slip: string;

    user_first_name: string;
    user_last_name: string;
    user_phone_number: string;

    driver_first_name?: string;
    driver_last_name?: string;
    driver_phone_number?: string;


    pickup_address?: string;
    dropoff_address?: string;
};

export type StatusFilter = "all" | "waiting_verify" | "verified" | "rejected";



