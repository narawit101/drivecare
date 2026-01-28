"use client";

import React from "react";
import { Icon } from "@iconify/react";

type Props = {
    verifiedLabel: string;
};

export default function DriverRejectedNotice({ verifiedLabel }: Props) {
    return (
        <div className="lg:w-5/6 mx-auto mb-4 rounded-xl border border-red-400 bg-red-50 p-4 sm:p-5">
            <div className="flex items-start gap-3">
                <Icon icon="mdi:clock-alert-outline" className="text-red-500 text-3xl mt-1" />

                <div className="flex flex-col gap-1">
                    <p className="text-sm sm:text-base text-red-800">
                        สถานะปัจจุบัน :
                        <span className="font-semibold ml-1">{verifiedLabel}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        กรุณาแก้ไขข้อมูลการยืนยันตัวตนของคุณใหม่ ตามคำแนะนำที่ส่งไปทางไลน์ของคุณ
                    </p>
                </div>
            </div>
        </div>
    );
}
