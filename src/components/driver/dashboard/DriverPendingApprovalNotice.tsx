"use client";

import React from "react";
import { Icon } from "@iconify/react";

type Props = {
    verifiedLabel: string;
};

export default function DriverPendingApprovalNotice({ verifiedLabel }: Props) {
    return (
        <div className="lg:w-5/6 mx-auto mb-4 rounded-xl border border-yellow-400 bg-yellow-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <Icon icon="mdi:clock-alert-outline" className="text-yellow-500 text-3xl mt-1" />

                <div className="flex flex-col gap-1">
                    <p className="text-sm sm:text-base text-yellow-800">
                        สถานะปัจจุบัน :
                        <span className="font-semibold ml-1">{verifiedLabel}</span>
                    </p>

                    <p className="text-sm text-gray-600">
                        ทีมงานกำลังตรวจสอบข้อมูลของคุณ หากผ่านการอนุมัติ คุณจะสามารถรับงานได้ทันที
                    </p>
                </div>
            </div>
        </div>
    );
}
