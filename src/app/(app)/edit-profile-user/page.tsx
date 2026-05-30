"use client";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { toast } from "react-toastify";
import { UserProfile } from "@/types/profile";
import type {
  UserFormField,
  UserProfileFormData,
} from "@/types/forms/edit-profile";
import { Icon } from "@iconify/react";

function toUserFormData(d: UserProfile): UserProfileFormData {
  return {
    first_name: d.first_name || "",
    last_name: d.last_name || "",
    phone_number: d.phone_number || "",
    address: d.address || "",
  };
}

export default function EditProfileUser() {
  const { token, isLoad, userData, setUserData } = useUser();
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API!;

  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserProfileFormData>({
    first_name: "",
    last_name: "",
    phone_number: "",
    address: "",
  });

  useEffect(() => {
    if (!isLoad) return;

    if (!userData) {
      router.replace("/login");
      return;
    }

    if (userData.role !== "user") {
      router.replace("/");
      return;
    }

    const d = userData as UserProfile;
    setFormData(toUserFormData(d));
    console.log("โหลดข้อมูลโปรไฟล์สำหรับแก้ไข", d);
  }, [isLoad, userData, router]);

  const handleCancel = (field: UserFormField) => {
    if (userData && userData.role === "user") {
      const original = toUserFormData(userData as UserProfile);
      setFormData((prev) => ({ ...prev, [field]: original[field] }));
    }
    setEditingField(null);
  };

  const handleSaveField = async (field: UserFormField) => {
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
      const res = await fetch(`${API_URL}/user-controller/edit-profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        if (userData && userData.role === "user") {
          setUserData({ ...(userData as UserProfile), ...formData });
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

  const handleFileUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    fieldName: "profile_img",
  ) => {
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
      const res = await fetch(`${API_URL}/user-controller/upload-image`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: uploadData,
      });
      const result = (await res.json()) as { url?: string };
      if (res.ok) {
        if (userData.role === "user" && result.url) {
          setUserData({
            ...(userData as UserProfile),
            [fieldName]: result.url,
          } as UserProfile);
        }
        toast.success("อัปเดตรูปภาพเรียบร้อย");
      }
    } catch (err) {
      toast.error("อัปโหลดไม่สำเร็จ");
    } finally {
      setUploadingField(null);
    }
  };

  if (!isLoad || !userData)
    return <p className="text-center p-10 text-gray-400">กำลังโหลด...</p>;
  const d = userData as UserProfile;

  return (
    <section className="w-full bg-gray-50 min-h-screen pb-24">
      <header className="border-b border-neutral-200">
        <div className="title w-full max-w-5xl mx-auto px-8 py-4">
          <h2 className="text-2xl text-gray-800 font-semibold">ตั้งค่า</h2>
        </div>
      </header>
      <main className="w-full max-w-5xl mx-auto px-6 pb-10 pt-4">
        <div className="mb-8">
          <p className="text-xl sm:text-2xl font-bold text-[#70C5BE]">
            จัดการข้อมูลโปรไฟล์
          </p>
          <p className="text-sm sm:text-base font-light ">
            คุณสามารถแก้ไขข้อมูลได้โดยกดที่ไอคอนดินสอข้างรายการนั้นๆ
          </p>
        </div>

        <div className="mb-10">
          <div className="flex flex-col gap-4 mb-6 border-b border-gray-200 pb-2">
            <div className="flex gap-2">
              <Icon
                icon="solar:user-circle-bold"
                className="text-[#70C5BE] w-6 h-6"
              />
              <p className="text-base sm:text-xl font-bold text-[#70C5BE]">
                ข้อมูลส่วนตัวของคุณ
              </p>
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-8 ">
            <div className="flex flex-col items-center justify-center md:border-r border-gray-100 pr-4">
              <div className="relative group">
                <img
                  src={d.profile_img}
                  className="w-38 h-38 rounded-full object-cover border-4 border-[#70C5BE] p-1 shadow-md"
                  alt="profile"
                />
                <label className="absolute bottom-1 right-1 bg-[#70C5BE] text-white p-2 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform">
                  <input
                    type="file"
                    hidden
                    onChange={(e) => handleFileUpload(e, "profile_img")}
                  />
                  {uploadingField === "profile_img" ? (
                    <Icon icon="line-md:loading-twotone-loop" />
                  ) : (
                    <Icon icon="solar:camera-bold" />
                  )}
                </label>
              </div>
              <div className="flex-col mt-1 items-center text-center">
                <span className="mt-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  รูปโปรไฟล์
                </span>
                <div className="flex mt-2 justify-center">
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

            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-6">
              <InputGroup
                label="ชื่อ"
                field="first_name"
                value={formData.first_name}
                editingField={editingField}
                setEditingField={setEditingField}
                onCancel={handleCancel}
                onSave={handleSaveField}
                loading={loading}
                onChange={(val: string) =>
                  setFormData({ ...formData, first_name: val })
                }
              />
              <InputGroup
                label="นามสกุล"
                field="last_name"
                value={formData.last_name}
                editingField={editingField}
                setEditingField={setEditingField}
                onCancel={handleCancel}
                onSave={handleSaveField}
                loading={loading}
                onChange={(val: string) =>
                  setFormData({ ...formData, last_name: val })
                }
              />
              <InputGroup
                label="เบอร์โทรศัพท์"
                field="phone_number"
                value={formData.phone_number}
                editingField={editingField}
                setEditingField={setEditingField}
                onCancel={handleCancel}
                onSave={handleSaveField}
                loading={loading}
                onChange={(val: string) =>
                  setFormData({ ...formData, phone_number: val })
                }
              />
              <InputGroup
                label="ที่อยู่"
                field="address"
                value={formData.address}
                editingField={editingField}
                setEditingField={setEditingField}
                onCancel={handleCancel}
                onSave={handleSaveField}
                loading={loading}
                multiline
                onChange={(val: string) =>
                  setFormData({ ...formData, address: val })
                }
              />
            </div>
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
  editingField,
  setEditingField,
  onCancel,
  onSave,
  loading,
  onChange,
  multiline = false,
}: {
  label: string;
  field: UserFormField;
  value: string;
  editingField: string | null;
  setEditingField: Dispatch<SetStateAction<string | null>>;
  onCancel: (field: UserFormField) => void;
  onSave: (field: UserFormField) => void;
  loading: boolean;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  const isEditing = editingField === field;

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
        {label}
      </label>

      {isEditing ? (
        <div className="flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
          {multiline ? (
            <textarea
              autoFocus
              rows={3}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border-2 border-[#70C5BE] rounded-xl p-3 text-gray-800 bg-[#70C5BE]/5 outline-none resize-none"
            />
          ) : (
            <input
              autoFocus
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="w-full border-2 border-[#70C5BE] rounded-xl p-3 text-gray-800 bg-[#70C5BE]/5 outline-none duration-150 transition-all"
            />
          )}

          <div className="flex justify-end gap-2">
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
        <div
          onClick={() => setEditingField(field)}
          className="
                        flex items-center justify-between
                        w-full p-2 -ml-2
                        rounded-xl cursor-pointer
                        hover:bg-[#70C5BE]/5
                        active:bg-[#70C5BE]/10
                        transition-all
                        group/item
                    "
        >
          <p className="font-semibold truncate">{value || "ไม่ระบุ"}</p>
          <div className="bg-[#70C5BE]/10 text-[#70C5BE] p-1.5 rounded-lg opacity-60 group-hover/item:opacity-100 transition-opacity">
            <Icon icon="solar:pen-new-square-linear" className="w-4 h-4" />
          </div>
        </div>
      )}
    </div>
  );
}
