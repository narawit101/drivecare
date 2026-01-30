"use client";

import React from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";

type Props = {
  name: string;
  phone?: string | null;
  imageSrc?: string | null;
  rightBadge?: React.ReactNode;
  className?: string;
  allergies?: string[];
  congenital_diseases: string[];
};

export default function JobPassengerCard({
  name,
  phone,
  imageSrc,
  rightBadge,
  className,
  allergies,
  congenital_diseases
}: Props) {
  return (
    <div
      className={
        "relative rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm " +
        (className ?? "")
      }
    >
      {/* rightBadge (desktop) */}
      {rightBadge ? (
        <div className="absolute top-4 right-4 hidden sm:block">
          {rightBadge}
        </div>
      ) : null}

      <div className="flex flex-col gap-6 min-w-0 w-full ">
        {/* Header */}
        <div className="flex items-start gap-4 min-w-0">
          <Image
            src={imageSrc || "/images/noprofile-avatar.jpg"}
            alt="user"
            width={56}
            height={56}
            className="rounded-full object-cover shrink-0"
          />

          <div className="flex flex-col min-w-0 gap-1 w-full">
            {/* Name + badge (mobile) */}
            <div className="flex items-center gap-2 min-w-0">
              <p className="text-lg font-bold text-gray-800 truncate max-w-[70%] sm:max-w-full">
                {name}
              </p>

              {rightBadge ? (
                <div className="sm:hidden shrink-0">
                  {rightBadge}
                </div>
              ) : null}
            </div>

            {phone ? (
              <div className="flex items-center gap-2 text-sm text-button-primary font-bold">
                <Icon
                  icon="solar:phone-linear"
                  className="w-5 h-5 shrink-0"
                />
                <span className="truncate">{phone}</span>
              </div>
            ) : null}
          </div>
        </div>

        {/* ข้อมูลผู้ป่วย */}
        <div className="flex flex-col gap-3">
          <p className="text-button-primary text-sm font-bold">
            ข้อมูลผู้ป่วยเบื้องต้น
          </p>

          <div className="flex flex-wrap gap-3">
            <div className="border border-button-primary px-2 py-1.5 text-xs text-button-primary font-bold rounded-xl bg-button-primary/10">
              โรคประจำตัว : {congenital_diseases || "-"}
            </div>

            <div className="border border-red-600 px-2 py-1.5 text-xs text-red-600 font-bold rounded-xl bg-red-600/10">
              ข้อมูลการแพ้ : {allergies || "-"}
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
