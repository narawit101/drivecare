import { SidebarMenu } from "@/types/admin/sideBar";
export const sidebarMenu: SidebarMenu[] = [
  {
    type: "item",
    label: "หน้าแรก",
    icon: "solar:home-2-linear",
    href: "/admin",
  },

  {
    type: "section",
    title: "กระบวนการการทำงาน",
  },
  {
    type: "item",
    label: "รายการจอง",
    icon: "solar:book-2-line-duotone",
    href: "/admin/overview-booking",
  },
  {
    type: "item",
    label: "จัดสรรงานให้ผู้ขับ",
    icon: "solar:clipboard-outline",
    href: "/admin/job-assignment",
  },
  {
    type: "item",
    label: "ตรวจสอบสลิปการโอนเงิน",
    icon: "solar:verified-check-outline",
    href: "/admin/verified-slip",
  },
  {
    type: "item",
    label: "รายงานปัญหา",
    icon: "solar:shield-warning-outline",
    href: "/admin/report",
  },

  {
    type: "section",
    title: "จัดการข้อมูล",
  },
  {
    type: "item",
    label: "จัดการผู้ใช้",
    icon: "solar:users-group-rounded-linear",
    href: "/admin/manager-users",
  },
];
