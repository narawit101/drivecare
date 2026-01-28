"use client";

import Button from "@/components/Button";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";

type Props = {
    open: boolean;
    loading?: boolean;
    reason: string;
    onChangeReason: (v: string) => void;
    onCancel: () => void;
    onConfirm: () => void;
};

export default function RejectPaymentModal({
    open,
    loading,
    reason,
    onChangeReason,
    onCancel,
    onConfirm,
}: Props) {
    useEscapeToClose(open && !loading, () => {
        if (loading) return;
        onCancel();
    });
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-2 text-red-600">
                    ปฏิเสธการชำระเงิน
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                    กรุณาระบุเหตุผลที่ปฏิเสธ (ผู้ป่วยจะเห็นข้อความนี้)
                </p>

                <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => onChangeReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 p-3 text-sm"
                    placeholder="เช่น สลิปไม่ชัดเจน / ยอดเงินไม่ตรง"
                />

                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        variant="secondary"
                        disabled={Boolean(loading)}
                        onClick={() => {
                            if (loading) return;
                            onCancel();
                        }}
                    >
                        ยกเลิก
                    </Button>
                    <Button
                        variant="primary"
                        disabled={!reason.trim() || loading}
                        buttonIsLoading={Boolean(loading)}
                        onClick={onConfirm}
                    >
                        ยืนยันการปฏิเสธ
                    </Button>
                </div>
            </div>
        </div>
    );
}
