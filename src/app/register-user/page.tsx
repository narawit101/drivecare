"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import liff from "@line/liff";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from '@/context/UserContext';
import Button from "@/components/Button";
import ConsentCheckbox from "@/components/ConsentCheckbox";
import PolicyModal from "@/components/modals/PolicyModal";
import LineNotifyModal from "@/components/modals/LineNotifyModal";
import { userTermsPolicy } from "@/constants/policy/user-terms";
import type { LineProfileSession } from "@/types/auth/line";
import type { AuthFormElement, RegisterUserFormData } from "@/types/forms/auth";


export default function RegisterUser() {
    const { setToken, isLoad, userData, token } = useUser();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [agreeLineNotify, setAgreeLineNotify] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [showLineNotifyModal, setShowLineNotifyModal] = useState(false);
    const [formData, setFormData] = useState<RegisterUserFormData>({
        firstName: "",
        lastName: "",
        phone_number: "",
        address: "",
        role: "user",
    });
    const LINE_LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    const API_URL = process.env.NEXT_PUBLIC_API;

    useEffect(() => {
        liff.init({ liffId: LINE_LIFF_ID! });
    }, []);

    useEffect(() => {
        if (!isLoad) {
            return
        }
        if (userData && token) {
            router.replace("/")
        }
    }, [isLoad, userData, token]);

    useEffect(() => {
        const temp = sessionStorage.getItem("lineProfile");
        if (!temp) {
            toast.error("กรุณาล็อกอินก่อนลงทะเบียน");
            router.push("/login");
            return;
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<AuthFormElement>) => {
        const { name, value } = e.target;

        if (name === "phone_number") {
            const onlyNums = value.replace(/[^0-9]/g, '');
            if (onlyNums.length <= 10) {
                setFormData(prev => ({
                    ...prev,
                    [name]: onlyNums,
                }));
            }
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreePolicy || !agreeLineNotify) {
            toast.error("กรุณายอมรับข้อตกลง และรับทราบวิธีรับการแจ้งเตือนผ่าน LINE ก่อนลงทะเบียน");
            return;
        }

        if (!formData.firstName) {
            toast.error("กรุณากรอกชื่อจริง");
            return;
        }
        if (!formData.lastName) {
            toast.error("กรุณากรอกนามสกุล");
            return;
        }
        if (!formData.phone_number) {
            toast.error("กรุณากรอกเบอร์โทรศัพท์");
            return;
        }
        if (!formData.address) {
            toast.error("กรุณากรอกที่อยู่");
            return;
        }
        try {
            setLoading(true);
            const temp = sessionStorage.getItem("lineProfile");
            if (!temp) return;

            const profile = JSON.parse(temp) as LineProfileSession;
            console.log("lineProfile", temp);
            const body = {
                line_id: profile.line_id,
                profile_img: profile.image,
                name: profile.name,
                first_name: formData.firstName,
                last_name: formData.lastName,
                phone_number: formData.phone_number,
                address: formData.address,
                role: formData.role,
            };

            const res = await fetch(`${API_URL}/auth/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("token", data.token);
                setToken(data.token);
                toast.success("สมัครสมาชิกสำเร็จ");
                sessionStorage.removeItem("lineProfile");
                router.replace("/");
            } else {
                toast.error(data.message || "สมัครสมาชิกไม่สำเร็จ");
            }
        } catch {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <div className="min-h-screen w-full bg-linear-to-b from-[#70C5BE]/15 via-white to-white flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-2xl">
                    <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur shadow-xl overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                                    <Image src="/images/logo.png" alt="DriveCare" width={34} height={34} />
                                </div>
                                <div>
                                    <p className="text-xl sm:text-2xl font-extrabold text-gray-900">ลงทะเบียนผู้ใช้</p>
                                    <p className="text-sm text-gray-500">ลงทะเบียนเพื่อให้เราดูแลการเดินทางไปโรงพยาบาลของคุณอย่างปลอดภัย</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">
                            <form className="flex flex-col gap-4 w-full" onSubmit={handleSubmit}>
                                <p className="text-lg sm:text-xl font-extrabold text-[#70C5BE]">ข้อมูลของคุณ</p>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm text-gray-700">ชื่อจริง *</span>
                                        <input
                                            className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2"
                                            type="text"
                                            name="firstName"
                                            placeholder="ชื่อจริง"
                                            value={formData.firstName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <span className="text-sm text-gray-700">นามสกุล *</span>
                                        <input
                                            className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2"
                                            type="text"
                                            name="lastName"
                                            placeholder="นามสกุล"
                                            value={formData.lastName}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-gray-700">เบอร์โทรศัพท์ *</span>
                                    <input
                                        className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2"
                                        type="tel"
                                        name="phone_number"
                                        placeholder="เบอร์โทร"
                                        maxLength={10}
                                        value={formData.phone_number}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-sm text-gray-700">ที่อยู่ *</span>
                                    <textarea
                                        className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 min-h-28"
                                        name="address"
                                        placeholder="ที่อยู่"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mt-2 p-4 rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50 to-white space-y-3">
                                    <ConsentCheckbox
                                        checked={agreePolicy}
                                        onCheckedChange={setAgreePolicy}
                                        text="ฉันได้อ่านและยอมรับข้อตกลงการใช้งาน"
                                        actionLabel="อ่านข้อตกลง"
                                        onAction={() => setShowPolicyModal(true)}
                                    />

                                    <ConsentCheckbox
                                        checked={agreeLineNotify}
                                        onCheckedChange={setAgreeLineNotify}
                                        text="ฉันรับทราบวิธีรับการแจ้งเตือนผ่าน LINE"
                                        actionLabel="ดูวิธีรับการแจ้งเตือน"
                                        onAction={() => setShowLineNotifyModal(true)}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                    <Button type="button" variant="secondary" className="w-full" onClick={() => router.push("/login")}
                                    >
                                        ย้อนกลับ
                                    </Button>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        buttonIsLoading={loading}
                                        disabled={!agreePolicy || !agreeLineNotify}
                                        className="w-full"
                                    >
                                        <p className="font-semibold text-sm sm:text-base">ลงทะเบียน</p>
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <p className="mt-4 text-center text-xs text-gray-400">DriveCare • Registration</p>
                </div>
            </div>

            <PolicyModal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} policy={userTermsPolicy} />
            <LineNotifyModal open={showLineNotifyModal} onClose={() => setShowLineNotifyModal(false)} />
        </>
    );
}
