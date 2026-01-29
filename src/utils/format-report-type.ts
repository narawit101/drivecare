import { USER_REPORT_TYPES, DRIVER_REPORT_TYPES } from "@/constants/reports/report-types";

export const formatReportType = (type: string) => {
    if (!type) return "ไม่ระบุประเภท";

    // Check in user report types
    const userType = USER_REPORT_TYPES.find(t => t.value === type);
    if (userType) return userType.label;

    // Check in driver report types
    const driverType = DRIVER_REPORT_TYPES.find(t => t.value === type);
    if (driverType) return driverType.label;

    return type;
};

export const getAllReportTypes = () => {
    // Combine both arrays and remove duplicates (OTHER appears in both)
    const allTypes = [...USER_REPORT_TYPES, ...DRIVER_REPORT_TYPES];
    const uniqueTypes = allTypes.filter((type, index, self) => 
        index === self.findIndex(t => t.value === type.value)
    );
    
    return uniqueTypes;
};