"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import Button from "@/components/Button"
import { toast } from "react-toastify"
import { dir } from "console"

export default function DriverDetailPage() {
    const { driverId } = useParams()
    const router = useRouter()
    const [driver, setDriver] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processLoading, setProcessLoading] = useState(false)
    const [showRejectModal, setShowRejectModal] = useState(false)
    const [rejectReason, setRejectReason] = useState("")


    const fetchDriver = async () => {
        console.log("Fetching driver data for ID:", driverId)
        try {
            setLoading(true)

            const res = await fetch(
                `/api/admin/admin-controller/drivers/${driverId}`,
                { credentials: "include" }
            )

            const data = await res.json()

            if (res.ok) {
                setDriver(data.data)
            } else {
                toast.error(data.message || "ไม่สามารถดึงข้อมูลคนขับได้")
            }
        } catch (error) {
            console.error("Failed to fetch driver data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDriver()
    }, [])

    const updateStatus = async (verified: string, reason?: string) => {
        setProcessLoading(true)
        try {
            const res = await fetch(`/api/admin/admin-controller/drivers/${driverId}/verify`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ verified, reason }),
            })
            const data = await res.json()

            if (res.ok) {
                toast.success(data.message || "อัพเดทสถานะเรียบร้อย")
                fetchDriver()
                setShowRejectModal(false)
                setRejectReason("")
            }
            else {
                toast.error(data.message || "ไม่สามารถอัพเดทสถานะได้")
            }
        } catch (error) {
            console.error("Failed to update driver status:", error)
        } finally {
            setProcessLoading(false)
        }
    }

    function DisplayField({
        label,
        value,
    }: {
        label: string
        value?: string
    }) {
        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    {label}
                </label>
                <div className="min-h-[45px] flex items-center px-3 rounded-xl bg-gray-50 border border-gray-100">
                    <p className="text-base text-gray-800 font-semibold">
                        {value || "ไม่ระบุ"}
                    </p>
                </div>
            </div>
        )
    }

    function ImagePreview({ label, value }: any) {
        return (
            <div className="bg-white p-5 rounded-3xl shadow-sm flex flex-col items-center gap-4">
                <div className="max-h-30 max-w-60 rounded-xl overflow-hidden">
                    <img
                        src={value}
                        className="w-full h-full object-cover"
                        alt={label}
                    />
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                        {label}
                    </p>
                </div>
            </div>
        )
    }

    if (loading) return <div className="max-w-5xl mx-auto p-6 text-center">กำลังโหลด...</div>
    if (!driver) return <div className="max-w-5xl mx-auto p-6 text-center">ไม่พบข้อมูล</div>

    return (
        <div className="bg-gray-50">
            <div className="max-w-5xl mx-auto p-6 space-y-6">
                <div className="mb-6">
                    <button
                        onClick={() => router.back()}
                        className="text-slate-500 cursor-pointer hover:underline flex items-center gap-1"
                    >
                        ← กลับ
                    </button>
                </div>

                {/* ข้อมูลหลัก */}
                <div className='flex gap-2'>
                    <Icon icon="solar:user-circle-bold" className="text-[#70C5BE] w-6 h-6" />
                    <p className="text-base sm:text-xl font-bold text-[#70C5BE]">ข้อมูลส่วนตัวคนขับ</p>
                </div>
                <div className='flex flex-col md:flex-row items-center gap-2 mb-6 border-b border-gray-200 pb-2'>
                    <div className='flex justify-center '>
                        <span className="bg-[#70C5BE] border border-[#70C5BE] text-white text-xs px-2 py-1 rounded-full">
                            สมัครเมื่อ{" "}
                            {driver?.create_at &&
                                new Date(driver?.create_at).toLocaleDateString("th-TH", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric",
                                })}
                        </span>
                    </div>
                    {driver?.verified === 'approved' ? (
                        <span className="bg-[#70C5BE] border border-[#70C5BE] text-white text-xs px-2 py-1 rounded-full">ยืนยันตัวตนแล้ว</span>
                    ) : driver?.verified === 'pending_approval' ? (
                        <span className="bg-yellow-400 border border-yellow-400 text-white text-xs px-2 py-1 rounded-full">รอตรวจสอบ</span>
                    ) : driver?.verified === 'rejected' ? (
                        <span className="bg-red-500 border border-red-500 text-white text-xs px-2 py-1 rounded-full">ปฏิเสธ</span>
                    ) : (
                        <span className="bg-gray-400 border border-gray-400 text-white text-xs px-2 py-1 rounded-full">ไม่ทราบสถานะการยืนยันตัวตน</span>
                    )}

                </div>
                <div className="bg-white p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                    {/* รูปโปรไฟล์ */}
                    <div className="flex flex-col items-center justify-center md:border-r border-gray-100 pr-4">
                        <img
                            src={driver?.profile_img || "/image/avatar.jpg"}
                            className="w-38 h-38 rounded-full object-cover border-4 border-[#70C5BE] p-1 shadow-md"
                            alt="profile"
                        />
                        <span className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                            รูปโปรไฟล์
                        </span>
                    </div>

                    {/* ข้อมูล */}
                    <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                        <DisplayField label="ชื่อ" value={driver?.first_name} />
                        <DisplayField label="นามสกุล" value={driver?.last_name} />
                        <DisplayField label="เบอร์โทรศัพท์" value={driver?.phone_number} />
                        <DisplayField label="เมืองที่ให้บริการ" value={driver?.city} />
                    </div>
                </div>

                {/* เอกสาร */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <ImagePreview
                        label="รูปบัตรประชาชน"
                        value={driver?.citizen_id_img}
                    />
                    <ImagePreview
                        label="รูปใบขับขี่"
                        value={driver?.driving_license_img}
                    />
                </div>
                {/* รถ */}
                <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
                    <Icon icon="solar:bus-bold" className="text-[#70C5BE] w-6 h-6" />
                    <p className="text-base sm:text-xl font-bold text-[#70C5BE]">ข้อมูลยานพาหนะ</p>
                </div>
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <ImagePreview
                            label="รูปรถ"
                            value={driver?.car_img}
                        />
                        <ImagePreview
                            label="รูป พ.ร.บ. รถ"
                            value={driver?.act_img}
                        />
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <DisplayField label="ยี่ห้อรถ" value={driver?.car_brand} />
                        <DisplayField label="รุ่นรถ" value={driver?.car_model} />
                        <DisplayField label="ทะเบียนรถ" value={driver?.car_plate} />
                    </div>
                </div>

                {/* การจัดการ */}
                <div className="flex gap-3 items-center mt-6 justify-end">
                    {driver?.verified === 'approved' && (
                        <Button
                            disabled={processLoading}
                            onClick={() => setShowRejectModal(true)}
                            variant="reject"
                        >
                            ปฏิเสธ
                        </Button>
                    )}
                    {driver?.verified === 'pending_approval' && (
                        <Button
                            buttonIsLoading={processLoading}
                            disabled={processLoading}
                            onClick={() => updateStatus("approved")}
                            variant="primary"
                        >
                            อนุมัติการตรจสอบ
                        </Button>
                    )}
                    {driver?.verified === 'rejected' && (
                        <Button
                            buttonIsLoading={processLoading}
                            disabled={processLoading}
                            onClick={() => updateStatus("approved")}
                            variant="primary"
                        >
                            อนุมัติการตรจสอบ
                        </Button>
                    )}

                </div>
            </div>
            {showRejectModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white w-full max-w-md rounded-2xl p-6 space-y-4">
                        <h2 className="text-xl font-bold text-gray-800">
                            เหตุผลในการปฏิเสธ
                        </h2>

                        <textarea
                            rows={4}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="กรุณาระบุเหตุผล เช่น เอกสารไม่ชัดเจน / ข้อมูลไม่ตรง"
                            className="w-full rounded-xl border border-gray-300 p-3 focus:outline-none focus:ring focus:ring-red-400"
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                variant="primary"
                                onClick={() => {
                                    setShowRejectModal(false)
                                    setRejectReason("")
                                }}
                            >
                                ยกเลิก
                            </Button>

                            <Button
                                variant="reject"
                                disabled={!rejectReason.trim() || processLoading}
                                buttonIsLoading={processLoading}
                                onClick={() => updateStatus("rejected", rejectReason)}
                            >
                                ยืนยันการปฏิเสธ
                            </Button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    )

}
