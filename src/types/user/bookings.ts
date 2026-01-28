export interface Booking {
  booking_id: number;
  booking_date: string;
  start_time: string;
  end_time: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lng: number;
  total_price: number;
  status: string;
  driver_id?: number;
  driver_first_name?: string;
  driver_last_name?: string;
  driver_phone?: string;
  driver_profile_image?: string;
  payment_status?:string;
  weight?: number;             
  height?: number;             
  bmi?: number;                
  congenital_diseases?: string[]; 
  allergies?: string[];
}
