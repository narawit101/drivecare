export type JobAssignmentJob = {
    id: string;
    customerName: string;
    customerPhone: string;
    pickup: string;
    destination: string;
    date: string;
    time: string;
    whenRaw?: string;
    bookingDateRaw?: string;
    startTimeRaw?: string;
    createdAtRaw?: string;
};

export type ApiNullDriverBookingRow = {
    booking_id: number;
    booking_date?: string | null;
    start_time?: string | null;
    status?: string | null;
    create_at?: string | null;
    user_id: number;
    name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    profile_img?: string | null;
    pickup_address?: string | null;
    pickup_lat?: number | null;
    pickup_lng?: number | null;
    dropoff_address?: string | null;
    dropoff_lat?: number | null;
    dropoff_lng?: number | null;
};

export type ActiveDriverRow = {
    driver_id: number;
    first_name?: string | null;
    last_name?: string | null;
    phone_number?: string | null;
    verified?: string | null;
    status?: string | null;
    profile_img?: string | null;
    city?: string | null;
};

export type AssignJobSummary = {
    bookingId: string;
    dateLabel: string;
    timeLabel: string;
    pickup: string;
    dropoff: string;
};
