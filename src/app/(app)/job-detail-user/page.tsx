"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { Icon } from "@iconify/react"
import Button from "@/components/Button"
import { toast } from "react-toastify"
import Image from "next/image"
import { useUser } from "@/context/UserContext"
import Pusher from "pusher-js"
import LongdoMap from "@/services/map/LongdoMap"
import { useLongdoMap } from "@/services/map/useLongdoMap"
import * as FormatDatetime from "@/utils/format-datetime"
import ReportModal from "@/components/modals/ReportModal"
import StatusTrackerCard from "@/components/user/StatusTrackerCard"
import { USER_REPORT_TYPES } from "@/constants/reports/report-types"
import { Booking } from "@/types/user/bookings"

const STATUS_LIST = [
    { key: "pending", label: "รอการยืนยัน", icon: "mdi:clock-outline" },
    { key: "accepted", label: "มีคนขับรับงานแล้ว", icon: "mdi:account-check-outline" },
    { key: "going_pickup", label: "กำลังไปรับ", icon: "mdi:car-connected" },
    { key: "picked_up", label: "รับผู้ป่วยแล้ว", icon: "mdi:account-check" },
    { key: "heading_to_hospital", label: "ไปโรงพยาบาล", icon: "mdi:hospital-building" },
    { key: "arrived_at_hospital", label: "ถึงโรงพยาบาล", icon: "mdi:map-marker-radius" },
    { key: "waiting_for_return", label: "รอรับกลับ", icon: "basil:clock-solid" },
    { key: "heading_home", label: "กำลังเดินทางกลับ", icon: "mdi:car-connected" },
    { key: "arrived_home", label: "ถึงบ้านแล้ว", icon: "si:home-fill" },
    { key: "pending_payment", label: "รอชำระเงิน", icon: "mdi:cash-clock" },
    { key: "completed", label: "เสร็จสิ้น", icon: "mdi:flag-checkered" },
]

