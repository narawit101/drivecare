"use client"

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import { Booking } from "@/types/user/bookings";
import { toast } from "react-toastify";
import dayjs from "@/utils/dayjs";
import LongdoMap from "@/services/map/LongdoMap";
import { useLongdoMap } from "@/services/map/useLongdoMap";
import * as FormatDatetime from "@/utils/format-datetime"
import Pusher from "pusher-js";
import Pagination from "@/components/driver/Pagination";

type TabGroup = "jobinprogress" | "jobhistory";

export default function DriverJob() {
    const [activeTab, setActiveTab] = useState<TabGroup>("jobinprogress");
    const [booking, setBooking] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const { token, isLoad, userData } = useUser();
    const router = useRouter();

    const { initMap, renderRoute, clearRoute } = useLongdoMap();
    const [mapReady, setMapReady] = useState(false);
    const renderedKeyRef = useRef<string | null>(null);

    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 9;

    const isInProgress = activeTab === "jobinprogress";

    // 1. Fetch Data
    const fetchAllBooking = useCallback(async () => {
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
            setBooking(Array.isArray(data.bookings) ? data.bookings : []);
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลการจองได้");
            setBooking([]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (isLoad && token) fetchAllBooking();
    }, [isLoad, token, fetchAllBooking]);

    // 2. Real-time Status Patching (ห้ามสั่ง fetch ใหม่ถ้าแค่เปลี่ยนสถานะ)
    useEffect(() => {
        if (!token || !userData || userData.role !== "user") return;

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: "ap1",
            authEndpoint: "/api/pusher/auth",
            auth: { headers: { Authorization: `Bearer ${token}` } },
        });

        const channel = pusher.subscribe(`private-user-${userData.user_id}`);

        channel.bind("booking-updated", (data: any) => {
            // ใช้ Functional Update เพื่อแก้ปัญหาเฉพาะจุด
            setBooking((prev) =>
                prev.map((b) =>
                    String(b.booking_id) === String(data.booking_id)
                        ? { ...b, status: data.status } // Patch เฉพาะสถานะ ข้อมูลพิกัดยังเหมือนเดิม
                        : b
                )
            );
            toast.info("สถานะการจองมีการอัปเดต");
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`private-user-${userData.user_id}`);
            pusher.disconnect();
        };
    }, [userData, token]);

    // 3. Logic สำหรับแบ่งกลุ่มงาน
    const activeStatuses = [
        'confirmed', 'going_pickup', 'picked_up',
        'heading_to_hospital', 'arrived_at_hospital',
        'waiting_for_return', 'heading_home', 'arrived_home', 'pending_payment', 'rejected'
    ];

    const inProgressBookings = booking.filter(b => activeStatuses.includes(b.status));
    const completedBookings = booking.filter(b => !activeStatuses.includes(b.status));

    const filteredCompletedBookings = statusFilter === "all"
        ? completedBookings
        : completedBookings.filter(b => statusFilter === "success" ? (b.status === "success" || b.status === "completed") : b.status === statusFilter);

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const paginatedCompletedBookings = filteredCompletedBookings.slice(startIndex, startIndex + PAGE_SIZE);
    const totalPages = Math.ceil(filteredCompletedBookings.length / PAGE_SIZE);



    // 4. Map Persistence (ล็อกพิกัด)
    useEffect(() => {
        // วาดแผนที่เฉพาะแท็บ In Progress และมีงานทำอยู่
        if (!mapReady || !isInProgress || inProgressBookings.length === 0) {
            renderedKeyRef.current = null;
            return;
        }

        const currentJob = inProgressBookings[0];
        const currentKey = `${currentJob.booking_id}`;

        if (renderedKeyRef.current === currentKey) return;

        const timer = setTimeout(() => {
            try {
                clearRoute();
                renderRoute(
                    { lon: currentJob.pickup_lng, lat: currentJob.pickup_lat },
                    { lon: currentJob.dropoff_lng, lat: currentJob.dropoff_lat }
                );
                renderedKeyRef.current = currentKey;
            } catch (err) {
                console.error("Map rendering failed:", err);
            }
        }, 800);

        return () => clearTimeout(timer);
    }, [mapReady, inProgressBookings, isInProgress, renderRoute, clearRoute]);


    // --- อื่นๆ ---
    useEffect(() => { setStatusFilter("all"); setCurrentPage(1); }, [activeTab]);
    const handleViewDetail = (id: number) => router.push(`/job-detail-user?id=${id}`);

    if (!isLoad) return null;

    return (
        <section className="w-full bg-gray-50 min-h-screen pb-24">
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-2">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
                        <Icon icon="mdi:chevron-left" className="text-3xl" />
                    </button>
                    <h2 className="text-xl font-bold">รายการจองของฉัน</h2>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full md:w-[400px]">
                    <button onClick={() => setActiveTab("jobinprogress")} className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${isInProgress ? "bg-[#70C5BE] text-white shadow-md" : "text-slate-400"}`}>
                        กำลังดำเนินการ ({inProgressBookings.length})
                    </button>
                    <button onClick={() => setActiveTab("jobhistory")} className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${!isInProgress ? "bg-[#70C5BE] text-white shadow-md" : "text-slate-400"}`}>
                        ประวัติการของ ({completedBookings.length})
                    </button>
                </div>

                <div className={`mb-6 transition-all duration-300
                    ${isInProgress && inProgressBookings.length > 0 ? "block" : "hidden"}`}>
                    <div className="bg-white rounded-4xl overflow-hidden shadow-sm border border-slate-100 h-[400px]">
                        <LongdoMap
                            initMap={(id) => {
                                initMap(id);
                                setMapReady(true);
                            }}
                        />
                    </div>
                </div>


                <div className={`grid gap-4 ${isInProgress ? "grid-cols-1" : "grid-cols-1 md:grid-cols-3"}`}>
                    {!isInProgress && (
                        <div className="col-span-full flex gap-2 mb-2">
                            {["all", "success", "cancelled"].map((id) => (
                                <button key={id} onClick={() => setStatusFilter(id)} className={`px-4 py-2 rounded-xl text-xs font-bold ${statusFilter === id ? "bg-[#70C5BE]/10 text-[#3a8b85] ring-1 ring-[#70C5BE]" : "bg-white text-slate-400 border border-slate-100"}`}>
                                    {id === "all" ? "ทั้งหมด" : id === "success" ? "สำเร็จ" : "ยกเลิก"}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading && booking.length === 0 ? (
                        <div className="col-span-full py-20 flex flex-col items-center gap-3 text-slate-300">
                            <div className="w-10 h-10 border-4 border-t-[#70C5BE] rounded-full animate-spin"></div>
                            <p>กำลังโหลด...</p>
                        </div>
                    ) : (
                        (isInProgress ? inProgressBookings : paginatedCompletedBookings).map(b => (
                            <BookingCard key={b.booking_id} booking={b} onViewDetail={handleViewDetail} />
                        ))
                    )}

                    {(isInProgress ? inProgressBookings : paginatedCompletedBookings).length === 0 && !loading && <EmptyState />}
                </div>

                {!isInProgress && totalPages > 1 && (
                    <Pagination currentPage={currentPage} totalPages={totalPages} onChangePage={setCurrentPage} />
                )}
            </main>
        </section>
    );
}


function BookingCard({ booking, onViewDetail }: { booking: Booking, onViewDetail: (id: number) => void }) {
    const getStatusConfig = (status: string) => {
        const configs: Record<string, { color: string; text: string }> = {
            pending: { color: 'bg-amber-100 text-amber-700', text: 'รอการยืนยัน' },
            accepted: { color: 'bg-blue-100 text-blue-700', text: 'คนขับรับงานแล้ว' },
            going_pickup: { color: 'bg-blue-100 text-blue-700', text: 'กำลังไปรับ' },
            picked_up: { color: 'bg-[#70C5BE]/10 text-[#3a8b85]', text: 'รับแล้ว' },
            heading_to_hospital: { color: 'bg-[#70C5BE]/10 text-[#3a8b85]', text: 'กำลังไปโรงพยาบาล' },
            arrived_at_hospital: { color: 'bg-green-100 text-green-700', text: 'ถึงโรงพยาบาลแล้ว' },
            waiting_for_return: { color: 'bg-amber-100 text-amber-700', text: 'รอรับผู้ป่วยกลับ' },
            heading_home: { color: 'bg-[#70C5BE]/10 text-[#3a8b85]', text: 'กำลังกลับบ้าน' },
            arrived_home: { color: 'bg-green-100 text-green-700', text: 'ถึงบ้านเรียบร้อย' },
            pending_payment: { color: 'bg-orange-100 text-orange-700', text: 'รอชำระเงิน' },
            paymented: { color: 'bg-blue-100 text-blue-700', text: 'ชำระเงินแล้ว' },
            rejected: { color: 'bg-red-100 text-red-700', text: 'สลิปถูกปฏิเสธ' },
            completed: { color: 'bg-green-100 text-green-700', text: 'เสร็จสิ้น' },
            success: { color: 'bg-green-100 text-green-700', text: 'สำเร็จ' },
            cancelled: { color: 'bg-red-100 text-red-700', text: 'ยกเลิก' },
        };
        return configs[status] || { color: 'bg-gray-100 text-gray-500', text: status };
    };

    const config = getStatusConfig(booking.status);

    return (
        <div className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-[#70C5BE]/10 transition-all duration-300 group flex flex-col justify-between h-full">
            <div className="space-y-5">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        <div className="bg-[#70C5BE] rounded-2xl p-3 text-white">
                            <Icon icon="solar:calendar-date-bold" className="text-2xl" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">กำหนดการ</p>
                            <p className="font-bold text-gray-800">{FormatDatetime.formatThaiDate(booking.booking_date)}, {FormatDatetime.formatThaiTime(booking.start_time)}</p>
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${config.color}`}>{config.text}</span>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="flex flex-col items-center py-1">
                        <Icon icon="solar:map-point-wave-bold" className="text-[#70C5BE] w-5 h-5" />
                        <div className="w-0.5 grow border-l-2 border-dashed border-gray-100 my-1"></div>
                        <Icon icon="mdi:hospital-building" className="text-[#70C5BE] w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-4 text-sm">
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">จุดรับ</p>
                            <p className="text-gray-700 font-medium   wrap-break-word ">{booking.pickup_address}</p>
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-gray-400 font-bold uppercase">จุดส่ง</p>
                            <p className="text-gray-700 font-medium truncate">{booking.dropoff_address}</p>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-50" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <Image src={booking.driver_profile_image || "/images/noprofile-avatar.jpg"} alt="Driver" fill className="rounded-full object-cover border-2 border-white shadow-sm" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 font-bold">คนขับ</p>
                            <p className="text-xs font-bold text-gray-700 truncate">{booking.driver_first_name ? `${booking.driver_first_name} ${booking.driver_last_name}` : 'รอคนขับรับงาน'}</p>
                        </div>
                    </div>
                    <div className="text-lg font-bold text-[#70C5BE]">฿{Number(booking.total_price).toLocaleString()}</div>
                </div>
            </div>

            <button onClick={() => onViewDetail(booking.booking_id)} className="mt-6 w-full py-3 rounded-2xl bg-slate-50 text-[#3a8b85] font-bold text-sm hover:bg-[#70C5BE] hover:text-white transition-all flex items-center justify-center gap-2">
                <Icon icon="solar:document-list-bold" className="text-xl" /> ดูรายละเอียดงาน
            </button>
        </div>
    );
}

function EmptyState() {
    return (
        <div className="bg-white rounded-4xl p-20 text-center border border-dashed border-slate-200 w-full col-span-full">
            <Icon icon="solar:document-list-linear" className="mx-auto text-6xl text-slate-100 mb-4" />
            <p className="text-slate-400 font-medium">ไม่พบรายการการจองในส่วนนี้</p>
        </div>
    );
}