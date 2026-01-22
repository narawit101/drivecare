"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import liff from "@line/liff";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Link from "next/link";
import { useUser } from '@/context/UserContext';
import Button from "@/components/Button";
import ConsentCheckbox from "@/components/ConsentCheckbox";
import SelectDropdown, { type SelectOption } from "@/components/common/SelectDropdown";
import { getCarBrands, getCarModelsByBrand } from "@/utils/carList";
import PolicyModal from "@/components/modals/PolicyModal";
import LineNotifyModal from "@/components/modals/LineNotifyModal";
import type { LineProfileSession } from "@/types/auth/line";
import type {
    AuthFormElement,
    DriverRegisterFileField,
    DriverRegisterFiles,
    DriverRegisterPreviews,
    DriverRegisterStep,
    RegisterDriverFormData,
} from "@/types/forms/auth";


export default function RegisterDriver() {
    const { setToken, isLoad, userData, token } = useUser();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<DriverRegisterStep>(1);
    const router = useRouter();
    const [carModels, setCarModels] = useState<string[]>([]);
    const [agreePolicy, setAgreePolicy] = useState(false);
    const [agreeLineNotify, setAgreeLineNotify] = useState(false);
    const [showPolicyModal, setShowPolicyModal] = useState(false);
    const [showLineNotifyModal, setShowLineNotifyModal] = useState(false);

    const CITY_OPTIONS: SelectOption<string>[] = [
        { label: "ขอนแก่น", value: "ขอนแก่น" },
        { label: "ร้อยเอ็ด", value: "ร้อยเอ็ด" },
        { label: "มหาสารคาม", value: "มหาสารคาม" },
    ];

    const backLogin = () => {
        router.push("/login");
    }
    const [formData, setFormData] = useState<RegisterDriverFormData>({
        firstName: "",
        lastName: "",
        phone_number: "",
        status: "inactive",
        car_brand: "",
        car_model: "",
        car_plate: "",
        verified: "pending_approval",
        city: "",
        role: "driver",
    });
    const [files, setFiles] = useState<DriverRegisterFiles>({
        profile_img: null,
        citizen_id_img: null,
        driving_license_img: null,
        car_img: null,
        act_img: null,
    });
    const [previews, setPreviews] = useState<DriverRegisterPreviews>({
        profile_img: "",
        citizen_id_img: "",
        driving_license_img: "",
        car_img: "",
        act_img: "",
    });
    const nextStep = () => {
        // เช็คข้อมูลทั่วไปที่จำเป็นใน Step 1
        if (!formData.firstName) {
            toast.error("กรุณากรอกข้อมูลชื่อจริง");
            return;
        }
        if (!formData.city) {
            toast.error("กรุณาเลือกจังหวัด");
            return;
        }
        if (!formData.lastName) {
            toast.error("กรุณากรอกข้อมูลนามสกุล");
            return;
        }
        if (!formData.phone_number) {
            toast.error("กรุณากรอกข้อมูลเบอร์โทรศัพท์");
            return;
        }

        if (!files.profile_img) {
            toast.error("กรุณาอัปโหลดรูปโปรไฟล์");
            return;
        }
        if (!files.citizen_id_img) {
            toast.error("กรุณาอัปโหลดรูปบัตรประชาชน");
            return;
        }
        if (!files.driving_license_img) {
            toast.error("กรุณาอัปโหลดรูปใบขับขี่");
            return;
        }
        setStep(2); // ผ่านการเช็คแล้ว ให้ไป Step 2
        window.scrollTo(0, 0); // เลื่อนหน้าจอกลับไปด้านบน
    };

    const nextStepFromCar = () => {
        if (!files.car_img) {
            toast.error("กรุณาอัปโหลดรูปรถ");
            return;
        }
        if (!files.act_img) {
            toast.error("กรุณาอัปโหลดรูปพ.ร.บ");
            return;
        }
        if (!formData.car_brand) {
            toast.error("กรุณาเลือกยี่ห้อรถ");
            return;
        }
        if (!formData.car_model) {
            toast.error("กรุณาเลือกรุ่นรถ");
            return;
        }
        if (!formData.car_plate) {
            toast.error("กรุณากรอกป้ายทะเบียนรถ");
            return;
        }

        setStep(3);
        window.scrollTo(0, 0);
    };

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
        if (userData && token) {
            router.replace("/");
        }
        if (!temp) {
            toast.error("กรุณาล็อกอินก่อนลงทะเบียน");
            router.push("/login");
            return;
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<AuthFormElement>) => {
        const name = e.target.name as keyof RegisterDriverFormData;
        const { value } = e.target;

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

        if (name === "car_brand") {
            setFormData(prev => ({
                ...prev,
                car_brand: value,
                car_model: "", // reset รุ่นรถ
            }));

            setCarModels(getCarModelsByBrand(value));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSelectCity = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            city: value,
        }));
    };

    const handleSelectCarBrand = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            car_brand: value,
            car_model: "",
        }));
        setCarModels(getCarModelsByBrand(value));
    };

    const handleSelectCarModel = (value: string) => {
        setFormData((prev) => ({
            ...prev,
            car_model: value,
        }));
    };

    const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const name = e.target.name as DriverRegisterFileField;

        if (!file) return;

        // type check
        if (!IMAGE_TYPES.includes(file.type)) {
            toast.error("อนุญาตเฉพาะไฟล์รูป (jpg, png, webp)");
            return;
        }

        // size check
        if (file.size > MAX_SIZE) {
            toast.error("ขนาดไฟล์ต้องไม่เกิน 10MB");
            return;
        }

        setPreviews(prev => ({ ...prev, [name]: URL.createObjectURL(file) }));

        setFiles(prev => ({ ...prev, [name]: file }));
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
        if (!files.profile_img) {
            toast.error("กรุณาอัปโหลดรูปโปรไฟล์");
            return;
        }
        if (!files.citizen_id_img) {
            toast.error("กรุณาอัปโหลดรูปบัตรประชาชน");
            return;
        }
        if (!files.driving_license_img) {
            toast.error("กรุณาอัปโหลดรูปใบขับขี่");
            return;
        }
        if (!files.car_img) {
            toast.error("กรุณาอัปโหลดรูปรถ");
            return;
        }
        if (!files.act_img) {
            toast.error("กรุณาอัปโหลดรูปพ.ร.บ");
            return;
        }
        if (formData.car_brand === "") {
            toast.error("กรุณากรอกยี่ห้อรถ");
            return;
        }
        if (formData.car_model === "") {
            toast.error("กรุณากรอกรุ่นรถ");
            return;
        }
        if (formData.car_plate === "") {
            toast.error("กรุณากรอกป้ายทะเบียนรถ");
            return;
        }
        if (formData.city === "") {
            toast.error("กรุณาเลือกจังหวัด");
            return;
        }
        try {
            setLoading(true);
            const temp = sessionStorage.getItem("lineProfile");
            if (!temp) return;

            const profile = JSON.parse(temp) as LineProfileSession;
            console.log("lineProfile", temp);

            const fd = new FormData();

            fd.append("line_id", profile.line_id);
            fd.append("first_name", formData.firstName);
            fd.append("last_name", formData.lastName);
            fd.append("phone_number", formData.phone_number);
            fd.append("city", formData.city);
            fd.append("car_brand", formData.car_brand);
            fd.append("car_model", formData.car_model);
            fd.append("car_plate", formData.car_plate);
            fd.append("status", formData.status);
            fd.append("verified", formData.verified);
            fd.append("role", formData.role);

            // files
            (Object.entries(files) as [DriverRegisterFileField, File | null][]).forEach(([key, file]) => {
                if (file) fd.append(key, file);
            });
            const body = {
                line_id: profile.line_id,
                formData: fd,
            };

            const res = await fetch(`${API_URL}/auth/drivers/register`, {
                method: "POST",
                body: fd,
            });

            const data = await res.json();
            if (res.ok) {
                localStorage.setItem("token", data.token);
                setToken(data.token);
                toast.success("สมัครสมาชิกสำเร็จ");
                sessionStorage.removeItem("lineProfile");
                router.replace("/driver-dashboard");
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
                <div className="w-full max-w-3xl">
                    <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur shadow-xl overflow-hidden">
                        <div className="p-6 sm:p-8 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                                        <Image src="/images/drive_care.png" alt="DriveCare" width={34} height={34} />
                                    </div>
                                    <div>
                                        <p className="text-xl sm:text-2xl font-extrabold text-gray-900">ร่วมงานกับ ไดรฟ์แคร์</p>
                                        <p className="text-sm text-gray-500">ลงทะเบียนเป็นพาร์ทเนอร์คนขับ</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {[1, 2, 3].map((n) => {
                                        const active = step === (n as 1 | 2 | 3);
                                        const done = step > (n as 1 | 2 | 3);
                                        return (
                                            <div key={n} className="flex items-center">
                                                <div
                                                    className={
                                                        "h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all " +
                                                        (done
                                                            ? "bg-[#70C5BE] text-white"
                                                            : active
                                                                ? "bg-[#70C5BE]/15 text-[#2c8f87] ring-2 ring-[#70C5BE]/30"
                                                                : "bg-gray-100 text-gray-500")
                                                    }
                                                >
                                                    {n}
                                                </div>
                                                {n !== 3 && <div className="w-8 h-0.5 bg-gray-200 mx-2" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 sm:p-8">

                            <form
                                className="flex flex-col gap-4 w-full"
                                onSubmit={handleSubmit}
                            >
                                {step === 1 && (
                                    <>
                                        <p className="text-lg sm:text-xl font-extrabold text-[#70C5BE]">ข้อมูลทั่วไป</p>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm sm:text-base font-light">รูปโปรไฟล์ *</span>
                                            {previews.profile_img && (
                                                <div className="relative w-40 h-40 lg:w-50 lg:h-50 mb-2 shadow-[0_0_20px_rgba(120,198,160,0.3)] rounded-full overflow-hidden border-2 border-[#78C6A0] mx-auto">
                                                    <img
                                                        src={previews.profile_img}
                                                        className="object-cover w-full h-full"
                                                    />
                                                </div>
                                            )}
                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="file"
                                                name="profile_img"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm sm:text-base font-light">เมือง *</span>
                                            <SelectDropdown
                                                value={formData.city}
                                                options={CITY_OPTIONS}
                                                onChange={handleSelectCity}
                                                placeholder="เลือกจังหวัด"
                                                buttonClassName="w-full border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                menuClassName="w-full border-0"
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm sm:text-base font-light">ชื่อจริง *</span>
                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="text"
                                                name="firstName"
                                                placeholder="ชื่อจริง"
                                                value={formData.firstName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm sm:text-base font-light">นามสกุล *</span>
                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="text"
                                                name="lastName"
                                                placeholder="นามสกุล"
                                                value={formData.lastName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm sm:text-base font-light">เบอร์โทรศัพท์ *</span>
                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="tel"
                                                name="phone_number"
                                                placeholder="เบอร์โทรศัพท์"
                                                maxLength={10}
                                                value={formData.phone_number}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm sm:text-base font-light">รูปบัตรประชาชน *</span>

                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="file"
                                                name="citizen_id_img"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2 mb-4">
                                            <span className="text-sm sm:text-base font-light">รูปใบอนุญาตขับขี่ *</span>
                                            {/* {previews.driving_license_img && (
                                     <div className="relative w-102 h-72 mb-2  rounded-2xl overflow-hidden mx-auto">
                                         <img
                                             src={previews.driving_license_img}
                                             className="object-contain w-full h-full"
                                         />
                                     </div>
                                 )} */}
                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="file"
                                                name="driving_license_img"
                                                onChange={handleFileChange}
                                            />
                                        </div>

                                        <div className="flex gap-3 sm:gap-4 lg:flex-row flex-col mb-2">
                                            <Button type="button" variant="secondary" onClick={backLogin} className="">
                                                <p className="text-sm sm:text-base font-light"> ย้อนกลับ</p>
                                            </Button>
                                            <Button
                                                type="button" variant="primary"
                                                className="flex-1"
                                                onClick={nextStep}>
                                                <p className="text-sm sm:text-base font-semibold">ถัดไป
                                                </p>
                                            </Button>
                                        </div>
                                    </>
                                )}
                                {step === 2 && (
                                    <>
                                        <p className="text-lg sm:text-xl font-extrabold text-[#70C5BE]">ข้อมูลรถ</p>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm sm:text-base font-light">รูปรถ *</span>
                                            {previews.car_img && (
                                                <div className="relative w-auto lg:h-96 mb-2 shadow-[0_0_20px_rgba(120,198,160,0.3)] rounded-xl overflow-hidden border-2 border-[#78C6A0] mx-auto">
                                                    <img
                                                        src={previews.car_img}
                                                        className="object-contain w-full h-full"
                                                    />
                                                </div>
                                            )}
                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="file"
                                                name="car_img"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <span className="text-sm sm:text-base font-light">รูป พ.ร.บ *</span>
                                            {/* {previews.act_img && (
                                     <div className="relative w-102 h-72 mb-2  rounded-2xl overflow-hidden mx-auto">
                                         <img
                                             src={previews.act_img}
                                             className="object-contain w-full h-full"
                                         />
                                     </div>
                                 )} */}
                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="file"
                                                name="act_img"
                                                onChange={handleFileChange}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm sm:text-base font-light">ยี่ห้อรถ *</span>
                                                <SelectDropdown
                                                    value={formData.car_brand}
                                                    options={getCarBrands().map((brand) => ({ label: brand, value: brand }))}
                                                    onChange={handleSelectCarBrand}
                                                    placeholder="เลือกยี่ห้อรถ"
                                                    buttonClassName="w-full border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2"
                                                    menuClassName="w-full border border-[#70C5BE]"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <span className="text-sm sm:text-base font-light">รุ่นรถ *</span>
                                                <SelectDropdown
                                                    value={formData.car_model}
                                                    options={carModels.map((model) => ({ label: model, value: model }))}
                                                    onChange={handleSelectCarModel}
                                                    placeholder={formData.car_brand ? "เลือกรุ่นรถ" : "กรุณาเลือกยี่ห้อก่อน"}
                                                    disabled={!formData.car_brand}
                                                    buttonClassName="w-full border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 disabled:bg-gray-100"
                                                    menuClassName="w-full border border-[#70C5BE]"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mb-4">
                                            <span className="text-sm sm:text-base font-light">ป้ายทะเบียนรถ *</span>
                                            <input
                                                className="border border-[#70C5BE] focus:outline-none focus:ring-2 focus:ring-[#1B7]/40 transition-all duration-200 rounded-md p-2 mb-2"
                                                type="text"
                                                name="car_plate"
                                                placeholder="กข 1234"
                                                value={formData.car_plate}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div className="flex gap-3 sm:gap-4 lg:flex-row flex-col mb-2">
                                            <Button type="button" variant="secondary" onClick={() => setStep(1)} className="">
                                                <p className="text-sm sm:text-base font-light"> ย้อนกลับ</p>
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="primary"
                                                className="flex-1"
                                                onClick={nextStepFromCar}
                                            >
                                                ถัดไป
                                            </Button>
                                        </div>
                                    </>
                                )}
                                {step === 3 && (
                                    <>
                                        <p className="text-lg sm:text-xl font-extrabold text-[#70C5BE]">
                                            ตรวจสอบข้อมูลก่อนลงทะเบียน
                                        </p>
                                        <span className="text-sm font-bold sm:text-base">รูปโปรไฟล์:</span>
                                        <div className="relative w-40 h-40 lg:w-50 lg:h-50 mb-2 shadow-[0_0_20px_rgba(120,198,160,0.3)] rounded-full overflow-hidden border-2 border-[#78C6A0] mx-auto">
                                            <img
                                                src={previews.profile_img}
                                                className="object-cover w-full h-full"
                                            />
                                        </div>
                                        <div className="space-y-3 text-sm sm:text-base">
                                            <div><b>ชื่อ:</b> {formData.firstName} {formData.lastName}</div>
                                            <div><b>เบอร์โทร:</b> {formData.phone_number}</div>
                                            <div><b>จังหวัด:</b> {formData.city}</div>

                                            <hr className="opacity-20" />
                                            <span className="text-sm font-bold sm:text-base">รูปรถ:</span>
                                            <div className="relative lg:w-76 w-auto lg:h-36 mb-2 shadow-[0_0_20px_rgba(120,198,160,0.3)] rounded-xl overflow-hidden border-2 border-[#78C6A0] mx-auto">
                                                <img
                                                    src={previews.car_img}
                                                    className="object-contain w-full h-full"
                                                />
                                            </div>
                                            <div><b>ยี่ห้อรถ:</b> {formData.car_brand}</div>
                                            <div><b>รุ่นรถ:</b> {formData.car_model}</div>
                                            <div><b>ทะเบียนรถ:</b> {formData.car_plate}</div>
                                        </div>
                                        <hr className="opacity-20" />
                                        <div className="mt-6 p-4 rounded-2xl border border-gray-200 bg-linear-to-b from-gray-50 to-white space-y-3">
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
                                        <div className="flex gap-3 sm:gap-4 lg:flex-row flex-col mt-6">
                                            <Button type="button" variant="secondary" onClick={() => setStep(2)}>
                                                ย้อนกลับ
                                            </Button>

                                            <Button
                                                type="submit"
                                                variant="primary"
                                                buttonIsLoading={loading}
                                                disabled={!agreePolicy || !agreeLineNotify}
                                                className="flex-1"
                                            >
                                                ยืนยันการลงทะเบียน
                                            </Button>
                                        </div>


                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            <PolicyModal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} />
            <LineNotifyModal open={showLineNotifyModal} onClose={() => setShowLineNotifyModal(false)} />
        </>
    );
}
