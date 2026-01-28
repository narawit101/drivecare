"use client";

import { useNotificationStore } from "@/store/notification.state";
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Icon } from "@iconify/react";

type FilterType = "ทั้งหมด" | "อ่านแล้ว" | "ยังไม่ได้อ่าน";

export default function Notification() {
  const { notifications, setNotifications } = useNotificationStore();
  const { token, isLoad, userData } = useUser();
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<FilterType>("ทั้งหมด");

  useEffect(() => {
    if (!isLoad) return;
    if (!token && !userData) {
      router.replace("/login");
    }
  }, [token, isLoad, userData]);


  useEffect(() => {
    setNotifications([
      {
        id: "1",
        title: "ระบบได้รับงานของคุณแล้ว",
        message: "งานจัดส่งสินค้าจาก ขอนแก่น ไปยัง ร้อยเอ็ด ได้รับการยืนยันแล้ว",
        createdAt: "2025-01-01 10:30",
        read: false,
      },
      {
        id: "2",
        title: "อัปเดตสถานะการยืนยัน",
        message: "บัญชีของคุณได้รับการตรวจสอบเรียบร้อยแล้ว ยินดีต้อนรับ!",
        createdAt: "2025-01-02 14:20",
        read: true,
      },
      {
        id: "3",
        title: "แจ้งเตือนการจองใหม่",
        message: "มีลูกค้าต้องการเรียกใช้บริการในพื้นที่ใกล้เคียงคุณ",
        createdAt: "2025-01-03 09:00",
        read: false,
      },
    ]);
  }, [setNotifications]);

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === "อ่านแล้ว") return n.read === true;
    if (activeFilter === "ยังไม่ได้อ่าน") return n.read === false;
    return true;
  });

  return (
    <div className="min-h-screen bg-white">

      <header className="border-b border-neutral-200">
        <div className="title w-full max-w-5xl mx-auto px-8 py-4">
          <h2 className="text-2xl text-gray-800 font-semibold">การแจ้งเตือน</h2>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {(["ทั้งหมด", "อ่านแล้ว", "ยังไม่ได้อ่าน"] as FilterType[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer ${activeFilter === filter
                ? "bg-[#70C5BE] text-white shadow-sm"
                : "bg-slate-50 text-slate-400 hover:bg-slate-100"
                }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="space-y-1">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`group flex items-start gap-4 p-5 border-b border-slate-50 transition-colors hover:bg-slate-50 relative`}
              >
                <div className="w-14 h-14 bg-slate-300 rounded-xl shrink-0"></div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-lg font-bold text-slate-800 truncate pr-4">
                      {notification.title}
                    </h3>

                    {!notification.read && (
                      <div className="w-2.5 h-2.5 bg-[#70C5BE] rounded-full mt-2 shadow-sm shadow-emerald-200"></div>
                    )}
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed truncate-2-lines mb-2">
                    {notification.message}
                  </p>
                  <p className="text-[11px] font-medium text-slate-300 uppercase tracking-wide">
                    {notification.createdAt}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Icon icon="solar:bell-off-linear" width="64" className="text-slate-200" />
              <p className="text-slate-400 font-medium">ไม่พบรายการแจ้งเตือน</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}