// types/report.ts

// 🔹 ใช้กับปุ่มกรอง (UI)
export type ReportStatusFilter = "all" | "replied" | "unreplied";

// 🔹 ใครเป็นคนรายงาน
export type ActorType = "user" | "driver";

// 🔹 รายงาน 1 รายการ
export type ReportItem = {
    report_id: number;
    actor_type: ActorType;
    actor_id?: number;
    report_type: string;
    message: string;
    is_replied: boolean;
    create_at: string;
    reporter_name?: string;
    reporter_phone?: string;
};

// 🔹 1 booking + reports
export type BookingReport = {
    booking_id: number;
    booking_date: string;
    start_time: string;

    user_id: number;
    user_name: string;
    user_phone: string;

    driver_id: number;
    driver_name: string;
    driver_phone: string;

    reports: ReportItem[];
};

// 🔹 response จาก backend
export type AdminReportResponse = {
    count: number;
    data: BookingReport[];
};

// 🔹 ใช้ render ตาราง (flatten แล้ว)
export type ReportRow = {
    booking_id: number;
    booking_date: string;
    booking_time: string;

    user_name: string;
    user_phone: string;

    driver_name: string;
    driver_phone: string;

    reporter_name: string;
    reporter_phone: string;

    report_id: number;
    actor_type: ActorType;
    report_type: string;
    message: string;
    is_replied: boolean;
    create_at: string;
};
