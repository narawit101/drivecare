"use client";

import { Icon } from "@iconify/react";
import Button from "@/components/Button";
import * as FormatDatetime from "@/utils/format-datetime";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";

type Props = {
    data: any;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    onOpenReject: () => void;
    renderStatus: (status: string) => React.ReactNode;
    isLoading?: boolean;
};

export default function PaymentSlipModal({
    data,
    onClose,
    onConfirm,
    onOpenReject,
    renderStatus,
    isLoading,
}: Props) {
    useEscapeToClose(Boolean(data) && !isLoading, () => {
        if (isLoading) return;
        onClose();
    });
    if (!data) return null;

    const canVerify =
        (data.status === "paymented" || data.status === "success") &&
        data.payment_status === "waiting_verify";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative w-full max-w-3xl rounded-xl bg-white shadow-xl overflow-hidden">
                <button
                    onClick={() => {
                        if (isLoading) return;
                        onClose();
                    }}
                    disabled={Boolean(isLoading)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Icon icon="solar:close-circle-linear" className="text-xl" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image */}
                    <div className="bg-slate-100 p-6 flex items-center justify-center">
                        <img
                            src={data.payment_slip}
                            className="rounded-lg shadow w-full object-contain min-h-76 max-h-96"
                        />
                    </div>

                    {/* Detail */}
                    <div className="p-6 flex flex-col">
                        <p className="text-lg font-bold mb-4 text-[#70C5BE]">
                            ตรวจสอบหลักฐานการโอนเงิน
                        </p>

                        <Info label="หมายเลขการจอง" value={`# ${data.booking_id}`} />
                        <Info
                            label="อัพโหลดเมื่อ"
                            value={`${FormatDatetime.formatThaiDate(
                                data.payment_at
                            )} เวลา ${FormatDatetime.formatThaiTime(data.payment_at)}`}
                        />
                        <Info
                            label="ยอดชำระ"
                            value={`฿ ${Number(data.total_price).toLocaleString()} บาท`}
                            highlight
                        />

                        <div className="mt-auto flex justify-end gap-3">
                            {canVerify ? (
                                <>
                                    <Button variant="danger" disabled={Boolean(isLoading)} onClick={onOpenReject}>
                                        ปฏิเสธ
                                    </Button>
                                    <Button
                                        variant="primary"
                                        buttonIsLoading={Boolean(isLoading)}
                                        disabled={Boolean(isLoading)}
                                        onClick={async () => {
                                            if (isLoading) return;
                                            await onConfirm();
                                        }}
                                    >
                                        ยืนยันการตรวจสอบ
                                    </Button>
                                </>
                            ) : (
                                renderStatus(data.payment_status)
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Info({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    return (
        <div className="mb-4">
            <p className="text-base text-slate-500">{label}</p>
            <p
                className={`font-semibold ${highlight ? "text-2xl text-button-primary" : "text-slate-800"
                    }`}
            >
                {value}
            </p>
        </div>
    );
}
