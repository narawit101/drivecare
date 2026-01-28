"use client";

import { Icon } from "@iconify/react";
import Button from "@/components/Button";
import type { EditUserData, UserStatus } from "@/types/admin/manager-users";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";
import SelectDropdown from "@/components/common/SelectDropdown";

type EditUserModalProps = {
    data: EditUserData;
    onChange: (next: EditUserData) => void;
    onClose: () => void;
    onManageVerification?: () => void;
    onSave: () => void;
    loading: boolean;
};

const DRIVER_STATUS_VALUES: UserStatus[] = ["active", "inactive", "banned"];

export default function EditUserModal({ data, onChange, onClose, onManageVerification, onSave, loading }: EditUserModalProps) {
    useEscapeToClose(!loading, () => {
        if (loading) return;
        onClose();
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl animate-in zoom-in-95">
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <Icon icon="solar:pen-linear" className="h-6 w-6 text-[#70C5BE]" />
                        <h2 className="text-lg font-semibold text-slate-800">แก้ไขข้อมูลผู้ใช้</h2>
                    </div>
                    <button
                        onClick={() => {
                            if (loading) return;
                            onClose();
                        }}
                        disabled={loading}
                        className="rounded-full p-1 hover:bg-slate-100 transition disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Icon icon="solar:close-circle-linear" className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    <div className="space-y-1">
                        <label className="text-sm text-slate-500">ชื่อ</label>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#70C5BE]"
                            value={data.first_name}
                            onChange={(e) => onChange({ ...data, first_name: e.target.value } as EditUserData)}
                            placeholder="ชื่อ"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-slate-500">นามสกุล</label>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none trasnsition-all duration-200 focus:ring-1 focus:ring-[#70C5BE]"
                            value={data.last_name}
                            onChange={(e) => onChange({ ...data, last_name: e.target.value } as EditUserData)}
                            placeholder="นามสกุล"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-slate-500">เบอร์โทรศัพท์</label>
                        <input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm trasnsition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#70C5BE]"
                            value={data.phone_number}
                            onChange={(e) => onChange({ ...data, phone_number: e.target.value } as EditUserData)}
                            placeholder="เบอร์โทร"
                        />
                    </div>

                    {data.role === "user" && (
                        <div className="space-y-1">
                            <label className="text-sm text-slate-500">ที่อยู่</label>
                            <textarea
                                rows={3}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm trasnsition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#70C5BE]"
                                value={data.address}
                                onChange={(e) => onChange({ ...data, address: e.target.value })}
                                placeholder="ที่อยู่"
                            />
                        </div>
                    )}

                    {data.role === "driver" && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">สถานะ</label>
                                <SelectDropdown
                                    value={data.status}
                                    onChange={(nextStatus) => {
                                        const safeStatus: UserStatus = DRIVER_STATUS_VALUES.includes(nextStatus)
                                            ? nextStatus
                                            : "inactive";
                                        onChange({ ...data, status: safeStatus });
                                    }}
                                    options={[
                                        { value: "active", label: "พร้อมรับงาน (ออนไลน์)" },
                                        { value: "inactive", label: "ไม่พร้อม (ออฟไลน์)" },
                                        { value: "banned", label: "แบน" },
                                    ]}
                                    buttonClassName="w-full justify-between"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-sm text-slate-500">จังหวัด</label>
                                <SelectDropdown
                                    value={data.city}
                                    onChange={(city) => onChange({ ...data, city })}
                                    options={[
                                        { value: "ร้อยเอ็ด", label: "ร้อยเอ็ด" },
                                        { value: "มหาสารคาม", label: "มหาสารคาม" },
                                        { value: "ขอนแก่น", label: "ขอนแก่น" },
                                    ]}
                                    buttonClassName="w-full justify-between"
                                />
                            </div>
                        </div>
                    )}
                    {data.role === "driver" && onManageVerification && (
                        <Button
                            variant="outline"
                            disabled={loading}
                            onClick={() => {
                                if (loading) return;
                                onManageVerification();
                            }}
                        >
                            <span className="inline-flex items-center gap-2">
                                <Icon icon="solar:shield-check-linear" className="h-5 w-5" />
                                จัดการการตรวจสอบ
                            </span>
                        </Button>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 px-6 py-4 border-t bg-slate-50 rounded-b-2xl">

                    <Button
                        variant="secondary"
                        disabled={loading}
                        onClick={() => {
                            if (loading) return;
                            onClose();
                        }}
                    >
                        ยกเลิก
                    </Button>
                    <Button variant="primary" onClick={onSave} disabled={loading} buttonIsLoading={loading}>
                        บันทึก
                    </Button>
                </div>
            </div>
        </div>
    );
}
