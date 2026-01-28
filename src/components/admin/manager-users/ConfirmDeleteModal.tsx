"use client";

import { Icon } from "@iconify/react";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";
import Button from "@/components/Button";

type ConfirmDeleteModalProps = {
    name: string;
    onCancel: () => void;
    onConfirm: () => void | Promise<void>;
    isLoading?: boolean;
};

export default function ConfirmDeleteModal({ name, onCancel, onConfirm, isLoading = false }: ConfirmDeleteModalProps) {
    useEscapeToClose(!isLoading, () => {
        if (isLoading) return;
        onCancel();
    });
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95">
                <div className="flex items-center gap-3 mb-4">
                    <Icon icon="solar:danger-triangle-linear" className="h-7 w-7 text-rose-500" />
                    <h3 className="text-lg font-semibold text-slate-800">ยืนยันการลบข้อมูล</h3>
                </div>

                <p className="text-slate-600 mb-6">
                    คุณแน่ใจหรือไม่ว่าต้องการลบ
                    <span className="font-semibold text-slate-800"> {name}</span>
                    ? <br />
                    การลบนี้ไม่สามารถย้อนกลับได้
                </p>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        type="button"
                        onClick={onCancel}
                        disabled={isLoading}
                        className="rounded-lg px-4 py-2"
                    >
                        ยกเลิก
                    </Button>

                    <Button
                        variant="reject"
                        type="button"
                        onClick={onConfirm}
                        buttonIsLoading={isLoading}
                        className="rounded-lg px-4 py-2"
                        title={isLoading ? "กำลังลบ..." : "ลบข้อมูล"}
                    >
                        ลบข้อมูล
                    </Button>
                </div>
            </div>
        </div>
    );
}
