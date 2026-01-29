"use client"

import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import Image from "next/image";
import { Booking } from "@/types/user/bookings";
import { toast } from "react-toastify";
import * as FormatDatetime from "@/utils/format-datetime"
import PaymentUploadModal from "@/components/modals/UpslipModal"
import Pagination from "@/components/driver/Pagination"
import Pusher from "pusher-js";

type TabGroup = "pending_payment" | "paid_history";

export default function PaymentPage() {
    const [activeTab, setActiveTab] = useState<TabGroup>("pending_payment");
    const [booking, setBooking] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(false);
    const { token, isLoad, userData } = useUser();
    const [isModalOpen, setIsModalOpen] = useState(false)
    const router = useRouter();
    const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const PAGE_SIZE = 9;
    const [statusFilter, setStatusFilter] = useState<"all" | "success" | "pending">("all");


    // ตรวจสอบสิทธิ์การเข้าใช้งาน
    useEffect(() => {
        if (!isLoad) return;
        if (!token) {
            router.replace("/login");
            return;
        }
        if (userData?.role !== "user") router.replace("/");
    }, [isLoad, token, userData, router]);

    const fetchAllBooking = async () => {
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
            console.error("getBooking error:", error);
            toast.error("ไม่สามารถโหลดข้อมูลได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isLoad || !token) return;
        fetchAllBooking();
    }, [isLoad, token]);

    // ฟังก์ชันจัดการเมื่อคลิกปุ่มจ่ายเงิน
    const handlePayClick = (targetBooking: Booking) => {
        setSelectedBooking(targetBooking);
        setIsModalOpen(true);
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
                setIsModalOpen(false);
                fetchAllBooking();
            } else {
                toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
            }
        } catch (error) {
            console.error("Upload Error:", error);
            toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        }
    };

    useEffect(() => {
        if (!token || !userData || userData.role !== "user") return

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: "ap1",
            authEndpoint: "/api/pusher/auth",
            auth: {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        })
        const channel = pusher.subscribe(`private-user-${userData.user_id}`)
        channel.bind("booking-updated", (data: any) => {
            fetchAllBooking()
            toast.info("สถานะชำระเงินมีการเปลี่ยนแปลง")
        })

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`private-user-${userData.user_id}`)
            pusher.disconnect()
        }
    }, [token, userData])

    const pendingPaymentJobs = booking.filter(b =>
        (b.status === "arrived_home" && b.payment_status === "pending") ||
        b.payment_status === "rejected" ||
        b.status === "pending_payment"
    );

    const paidJobs = booking.filter(b =>
        b.payment_status === "waiting_verify" ||
        b.payment_status === "verified" ||
        ["completed", "success"].includes(b.status)
    );
    const STATUS_FILTERS: ("all" | "success" | "pending")[] = [
        "all",
        "success",
        "pending",
    ];

    const isPaymentSuccess = (b: Booking) => b.payment_status === "verified";
    const isPaymentPending = (b: Booking) => b.payment_status === "waiting_verify";

    const filteredBookings = booking.filter(b => {
        if (statusFilter === "success") return isPaymentSuccess(b)
        if (statusFilter === "pending") return isPaymentPending(b)
        return true;
    })

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    const paginatedPaidJobs = filteredBookings.slice(startIndex, endIndex);
    const totalPages = Math.ceil(filteredBookings.length / PAGE_SIZE);

    const handleViewDetail = (id: number) => {
        router.push(`/job-detail-user?id=${id}`);
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);


    return (
        <section className="w-full bg-gray-50 min-h-screen pb-24">
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon icon="mdi:chevron-left" className="text-3xl text-gray-700" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">การชำระเงิน</h2>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                <div className="flex bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100 w-full md:w-[450px]">
                    <button
                        onClick={() => setActiveTab("pending_payment")}
                        className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "pending_payment" ? "bg-[#70C5BE] text-white shadow-md" : "text-slate-400"}`}
                    >
                        ที่ต้องชำระ ({pendingPaymentJobs.length})
                    </button>
                    <button
                        onClick={() => setActiveTab("paid_history")}
                        className={`flex-1 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === "paid_history" ? "bg-[#70C5BE] text-white shadow-md" : "text-slate-400"}`}
                    >
                        ชำระแล้ว ({paidJobs.length})
                    </button>
                </div>
                {activeTab === "paid_history" && (
                    <div className="flex gap-2 mb-4">
                        {STATUS_FILTERS.map(id => (
                            <button
                                key={id}
                                onClick={() => setStatusFilter(id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold ${statusFilter === id
                                    ? "bg-[#70C5BE]/10 text-[#3a8b85] ring-1 ring-[#70C5BE]"
                                    : "bg-white text-slate-400 border"
                                    }`}
                            >
                                {id === "all"
                                    ? "ทั้งหมด"
                                    : id === "success"
                                        ? "สำเร็จ"
                                        : "รอการตรวจสอบ"}
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading ? (
                        <div className="col-span-full py-20 text-center"><p>กำลังโหลด...</p></div>
                    ) : (
                        <>

                            {activeTab === "pending_payment" ? (
                                pendingPaymentJobs.length > 0 ?
                                    pendingPaymentJobs.map(b => <PaymentCard key={b.booking_id} booking={b} isPaid={false} onPay={() => handlePayClick(b)} onViewDetail={handleViewDetail} />) :
                                    <div className="col-span-full"><EmptyState text="ไม่มีรายการค้างชำระ" /></div>
                            ) : (
                                paginatedPaidJobs.length > 0 ?
                                    paginatedPaidJobs.map(b => <PaymentCard key={b.booking_id} booking={b} isPaid={true} onViewDetail={handleViewDetail} />) :
                                    <div className="col-span-full"><EmptyState text="ไม่มีประวัติการชำระเงิน" /></div>
                            )}
                        </>
                    )}
                </div>
                {activeTab === "paid_history" && totalPages > 1 && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onChangePage={setCurrentPage}
                    />
                )}
            </main>

            <PaymentUploadModal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                bookingId={selectedBooking?.booking_id}
                totalPrice={selectedBooking?.total_price}
                onSubmit={(file) => {
                    if (selectedBooking) {
                        handleUploadSlip(file, selectedBooking.booking_id);
                    }
                }}
            />
        </section>
    );
}

