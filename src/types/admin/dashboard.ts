export type DashboardRange = {
  start: string; // yyyy-mm-dd
  end: string; // yyyy-mm-dd
  month: string; // yyyy-mm
};

export type DashboardDailyRow = {
  date: string; // yyyy-mm-dd

  bookings_total: number;
  bookings_cancelled: number;
  bookings_pending: number;

  slips_checked: number; // verified + rejected
  slips_unchecked: number; // waiting_verify
  revenue_verified: number; // sum(total_price) where payment_status='verified'

  reports_answered: number;
  reports_unanswered: number;
};

export type DashboardTotals = {
  revenue_verified: number;
  users_total: number;
  drivers_total: number;

  bookings_total: number;
  bookings_cancelled: number;
  bookings_pending: number;

  slips_checked: number;
  slips_unchecked: number;

  reports_total: number;
  reports_answered: number;
  reports_unanswered: number;
};

export type AdminDashboardResponse = {
  range: DashboardRange;
  totals: DashboardTotals;
  daily: DashboardDailyRow[];
};
