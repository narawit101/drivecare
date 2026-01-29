"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useNotificationStore } from "@/store/notification.state";
import { useUser } from "@/context/UserContext";
import { Booking } from "@/types/user/bookings";
import PaymentUploadModal from "@/components/modals/UpslipModal"
import { toast } from "react-toastify";
import { mockTips } from "@/data/healthTips"
import Pusher from "pusher-js";


const STARTED_STATUS = [
  "accepted",
  "going_pickup",
  "picked_up",
  "heading_to_hospital",
  "arrived_at_hospital",
  "waiting_for_return",
  "heading_home",
  "arrived_home",
  "pending_payment",
] as const;

// แยกสถานะสำหรับการแสดงบน Progress Bar
const TRACKING_FLOW = [
  "accepted",
  "going_pickup",
  "picked_up",
  "heading_to_hospital",
  "arrived_at_hospital",
  "waiting_for_return",
  "heading_home",
  "arrived_home",
];

const STATUS_LABEL: Record<string, string> = {
  accepted: "มีคนขับรับงานแล้ว",
  going_pickup: "กำลังเดินทางไปรับผู้ป่วย",
  picked_up: "รับผู้ป่วยแล้ว",
  heading_to_hospital: "กำลังเดินทางไปโรงพยาบาล",
  arrived_at_hospital: "ถึงโรงพยาบาลแล้ว",
  waiting_for_return: "รอรับกลับ",
  heading_home: "กำลังเดินทางกลับ",
  arrived_home: "ถึงบ้านแล้ว",
  pending_payment: "รอชำระเงิน",
  pending: "รอดำเนินการ",
};

