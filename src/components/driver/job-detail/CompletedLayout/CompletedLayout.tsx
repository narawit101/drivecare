
"use client";

import Button from "@/components/Button";
import { useState } from "react";
import { Job } from "@/types/driver/job";
import StatusHeader from "@/components/driver/job-detail/CompletedLayout/StatusHeader";
import TimelineSection from "@/components/driver/job-detail/CompletedLayout/TimelineSection";
import TotalPriceBox from "@/components/driver/job-detail/CompletedLayout/TotalPriceBox";
import ConfirmFinishModal from "@/components/driver/job-detail/CompletedLayout/ConfirmFinishModal";
import { TimelineItemType } from "@/types/driver/timeline";


export default function CompletedLayout({
    job,
    timeline,
    onFinishJob,
}: {
    job: Job;
    timeline: TimelineItemType[];
    onFinishJob: () => void;
}) {
    const [openConfirm, setOpenConfirm] = useState(false);

    return (
        <div className="flex flex-col items-center gap-6 py-10 bg-white rounded-2xl p-6">
            <StatusHeader job={job} />

            <TimelineSection items={timeline} />

            {job.status !== "cancelled" && (
                <TotalPriceBox price={job.total_price} />
            )}

            {job.status === "paymented" && job.payment_status !== "rejected" && (
                <Button className="w-full max-w-md" onClick={() => setOpenConfirm(true)}>
                    ปิดงาน
                </Button>
            )}

            {openConfirm && (
                <ConfirmFinishModal
                    onClose={() => setOpenConfirm(false)}
                    onConfirm={() => {
                        setOpenConfirm(false);
                        onFinishJob();
                    }}
                />
            )}
        </div>
    );
}
