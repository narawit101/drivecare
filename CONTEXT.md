# 📄 CONTEXT.md - DriveCare System Context & Architecture

This document serves as the central context and architecture reference for the **DriveCare** platform. It contains the system overview, directory structures, backend APIs, database schemas, and workflows.

---

## 🏗️ 1. System Architecture & Tech Stack

DriveCare is a multi-role web application designed to facilitate patient transport, driver assignment, trip tracking, and payment validation.

| Layer | Technology | Usage |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS 4, DaisyUI | Responsive, modern, and high-performance UI |
| **Backend** | Next.js App Router (Route Handlers) | Serverless API endpoints |
| **Database** | PostgreSQL | Relational database (via custom db helper `src/lib/db.ts`) |
| **Caching** | Redis (Local / Upstash) | API performance optimization, SWR, and DB connection saving |
| **Realtime** | Pusher | Live location and booking status synchronization |
| **Maps & Routing** | Longdo Map API | Location search, route drawing, and distance/ETA calculation |
| **Integrations** | LINE LIFF / LINE Messaging API | Seamless login flow and push notifications |
| **Media Upload** | Cloudinary | Storing user/driver avatars and payment slips |
| **State Management** | React Context (User/Admin), Zustand | Global state and notification tracking |

---

## 📂 2. Complete Project Directory Structure

Here is the comprehensive directory structure mapped out for all three roles:

