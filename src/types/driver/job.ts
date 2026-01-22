export type Job = {
    booking_id: number
    status: string
    payment_status: string
    booking_date: string,
    total_price: string,
    total_hours: number,
    start_time: string
    first_name: string
    last_name: string
    phone_number: string
    profile_img: string | null
    pickup_address: string
    dropoff_address: string
    pickup_lat?: number
    pickup_lng?: number
    dropoff_lat?: number
    dropoff_lng?: number
    allergies?: string[]
    congenital_diseases?: string[]

}

