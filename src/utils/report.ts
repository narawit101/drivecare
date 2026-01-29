// utils/report.ts
import { BookingReport, ReportRow } from "@/types/admin/report";

export function flattenReports(data: BookingReport[]): ReportRow[] {
    return data.flatMap((booking) =>
        booking.reports.map((r) => ({
            booking_id: booking.booking_id,
            booking_date: booking.booking_date,
            booking_time: booking.start_time,

            user_name: booking.user_name,
            user_phone: booking.user_phone,

            driver_name: booking.driver_name,
            driver_phone: booking.driver_phone,

            // Use reporter info from the report item, fallback to actor-based logic
            reporter_name: r.reporter_name || 
                (r.actor_type === "user" ? booking.user_name : booking.driver_name),
            reporter_phone: r.reporter_phone || 
                (r.actor_type === "user" ? booking.user_phone : booking.driver_phone),

            report_id: r.report_id,
            actor_type: r.actor_type,
            report_type: r.report_type,
            message: r.message,
            is_replied: r.is_replied,
            create_at: r.create_at,
        }))
    );
}