function JobDetailUserInner() {
    const searchParams = useSearchParams()
    const booking_id = searchParams.get('id')
    const router = useRouter()
    const { token, isLoad, userData } = useUser()

    const [job, setJob] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [reportModalOpen, setReportModalOpen] = useState(false)
    const [reportType, setReportType] = useState("")
    const [reportMessage, setReportMessage] = useState("")
    const [cancelLoading, setCancelLoading] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const { initMap, renderRoute } = useLongdoMap()

    const handleInitMap = useCallback((map: any) => {
        initMap(map);
    }, [initMap]);

    const fetchJobDetail = useCallback(async () => {
        if (!booking_id || !token) return
        setLoading(true)
        try {
            const res = await fetch(`/api/booking/users/${booking_id}/detail-booking`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed")
            const data = await res.json()
            setJob(data.job)
            console.log("job", data.job)
        } catch (error) {
            toast.error("ไม่สามารถโหลดข้อมูลได้")
        } finally {
            setLoading(false)
        }
    }, [booking_id, token]);

    useEffect(() => {
        if (!isLoad) return
        if (!token) { router.replace("/login"); return; }
        if (userData && userData.role !== "user") {
            router.replace("/");
            return;
        }
        fetchJobDetail()
    }, [isLoad, token, userData, router, fetchJobDetail])

    useEffect(() => {
        if (!token || !userData || userData.role !== "user") return;
        if (!booking_id) return;

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
            const incomingId = String(data?.booking_id ?? "");
            if (incomingId && incomingId !== String(booking_id)) return;

            // If booking is deleted/cancelled by admin, return to previous page
            if (data?.type === "BOOKING_DELETED") {
                toast.info("งานนี้ถูกยกเลิก/ลบแล้ว");
                router.back();
                return;
            }

            const type = String(data?.type ?? "");
            const status = data?.status;
            const payment_status = data?.payment_status;

            const label = STATUS_LIST[status] ?? status;


            // Prefer patching state (no refetch) to avoid remounting/blank map
            if (type === "STATUS_UPDATE" || type === "DRIVER_WAITING_PAYMENT" || type === "ADMIN_VERIFY_PAYMENT" || type === "ADMIN_REJECT_PAYMENT") {
                setJob((prev: any) => {
                    if (!prev) return prev;
                    return {
                        ...prev,
                        ...(status ? { status } : null),
                        ...(payment_status ? { payment_status } : null),
                    };
                });
                toast.info("สถานะงานของคุณได้รับการอัปเดต");
                return;
            }

            // Fallback: unknown update type -> refetch
            fetchJobDetail();
        });

        channel.bind("report-created", (data: any) => {
            const incomingId = String(data?.booking_id ?? "");
            if (incomingId && incomingId !== String(booking_id)) return;
            // No need to refetch full detail; keep this as best-effort
            fetchJobDetail();
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`private-user-${userData.user_id}`);
            pusher.disconnect();
        };
    }, [booking_id, fetchJobDetail, router, token, userData]);

    const cancelBooking = async () => {
        if (!booking_id) return

        setCancelLoading(true)
        try {
            const res = await fetch(`/api/booking/users/${booking_id}/cancel-booking`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!res.ok) {
                const errorData = await res.json()
                throw new Error(errorData.message || 'ไม่สามารถยกเลิกการจองได้')
            }

            toast.success('ยกเลิกการจองสำเร็จ')
            setShowCancelConfirm(false)
            router.back()
        } catch (error: any) {
            toast.error(error.message || 'เกิดข้อผิดพลาดในการยกเลิกการจอง')
        } finally {
            setCancelLoading(false)
        }
    }

    useEffect(() => {
        if (!job?.pickup_lat || !job?.pickup_lng || !job?.dropoff_lat || !job?.dropoff_lng) return;

        // เล็กน้อย: รอให้ Map mount แป๊บหนึ่ง
        const t = setTimeout(() => {
            renderRoute(
                { lat: job.pickup_lat, lon: job.pickup_lng },
                { lat: job.dropoff_lat, lon: job.dropoff_lng },
            );
        }, 500);

        return () => clearTimeout(t);
    }, [job?.pickup_lat, job?.pickup_lng, job?.dropoff_lat, job?.dropoff_lng, renderRoute])

    const handleSendReport = async () => {
        if (!reportType || !reportMessage) {
            toast.warn("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        try {
            const res = await fetch("/api/reports/users", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    booking_id: job.booking_id,
                    report_type: reportType,
                    message: reportMessage,
                    actor_id: job.driver_id, // ส่ง ID คนขับไปด้วย
                    actor_type: 'driver'      // ระบุว่ารายงานคนขับ
                }),
            });

            if (res.ok) {
                toast.success("ส่งรายงานเรียบร้อยแล้ว");
                setReportModalOpen(false); // ปิด Modal
                setReportMessage("");      // ล้างค่าข้อความ
            } else {
                toast.error("เกิดข้อผิดพลาดในการส่งรายงาน");
            }
        } catch (error) {
            toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        }
    };

    const currentStatusIndex = useMemo(() =>
        STATUS_LIST.findIndex(s => s.key === job?.status), [job?.status]
    )



    // Only block the whole page on the very first load.
    if (loading && !job) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-t-[#70C5BE] border-gray-100 animate-spin"></div>
                <p className="mt-4 text-gray-400 font-medium">กำลังดึงข้อมูล...</p>
            </div>
        </div>
    )

    if (!job) return null

    return (
        <section className="w-full bg-gray-50 min-h-screen pb-24">
            {/* Sticky Header */}
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon icon="mdi:chevron-left" className="text-3xl text-gray-700" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">รายละเอียดการจอง</h2>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">

                {/* 1. Status Tracker Card */}
                <StatusTrackerCard
                    statusList={STATUS_LIST}
                    currentStatus={job.status}
                    currentStatusIndex={currentStatusIndex}
                />

                {/* 2. Map Card */}
                <div className="bg-white p-2 rounded-4xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="h-64 w-full rounded-[1.8rem] overflow-hidden">
                        <LongdoMap initMap={handleInitMap} />
                    </div>
                    <div className="p-4 flex items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Icon icon="mdi:map-marker" className="text-sm" />
                                <span className="text-[10px] font-bold uppercase">ต้นทาง</span>
                            </div>
                            <p className="text-sm font-medium line-clamp-1 text-gray-700">{job.pickup_address}</p>
                        </div>
                        <Icon icon="mdi:arrow-right" className="text-gray-300" />
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-gray-400 mb-1">
                                <Icon icon="mdi:hospital-marker" className="text-sm" />
                                <span className="text-[10px] font-bold uppercase">ปลายทาง</span>
                            </div>
                            <p className="text-sm font-medium line-clamp-1 text-gray-700">{job.dropoff_address}</p>
                        </div>
                    </div>
                </div>

                {/* 3. Driver Profile Card (Show only if assigned) */}
                {job.driver_id ? (
                    <div className="bg-white p-6 rounded-4xl shadow-md  flex items-center gap-5 relative overflow-hidden">
                        <div className="relative">
                            <Image
                                src={job.driver_profile_img || "/default-avatar.png"}
                                alt="Driver" width={70} height={70}
                                className="w-15 h-15 rounded-full object-cover border-2 border-white shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">คนขับของคุณ</h4>
                            <p className="text-lg font-extrabold text-gray-800">{job.driver_first_name} {job.driver_last_name}</p>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">{job.driver_phone_number}</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-amber-50 p-6 rounded-4xl border border-amber-100 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600">
                            <Icon icon="mdi:account-search" className="text-2xl" />
                        </div>
                        <p className="text-sm font-bold text-amber-700">กำลังจัดหาคนขับที่ดีที่สุดให้คุณ...</p>
                    </div>
                )}

                {/* 4. Booking Summary Card */}
                <div className="bg-white p-8 rounded-4xl shadow-sm border border-gray-50">
                    <h3 className="text-gray-800 font-extrabold mb-6 flex items-center gap-2">
                        <Icon icon="mdi:file-document-edit-outline" className="text-[#70C5BE]" />
                        สรุปข้อมูลการจอง
                    </h3>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">ผู้ป่วย</p>
                            <p className="text-sm font-bold text-gray-700">{userData?.name}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">วันที่นัดหมาย</p>
                            <p className="text-sm font-bold text-gray-700">{FormatDatetime.formatThaiDate(job.booking_date)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">โรคประจำตัว</p>
                            <p className="text-sm font-bold text-gray-700">
                                {job.congenital_diseases?.length > 0 ? job.congenital_diseases.join(", ") : "ไม่มี"}
                            </p>
                        </div>
                        {job.allergies?.length > 0 && (
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-red-400 uppercase">ข้อมูลการแพ้</p>
                                <p className="text-sm font-bold text-red-600">
                                    {job.allergies.join(", ")}
                                </p>
                            </div>
                        )}
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">เวลาเริ่ม</p>
                            <p className="text-sm font-bold text-gray-700">{FormatDatetime.formatThaiTime(job.start_time)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">ระยะเวลา</p>
                            <p className="text-sm font-bold text-gray-700">{job.total_hours} ชม.</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">ยอดรวม</p>
                            <p className="text-lg font-black text-[#70C5BE]">฿{job.total_price}</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-dashed border-gray-200 flex justify-between items-center">
                        <button
                            onClick={() => setReportModalOpen(true)}
                            className="text-xs font-bold text-red-400 flex items-center gap-1 hover:text-red-600"
                        >
                            <Icon icon="mdi:alert-circle-outline" />
                            แจ้งปัญหาการเดินทาง
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                disabled={
                                    job?.status === 'cancelled' ||
                                    job?.status === 'completed' ||
                                    job?.status === 'pending_payment' ||
                                    job?.status === 'paymented' ||
                                    job?.status === 'success'
                                }
                                className="px-4 py-2 text-sm font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                ยกเลิกการจอง
                            </button>
                        </div>
                    </div>
                </div>

            </main>

            <ReportModal
                open={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                onSubmit={handleSendReport} // ใส่ Logic ตามเดิมของคุณ
                reportType={reportType}
                setReportType={setReportType}
                message={reportMessage}
                setMessage={setReportMessage}
                reportTypes={USER_REPORT_TYPES} // ใส่ค่าตามเดิม
            />

            {/* Cancel Confirmation Modal */}
            {showCancelConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Icon icon="mdi:alert-circle" className="text-3xl text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">ยืนยันการยกเลิก</h3>
                            <p className="text-sm text-gray-600 mb-6">
                                คุณต้องการยกเลิกการจองนี้หรือไม่? การยกเลิกไม่สามารถยกเลิกได้
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50"
                                    disabled={cancelLoading}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={cancelBooking}
                                    disabled={cancelLoading}
                                    className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {cancelLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            กำลังยกเลิก...
                                        </>
                                    ) : (
                                        'ยืนยันยกเลิก'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </section>
    )
}

export default function JobDetailUser() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
            <JobDetailUserInner />
        </Suspense>
    );
}