// แยก Component ออกมาด้านนอก
function PaymentCard({ booking, isPaid, onPay, onViewDetail }: { booking: Booking, isPaid: boolean, onPay?: () => void, onViewDetail?: (id: number) => void }) {
    const isWaitingVerify = booking.payment_status === "waiting_verify";
    const isRejected = booking.payment_status === "rejected";
    return (
        <div className="bg-white rounded-4xl p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-[#70C5BE]/10 transition-all duration-300 group flex flex-col justify-between h-full relative overflow-hidden">
            {isPaid && !isWaitingVerify && (
                <div className="absolute top-4 right-4 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200">
                    ชำระแล้ว
                </div>
            )}
            {isWaitingVerify && (
                <div className="absolute top-4 right-4 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                    <Icon icon="solar:clock-circle-bold" />
                    รอตรวจสอบ
                </div>
            )}
            {isRejected && (
                <div className="absolute top-4 right-4 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-full border border-red-200 flex items-center gap-1">
                    <Icon icon="solar:danger-bold" />
                    สลิปไม่ถูกต้อง
                </div>
            )}
            <div className="space-y-5">
                <div className="flex gap-4 items-center">
                    <div className="bg-[#70C5BE] rounded-2xl p-3 text-white">
                        <Icon icon="solar:calendar-date-bold" className="text-2xl" />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">กำหนดการ</p>
                        <p className="font-bold text-gray-800">{FormatDatetime.formatThaiDate(booking.booking_date)}</p>
                    </div>
                </div>

                <div className="flex gap-4 mb-6">
                    <div className="flex flex-col items-center py-1">
                        <Icon icon="solar:map-point-wave-bold" className="text-[#70C5BE] w-5 h-5" />
                        <div className="w-0.5 grow border-l-2 border-dashed border-gray-100 my-1"></div>
                        <Icon icon="mdi:hospital-building" className="text-[#70C5BE] w-5 h-5" />
                    </div>
                    <div className="flex flex-col gap-4 text-sm text-gray-700">
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">จุดรับ</p>
                            <p className="font-medium line-clamp-1">{booking.pickup_address}</p>
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase">จุดส่ง</p>
                            <p className="font-medium line-clamp-1">{booking.dropoff_address}</p>
                        </div>
                    </div>
                </div>

                <hr className="border-slate-50" />

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10">
                            <Image
                                src={booking.driver_profile_image || "/images/noprofile-avatar.jpg"}
                                alt="Driver"
                                fill
                                className="rounded-full object-cover border-2 border-white shadow-sm"
                            />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 font-bold">คนขับ</p>
                            <p className="text-xs font-bold text-gray-700">
                                {booking.driver_first_name ? `${booking.driver_first_name} ${booking.driver_last_name}` : 'รอคนขับรับงาน'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold">{booking.driver_phone}</p>
                        </div>
                    </div>
                    <div className="text-lg font-bold text-[#70C5BE]">
                        {booking.total_price !== null ? `฿${booking.total_price.toLocaleString()}` : "0"}
                    </div>
                </div>
            </div>

            {!isPaid && onPay && onViewDetail && (
                <div className="mt-6 space-y-3">
                    {booking.payment_status === "rejected" ? (
                        <button
                            onClick={onPay}
                            className="w-full py-3 rounded-2xl bg-[#70C5BE] text-white font-bold text-xs hover:bg-[#5bb1aa] transition-all shadow-lg shadow-[#70C5BE]/20 flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:wallet-money-bold" className="text-lg" />
                            ชำระเงินอีกครั้ง
                        </button>
                    ) : (
                        <button
                            onClick={onPay}
                            className="w-full py-3 rounded-2xl bg-[#70C5BE] text-white font-bold text-xs hover:bg-[#5bb1aa] transition-all shadow-lg shadow-[#70C5BE]/20 flex items-center justify-center gap-2"
                        >
                            <Icon icon="solar:wallet-money-bold" className="text-lg" />
                            ชำระเงินตอนนี้
                        </button>
                    )}

                    <button
                        onClick={() => onViewDetail(booking.booking_id)}
                        className="w-full py-3 rounded-2xl bg-slate-50 text-[#3a8b85] font-bold text-xs hover:bg-[#70C5BE] hover:text-white transition-all shadow-lg shadow-[#70C5BE]/20 flex items-center justify-center gap-2 border border-[#70C5BE]"
                    >
                        <Icon icon="solar:document-list-bold" className="text-lg" />
                        ดูรายละเอียด
                    </button>
                </div>
            )}
            {isPaid && onViewDetail && (
                <button
                    onClick={() => onViewDetail(booking.booking_id)}
                    className="mt-6 w-full py-3 rounded-2xl bg-slate-50 text-[#3a8b85] font-bold text-xs hover:bg-[#70C5BE] hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    <Icon icon="solar:document-list-bold" className="text-lg" />
                    ดูรายละเอียด
                </button>
            )}
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="bg-white rounded-[3rem] p-16 text-center border border-dashed border-slate-200 w-full col-span-full">
            <Icon icon="solar:wad-of-money-linear" className="mx-auto text-6xl text-slate-200 mb-4" />
            <p className="text-slate-400 font-medium">{text}</p>
        </div>
    );
}