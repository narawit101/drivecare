"use client";

import Image from "next/image";
import Button from "@/components/Button";

export default function LineNotifyModal({
    open,
    onClose,
}: {
    open: boolean;
    onClose: () => void;
}) {
    if (!open) return null;

    const qrSrc = process.env.NEXT_PUBLIC_LINE_OA_QR_SRC || "";
    const oaId = process.env.NEXT_PUBLIC_LINE_OA_ID || "";

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center relative shadow-2xl">
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                    aria-label="close"
                >
                    ✕
                </button>

                <p className="text-xl font-bold text-gray-800 mb-4">รับการแจ้งเตือนผ่าน LINE</p>

                <div className="bg-gray-50 p-4 rounded-xl mb-4 flex flex-col items-center">
                    <div className="bg-white p-2 border-2 border-[#70C5BE] rounded-lg mb-3">
                        <Image
                            src={qrSrc}
                            alt="Line QR Code"
                            width={250}
                            height={250}
                        />
                    </div>
                    <p className="text-lg font-bold text-[#00b900]">{oaId}</p>
                </div>

                <div className="text-left text-sm text-gray-600 space-y-2 mb-6">
                    <p>1. สแกน QR Code หรือเพิ่มเพื่อนผ่าน ID</p>
                    <p>2. กดปุ่ม "เพิ่มเพื่อน" (Add)</p>
                    <p>3. คุณจะได้รับการแจ้งเตือนสถานะต่างๆ ผ่านช่องทางนี้</p>
                </div>

                <Button onClick={onClose} className="w-full bg-[#70C5BE] text-white rounded-xl">
                    ตกลง
                </Button>
            </div>
        </div>
    );
}
