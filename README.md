# DriveCare

DriveCare is a role-based medical transportation web platform for coordinating patients, drivers, and admin operations in one system. The project covers the full workflow from LINE login and transport booking to driver assignment, trip status tracking, payment verification, and operational reporting.

---

## 📖 Developer Documentation

If you are a developer or using an AI coding assistant, please refer to the following documents:
- 📄 **[CONTEXT.md](file:///C:/D/drivecare/drivecare/CONTEXT.md)**: Contains the full system context, complete directory structure, Postgres database schema, Pusher events, and status transition flows for Users, Drivers, and Admins.
- 🤖 **[AGENT.md](file:///C:/D/drivecare/drivecare/AGENT.md)**: Coding rules, constraints, architectural boundaries, and checklists before/after tasks.
- 📋 **[SYSTEM_SPECIFICATION.md](file:///C:/D/drivecare/drivecare/SYSTEM_SPECIFICATION.md)**: Detailed Mermaid flowcharts and state matrices for the complete booking lifecycle.

---

## Resume Summary

You can reuse the following points in a resume or portfolio:

- Built a role-based medical transport platform for users, drivers, and admin staff using Next.js, React, TypeScript, and PostgreSQL.
- Implemented end-to-end booking workflows including health profile capture, route-based trip booking, driver assignment, live status updates, and payment slip verification.
- Integrated LINE LIFF login, LINE Messaging API notifications, Pusher realtime events, Longdo Map routing, and Cloudinary image uploads to support operational workflows.

## Main Features

- Role-based access for users, drivers, and admins
- LINE LIFF authentication for login and onboarding
- User registration with profile setup and consent flow
- Medical transport booking with pickup, dropoff, schedule, patient details, and health information
- Health profile capture with BMI calculation before booking
- Driver dashboard for job acceptance, route viewing, trip progress, and job completion
- Booking timeline and status tracking across the full trip lifecycle
- Realtime updates and notifications with Pusher
- Payment flow with slip upload, verification status, and payment history
- Admin dashboard with booking metrics, revenue summary, and report analytics
- Admin tools for driver verification, job assignment, booking management, user management, and payment slip review
- Report and issue management between users, drivers, and admin
- Profile image upload and asset handling with Cloudinary

## Tech Stack

- Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS 4
- Backend: Next.js App Router Route Handlers, PostgreSQL, JWT-based auth
- Realtime: Pusher
- Mapping: Longdo Map
- Messaging: LINE LIFF, LINE Messaging API
- Media Uploads: Cloudinary
- State and Forms: React Context, Zustand, React Hook Form, Zod
- Charts and UI: Chart.js, React Chart.js 2, DaisyUI, React Icons

## Product Scope

### User App

- Register and log in with LINE
- Create and manage transport bookings
- Save health information and BMI data
- Track booking status and trip progress
- Upload payment slips and review payment history
- Edit personal profile and receive notifications

### Driver App

- Register as a driver and wait for approval
- View assigned and available jobs
- Accept jobs and update trip statuses
- View route details and progress timeline
- Report issues during or after jobs

### Admin App

- Monitor booking volume, cancellations, revenue, and reports
- Approve or reject driver registrations
- Assign drivers to unclaimed bookings
- Review booking details and manage status changes
- Verify payment slips and respond to reports
- Manage user and driver records

## Project Structure

```text
src/
  app/           Next.js pages, layouts, and API routes
  components/    Shared UI plus user, driver, and admin components
  context/       Authentication and role-based client state
  lib/           Database, LINE, Pusher, and Cloudinary integrations
  services/      Booking, map, pricing, and notification helpers
  types/         Shared TypeScript models
  utils/         Formatting and utility functions
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- LINE LIFF credentials
- Pusher account
- Cloudinary account
- Longdo Map API key

### Installation

```bash
git clone https://github.com/Datadorf-co-ltd/paphop-driver-caregiver.git
cd paphop-driver-caregiver
npm install
```

### Environment Variables

Create a `.env` file from `.env.example` and configure the required values:

```bash
NEXT_PUBLIC_API=http://localhost:3000/api
NEXT_PUBLIC_LINE_LIFF_ID=
NEXT_LINE_ACCESS_TOKEN=
NEXT_LINE_SECRET_KEY=
NEXT_PUBLIC_LINE_OA_QR_SRC=
NEXT_PUBLIC_LINE_OA_ID=
DATABASE_URL=
JWT_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
PUSHER_APP_ID=
PUSHER_KEY=
PUSHER_SECRET=
PUSHER_CLUSTER=
NEXT_PUBLIC_PUSHER_KEY=
NEXT_PUBLIC_LONGDO_MAP_KEY=
```

### Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Notes

- This project is optimized for role-based operational workflows across patient booking, driver dispatch, and admin monitoring.
- The README is written to highlight project scope and business value, making it suitable for portfolio and resume use.
