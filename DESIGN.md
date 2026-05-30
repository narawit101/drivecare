# 🎨 DriveCare Design System & UI Specification

This document details the visual guidelines, design tokens, UI components, and layout patterns used in the **DriveCare** medical transportation platform. Adherence to these standards is required to maintain visual consistency across all User, Driver, and Admin screens.

---

## 🎨 1. Color Palette (OKLCH & HEX)

DriveCare uses a curated green-and-white theme tailored for medical care contexts, accented with modern neutral tones and alert states. All colors are defined as Tailwind theme extensions using the OKLCH model.

### 🟢 A. Core Theme Colors
*   **Primary Green (Care & Safety):**
    *   `primary-500` / Primary Brand color: `oklch(0.64 0.17 145)` (Equivalent to `#4CAF50`)
    *   Used for major action buttons, main headers, focus states, and success indicators.
    *   Shades: `primary-50` (lightest highlight) to `primary-950` (darkest forest green).
*   **Secondary Green (Accents & Highlights):**
    *   `secondary-200` / Accent color: `oklch(0.92 0.03 130)` (Equivalent to `#e1eadb`)
    *   Used for card backgrounds, secondary labels, and soft highlights.
*   **Primary Button Special Green:**
    *   `button-primary`: `#70c5be`
    *   Used for main call-to-actions (CTAs) demanding high visibility.

### ⚪ B. Neutral & Surface Colors
*   **Base Background & Cards:**
    *   `surface` (Pure White): `oklch(1 0 0)` (Equivalent to `#ffffff`)
    *   `surface-dim` (Light grey background): `oklch(0.98 0 0)`
    *   `surface-dark` (Dark theme background): `oklch(0.17 0.005 240)` (Equivalent to `#151718`)
*   **Text & Dividers:**
    *   `neutral-900` (Primary Text): `oklch(0.18 0.01 240)` (Equivalent to `#11181C`)
    *   `neutral-400` (Icons / Subtitles): `oklch(0.7 0.005 240)` (Equivalent to `#687076`)
    *   `neutral-100` (Dividers & Borders): `oklch(0.94 0 0)` (Equivalent to `#eeeeee`)

### 🚨 C. Alert & Status Colors
*   **Info:** Blue `oklch(0.62 0.19 260)` (Equivalent to `#3b82f6`) — Used for info tags and neutral updates.
*   **Success:** Vivid Green `oklch(0.72 0.18 145)` (Equivalent to `#4ade80`) — Used for completed states and verified payments.
*   **Warning:** Amber `oklch(0.75 0.18 70)` (Equivalent to `#f59e0b`) — Used for pending actions and validations.
*   **Error/Danger:** Red `oklch(0.63 0.22 27)` (Equivalent to `#ef4444`) — Used for rejections, cancellations, and errors.

---

## 🔤 2. Typography & Fonts

### 📱 Fonts
*   **Sans-Serif (Default Interface Font):** **`Prompt`** (Google Font mapped via CSS variable `--font-prompt`). This font provides excellent readability in both Thai and English.
*   **Monospace:** **`JetBrains Mono`** — Used for ticket IDs, payment transaction references, and numeric coordinates.

### 📐 Text Sizing & Weights
*   `text-xs` (12px) - Minor captions and timelines.
*   `text-sm` (14px) - Default body copy, helper text, and secondary card descriptions.
*   `text-base` (16px) - Navigation items, input fields, and standard list items.
*   `text-lg` (18px) - Card titles, modal headers, and minor headings.
*   `text-xl` to `text-3xl` (20px-30px) - Page titles, dashboard metrics, and landing banner titles.
*   **Weights:** `font-light` (300), `font-normal` (400), `font-medium` (500) for standard interface texts, and `font-semibold` (600) / `font-bold` (700) for emphasis and headers.

---

## 📐 3. Layouts & Responsiveness

### 📱 A. Mobile-First (User & Driver Apps)
The interface for patients and drivers is optimized for mobile WebViews (LINE LIFF sandbox):
*   **Max Width Container:** Contained within `max-w-md mx-auto` or `max-w-lg mx-auto` to look like a native application even on desktop viewports.
*   **Scroll Behavior:** Use `.no-scrollbar` or `.hide-scrollbar` classes to keep interfaces neat and prevent browser scrollbars from breaking the native app-like experience.
*   **Navigation:** Uses a fixed sticky `bottom-navbar.tsx` for easy thumb access.

### 💻 B. Desktop-Optimized (Admin Console)
The Admin panel is built for wide desktop screens (dashboard, tables, and analytics charts):
*   **Layout Structure:** Fixed side navigation (`AdminSidebar.tsx`) with a scrollable content area containing grids of MetricCards and tables.
*   **Table Layouts:** Tables use responsive horizontal scrolling (`overflow-x-auto`) with mobile card list fallbacks (`JobAssignmentMobileCards.tsx`) when accessed on small screens.

---

## 🧩 4. Core UI Components Specification

### 🔘 A. Buttons & Inputs
*   **Primary Action Button:**
    *   Classes: `bg-primary-500 text-white hover:bg-primary-600 transition-colors font-medium rounded-lg px-4 py-2`
*   **Secondary Highlight Button:**
    *   Classes: `bg-secondary-200 text-primary-700 hover:bg-primary-100 transition-colors font-medium rounded-lg px-4 py-2`
*   **Input Fields:**
    *   Classes: `border border-neutral-200 rounded-lg p-2.5 bg-surface text-neutral-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all`

### 🏷️ B. Status Badges & Indicators
All booking, verification, and payment statuses use standardized visual tags to represent state:
```text
[ PENDING ]            ➔   Warning / Amber badge (e.g., text-warning-700 bg-warning-50)
[ ASSIGNED / ACCEPTED ] ➔   Info / Blue badge (e.g., text-info-700 bg-info-50)
[ IN_PROGRESS ]        ➔   Pulse animation + Primary Green badge
[ WAIT_PAYMENT ]       ➔   Warning badge + Action button
[ VERIFYING_SLIP ]     ➔   Purple or Light Info badge
[ SUCCESS ]            ➔   Success / Green badge (e.g., text-success-700 bg-success-50)
[ CANCELLED / REJECTED ]➔   Error / Red badge (e.g., text-error-700 bg-error-50)
```

### 🖼️ C. Cards & Containers
*   **Cards (`bg-surface`):** Shadow-md or shadow-sm, rounded-xl (`rounded-xl`), with thin border dividers (`border border-neutral-100`).
*   **Status Tracker:** Horizontal/vertical timeline dots using dynamic SVG icons and dashed connection lines to trace checkpoints.

---

## 🎞️ 5. Micro-Animations & Transitions

DriveCare utilizes CSS-based keyframe animations to create a responsive, fluid feel:

*   **Page Transitions (`animate-fade-in`):**
    *   `from { opacity: 0; } to { opacity: 1; }` (0.3 seconds ease-out)
    *   Applied to all main screen load wrappers.
*   **List Item Entrance (`animate-slide-up`):**
    *   `from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); }` (0.3s ease-out)
    *   Applied when items load dynamically in lists (bookings, jobs, reports).
*   **Modal Popups (`animate-scale-in`):**
    *   `from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); }` (0.2s ease-out)
    *   Applied on policy checks, payment slip views, and verification confirmations.

---

*Refer to [CONTEXT.md](file:///C:/D/drivecare/drivecare/CONTEXT.md) for folder trees mapping the physical locations of these components.*
