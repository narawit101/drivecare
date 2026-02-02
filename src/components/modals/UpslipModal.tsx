"use client";

import React, { useState, useRef } from "react";
import Button from "@/components/Button";
import { Icon } from "@iconify/react";
import Image from "next/image";

interface PaymentUploadModalProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (file: File) => void;
    bookingId?: number;
    totalPrice?: number;
}

export default function PaymentUploadModal({
    open,
    onClose,
    onSubmit,
    bookingId,
    totalPrice = 0,
}: PaymentUploadModalProps) {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!open) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirm = () => {
        if (selectedFile) {
            onSubmit(selectedFile);
        }
    };

    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/50 p-4 ">
            <div className="bg-white w-full max-w-100 h-[600px] overflow-y-auto rounded-xl p-5 shadow-2xl animate-in fade-in zoom-in duration-200 hide-scrollbar">
                <div className="text-center mb-2">
                    <h3 className="text-xl font-black text-gray-800 mb-1">แจ้งชำระเงิน</h3>
                    <p className="text-sm text-gray-400">รายการจอง : {bookingId}</p>
                </div>
                <div className="bg-[#70C5BE]/10 rounded-xl p-3 mb-4 text-center">
                    <p className="text-xs text-[#3a8b85] font-bold uppercase mb-1">ยอดชำระสุทธิ</p>
                    <p className="text-3xl font-black text-[#70C5BE]">
                        ฿ {totalPrice?.toLocaleString() ?? "0"}
                    </p>
                </div>
                <div className="bg-[#70C5BE]/10 rounded-xl p-3 mb-4 text-center group relative">
                    <p className="text-xs text-[#3a8b85] font-bold uppercase mb-1">บัญชีธนาคาร</p>

                    <div>
                        <div className="flex justify-center mb-1.5">
                        <Image src="/images/qr-payment.png" alt="qr-payment" width={200} height={200}
                        className="rounded-2xl border border-[#70C5BE]"
                        />
                        </div>
                        <p className="text-xs text-[#3a8b85] font-bold uppercase mb-1">ธนาคารกรุงไทย</p>
                        <div className="flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-transform"
                        onClick={()=>{
                            const accountNumber = "0981848532";
                            navigator.clipboard.writeText(accountNumber);
                        }}>
                            <p className="text-xs text-[#3a8b85] font-bold uppercase mb-1">เลขพร้อมเพย์ 0981848532</p>  
                            <Icon icon="solar:copy-bold-duotone" className="text-[#70C5BE] w-3 h-3 hover:text-[#3a8b85]"/>  
                        </div>
                    </div>
                </div>
                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-full aspect-video border-2 border-dashed border-gray-200 rounded-4xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-all overflow-hidden group"
                >
                    {previewUrl ? (
                        <>
                            <Image src={previewUrl} alt="Slip Preview" fill className="object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Icon icon="solar:camera-add-bold" className="text-white text-4xl" />
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                <Icon icon="solar:gallery-add-bold" className="text-3xl text-gray-300" />
                            </div>
                            <div className="text-center px-6">
                                <p className="text-sm font-bold text-gray-400">คลิกเพื่ออัปโหลดสลิป</p>
                                <p className="text-[10px] text-gray-300 mt-1">รองรับไฟล์ JPG, PNG (สูงสุด 5MB)</p>
                            </div>
                        </div>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <div className="flex gap-4 mt-8">
                    <button
                        className="flex-1 py-4 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                        onClick={() => {
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            onClose();
                        }}
                    >
                        ยกเลิก
                    </button>

                    <Button
                        className="flex-2 rounded-2xl shadow-lg shadow-[#70C5BE]/20"
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={!selectedFile}
                    >
                        <div className="flex text-sm items-center justify-center gap-2">
                            <Icon icon="solar:check-read-bold" className="text-sm" />
                            ยืนยันการชำระเงิน
                        </div>
                    </Button>
                </div>



            </div>
        </div>
    );
}