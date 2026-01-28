"use client";

import { useState } from "react";
import { STATUS_LIST } from "@/types/driver/types";
import { StatusProgress } from "./StatusProgress";
import { StatusActions } from "./StatusActions";
import { ConfirmStatusModal } from "./ConfirmStatusModal";

export default function JobStatusCard({
    currentStatus,
    disabled,
    onChangeStatus,
    onEndJob,
}: {
    currentStatus: string;
    disabled: boolean;
    onChangeStatus: (status: string) => void;
    onEndJob: () => void;
}) {
    const isPreStep = currentStatus === "accepted" || currentStatus === "in_progress";
    const currentIndex = isPreStep ? -1 : STATUS_LIST.findIndex((s) => s.key === currentStatus);
    const [confirmIndex, setConfirmIndex] = useState<number | null>(null);

    const badgeLabel = isPreStep ? "เริ่มงานแล้ว" : (STATUS_LIST[currentIndex]?.label ?? "");

    const confirmNext = () => {
        if (confirmIndex === null) return;
        const nextKey = STATUS_LIST[confirmIndex].key;

        if (nextKey === "pending_payment") {
            onEndJob();
        } else {
            onChangeStatus(nextKey);
        }
        setConfirmIndex(null);
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg border border-button-primary/15 mb-4">
            {/* header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">สถานะงาน</p>
                    {/* <p className="text-base font-bold text-gray-800"> {STATUS_LIST[currentIndex]?.label}</p> */}
                </div>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-button-primary/10 text-button-primary border border-button-primary/20">
                    <span className="w-2 h-2 rounded-full bg-button-primary" />
                    {badgeLabel}
                </div>
            </div>

            <StatusProgress
                statuses={STATUS_LIST}
                currentIndex={currentIndex}
            />

            <StatusActions
                statuses={STATUS_LIST}
                currentIndex={currentIndex}
                disabled={disabled}
                onSelectNext={setConfirmIndex}
            />

            {confirmIndex !== null && (
                <ConfirmStatusModal
                    label={STATUS_LIST[confirmIndex].label}
                    onCancel={() => setConfirmIndex(null)}
                    onConfirm={confirmNext}
                />
            )}
        </div>
    );
}
