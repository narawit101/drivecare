"use client";

import React, { useState, useEffect, useCallback } from "react"; // เพิ่ม useCallback
import { Icon } from "@iconify/react";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { HealthData, FormData, InputProps, StatCardProps } from "@/types/user/health-bookinng";

export default function HealthDashboard() {
    const { token, isLoad, userData } = useUser();
    const [healthData, setHealthData] = useState<HealthData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState<FormData>({
        weight: "",
        height: "",
        congenital_diseases: "",
        allergies: "",
    });

    // แก้ไข: ใช้ useCallback เพื่อให้เรียกซ้ำได้จากหลายที่
    const fetchHealthData = useCallback(async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await fetch("/api/health-bookinng/get-health", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data: HealthData = await res.json();
                setHealthData(data);
            } else if (res.status === 404) {
                // กรณีไม่เคยมีข้อมูล ให้หยุดโหลดเพื่อให้หน้าจอแสดงค่าว่าง (-)
                setHealthData(null);
            }
        } catch (err) {
            console.error(err);
            toast.error("โหลดข้อมูลสุขภาพล้มเหลว");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!isLoad) return;
        if (!token) {
            router.replace("/login");
            return;
        }
        if (userData?.role !== "user") {
            router.replace("/");
            return;
        }
        fetchHealthData(); 
    }, [isLoad, token, userData, router, fetchHealthData]);

    const openEditModal = () => {
        setFormData({
            weight: healthData?.weight?.toString() ?? "",
            height: healthData?.height?.toString() ?? "",
            congenital_diseases: healthData?.congenital_diseases?.join(", ") ?? "",
            allergies: healthData?.allergies?.join(", ") ?? "",
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Validation เบื้องต้น
        if (!formData.weight || !formData.height) {
            return toast.warning("กรุณากรอกน้ำหนักและส่วนสูง");
        }

        try {
            const res = await fetch("/api/health-bookinng/create-health", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    weight: Number(formData.weight),
                    height: Number(formData.height),
                    congenital_diseases: formData.congenital_diseases
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    allergies: formData.allergies
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                }),
            });

            if (res.ok) {
                toast.success("บันทึกข้อมูลสำเร็จ");
                setIsModalOpen(false);
                fetchHealthData();
            } else {
                toast.error("เกิดข้อผิดพลาดในการบันทึก");
            }
        } catch {
            toast.error("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
        }
    };

    const bmiValue = Number(healthData?.bmi ?? 0);

    const getBmiStatus = (bmi: number) => {
        if (bmi === 0) return { label: "ไม่มีข้อมูล", color: "bg-gray-200" };
        if (bmi < 18.5) return { label: "น้ำหนักน้อย", color: "bg-blue-400" };
        if (bmi < 23) return { label: "ปกติ (สุขภาพดี)", color: "bg-[#70C5BE]" };
        if (bmi < 25) return { label: "ท้วม / น้ำหนักเกิน", color: "bg-yellow-400" };
        return { label: "เริ่มอ้วน / อ้วน", color: "bg-red-400" };
    };

    const bmiToPercent = (bmi: number) => {
        if (bmi === 0) return 0;
        if (bmi <= 18.5) return 15;
        if (bmi <= 23) return 40;
        if (bmi <= 25) return 65;
        if (bmi <= 30) return 85;
        return 100;
    };

    const status = getBmiStatus(bmiValue);

    // แก้ไข: Loading State ที่ไม่บล็อกหน้าจอถ้าไม่มีข้อมูล
    if (loading && !healthData) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fcfc]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#70C5BE]"></div>
            </div>
        );
    }

    return (
        <section className="w-full bg-gray-50 min-h-screen pb-24">
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center">
                    <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <Icon icon="mdi:chevron-left" className="text-3xl text-gray-700" />
                    </button>
                    <h2 className="text-xl font-bold text-gray-800">สมุดสุขภาพ</h2>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                <div className="min-h-screen pb-24 font-sans">
                    <header className="px-2 ppb-4 flex justify-between items-center">
                        <div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Icon icon="solar:clock-circle-linear" />
                                อัปเดตล่าสุด: {healthData?.updated_at
                                    ? new Date(healthData.updated_at).toLocaleDateString("th-TH", { day: 'numeric', month: 'long', year: 'numeric' })
                                    : "ยังไม่มีข้อมูล"}
                            </div>
                        </div>

                        <button
                            onClick={openEditModal}
                            className="p-2 bg-[#70C5BE]/10 text-[#70C5BE] rounded-xl active:scale-90 transition-transform"
                        >
                            <Icon icon="solar:pen-new-square-bold" className="text-xl" />
                        </button>
                    </header>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3  mt-4">
                        <StatCard label="น้ำหนัก" value={healthData?.weight ?? "-"} unit="กก." />
                        <StatCard label="ส่วนสูง" value={healthData?.height ?? "-"} unit="ซม." />
                        <StatCard label="BMI" value={healthData?.bmi ?? "-"} isHighlight />
                    </div>

                    {/* BMI Bar Section */}
                    <div className="bg-white  mt-4 p-6 rounded-2xl shadow-sm border border-gray-50">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-gray-600">ระดับ BMI</span>
                            <span className={`text-[10px] px-3 py-1 rounded-full font-bold text-white ${status.color}`}>
                                {status.label}
                            </span>
                        </div>

                        <div className="h-2.5 bg-gray-100 rounded-full relative overflow-hidden">
                            <div
                                className={`absolute h-full rounded-full transition-all duration-1000 ${status.color}`}
                                style={{ width: `${bmiToPercent(bmiValue)}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-2 text-[9px] text-gray-400 font-bold px-1">
                            <span>18.5</span><span>22.9</span><span>25.0</span><span>30.0</span>
                        </div>
                    </div>

                    {/* Medical Info Section */}
                    <div className="mt-4 space-y-4">
                        <div className="bg-white p-5 rounded-2xl border border-gray-50">
                            <p className="text-sm  font-bold text-[#70C5BE] mb-3 uppercase tracking-wider">โรคประจำตัว</p>
                            <div className="flex flex-wrap gap-2">
                                {healthData?.congenital_diseases?.length ? (
                                    healthData.congenital_diseases.map(d => (
                                        <span key={d} className="bg-[#f2faf9] text-[#3a8b85] text-xs font-bold px-4 py-1.5 rounded-full border border-[#e0f2f0]">{d}</span>
                                    ))
                                ) : <span className="text-xs text-gray-400">ไม่มีข้อมูล</span>}
                            </div>
                        </div>

                        <div className="bg-[#fff8f8] p-5 rounded-2xl border border-[#ffebeb]">
                            <p className="text-sm font-bold text-[#ff5a5a] mb-3 uppercase tracking-wider">การแพ้ยา / อาหาร</p>
                            <div className="flex flex-wrap gap-2">
                                {healthData?.allergies?.length ? (
                                    healthData.allergies.map(a => (
                                        <div key={a} className="bg-white text-[#ff5a5a] text-xs font-bold px-4 py-1.5 rounded-full border border-[#ffebeb] flex items-center gap-1">
                                            <Icon icon="solar:danger-bold" /> {a}
                                        </div>
                                    ))
                                ) : <span className="text-xs text-gray-400">ไม่มีข้อมูล</span>}
                            </div>
                        </div>
                    </div>

                    
                    {isModalOpen && (
                        <div className="fixed inset-0 z-100 bg-black/60 flex items-center justify-center p-3  backdrop-blur-sm">
                            <form
                                onSubmit={handleSubmit}
                                className="bg-white p-6 rounded-2xl sm:rounded-3xl w-full max-w-md space-y-5 animate-in slide-in-from-bottom duration-300 shadow-2xl"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h2 className="text-xl font-black text-gray-800">แก้ไขข้อมูลสุขภาพ</h2>
                                    <button type="button" onClick={() => setIsModalOpen(false)}>
                                        <Icon icon="mdi:close" className="text-2xl text-gray-400" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <Input
                                    
                                        label="น้ำหนัก (กก.)"
                                        type="number"
                                        value={formData.weight}
                                        onChange={(v) => setFormData({ ...formData, weight: v })}
                                    />
                                    <Input
                                        label="ส่วนสูง (ซม.)"
                                        type="number"
                                        value={formData.height}
                                        onChange={(v) => setFormData({ ...formData, height: v })}
                                    />
                                </div>
                                <Input
                                    label="โรคประจำตัว (คั่นด้วยเครื่องหมายจุลภาค , )"
                                    type="text"
                                    value={formData.congenital_diseases}
                                    onChange={(v) => setFormData({ ...formData, congenital_diseases: v })}
                                    placeholder="เช่น ความดัน, เบาหวาน"
                                />
                                <Input
                                    label="การแพ้ยา / อาหาร (คั่นด้วยเครื่องหมายจุลภาค , )"
                                    type="text"
                                    value={formData.allergies}
                                    onChange={(v) => setFormData({ ...formData, allergies: v })}
                                    placeholder="เช่น กุ้ง, เพนิซิลลิน"
                                    isAlert
                                />

                                <button className="w-full bg-[#70C5BE] text-white py-2 rounded-2xl  shadow-lg shadow-[#70C5BE]/20 active:scale-95 transition-all mt-4">
                                    บันทึกข้อมูล
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </main>
        </section>
    );
}

function StatCard({ label, value, unit, isHighlight = false }: StatCardProps) {
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-50 text-center flex flex-col items-center justify-center">
            <p className="text-sm  text-[#70C5BE] uppercase mb-1">{label}</p>
            <div className="flex flex-col items-center gap-1">
                <span className={`text-xl font-black ${isHighlight ? "text-[#70C5BE]" : "text-gray-800"}`}>
                    {value}
                </span>
                {unit && value !== "-" && <span className="text-sm text-gray-400 font-bold">{unit}</span>}
            </div>
        </div>
    );
}

function Input({ label, type, value, onChange, isAlert = false, placeholder }: InputProps & { placeholder?: string }) {
    return (
        <div className="space-y-1">
            <label className={`text-xs  uppercase ml-1 ${isAlert ? "text-red-400" : "text-[#70C5BE]"}`}>
                {label}
            </label>
            <input
                type={type}
                step="0.1"
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full p-2 rounded-xl text-sm border-none focus:ring-2 ${isAlert ? "bg-red-50 focus:ring-red-200" : "bg-gray-50 focus:ring-[#70C5BE]"}`}
            />
        </div>
    );
}