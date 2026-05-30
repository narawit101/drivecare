"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Icon } from "@iconify/react";
import Button from "@/components/Button";
import { toast } from "react-toastify";

export default function LineNotifyModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  let qrSrc = process.env.NEXT_PUBLIC_LINE_OA_QR_SRC || "/images/qr-lineOA.png";
  if (
    qrSrc &&
    !qrSrc.startsWith("/") &&
    !qrSrc.startsWith("http://") &&
    !qrSrc.startsWith("https://")
  ) {
    qrSrc = `/${qrSrc}`;
  }
  const oaId = process.env.NEXT_PUBLIC_LINE_OA_ID || "@drivecare";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(oaId);
      setCopied(true);
      toast.success("คัดลอก LINE ID เรียบร้อยแล้ว!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("ไม่สามารถคัดลอกได้");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-sm w-full text-center relative shadow-2xl border border-white/80 overflow-hidden animate-scale-in">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-gradient-to-r from-[#70C5BE] to-[#4CAF50] w-full"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer z-10"
          aria-label="close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Header Icon & Title */}
        <div className="pt-8 pb-4 px-6">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#06C755]/10 text-[#06C755] flex items-center justify-center mb-3">
            <Icon icon="bi:line" className="text-2xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            รับแจ้งเตือนผ่าน LINE
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            รับทราบสถานะการรับส่งงานเดินทางแบบ Real-time
          </p>
        </div>

        {/* QR Code and ID Card */}
        <div className="px-6 mb-4">
          <div className="bg-gray-50/70 border border-gray-100 p-5 rounded-2xl flex flex-col items-center shadow-inner">
            {qrSrc && (
              <div className="bg-white p-3 rounded-2xl shadow-[0_4px_20px_rgba(112,197,190,0.15)] border border-[#70C5BE]/20 mb-3 transition-transform duration-300 hover:scale-102">
                <Image src={qrSrc} alt="Line QR Code" width={180} height={180} className="rounded-lg" />
              </div>
            )}
            
            {/* Copyable LINE ID Box */}
            <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-xs">
              <span className="text-sm font-bold text-[#06C755]">{oaId}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-gray-400 hover:text-[#70C5BE] transition-colors p-1 cursor-pointer"
                title="คัดลอก ID"
              >
                <Icon icon={copied ? "solar:check-read-linear" : "solar:copy-linear"} className="text-base" />
              </button>
            </div>
          </div>
        </div>

        {/* Instruction Steps */}
        <div className="px-6 text-left text-sm text-gray-600 space-y-3 mb-6">
          <div className="flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-[#06C755]/10 text-[#06C755] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              1
            </span>
            <p className="text-xs sm:text-sm text-gray-700">สแกน QR Code หรือกดคัดลอก ID เพื่อเพิ่มเพื่อน</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-[#06C755]/10 text-[#06C755] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              2
            </span>
            <p className="text-xs sm:text-sm text-gray-700">กดปุ่ม <b>เพิ่มเพื่อน (Add)</b> ในแอปพลิเคชัน LINE</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="h-5 w-5 rounded-full bg-[#06C755]/10 text-[#06C755] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
              3
            </span>
            <p className="text-xs sm:text-sm text-gray-700">เมื่อสถานะการจองขยับ ระบบจะส่งข้อความแจ้งทันที</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 pb-6">
          <Button
            onClick={onClose}
            className="w-full bg-[#70C5BE] text-white hover:bg-[#5bb2ab] rounded-xl font-bold py-2.5 transition-all shadow-md cursor-pointer"
          >
            ตกลง เข้าใจแล้ว
          </Button>
        </div>
      </div>
    </div>
  );
}
