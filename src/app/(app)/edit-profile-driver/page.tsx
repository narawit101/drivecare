"use client"
import { useEffect, useState, type ChangeEvent, type Dispatch, type SetStateAction } from "react";
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { toast } from "react-toastify";
import { DriverProfile } from '@/types/profile';
import type { DriverFormField, DriverImageField, DriverProfileFormData } from "@/types/forms/edit-profile";
import { Icon } from "@iconify/react";
import { getCarBrands, getCarModelsByBrand } from "@/utils/carList";

// รายชื่อเมืองตัวอย่าง
const CITIES = ["ขอนแก่น", "ร้อยเอ็ด", "มหาสารคาม",];

function toDriverFormData(d: DriverProfile): DriverProfileFormData {
    return {
        first_name: d.first_name || "",
        last_name: d.last_name || "",
        phone_number: d.phone_number || "",
        car_brand: d.car_brand || "",
        car_model: d.car_model || "",
        car_plate: d.car_plate || "",
        city: d.city || "",
    };
}

export default function EditProfileDriver() {
    const { token, isLoad, userData, setUserData } = useUser();
    const router = useRouter();
    const API_URL = process.env.NEXT_PUBLIC_API!;

    const [loading, setLoading] = useState(false);
    const [uploadingField, setUploadingField] = useState<string | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [carModels, setCarModels] = useState<string[]>([]);

    const [formData, setFormData] = useState<DriverProfileFormData>({
        first_name: "",
        last_name: "",
        phone_number: "",
        car_brand: "",
        car_model: "",
        car_plate: "",
        city: "",
    });

    useEffect(() => {
        if (!isLoad) return;

        if (!userData) {
            router.replace("/login");
            return;
        }

        if (userData.role !== "driver") {
            router.replace("/");
            return;
        }

        if (userData.verified !== "approved") {
            toast.info("ไม่สามารถแก้ไขได้ในขณะนี้");
            router.replace("/driver-dashboard");
            return;
        }

        // ตอนนี้ TS มั่นใจแล้วว่า userData เป็น DriverProfile
        const d = userData as DriverProfile;
        setFormData(toDriverFormData(d));
        setCarModels(getCarModelsByBrand(d.car_brand || ""));
        console.log("โหลดข้อมูลโปรไฟล์สำหรับแก้ไข", d);
    }, [isLoad, userData, router]);

    useEffect(() => {
        setCarModels(getCarModelsByBrand(formData.car_brand || ""));
    }, [formData.car_brand]);

    const handleCancel = (field: DriverFormField) => {
        if (userData && userData.role === "driver") {
            const original = toDriverFormData(userData as DriverProfile);
            if (field === "car_brand") {
                setFormData(prev => ({
                    ...prev,
                    car_brand: original.car_brand,
                    car_model: original.car_model,
                }));
            } else {
                setFormData(prev => ({ ...prev, [field]: original[field] }));
            }
        }
        setEditingField(null);
    };

    const handleSaveField = async (field: DriverFormField) => {

        if (formData.car_brand?.trim() && !formData.car_model?.trim() && field !== "car_model") {
            toast.error("กรุณาเลือกรุ่นรถก่อนบันทึก");
            return;
        }
        if (field === "car_model" && !formData.car_brand?.trim()) {
            toast.error("กรุณาเลือกยี่ห้อรถก่อน");
            return;
        }

        if (!formData[field]?.trim()) {
            toast.error("ห้ามใส่ค่าว่าง");
            return;
        }
        // 📱 ดักเบอร์โทร 10 ตัว (ตัวเลขล้วน)
        if (field === "phone_number") {
            const phone = formData.phone_number.trim();

            if (!/^\d{10}$/.test(phone)) {
                toast.error("กรุณากรอกเบอร์โทรศัพท์ 10 หลักเท่านั้น");
                return;
            }
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/driver-controller/edit-profile`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                if (userData && userData.role === "driver") {
                    setUserData({ ...(userData as DriverProfile), ...formData });
                }
                toast.success("อัปเดตข้อมูลเรียบร้อย");
                setEditingField(null);
            }
        } catch (err) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };

    const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, fieldName: DriverImageField) => {
        const file = e.target.files?.[0];
        if (!file || !userData) return;

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

        setUploadingField(fieldName);
        const uploadData = new FormData();
        uploadData.append("file", file);
        uploadData.append("fieldName", fieldName);

        try {
            const res = await fetch(`${API_URL}/driver-controller/upload-image`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: uploadData
            });
            const result = (await res.json()) as { url?: string };
            if (res.ok) {
                if (userData.role === "driver" && result.url) {
                    setUserData({ ...(userData as DriverProfile), [fieldName]: result.url } as DriverProfile);
                }
                toast.success("อัปเดตรูปภาพเรียบร้อย");
            }
        } catch (err) {
            toast.error("อัปโหลดไม่สำเร็จ");
        } finally {
            setUploadingField(null);
        }
    };

    if (!isLoad || !userData) return <p className="text-center p-10 text-gray-400">กำลังโหลด...</p>;
    const d = userData as DriverProfile;

    return (
        <section className="w-full bg-gray-50 min-h-screen pb-24">
            <header className="border-b border-neutral-200">
                <div className="title w-full max-w-5xl mx-auto px-8 py-4">
                    <h2 className="text-2xl text-gray-800 font-semibold">ตั้งค่า</h2>
                </div>
            </header>
            <main className="w-full max-w-5xl mx-auto px-6 pb-10 pt-4">
                {/* <div className="mb-8">
                    <p className="text-xl sm:text-2xl font-bold text-[#70C5BE]">จัดการข้อมูลโปรไฟล์</p>
                    <p className="text-sm sm:text-base font-light ">คุณสามารถแก้ไขข้อมูลได้โดยกดที่ไอคอนดินสอข้างรายการนั้นๆ</p>
                </div> */}

                <div className="mb-10">
                    <div className="flex flex-col gap-4 mb-6 border-b border-gray-200 pb-2">
                        <div className='flex gap-2'>
                            <Icon icon="solar:user-circle-bold" className="text-[#70C5BE] w-6 h-6" />
                            <p className="text-base sm:text-xl font-bold text-[#70C5BE]">ข้อมูลส่วนตัวคนขับ</p>
                        </div>
                        <div className='flex flex-col md:flex-row gap-2 items-center'>
                            {d?.verified === 'approved' ? (
                                <span className="bg-[#70C5BE] border border-[#70C5BE] text-white text-xs px-2 py-1 rounded-full">ยืนยันตัวตนแล้ว</span>
                            ) : d?.verified === 'pending_approval' ? (
                                <span className="bg-yellow-400 border border-yellow-400 text-white text-xs px-2 py-1 rounded-full">รอยืนยันตัวตน</span>
                            ) : d?.verified === 'rejected' ? (
                                <span className="bg-red-500 border border-red-500 text-white text-xs px-2 py-1 rounded-full">ไม่ผ่านการยืนยันตัวตน</span>
                            ) : <span>
                                ไม่ทราบสถานะการยืนยันตัวตน
                            </span>}
                            <div className='flex justify-center'>
                                <span className="bg-[#70C5BE] border border-[#70C5BE] text-white text-xs px-2 py-1 rounded-full">
                                    สมัครเมื่อ{" "}
                                    {d.create_at &&
                                        new Date(d.create_at).toLocaleDateString("th-TH", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
                        <div className="flex flex-col items-center justify-center md:border-r border-gray-100 pr-4">
                            <div className="relative group">
                                <img src={d.profile_img} className="w-38 h-38 rounded-full object-cover border-4 border-[#70C5BE] p-1 shadow-md" alt="profile" />
                                <label className="absolute bottom-1 right-1 bg-[#70C5BE] text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                                    <input type="file" hidden onChange={(e) => handleFileUpload(e, "profile_img")} />
                                    {uploadingField === 'profile_img' ? <Icon icon="line-md:loading-twotone-loop" /> : <Icon icon="solar:camera-bold" />}
                                </label>
                            </div>
                            <span className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-wider">รูปโปรไฟล์</span>
                        </div>

                        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
                            <InputGroup label="ชื่อ" field="first_name" value={formData.first_name} editingField={editingField} setEditingField={setEditingField} onCancel={handleCancel} onSave={handleSaveField} loading={loading} onChange={(val: string) => setFormData({ ...formData, first_name: val })} />
                            <InputGroup label="นามสกุล" field="last_name" value={formData.last_name} editingField={editingField} setEditingField={setEditingField} onCancel={handleCancel} onSave={handleSaveField} loading={loading} onChange={(val: string) => setFormData({ ...formData, last_name: val })} />
                            <InputGroup label="เบอร์โทรศัพท์" field="phone_number" value={formData.phone_number} editingField={editingField} setEditingField={setEditingField} onCancel={handleCancel} onSave={handleSaveField} loading={loading} onChange={(val: string) => setFormData({ ...formData, phone_number: val })} />

                            {/* เมืองที่เป็น Select Option */}
                            <InputGroup
                                label="เมืองที่ให้บริการ"
                                field="city"
                                type="select"
                                options={CITIES}
                                value={formData.city}
                                editingField={editingField}
                                setEditingField={setEditingField}
                                onCancel={handleCancel}
                                onSave={handleSaveField}
                                loading={loading}
                                onChange={(val: string) => setFormData({ ...formData, city: val })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ImageUploader label="รูปบัตรประชาชน" field="citizen_id_img" value={d.citizen_id_img} uploading={uploadingField === 'citizen_id_img'} onUpload={handleFileUpload} />
                        <ImageUploader label="รูปใบอนุญาตขับขี่" field="driving_license_img" value={d.driving_license_img} uploading={uploadingField === 'driving_license_img'} onUpload={handleFileUpload} />
                    </div>
                </div>

                <div className="mb-10">
                    <div className="flex items-center gap-2 mb-6 border-b border-gray-200 pb-2">
                        <Icon icon="solar:bus-bold" className="text-[#70C5BE] w-6 h-6" />
                        <p className="text-base sm:text-xl font-bold text-[#70C5BE]">ข้อมูลยานพาหนะ</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <ImageUploader label="รูปรถ" field="car_img" value={d.car_img} uploading={uploadingField === 'car_img'} onUpload={handleFileUpload} />
                        <ImageUploader label="รูป พ.ร.บ. รถ" field="act_img" value={d.act_img} uploading={uploadingField === 'act_img'} onUpload={handleFileUpload} />
                    </div>
                    <div className="bg-white p-8 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-8">
                        <InputGroup
                            label="ยี่ห้อรถ"
                            field="car_brand"
                            type="select"
                            options={getCarBrands()}
                            value={formData.car_brand}
                            editingField={editingField}
                            setEditingField={setEditingField}
                            onCancel={handleCancel}
                            onSave={handleSaveField}
                            loading={loading}
                            onChange={(val: string) => {
                                setFormData(prev => ({ ...prev, car_brand: val, car_model: "" }));
                                setCarModels(getCarModelsByBrand(val));
                                setEditingField("car_model");
                            }}
                        />
                        <InputGroup
                            label="รุ่นรถ"
                            field="car_model"
                            type="select"
                            options={carModels}
                            value={formData.car_model}
                            editingField={editingField}
                            setEditingField={setEditingField}
                            onCancel={handleCancel}
                            onSave={handleSaveField}
                            loading={loading}
                            disabled={!formData.car_brand}
                            selectPlaceholder={formData.car_brand ? "เลือกรุ่นรถ" : "กรุณาเลือกยี่ห้อก่อน"}
                            onChange={(val: string) => setFormData({ ...formData, car_model: val })}
                        />
                        <InputGroup label="เลขทะเบียนรถ" field="car_plate" value={formData.car_plate} editingField={editingField} setEditingField={setEditingField} onCancel={handleCancel} onSave={handleSaveField} loading={loading} onChange={(val: string) => setFormData({ ...formData, car_plate: val })} />
                    </div>


                </div>
            </main>
        </section>
    );
}

// --- Sub Components ---
function InputGroup({
    label,
    field,
    value,
    type = "text",
    options = [],
    disabled = false,
    selectPlaceholder,
    editingField,
    setEditingField,
    onCancel,
    onSave,
    loading,
    onChange,
}: {
    label: string;
    field: DriverFormField;
    value: string;
    type?: "text" | "select";
    options?: readonly string[];
    disabled?: boolean;
    selectPlaceholder?: string;
    editingField: string | null;
    setEditingField: Dispatch<SetStateAction<string | null>>;
    onCancel: (field: DriverFormField) => void;
    onSave: (field: DriverFormField) => void;
    loading: boolean;
    onChange: (value: string) => void;
}) {
    const isEditing = editingField === field;
    const canEdit = !disabled;

    return (
        <div className="flex flex-col gap-1.5 relative group">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{label}</label>

            <div className="min-h-[45px] w-full">
                {isEditing ? (
                    <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                        {type === "select" ? (
                            <div className="relative">
                                <select
                                    autoFocus
                                    value={value}
                                    onChange={(e) => onChange(e.target.value)}
                                    disabled={disabled}
                                    className="w-full border-b-2 border-[#70C5BE] py-2 pl-3 pr-10 outline-none text-gray-800 bg-[#70C5BE]/5 px-3 rounded-t-md appearance-none cursor-pointer font-semibold transition-all shadow-inner disabled:cursor-not-allowed disabled:bg-gray-100"
                                >
                                    <option value="" disabled>
                                        {selectPlaceholder ?? `เลือก${label}`}
                                    </option>
                                    {options.map((opt) => (
                                        <option key={opt} value={opt} className="bg-white text-gray-800 py-2">
                                            {opt}
                                        </option>
                                    ))}
                                </select>
                                {/* เพิ่มลูกศร Custom ให้ดูทันสมัยขึ้น */}
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#70C5BE]">
                                    <Icon icon="solar:alt-arrow-down-bold-duotone" className="w-5 h-5" />
                                </div>
                            </div>
                        ) : (
                            <input
                                type="text"
                                autoFocus
                                value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="w-full border-2 border-[#70C5BE] rounded-xl p-3 text-gray-800 bg-[#70C5BE]/5 outline-none shadow-inner font-semibold "
                            />
                        )}

                        {/* ปุ่มบันทึก/ยกเลิก (เหมือนเดิม) */}
                        <div className="flex justify-end gap-2 pr-1">
                            <button
                                onClick={() => onSave(field)}
                                disabled={loading}
                                className="flex items-center gap-1.5 bg-[#70C5BE] text-white px-3 py-1.5 rounded-full text-xs  hover:bg-[#5bb1aa] active:scale-95 transition-all shadow-sm cursor-pointer"
                            >
                                บันทึก
                            </button>
                            <button
                                onClick={() => onCancel(field)}
                                className="flex items-center gap-1.5 bg-gray-100 text-gray-600 px-3 py-1.5 rounded-full text-xs  hover:bg-gray-200 active:scale-95 transition-all border border-gray-200 cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                ) : (
                    /* โหมดแสดงผล (เหมือนเดิม) */
                    <div
                        onClick={() => {
                            if (!canEdit) return;
                            setEditingField(field);
                        }}
                        className={
                            "flex items-center justify-between w-full p-2 -ml-2 rounded-xl transition-all group/item " +
                            (canEdit
                                ? "cursor-pointer hover:bg-[#70C5BE]/5 active:bg-[#70C5BE]/10"
                                : "cursor-not-allowed opacity-60")
                        }
                    >
                        <p className="text-base text-gray-800 font-semibold truncate pr-2">
                            {value || "ไม่ระบุ"}
                        </p>
                        {canEdit && (
                            <div className="bg-[#70C5BE]/10 text-[#70C5BE] p-1.5 rounded-lg opacity-60 group-hover/item:opacity-100 transition-opacity">
                                <Icon icon="solar:pen-new-square-linear" className="w-4 h-4" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function ImageUploader({
    label,
    field,
    value,
    uploading,
    onUpload,
}: {
    label: string;
    field: DriverImageField;
    value: string;
    uploading: boolean;
    onUpload: (e: ChangeEvent<HTMLInputElement>, fieldName: DriverImageField) => void;
}) {
    return (
        <div className="bg-white p-5 rounded-3xl shadow-sm flex items-center justify-between border border-transparent hover:border-gray-100 transition-all gap-4">
            <div className="flex items-center gap-4">
                <div className="max-h-60 max-w-60 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative shadow-inner">
                    <img src={value} className="w-full h-full object-cover" alt={label} />
                    {uploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center ">
                            <Icon icon="line-md:loading-twotone-loop" className="text-[#70C5BE]" />
                        </div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wider">{label}</p>
                    <p className="text-[10px] text-gray-400">ขนาดแนะนำไม่เกิน 10MB</p>
                </div>
            </div>
            <label className="bg-gray-50 text-[#70C5BE] p-2.5 rounded-2xl cursor-pointer hover:bg-[#70C5BE] hover:text-white transition-all shadow-sm">
                <input type="file" hidden onChange={(e) => onUpload(e, field)} />
                <Icon icon="solar:upload-minimalistic-bold" className="w-5 h-5" />
            </label>
        </div>
    );
}