export default function Home() {
  const router = useRouter();
  const { token, isLoad, userData } = useUser();
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);


  useEffect(() => {
    if (!isLoad) return;
    if (!token || !userData) {
      router.replace("/login");
      return;
    }
    if (userData.role === "driver") {
      router.replace("/driver-dashboard");
    }
  }, [isLoad, token, userData, router]);

  const getBooking = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await fetch("/api/booking/users/my-bookings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const data = await response.json();
      setBookings(Array.isArray(data.bookings) ? data.bookings : []);
    } catch (error) {
      console.error("getBooking error:", error);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoad || !token) return;
    getBooking();
  }, [isLoad, token, getBooking]);

  const startBookings = bookings.filter((b) =>
    STARTED_STATUS.includes(b.status as any)
  );

  const completedBookings = bookings.filter(
    (b) => b.status === "success"
  );

  const handleViewDetail = (id: number) => {
    router.push(`/job-detail-user?id=${id}`);
  };

  const handleUploadSlip = async (file: File, bookingId: number) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("booking_id", String(bookingId));
    formData.append("payment_slip", file);

    try {
      const response = await fetch("/api/booking/users/payments", {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json()
      console.log(data)

      console.log(response)

      if (response.ok) {
        toast.success("อัปโหลดสลิปสำเร็จ");
        setIsPaymentModalOpen(false);
        setSelectedBooking(null);
        getBooking();
      } else {
        toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
      }
    } catch (error) {
      console.error("Upload Error:", error);
      toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
  };

  useEffect(() => {
    if (!token || !userData || userData.role !== "user") return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: "ap1",
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    const channel = pusher.subscribe(`private-user-${userData.user_id}`);
    channel.bind("booking-updated", (data: any) => {
      console.log("ได้รับสัญญาณอัปเดต:", data);

      // 2. สั่งโหลดข้อมูลใหม่จาก Database ทันที
      getBooking();

      // 3. แจ้งเตือนผู้ใช้
      const status = String(data?.status ?? "");
      const label = STATUS_LABEL[status] ?? status;
      toast.info(label ? `สถานะอัปเดต: ${label}` : "สถานะการเดินทางของคุณมีการอัปเดต");
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-user-${userData.user_id}`);
      pusher.disconnect();
    };
  }, [userData, token, getBooking]);

  return (
    <section className="w-full bg-gray-50 min-h-screen pb-24">
      {userData && isLoad && (
        <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
          <div className="w-full max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <div className="relative w-12 h-12 md:w-14 md:h-14">
                <Image
                  className="rounded-full object-cover border-2 border-primary-100"
                  src={userData.profile_img || "/default-avatar.png"}
                  alt="User Profile"
                  fill
                />
              </div>
              <div>
                <p className="text-[10px] font-bold text-primary-500 uppercase tracking-wider">
                  ยินดีต้นรับ
                </p>
                <h2 className="text-base text-gray-800 font-bold">
                  สวัสดี, {userData.name}
                </h2>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="w-full max-w-5xl mx-auto px-6 py-4">
        {/* ส่วนแสดงงานที่กำลังดำเนินการ (Tracking) */}
        {startBookings.length > 0 && (
          <div className="mt-4 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary-500"></span>
              </span>
              <h3 className="text-lg font-bold text-gray-800">กำลังดำเนินการ</h3>
            </div>

            <div className="space-y-4">
              {startBookings.map((item) => {
                const currentStepIndex = TRACKING_FLOW.indexOf(item.status);
                const isPendingPayment = item.status === "pending_payment";
                const progressPercentage = isPendingPayment
                  ? 100
                  : (Math.max(0, currentStepIndex) / (TRACKING_FLOW.length - 1)) * 100;

                return (
                  <div key={item.booking_id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Header สถานะ */}
                    <div className="bg-[#E2F3F2] px-5 py-3 flex justify-between items-center">
                      <div className="flex items-center gap-2 text-[#3a8b85] font-bold text-sm">
                        <Icon icon="solar:Map-point-bold-duotone" className="w-5 h-5" />
                        {STATUS_LABEL[item.status] ?? item.status}
                      </div>
                    </div>

                    <div className="p-5">
                      {/* Tracking Progress Bar */}
                      {!isPendingPayment && (
                        <div className="mb-8 px-2">
                          <div className="relative flex justify-between items-center w-full">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2"></div>
                            <div
                              className="absolute top-1/2 left-0 h-1 bg-[#70C5BE] -translate-y-1/2 transition-all duration-700"
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                            {TRACKING_FLOW.map((step, idx) => (
                              <div key={step} className="relative z-10">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${idx <= currentStepIndex ? "bg-[#70C5BE] border-[#70C5BE]" : "bg-white border-gray-200"
                                  } ${idx === currentStepIndex ? "ring-4 ring-[#E2F3F2] scale-125" : ""}`} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* รายละเอียดจุดรับส่ง */}
                      <div className="flex gap-4 mb-6">
                        <div className="flex flex-col items-center py-1">
                          <Icon icon="solar:map-point-wave-bold" className="text-[#70C5BE] w-5 h-5" />
                          <div className="w-0.5 grow border-l-2 border-dashed border-gray-100 my-1"></div>
                          <Icon icon="mdi:hospital-building" className="text-[#70C5BE] w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-4 text-sm">
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">จุดรับ</p>
                            <p className="text-gray-700 font-medium line-clamp-1">{item.pickup_address}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">จุดส่ง</p>
                            <p className="text-gray-700 font-medium line-clamp-1">{item.dropoff_address}</p>
                          </div>
                        </div>
                      </div>


                      {isPendingPayment ? (
                        <button onClick={() => {
                          setSelectedBooking(item)
                          setIsPaymentModalOpen(true)
                        }} className="w-full bg-[#70C5BE] text-white font-bold py-2 rounded-2xl shadow-lg shadow-[#70C5BE]/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                          <Icon icon="solar:wallet-money-bold" className="w-5 h-5" />
                          ชำระเงินตอนนี้
                        </button>
                      ) : (
                        <button onClick={() => handleViewDetail(item.booking_id)} className="w-full py-3.5 border-2 border-[#70C5BE]/20 text-[#3a8b85] font-bold rounded-2xl hover:bg-[#F2FAF9] active:scale-95 transition-all text-sm flex items-center justify-center gap-2">
                          <Icon icon="solar:document-list-bold" className="w-5 h-5" />
                          ดูรายละเอียด
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
              <PaymentUploadModal
                open={isPaymentModalOpen}
                bookingId={selectedBooking?.booking_id}
                totalPrice={selectedBooking?.total_price}
                onClose={() => {
                  setIsPaymentModalOpen(false);
                  setSelectedBooking(null);
                }}
                onSubmit={(file) => {
                  if (!selectedBooking) return;
                  handleUploadSlip(file, selectedBooking.booking_id);
                }}
              />

            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "การจองของฉัน", icon: "solar:calendar-date-bold", path: "/list-reserve" },
            { label: "ชำระเงิน", icon: "solar:card-2-bold", path: "/payment" },
            { label: "สมุดสุขภาพ", icon: "solar:health-bold", path: "/health-booking" },
          ].map((menu) => (
            <button key={menu.label} onClick={() => router.push(menu.path)} className="flex flex-col items-center gap-2  ">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-gray-50 flex items-center justify-center active:scale-90 transition-all">
                <Icon icon={menu.icon} className="w-8 h-8 text-[#70C5BE] cursor-pointer" />
              </div>
              <span className="text-xs font-semibold text-gray-600">{menu.label}</span>
            </button>
          ))}
        </div>

        {/* ปุ่มจองรถหลัก */}
        <button className="w-full bg-linear-to-r from-[#70C5BE] to-[#5bb1aa] text-white rounded-2xl py-3 font-bold shadow-xl shadow-[#70C5BE]/20 active:scale-[0.98] transition-all mb-10 flex items-center justify-center gap-3 cursor-pointer"
          onClick={() => router.push("/booking")}
        >
          <Icon icon="solar:ambulance-bold" className="w-6 h-6" />
          จองรถพยาบาลทันที
        </button>


        <div>
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-gray-800">ประวัติล่าสุด</h4>
            <button onClick={() => router.push("/list-reserve")} className="text-sm font-bold text-[#70C5BE]">ดูทั้งหมด</button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar">
            {loading ? (
              <p className="text-sm text-gray-400">กำลังโหลด...</p>
            ) : (
              (() => {
                if (completedBookings.length === 0) {
                  return <p className="text-sm text-gray-400">ไม่มีการจอง</p>
                }

                return completedBookings.slice(0, 5).map((item) => (
                  <div key={item.booking_id} className="min-w-60 bg-white p-4 rounded-2xl shadow-sm border border-gray-50 "

                  >
                    <div className="flex items-center gap-2 mb-3 justify-between">
                      <div className="p-2 bg-gray-50 rounded-lg">
                        <Icon icon="solar:history-bold" className="text-gray-400 w-4 h-4" />
                      </div>
                      <p className="text-[10px] border p-0.5 px-1 rounded-sm border-primary-400 text-primary-400">
                        {item.status === "success" ? "สำเร็จ" : item.status}
                      </p>

                    </div>
                    <p className="text-sm font-bold text-gray-700 line-clamp-1 mb-1">{item.dropoff_address}</p>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const url = `/booking?pickup=${encodeURIComponent(item.pickup_address)}` +
                            `&p_lat=${item.pickup_lat}` +
                            `&p_lon=${item.pickup_lng}` +
                            `&dropoff=${encodeURIComponent(item.dropoff_address)}` +
                            `&d_lat=${item.dropoff_lat}` +
                            `&d_lon=${item.dropoff_lng}`;

                          router.push(url);
                        }}
                        className="text-xs text-[#70C5BE] mt-1.5 border p-1 px-1 rounded-sm border-[#70C5BE] cursor-pointer hover:bg-[#70C5BE] hover:text-white z-10"
                      >
                        จองอีกครั้ง
                      </button>
                      <div onClick={() => handleViewDetail(item.booking_id)}>
                        <Icon icon="ei:arrow-right" className="text-xl cursor-pointer hover:text-[#70C5BE] " />
                      </div>
                    </div>
                  </div>
                ))
              })()
            )}
          </div>
        </div>
        <div className="mt-13">
          <h4 className="font-bold text-gray-800 ">Health Trips For You</h4>
          <div className="flex flex-col md:flex-row gap-3 mt-4">
            {mockTips.categories.map((category) => (
              <div key={category.key}>
                <div key={category.key} style={{
                  backgroundImage: `linear-gradient(135deg, ${category.color}70, ${category.color}25)`,
                }}
                  className="min-w-20 bg-white p-4 rounded-2xl shadow-sm border border-gray-50">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-col md:flex-row md:items-center gap-2">
                      <Icon icon={category.icon}
                        style={{ color: category.iconcolor }}
                        className="bg-gray-50 p-1 rounded-md  text-gray-400 w-7 h-7" />
                      <h2
                        style={{ color: category.labelcolor }}
                        className="text-sm font-bold text-gray-700 line-clamp-1 ">{category.label}</h2>
                    </div>
                    <div className="flex items-center gap-2 mb-3 justify-between">
                      {category.items.map((item) => (
                        <div key={item.id} >
                          <h3
                            style={{ color: item.titalcolor }} className="text-sm mb-0.5 font-bold ">{item.title}</h3>
                          <p className="text-sm text-gray-500">{item.description}</p>
                        </div>
                      ))}

                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </section>
  );
}