```text
src/
├── 📁 app/                             # Next.js App Router (Pages, Layouts, APIs)
│   ├── 📁 (app)/                       # App Layout Group (Authenticated User & Driver Pages)
│   │   ├── 📄 page.tsx                 # Main Gateway/Dashboard (Redirects by role)
│   │   ├── 📄 layout.tsx               # Main Sidebar/Layout template
│   │   ├── 📁 user-booking/            # [USER] Booking creation page
│   │   ├── 📁 health-user-booking/     # [USER] BMI & Health capture page
│   │   ├── 📁 user-list-reserve/       # [USER] List of user reservations
│   │   ├── 📁 user-payment/            # [USER] Bank slip upload & payment status page
│   │   ├── 📁 job-detail-user/         # [USER] Detailed view of trip tracking
│   │   ├── 📁 edit-profile-user/       # [USER] User profile editing
│   │   ├── 📁 driver-dashboard/        # [DRIVER] Main dashboard (availability toggle, stats)
│   │   ├── 📁 driver-job/              # [DRIVER] Job listing page (upcoming, in-progress)
│   │   ├── 📁 job-detail/              # [DRIVER] Detailed trip timeline control
│   │   │   └── 📁 [id]/
│   │   ├── 📁 edit-profile-driver/     # [DRIVER] Driver profile editing
│   │   ├── 📁 notifications/           # [SHARED] Shared notification alert center
│   │   └── 📁 settings/                # [SHARED] Account settings and logout
│   ├── 📁 admin/                       # Admin Layout Group (Secure Console Pages)
│   │   ├── 📄 page.tsx                 # Admin Analytics Dashboard (revenue, bookings, charts)
│   │   ├── 📄 layout.tsx               # Admin Navigation Sidebar and route loader
│   │   ├── 📁 login/                   # Credentials-based admin login
│   │   ├── 📁 driver/                  # Admin Driver Verification pages
│   │   │   └── 📁 [driverId]/
│   │   ├── 📁 job-assignment/          # Admin driver dispatch console
│   │   ├── 📁 manager-users/           # Admin user and driver directory management
│   │   ├── 📁 overview-booking/        # Admin master booking lifecycle console
│   │   ├── 📁 report/                  # Admin support ticket system
│   │   └── 📁 verified-slip/           # Admin payment slip auditing console
│   ├── 📁 login/                       # LINE LIFF User and Driver Login Gate
│   ├── 📁 register-user/               # Patient / Relatives registration form
│   ├── 📁 register-driver/             # Driver / Caregiver application form
│   │
│   └── 📁 api/                         # Backend Serverless API Handlers
│       ├── 📁 auth/                    # Auth Endpoints
│       │   ├── 📁 users/               # User Login & Register
│       │   ├── 📁 drivers/             # Driver Register
│       │   ├── 📁 admin/               # Admin Login
│       │   └── 📁 switch-role/         # In-app role switcher (User <-> Driver)
│       ├── 📁 users/                   # Get current user data
│       ├── 📁 user-controller/         # Profile edits and image uploads
│       │   ├── 📁 edit-profile/
│       │   └── 📁 upload-image/
│       ├── 📁 driver-controller/       # Driver availability status, profile, uploads
│       │   ├── 📁 change-status/
│       │   ├── 📁 driver-logout/
│       │   ├── 📁 edit-profile/
│       │   └── 📁 upload-image/
│       ├── 📁 admin/                   # Admin System Operations
│       │   ├── 📁 admin-controller/    # Fetch & Update user/driver, delete accounts
│       │   ├── 📁 dashboard/           # Admin metrics & analytics
│       │   ├── 📁 job-assignment/      # Auto or manual driver assignment
│       │   ├── 📁 logout/
│       │   └── 📁 me/
│       ├── 📁 booking/                 # Booking Life-cycle Endpoints
│       │   ├── 📁 users/               # user confirm, list, detail, payments, cancel
│       │   ├── 📁 drivers/             # driver accept, start, log-timeline, end, cancel-task
│       │   └── 📁 admin/               # admin get-bookings, handle-slip, get-slip
│       ├── 📁 health-bookinng/         # BMI records fetch and create
│       ├── 📁 reports/                 # Support & Issue Ticket controller (user/driver/admin)
│       ├── 📁 line/                    # LINE Notify webhook integration
│       └── 📁 pusher/                  # Pusher realtime authentication helper
│
├── 📁 components/                      # Shared & Role-Specific Components
│   ├── 📁 user/                        # Patient-facing UI parts (StatusTrackerCard)
│   ├── 📁 driver/                      # Driver-facing UI parts
│   │   ├── 📁 cards/                   # JobCard, JobPassengerCard, JobScheduleRouteCard
│   │   ├── 📁 dashboard/               # DriverDashboardApproved, Notices
│   │   ├── 📁 driver-job/              # UpcomingLayout, InProgressLayout
│   │   ├── 📁 job-detail/              # ConfirmStatusModal, StatusActions, StatusProgress
│   │   └── 📁 map/                     # DriverMapWithActions (routing map)
│   ├── 📁 admin/                       # Admin management widgets
│   │   ├── 📁 dashboard/               # MetricCard, SimpleLineChart, ReportAnalyticsCard
│   │   ├── 📁 job-assignment/          # AssignDriverModal, JobAssignmentTable
│   │   ├── 📁 manager-users/           # AdminUsersTable, EditUserModal, AddressModal
│   │   ├── 📁 overview-booking/        # BookingManageModal, BookingOverviewTable
│   │   ├── 📁 report/                  # ReportTable, ReportTypeDropdown
│   │   └── 📁 verified-slip/           # PaymentSlipModal, RejectPaymentModal
│   ├── 📁 navigation-menu/             # Top, bottom, and sidebar navigation
│   ├── 📁 modals/                      # LineNotifyModal, PolicyModal, UpslipModal
│   └── 📁 common/                      # SelectDropdown, Button, ConsentCheckbox
│
├── 📁 context/                         # React Context State Providers
│   ├── 📄 UserContext.tsx              # Authenticated user & driver token state
│   └── 📄 AdminContext.tsx             # Authenticated admin token state
│
├── 📁 store/                           # Zustand Stores
│   └── 📄 notification.state.ts        # App notifications state
│
├── 📁 services/                        # Service Helpers
│   ├── 📄 calculatePrice.ts            # Price calculation algorithm based on distance
│   ├── 📁 map/                         # Longdo Map integrations (LongdoMap, PlaceSearch)
│   ├── 📁 hospital/                    # Near hospital search algorithm
│   └── 📁 sent-line-user/              # LINE notification event messages
│
├── 📁 types/                           # TypeScript Interfaces
│   ├── 📁 user/                        # Bookings, Health bookings
│   ├── 📁 driver/                      # Dashboard, job, route, timeline
│   ├── 📁 admin/                       # BookingOverview, BookingSlip, Dashboard, Report
│   └── 📁 profile/                     # Base profile, User, Driver profile structures
│
├── 📁 utils/                           # Formatting & Math Helpers
│   ├── 📄 distance.ts                  # Distance calculation (Haversine formula)
│   └── 📄 format-datetime.ts           # Thai locale date and time formatting
│
└── 📁 lib/                             # External Service Clients
    ├── 📄 db.ts                        # Custom pg-pool database query client
    ├── 📄 line.ts                      # LINE Notify integration
    ├── 📄 pusher.ts                    # Pusher triggers (realtime events)
    ├── 📄 cloudinary.ts                # Cloudinary image upload client
    ├── 📄 redis.ts                     # Redis client connection singleton
    ├── 📄 cache.ts                     # Caching logic helper and invalidation hooks
    └── 📄 cache-keys.ts                # Caching prefix hierarchy and TTL constants
```

