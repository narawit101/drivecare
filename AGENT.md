# 🤖 AGENTS.md - AI Coding Assistant Rules & Checklist

This document details the guidelines, coding rules, and conventions that the AI Agent **must** follow when working on the **DriveCare** codebase.

---

## 🔍 1. Before Starting Any Task

- **Always read [CONTEXT.md](file:///C:/D/drivecare/drivecare/CONTEXT.md) before writing code** to understand the layout, schema, state models, and APIs.
- **Clarify requirements** with the USER if anything is unclear before starting.
- **Never install new libraries** without asking the USER for permission first.

---

## ❌ 2. Never Do

- **Never write raw SQL** outside of the `/api` route handlers.
- Never bypass UserContext/AdminContext for client-side authentication checks.
- **Never perform database write mutations (INSERT/UPDATE/DELETE) without invalidating corresponding Redis caches** (using `invalidateBooking` or `cacheInvalidate`).
- Never use `fetch()` directly — always use the established project service patterns and endpoints wrappers.
- Never hardcode booking status strings (e.g. `"pending"`, `"success"`) in logical checks — reference them via constant files where possible or adhere to the status matrix exactly.
- Never expose LINE tokens or Pusher secrets in client-side code. Keep all secrets securely in `.env`.

---

## 🛠️ 3. Code Conventions

- **All API routes** must live in `src/app/api/`.
- **Use `src/lib/db.ts`** for **ALL** database queries (utilizing PostgreSQL pool).
- **Use `src/lib/cache.ts` & `src/lib/cache-keys.ts`** for **ALL** caching logic and invalidations.
- **Realtime events** must be dispatched through `src/lib/pusher.ts`.
- **LINE notifications** must only go through the `src/lib/line.ts` integration client.
- **Price calculations** must use the `calculatePrice.ts` service helper under `src/services/`.
- **Tailwind CSS v4 Conventions**:
  - Use the canonical Tailwind CSS v4 class names. Specifically, `bg-gradient-to-r` is written as `bg-linear-to-r` (e.g. `bg-linear-to-r from-[#70C5BE]/15 via-white to-white`).

---

## 🔄 4. After Completing a Feature

- **Update [CONTEXT.md](file:///C:/D/drivecare/drivecare/CONTEXT.md) to reflect changes**:
  - If a new table is added ➔ Update the schema section in [CONTEXT.md](file:///C:/D/drivecare/drivecare/CONTEXT.md).
  - If a new API route is added ➔ Document the route path and behavior in [CONTEXT.md](file:///C:/D/drivecare/drivecare/CONTEXT.md).
  - If a new library is installed ➔ Update the tech stack section in [CONTEXT.md](file:///C:/D/drivecare/drivecare/CONTEXT.md).
- **Clean up code and verify typing** before completing the turn.
