// ==========================================
// TTL Constants (in seconds)
// ==========================================
export const TTL = {
  // 🔥 Hot — real-time sensitive
  BOOKING_DETAIL: 15,
  BOOKING_LIST_USER: 30,
  BOOKING_LIST_DRIVER: 30,
  ADMIN_JOB_ASSIGNMENT: 30,
  ADMIN_BOOKINGS: 30,
  ADMIN_SLIPS: 30,

  // 🟡 Warm — moderate freshness
  USER_PROFILE: 300,        // 5 minutes
  DRIVER_PROFILE: 300,      // 5 minutes
  ADMIN_ME: 600,            // 10 minutes
  ADMIN_DASHBOARD: 180,     // 3 minutes
  ALL_DRIVERS: 120,         // 2 minutes
  ADMIN_REPORTS: 120,       // 2 minutes
  SINGLE_DRIVER_DETAIL: 300,// 5 minutes
  SINGLE_USER_DETAIL: 300,  // 5 minutes

  // 🧊 Cold — rarely changes
  HEALTH_RECORDS: 1800,     // 30 minutes
  STATIC_CONFIG: 3600,      // 1 hour
} as const;

// ==========================================
// Cache Key Builders
// ==========================================
const PREFIX = 'drivecare';

export const CacheKeys = {
  // User
  userProfile: (userId: number | string) =>
    `${PREFIX}:user:usr_${userId}:profile`,
  userAdminDetail: (userId: number | string) =>
    `${PREFIX}:user:usr_${userId}:admin-detail`,

  // Driver
  driverProfile: (driverId: number | string) =>
    `${PREFIX}:driver:drv_${driverId}:profile`,
  driverAdminDetail: (driverId: number | string) =>
    `${PREFIX}:driver:drv_${driverId}:admin-detail`,
  allDrivers: () =>
    `${PREFIX}:driver:global:all-drivers`,

  // Booking
  userBookings: (userId: number | string) =>
    `${PREFIX}:booking:usr_${userId}:my-bookings`,
  driverJobs: (driverId: number | string, tab?: string) =>
    tab
      ? `${PREFIX}:booking:drv_${driverId}:my-jobs:${tab}`
      : `${PREFIX}:booking:drv_${driverId}:my-jobs`,

  bookingUserDetail: (bookingId: number | string) =>
    `${PREFIX}:booking:bk_${bookingId}:user-detail`,
  bookingDriverDetail: (bookingId: number | string) =>
    `${PREFIX}:booking:bk_${bookingId}:driver-detail`,
  adminBookings: () =>
    `${PREFIX}:booking:global:admin-bookings`,
  adminBookingsFull: () =>
    `${PREFIX}:booking:global:admin-bookings-full`,
  adminSlips: () =>
    `${PREFIX}:booking:global:slips`,

  // Admin
  adminMe: (adminId: number | string) =>
    `${PREFIX}:admin:adm_${adminId}:me`,
  adminDashboard: (startDate?: string, endDate?: string) =>
    startDate && endDate
      ? `${PREFIX}:admin:global:dashboard:${startDate}:${endDate}`
      : `${PREFIX}:admin:global:dashboard`,

  adminJobAssignment: (sort?: string) =>
    sort
      ? `${PREFIX}:admin:global:job-assignment:${sort}`
      : `${PREFIX}:admin:global:job-assignment`,

  // Health
  healthRecords: (userId: number | string) =>
    `${PREFIX}:health:usr_${userId}:records`,

  // Reports
  adminReports: () =>
    `${PREFIX}:report:global:admin-reports`,
} as const;

// ==========================================
// Pattern Keys (for bulk invalidation)
// ==========================================
export const CachePatterns = {
  allBookingGlobal: () => `${PREFIX}:booking:global:*`,
  bookingById: (bookingId: number | string) =>
    `${PREFIX}:booking:bk_${bookingId}:*`,
  driverAll: (driverId: number | string) =>
    `${PREFIX}:driver:drv_${driverId}:*`,
  userAll: (userId: number | string) =>
    `${PREFIX}:user:usr_${userId}:*`,
  adminDashboardWildcard: () =>
    `${PREFIX}:admin:global:dashboard*`,
  driverJobsWildcard: (driverId: number | string) =>
    `${PREFIX}:booking:drv_${driverId}:my-jobs*`,
  adminJobAssignmentWildcard: () =>
    `${PREFIX}:admin:global:job-assignment*`,
} as const;

