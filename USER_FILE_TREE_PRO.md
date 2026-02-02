# 📁 User-Related File Tree Structure (DriveCare) - File Tree Pro

## 🎨 Frontend Structure
```
📁 src/
├── 📁 app/
│   ├── 📁 (app)/
│   │   ├── 📁 edit-profile-user/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 job-detail-user/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 user-booking/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 user-list-reserve/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 user-payment/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 health-user-booking/
│   │   │   └── 📄 page.tsx
│   │   ├── 📁 notifications/
│   │   │   └── 📄 page.tsx
│   │   └── 📁 settings/
│   │       └── 📄 page.tsx
│   └── 📁 register-user/
│       └── 📄 page.tsx
├── 📁 components/
│   ├── 📁 user/
│   │   └── 📄 StatusTrackerCard.tsx
│   ├── 📁 navigation-menu/
│   │   ├── 📄 nav-menu.ts
│   │   └── 📄 bottom-navbar.tsx
│   └── 📁 admin/
│       └── 📁 manager-users/
│           ├── 📄 AdminUsersTable.tsx
│           └── 📄 EditUserModal.tsx
├── 📁 context/
│   └── 📄 UserContext.tsx
├── 📁 store/
│   └── 📄 notification.state.ts
├── 📁 types/
│   ├── 📁 profile/
│   │   ├── 📄 base.ts
│   │   ├── 📄 user.ts
│   │   
│   ├── 📁 user/
│   │   ├── 📄 bookings.ts
│   │   └── 📄 health-bookinng.ts
│   ├── 📁 admin/
│   │   └── 📄 manager-users.ts
│   ├── 📁 auth/
│   │   └── 📄 line.ts
│   ├── 📄 notification.ts
│   ├── 📄 profile.ts
│   └── 📁 forms/
│       └── 📄 auth.ts
└── 📁 constants/
    └── 📁 policy/
        └── 📄 user-terms.ts
```

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
```

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
- **register-user** - ลงทะเบียนผู้ใช้ใหม่
- **auth/users/** - API การยืนยันตัวตน

### **📡 API Endpoints (15+ endpoints)**
- **user-controller/** - API ควบคุมผู้ใช้ (แก้ไขโปรไฟล์, อัพโหลดรูป)
- **booking/users/** - API จัดการการจองทั้งหมด
- **health-bookinng/** - API จัดการข้อมูลสุขภาพผู้ใช้
- **reports/users/** - API รายงานผู้ใช้

### **🎨 Components (5 components)**
- **user/** - Component สำหรับผู้ใช้
- **navigation-menu/** - Component นำทางสำหรับผู้ใช้
- **admin/manager-users/** - Component จัดการผู้ใช้สำหรับ Admin

### **🔄 State Management**
- **UserContext** - Context จัดการสถานะผู้ใช้ทั่วระบบ
- **notification.state** - State จัดการการแจ้งเตือน

### **📝 Type Definitions (10+ types)**
- **profile/** - Types โปรไฟล์ผู้ใช้
- **user/** - Types การจองและสุขภาพ
- **admin/** - Types จัดการผู้ใช้
- **notification** - Types การแจ้งเตือน

### **📋 Constants & Policies**
- **user-terms** - ข้อกำหนดและเงื่อนไขสำหรับผู้ใช้

---

*📊 Total: 40+ user-related files and folders covering complete user functionality in DriveCare system*
