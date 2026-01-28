// constants/report-types.ts

export type ReportTypeItem = {
    value: string;
    label: string;
};

/* ---------- ผู้ป่วยรายงานคนขับ ---------- */
export const USER_REPORT_TYPES: ReportTypeItem[] = [
    { value: "DRIVER_BAD", label: "คนขับไม่สุภาพ" },
    { value: "DRIVER_LATE", label: "คนขับมาสาย" },
    { value: "UNSAFE_DRIVING", label: "ขับรถไม่ปลอดภัย" },
    { value: "REFUSE_SERVICE", label: "คนขับปฏิเสธการให้บริการ" },
    { value: "WRONG_ROUTE", label: "ใช้เส้นทางไม่เหมาะสม" },
    { value: "DIRTY_VEHICLE", label: "สภาพรถไม่เหมาะสม" },
    { value: "OTHER", label: "อื่น ๆ" },
];

/* ---------- คนขับรายงานผู้ป่วย ---------- */
export const DRIVER_REPORT_TYPES: ReportTypeItem[] = [
    { value: "PATIENT_NO_SHOW", label: "ผู้ป่วยไม่มาตามนัด" },
    { value: "PATIENT_CANCEL_LATE", label: "ผู้ป่วยยกเลิกกระชั้นชิด" },
    { value: "WRONG_LOCATION", label: "สถานที่รับ-ส่งไม่ถูกต้อง" },
    { value: "PATIENT_UNREADY", label: "ผู้ป่วยไม่พร้อมตามเวลานัด" },
    { value: "PAYMENT_PROBLEM", label: "ปัญหาการชำระเงิน" },
    { value: "DANGEROUS_SITUATION", label: "สถานการณ์ไม่ปลอดภัย" },
    { value: "OTHER", label: "อื่น ๆ" },
];
