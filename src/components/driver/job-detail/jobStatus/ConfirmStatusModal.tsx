"use client";

import Button from "@/components/Button";

export function ConfirmStatusModal({
    label,
    onConfirm,
    onCancel,
}: {
    label: string;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="fixed inset-0 z-100 bg-black/40 backdrop-blur-[2px] flex items-center justify-center px-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 border border-button-primary/15 shadow-xl">
                <h3 className="font-bold text-lg text-center text-gray-800">ยืนยันเปลี่ยนสถานะ</h3>
                <p className="text-center text-gray-600">
                    เปลี่ยนสถานะเป็น
                    <span className="font-bold block mt-1">{label}</span>
                </p>
                <div className="flex gap-3">
                    <Button variant="secondary" className="w-full" onClick={onCancel}>
                        ยกเลิก
                    </Button>
                    <Button className="w-full" onClick={onConfirm}>
                        ยืนยัน
                    </Button>
                </div>
            </div>
        </div>
    );
}
