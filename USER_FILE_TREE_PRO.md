# 📁 User-Related File Tree Structure (DriveCare)

## 🔧 Backend Structure - User Main Folders
```
📁 src/
├── 📁 app/api/
│   ├── 📁 auth/
│   ├── 📁 user-controller/
│   ├── 📁 booking/
│   ├── 📁 health-bookinng/
│   └── 📁 reports/
└── 📁 lib/
    ├── 📄 cloudinary.ts
    ├── 📄 db.ts
    ├── 📄 line.ts
    └── 📄 pusher.ts

## 🔧 Backend Structure - User APIs
```
📁 src/
├── 📁 app/api/
│   ├── 📁 auth/
│   │   └── 📁 users/
│   │       ├── 📁 login/
│   │       │   └── 📄 route.ts
│   │       └── 📁 register/
│   │           └── 📄 route.ts
│   ├── 📁 user-controller/
│   │   ├── 📁 edit-profile/
│   │   │   └── 📄 route.ts
│   │   └── 📁 upload-image/
│   │       └── 📄 route.ts
│   ├── 📁 booking/
│   │   └── 📁 users/
│   │       ├── 📁 cancel-booking/
│   │       │   └── 📄 route.ts
│   │       ├── 📁 comfirm-booking/
│   │       │   └── 📄 route.ts
│   │       ├── 📁 detail-booking/
│   │       │   └── 📄 route.ts
│   │       ├── 📁 my-bookings/
│   │       │   └── 📄 route.ts
│   │       └── 📁 payments/
│   │           └── 📄 route.ts
│   ├── 📁 health-bookinng/
│   │   ├── 📁 create-health/
│   │   │   └── 📄 route.ts
│   │   └── 📁 get-health/
│   │       └── 📄 route.ts
│   └── 📁 reports/
│       └── 📁 users/
│           └── 📄 route.ts
├── 📁 lib/
│   ├── 📄 cloudinary.ts
│   ├── 📄 db.ts
│   ├── 📄 line.ts
│   └── 📄 pusher.ts
├── 📁 utils/
│   ├── 📄 db-datetime.ts
│   ├── 📄 format-datetime.ts
│   ├── 📄 past-datetime-content.ts
│   ├── 📄 format-report-type.ts
│   ├── 📄 distance.ts
│   └── 📄 pagination.ts
├── 📁 services/
│   └── 📁 sent-line-user/
│       ├── 📄 driver-accepted.ts
│       ├── 📄 driver-cancelled.ts
│       ├── 📄 payment-pending.ts
│       ├── 📄 payment-verification.ts
│       ├── 📄 status-update.ts
│       └── 📄 success-reserved.ts
├── 📁 types/
│   ├── 📁 admin/
│   ├── 📁 driver/
│   ├── 📁 profile/
│   ├── 📁 user/
│   ├── 📁 forms/
│   ├── 📁 auth/
│   ├── 📁 map/
│   ├── 📁 realtime/
│   ├── 📄 notification.ts
│   ├── 📄 profile.ts
│   ├── 📄 report.ts
│   └── 📄 useContextType.ts
├── 📁 constants/
│   ├── 📁 policy/
│   ├── 📁 reports/
│   └── 📄 booking-status.ts
├── 📁 data/
│   └── 📄 healthTips.ts
└── 📁 components/
    ├── 📁 admin/
    └── 📁 driver/

