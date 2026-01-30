"use client";

import { StatusItem } from "@/types/driver/types";
import { Icon } from "@iconify/react";

export function StatusActions({
    statuses,
    currentIndex,
    disabled,
    onSelectNext,
}: {
    statuses: StatusItem[];
    currentIndex: number;
    disabled: boolean;
    onSelectNext: (index: number) => void;
}) {
    // Find the next available status
    const nextIndex = currentIndex + 1;
    const hasNextStep = nextIndex < statuses.length;
    const nextStatus = hasNextStep ? statuses[nextIndex] : null;
    
    // Check if we're at the last step (pending_payment)
    const isLastStep = currentIndex === statuses.length - 1;
    const currentStatus = statuses[currentIndex];
    const isPaymentWaiting = isLastStep && currentStatus?.key === "pending_payment";

    if (isPaymentWaiting) {
        return (
            <div className="mt-6">
                <button
                    disabled
                    className="w-full flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-gray-100 px-6 py-4 text-sm text-left transition-all cursor-not-allowed"
                >
                    <span className="grid place-items-center w-9 h-9 rounded-xl border border-gray-300 bg-gray-200 text-gray-500">
                        <Icon icon="mdi:clock" className="text-lg" />
                    </span>
                    <div className="flex-1">
                        <span className="block font-semibold text-gray-500">
                            รอชำระเงิน
                        </span>
                        <span className="block text-[11px] mt-0.5 text-gray-400">
                            กำลังรอการชำระเงิน
                        </span>
                    </div>
                </button>
            </div>
        );
    }

    if (!hasNextStep || disabled) {
        return null;
    }

    return (
        <div className="mt-6">
            <button
                onClick={() => onSelectNext(nextIndex)}
                className="cursor-pointer w-full flex items-center gap-3 rounded-2xl border border-button-primary/40 bg-button-primary px-4 py-2 text-sm text-left transition-all shadow-md hover:shadow-lg hover:brightness-[1.02]"
            >
                <span className="grid place-items-center w-9 h-9 rounded-xl border border-white/30 bg-white/15">
                    <Icon icon="mdi:arrow-right-circle" className="text-lg text-white" />
                </span>
                <div className="flex-1">
                    <span className="block font-semibold text-white">
                        {nextStatus?.label}
                    </span>
                    <span className="block text-[11px] mt-0.5 text-white/90">
                        ขั้นถัดไป • กดเพื่อดำเนินการ
                    </span>
                </div>
            </button>
        </div>
    );
}