---

## 🗃️ 3. Database Schema (Conceptual Postgres Tables)

* **Schema files:** Stored at [health_schema.sql](file:///C:/D/drivecare/drivecare/database/health_schema.sql)
* **Setup script:** [init-db.js](file:///C:/D/drivecare/drivecare/scripts/init-db.js)

Based on database queries within the `src/app/api/` handlers:
- **`users`:** `id`, `name`, `tel`, `profile_image`, `line_user_id`, `created_at`.
- **`drivers`:** `id`, `name`, `tel`, `license_plate`, `vehicle_brand`, `vehicle_type`, `driver_license_url`, `status` (`pending`/`approved`/`rejected`), `is_active` (`true`/`false`), `lat`, `lng`.
- **`bookings`:** `id`, `user_id`, `driver_id`, `pickup_name`, `pickup_lat`, `pickup_lng`, `dropoff_name`, `dropoff_lat`, `dropoff_lng`, `price`, `status`, `scheduled_at`, `car_type_id`, `patient_name`, `patient_tel`, `slip_image_url`, `created_at`.
- **`health_records`:** `health_id`, `user_id` (unique), `weight`, `height`, `bmi`, `congenital_diseases` (array), `allergies` (array), `updated_at`.
- **`health_history`:** `history_id`, `user_id`, `weight`, `recorded_at`.
- **`reports`:** `id`, `booking_id`, `reporter_id`, `reporter_role`, `topic`, `detail`, `reply_message`, `status` (`pending`/`resolved`), `created_at`.

---

## ⚙️ 4. External Integrations Matrix

### Pusher Channels & Events
- **Driver location update:** `presence-booking-[bookingId]` ➔ `client-location-update`
- **Trip status updated:** `private-user-[userId]` ➔ `booking-status-updated`
- **New booking created:** `private-admin` ➔ `new-booking-created`
- **Slip uploaded:** `private-admin` ➔ `slip-uploaded`
- **New report/issue:** `private-admin` ➔ `new-report-created`

### LINE Notify Notification Templates (`src/services/sent-line-user/`)
- `success-reserved.ts` - Booking confirmation alert.
- `driver-accepted.ts` - Driver details and vehicle information.
- `status-update.ts` - In-transit status alerts.
- `payment-pending.ts` - Bank account and bill details.
- `payment-verification.ts` - Payment invoice / receipt confirmation.
- `driver-cancelled.ts` - Cancellation alerts.

---

## 📈 5. Booking Status Lifecycles

| Status | Role Initiator | Action Triggered | UI View (User) | UI View (Driver) | UI View (Admin) |
|---|---|---|---|---|---|
| **PENDING** | User | Submits booking | Shows "Waiting for driver assignment" | Not visible in My Job | Shows in Job Assignment table (Unassigned) |
| **ASSIGNED** | Admin | Assigns specific driver | Shows driver assigned, waiting acceptance | Job appears in Dashboard "Upcoming" | Status changes to Assigned |
| **ACCEPTED** | Driver | Clicks "Accept Job" | Shows driver details & route | Job moves to "In Progress" list | Shows driver has accepted |
| **IN_PROGRESS** | Driver | Clicks "Start Journey" | Shows map with driver moving towards pickup | Displays maps with GPS tracking | Shows trip in progress on dashboard |
| **ARRIVED_PICKUP**| Driver | Clicks "Arrived at Pickup" | Shows notification "Driver has arrived!" | Shows "Pick Up Passenger" button | Map updates checkpoint time |
| **DRIVING** | Driver | Clicks "Passenger On-board" | Shows journey route to hospital | Shows navigation to destination | Map tracks journey status |
| **ARRIVED_DEST** | Driver | Clicks "Arrived at Hospital" | Shows summary, waiting for final wrap | Shows "End Trip" button | Verifies final endpoint arrival |
| **WAIT_PAYMENT** | Driver | Clicks "Complete Trip" | Shows QR code payment form | Job moves to history | Job shows as "Pending Payment" |
| **VERIFYING_SLIP**| User | Uploads bank transfer slip | Shows "Slip is being verified" | History (Completed status) | Booking appears in verified-slip table |
| **SUCCESS** | Admin | Approves slip | Shows success receipt & invoice | History (Completed status) | Moves to revenue metrics & history |
| **PAY_FAILED** | Admin | Rejects slip | Shows error & re-upload form | History (Completed status) | Moves back to verified-slip list |
| **CANCELLED** | User / Admin / Driver | Cancels booking | Shows booking cancelled | Removed from dashboard | Moved to cancellation logs |

---

## ⚡ 6. Redis Caching & Invalidation Flow

To optimize operational efficiency under active load, the platform utilizes Redis to cache heavy query results and session details, governed by an event-driven cache invalidation policy.

### Caching Strategy Overview

| Cache Key Pattern | TTL | Invalidation Triggers |
|---|---|---|
| `drivecare:user:{userId}:profile` | 5m | Profile updates, avatar uploads |
| `drivecare:driver:drv_{driverId}:profile` | 5m | Profile updates, online status changes, avatar uploads |
| `drivecare:admin:adm_{adminId}:me` | 10m | Admin logouts |
| `drivecare:admin:global:dashboard:[startDate]:[endDate]` | 3m | Booking updates, slip verifications, new registrations |
| `drivecare:booking:usr_{userId}:my-bookings` | 30s | New bookings, cancellations, driver assignment |
| `drivecare:booking:drv_{driverId}:my-jobs:[tab]` | 30s | Job assignments, accepts, status progression updates |
| `drivecare:booking:bk_{bookingId}:[detail]` | 15s | Status changes, log timeline events |
| `drivecare:booking:global:admin-bookings` | 30s | Any booking status change, manual assignments |
| `drivecare:driver:global:all-drivers` | 2m | Driver registrations, online status changes |

### Cache Control Rules

1. **DB Fallback Guarantee:** All cache calls are wrapped in `cacheGet()`. If Redis goes offline, API routes automatically fall back to standard PostgreSQL queries without blocking the request.
2. **Instant Invalidation on Write:** Every POST/PATCH/PUT/DELETE handler that updates a user profile, driver status, or booking status triggers immediate cache eviction via `cacheInvalidate` or `invalidateBooking`. It does not rely on TTL expiration to refresh data.
3. **Multi-Tab Safety:** Keys that vary based on parameters (like date ranges on the dashboard or tabs on driver job lists) include these parameters in the cache key. Wildcards (using SCAN patterns) are used to wipe all parameter variations at once when invalidations occur.