## 🎨 Frontend Structure - Detailed
```
📁 src/
├── 📁 app/ (Pages & Routing)
│   ├── 📁 (app)/ (User Pages)
│   │   ├── 📄 page.tsx (User Dashboard)
│   │   ├── � page.tsx (User Dashboard)
│   │   ├── 📄 layout.tsx (User Layout)
│   │   ├── � edit-profile-user/
│   │   ├── 📁 job-detail-user/
│   │   ├── 📁 booking/
│   │   ├── 📁 list-reserve/
│   │   ├── 📁 payment/
│   │   ├── 📁 health-booking/
│   │   ├── 📁 notifications/
│   │   └── 📁 settings/
│   └── 📁 register-user/
├── � components/ (UI Components)
│   ├── � user/ (User-specific)
│   │   └── 📄 StatusTrackerCard.tsx
│   ├── 📁 navigation-menu/ (Navigation)
│   │   ├── 📄 nav-menu.ts
│   │   └── 📄 bottom-navbar.tsx
│   ├── 📁 modals/ (Dialog Components)
│   │   ├── 📄 LineNotifyModal.tsx
│   │   ├── 📄 PolicyModal.tsx
│   │   ├── 📄 ReportModal.tsx
│   │   └── 📄 UpslipModal.tsx
│   ├── 📁 common/ (Shared Components)
│   │   └── 📄 SelectDropdown.tsx
│   ├── 📄 Button.tsx
│   └── 📄 ConsentCheckbox.tsx
├── 📁 context/ (State Management)
│   └── 📄 UserContext.tsx
├── 📁 store/ (Global State)
│   └── 📄 notification.state.ts
├── 📁 types/ (TypeScript Types)
│   ├── 📁 profile/
│   │   ├── 📄 base.ts
│   │   └── 📄 user.ts
│   ├── 📁 user/
│   │   ├── 📄 bookings.ts
│   │   └── 📄 health-bookinng.ts
│   ├── 📁 forms/
│   │   ├── 📄 auth.ts
│   │   └── 📄 edit-profile.ts
│   ├── 📁 auth/
│   │   └── 📄 line.ts
│   ├── � map/
│   │   └── � search.ts
│   ├── 📄 profile.ts
│   └── � useContextType.ts
├── � services/ (Frontend Services)
│   ├── � calculatePrice.ts
│   ├── �📁 map/
│   │   ├── 📄 location.ts
│   │   ├── 📄 LongdoMap.tsx
│   │   ├── 📄 PlaceSearch.tsx
│   │   └── 📄 useLongdoMap.ts
│   └── 📁 hospital/
│       └── 📄 get-near-find.ts
├── 📁 data/ (Static Data)
│   └── 📄 healthTips.ts
├── 📁 constants/ (Constants)
│   ├── 📁 policy/
│   │   └── 📄 user-terms.ts
│   └── 📄 booking-status.ts
├── 📁 utils/ 
│   ├── 📄 dayjs.ts 
│   └── 📄 format-datetime.ts 
└── 📁 lib/ (External Libraries)
    ├── 📄 cloudinary.ts
    ├── 📄 db.ts
    ├── 📄 line.ts
    └── 📄 pusher.ts

## 🔧 Backend API Structure
```
📁 src/app/api/
├── 📁 auth/
│   └── 📁 users/
│       ├── 📁 login/
│       └── 📁 register/
├── 📁 user-controller/
│   ├── 📁 edit-profile/
│   │   └── 📄 route.ts
│   └── 📁 upload-image/
│       └── 📄 route.ts
├── 📁 users/
│   └── 📄 route.ts
├── 📁 booking/
│   └── 📁 users/
│       ├── 📁 [id]/
│       │   ├── 📁 cancel-booking/
│       │   └── 📁 detail-booking/
│       ├── 📁 comfirm-booking/
│       ├── 📁 my-bookings/
│       └──  payments/
├── 📁 health-bookinng/
│   ├── 📁 create-health/
│   └──  get-health/
└── 📁 reports/
    └── 📁 users/

---

## 🔑 Key User Features Summary:

### **🏠 User Pages (8 pages)**
- **edit-profile-user** - แก้ไขโปรไฟล์ผู้ใช้
- **job-detail-user** - รายละเอียดงานสำหรับผู้ใช้
- **user-booking** - จองรถสำหรับผู้ใช้
- **user-list-reserve** - รายการการจองของผู้ใช้
- **user-payment** - ชำระเงินของผู้ใช้
- **health-user-booking** - จองด้านสุขภาพของผู้ใช้
- **notifications** - การแจ้งเตือนสำหรับผู้ใช้
- **settings** - ตั้งค่าระบบ (โปรไฟล์, ออกจากระบบ)

