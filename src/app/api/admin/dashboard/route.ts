import { NextRequest, NextResponse } from "next/server";
import { DateTime } from "luxon";
import pool from "@/lib/db";

const ZONE = "Asia/Bangkok";

function toISODate(d: DateTime) {
    return d.toFormat("yyyy-LL-dd");
}

function parseRange(req: NextRequest): { start: DateTime; end: DateTime; month: string } | { error: string } {
    const { searchParams } = new URL(req.url);
    const monthParam = (searchParams.get("month") ?? "").trim(); // yyyy-mm
    const startParam = (searchParams.get("start") ?? "").trim(); // yyyy-mm-dd
    const endParam = (searchParams.get("end") ?? "").trim(); // yyyy-mm-dd

    if (monthParam) {
        const start = DateTime.fromFormat(monthParam, "yyyy-LL", { zone: ZONE }).startOf("month");
        if (!start.isValid) return { error: "month ไม่ถูกต้อง (รูปแบบ yyyy-mm)" };
        const end = start.endOf("month");
        return { start, end, month: start.toFormat("yyyy-LL") };
    }

    if (startParam && endParam) {
        const start = DateTime.fromISO(startParam, { zone: ZONE }).startOf("day");
        const end = DateTime.fromISO(endParam, { zone: ZONE }).startOf("day");
        if (!start.isValid || !end.isValid) return { error: "start/end ไม่ถูกต้อง (รูปแบบ yyyy-mm-dd)" };
        if (end < start) return { error: "end ต้องมากกว่าหรือเท่ากับ start" };
        return { start, end, month: start.toFormat("yyyy-LL") };
    }

    // default: current month
    const now = DateTime.now().setZone(ZONE);
    return { start: now.startOf("month"), end: now.endOf("month"), month: now.toFormat("yyyy-LL") };
}

export async function GET(request: NextRequest) {
    const adminId = request.headers.get("x-admin-id");
    if (!adminId) {
        return NextResponse.json({ message: "unauthorized" }, { status: 401 });
    }

    const range = parseRange(request);
    if ("error" in range) {
        return NextResponse.json({ message: range.error }, { status: 400 });
    }

    const startDate = toISODate(range.start);
    const endDate = toISODate(range.end);

    try {
        const [usersRes, driversRes, dailyRes] = await Promise.all([
            pool.query("SELECT COUNT(*)::int AS c FROM users"),
            pool.query("SELECT COUNT(*)::int AS c FROM drivers"),
            pool.query(
                `
WITH days AS (
  SELECT generate_series($1::date, $2::date, interval '1 day')::date AS day
),
booking_stats AS (
  SELECT
    b.booking_date::date AS day,
    COUNT(*)::int AS bookings_total,
    COUNT(*) FILTER (WHERE b.status = 'cancelled')::int AS bookings_cancelled,
    COUNT(*) FILTER (WHERE b.status = 'pending')::int AS bookings_pending
  FROM bookings b
  WHERE b.booking_date::date BETWEEN $1::date AND $2::date
  GROUP BY 1
),
payment_stats AS (
  SELECT
    b.payment_at::date AS day,
    COUNT(*) FILTER (WHERE b.payment_status IN ('verified','rejected'))::int AS slips_checked,
    COUNT(*) FILTER (WHERE b.payment_status = 'waiting_verify')::int AS slips_unchecked,
    COALESCE(
      SUM(
        NULLIF(regexp_replace(b.total_price, '[^0-9.]', '', 'g'), '')::numeric
      ) FILTER (WHERE b.payment_status = 'verified'),
      0
    )::float AS revenue_verified
  FROM bookings b
  WHERE b.payment_at IS NOT NULL
    AND b.payment_at::date BETWEEN $1::date AND $2::date
  GROUP BY 1
),
report_stats AS (
  SELECT
    r.create_at::date AS day,
    COUNT(*) FILTER (WHERE r.is_replied = true)::int AS reports_answered,
    COUNT(*) FILTER (WHERE r.is_replied = false)::int AS reports_unanswered
  FROM reports r
  WHERE r.create_at::date BETWEEN $1::date AND $2::date
  GROUP BY 1
)
SELECT
  d.day::text AS date,
  COALESCE(bs.bookings_total, 0)::int AS bookings_total,
  COALESCE(bs.bookings_cancelled, 0)::int AS bookings_cancelled,
  COALESCE(bs.bookings_pending, 0)::int AS bookings_pending,

  COALESCE(ps.slips_checked, 0)::int AS slips_checked,
  COALESCE(ps.slips_unchecked, 0)::int AS slips_unchecked,
  COALESCE(ps.revenue_verified, 0)::float AS revenue_verified,

  COALESCE(rs.reports_answered, 0)::int AS reports_answered,
  COALESCE(rs.reports_unanswered, 0)::int AS reports_unanswered
FROM days d
LEFT JOIN booking_stats bs ON bs.day = d.day
LEFT JOIN payment_stats ps ON ps.day = d.day
LEFT JOIN report_stats rs ON rs.day = d.day
ORDER BY d.day ASC
        `,
                [startDate, endDate]
            ),
        ]);

        const daily = (dailyRes.rows ?? []).map((r) => ({
            date: String(r.date),
            bookings_total: Number(r.bookings_total ?? 0),
            bookings_cancelled: Number(r.bookings_cancelled ?? 0),
            bookings_pending: Number(r.bookings_pending ?? 0),
            slips_checked: Number(r.slips_checked ?? 0),
            slips_unchecked: Number(r.slips_unchecked ?? 0),
            revenue_verified: Number(r.revenue_verified ?? 0),
            reports_answered: Number(r.reports_answered ?? 0),
            reports_unanswered: Number(r.reports_unanswered ?? 0),
        }));

        const totals = daily.reduce(
            (acc, row) => {
                acc.revenue_verified += row.revenue_verified;
                acc.bookings_total += row.bookings_total;
                acc.bookings_cancelled += row.bookings_cancelled;
                acc.bookings_pending += row.bookings_pending;
                acc.slips_checked += row.slips_checked;
                acc.slips_unchecked += row.slips_unchecked;
                acc.reports_answered += row.reports_answered;
                acc.reports_unanswered += row.reports_unanswered;
                return acc;
            },
            {
                revenue_verified: 0,
                users_total: Number(usersRes.rows?.[0]?.c ?? 0),
                drivers_total: Number(driversRes.rows?.[0]?.c ?? 0),
                bookings_total: 0,
                bookings_cancelled: 0,
                bookings_pending: 0,
                slips_checked: 0,
                slips_unchecked: 0,
                reports_total: 0,
                reports_answered: 0,
                reports_unanswered: 0,
            }
        );

        totals.reports_total = totals.reports_answered + totals.reports_unanswered;

        return NextResponse.json(
            {
                range: {
                    start: startDate,
                    end: endDate,
                    month: range.month,
                },
                totals,
                daily,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:", error);
        return NextResponse.json({ message: "ไม่สามารถดึงข้อมูล dashboard ได้" }, { status: 500 });
    }
}