### **🔐 Authentication & Registration**
- **register-user** - ลงทะเบียนผู้ใช### **โครงสร้างไฟล์และโฟลเดอร์หลัก**
| โฟลเดอร์/ไฟล์ | คำอธิบาย (ส่วนที่ User ใช้) |
|---|---|
| **📁 app/** | จัดการโครงสร้างหน้า (Page) และ Routing ของระบบที่ผู้ใช้เข้าถึง |
| └── 📁 (app)/ | กลุ่มหน้าหลักสำหรับผู้ใช้ที่เข้าสู่ระบบแล้ว |
| │   ├── 📄 page.tsx | หน้าแรกของผู้ใช้ (User Dashboard) |
| │   ├── 📄 layout.tsx | Layout หลักสำหรับหน้าผู้ใช้ |
| │   ├── 📁 edit-profile-user/ | หน้าแก้ไขโปรไฟล์ผู้ใช้ |
| │   ├── 📁 job-detail-user/ | หน้ารายละเอียดงานสำหรับผู้ใช้ |
| │   ├── 📁 booking/ | หน้าจองรถสำหรับผู้ใช้ |
| │   ├── 📁 list-reserve/ | หน้ารายการการจองของผู้ใช้ |
| │   ├── 📁 payment/ | หน้าชำระเงินของผู้ใช้ |
| │   ├── 📁 health-booking/ | หน้าจองด้านสุขภาพของผู้ใช้ |
| │   ├── 📁 notifications/ | หน้าการแจ้งเตือนสำหรับผู้ใช้ |
| │   └── 📁 settings/ | หน้าตั้งค่าระบบสำหรับผู้ใช้ |
| └── 📁 register-user/ | หน้าลงทะเบียนผู้ใช้ใหม่ |
| **📁 components/** | จัดเก็บ Component ส่วนติดต่อผู้ใช้ที่สามารถนำกลับมาใช้ซ้ำได้ |
| ├── 📁 user/ | Component สำหรับผู้ใช้โดยเฉพาะ |
| │   └── 📄 StatusTrackerCard.tsx | การ์ดแสดงสถานะการจอง |
| ├── 📁 navigation-menu/ | Component แถบนำทางสำหรับผู้ใช้ |
| │   ├── 📄 nav-menu.ts | เมนูนำทางหลัก |
| │   └── 📄 bottom-navbar.tsx | แถบนำทางด้านล่าง |
| ├── 📁 modals/ | Component โมดัลที่ผู้ใช้ใช้ |
| │   ├── 📄 LineNotifyModal.tsx | โมดัลแจ้งเตือน LINE |
| │   ├── 📄 PolicyModal.tsx | โมดัลข้อกำหนดและเงื่อนไข |
| │   ├── 📄 ReportModal.tsx | โมดัลรายงาน |
| │   └── 📄 UpslipModal.tsx | โมดัลอัปโหลดสลิป |
| ├── 📁 common/ | Component ทั่วไปที่ใช้ร่วมกัน |
| │   └── 📄 SelectDropdown.tsx | ดรอปดาวน์เลือกข้อมูล |
| ├── 📄 Button.tsx | ปุ่มทั่วไปสำหรับผู้ใช้ |
| └── 📄 ConsentCheckbox.tsx | ช่องยอมรับเงื่อนไข |
| **📁 context/** | จัดการสถานะข้อมูลผู้ใช้ด้วย React Context API |
| └── 📄 UserContext.tsx | Context จัดการข้อมูลผู้ใช้ทั่วระบบ |
| **📁 store/** | จัดการสถานะข้อมูลแบบ Global State |
| └── 📄 notification.state.ts | State จัดการการแจ้งเตือน |
| **📁 types/** | จัดเก็บ Type และ Interface ของ TypeScript สำหรับข้อมูลผู้ใช้ |
| ├── 📁 profile/ | Types โปรไฟล์ผู้ใช้ |
| │   ├── 📄 base.ts | Types โครงสร้างพื้นฐานโปรไฟล์ |
| │   └── 📄 user.ts | Types โปรไฟล์ผู้ใช้โดยเฉพาะ |
| ├── 📁 user/ | Types ข้อมูลการจองและสุขภาพ |
| │   ├── 📄 bookings.ts | Types การจองรถ |
| │   └── 📄 health-bookinng.ts | Types การจองด้านสุขภาพ |
| ├── 📁 forms/ | Types ฟอร์มที่ผู้ใช้ใช้ |
| │   ├── 📄 auth.ts | Types ฟอร์มการยืนยันตัวตน |
| │   └── 📄 edit-profile.ts | Types ฟอร์มแก้ไขโปรไฟล์ |
| ├── 📁 auth/ | Types การยืนยันตัวตน |
| │   └── 📄 line.ts | Types การยืนยันตัวตนผ่าน LINE |
| ├── 📁 map/ | Types แผนที่ที่ผู้ใช้ใช้ |
| │   ├── 📄 geo.ts | Types พิกัดภูมิศาสตร์ |
| │   ├── 📄 longdo.ts | Types แผนที่ Longdo |
| │   └── 📄 search.ts | Types การค้นหาสถานที่ |
| ├── 📄 profile.ts | Types โปรไฟล์ทั่วไป |
| └── 📄 useContextType.ts | Types สำหรับ Context |
| **📁 services/** | จัดการการเรียกใช้บริการภายนอกที่เกี่ยวข้องกับผู้ใช้ |
| ├── 📄 calculatePrice.ts | Service คำนวณราคาการจอง |
| ├── 📁 map/ | Services แผนที่สำหรับผู้ใช้ |
| │   ├── 📄 location.ts | Service จัดการตำแหน่งที่ตั้ง |
| │   ├── 📄 LongdoMap.tsx | Service แผนที่ Longdo |
| │   ├── 📄 PlaceSearch.tsx | Service ค้นหาสถานที่ |
| │   └── 📄 useLongdoMap.ts | Hook สำหรับแผนที่ Longdo |
| └── 📁 hospital/ | Services โรงพยาบาล |
|     └── 📄 get-near-find.ts | Service ค้นหาโรงพยาบาลใกล้เคียง |
| **📁 data/** | ข้อมูลสำหรับผู้ใช้ |
| └── 📄 healthTips.ts | ข้อมูลเคล็ดลับสุขภาพ |
| **📁 constants/** | ค่าคงที่ที่ใช้ร่วมกันทั้งระบบที่เกี่ยวข้องกับผู้ใช้ |
| ├── 📁 policy/ | ข้อกำหนดและเงื่อนไข |
| │   └── 📄 user-terms.ts | ข้อกำหนดและเงื่อนไขสำหรับผู้ใช้ |
| └── 📄 booking-status.ts | สถานะการจอง |
| **📁 utils/** | ไฟล์ยูทิลิตี้สำหรับฟังก์ชันเสริมที่ผู้ใช้ใช้งาน |
| ├── 📄 dayjs.ts | จัดการวันที่และเวลา |
| ├── 📄 db-datetime.ts | จัดการ datetime ฐานข้อมูล |
| ├── 📄 distance.ts | คำนวณระยะทาง |
| └── 📄 format-datetime.ts | จัดรูปแบบวันที่เวลา |
| **📁 lib/** | ไฟล์เชื่อมต่อระบบหรือบริการภายนอกที่ผู้ใช้ใช้งาน |
| ├── 📄 cloudinary.ts | จัดการรูปภาพผู้ใช้ |
| ├── 📄 db.ts | การเชื่อมต่อฐานข้อมูลผู้ใช้ |
| ├── 📄 line.ts | LINE SDK สำหรับแจ้งเตือนผู้ใช้ |
| └── 📄 pusher.ts | Real-time communication สำหรับผู้ใช้ |
