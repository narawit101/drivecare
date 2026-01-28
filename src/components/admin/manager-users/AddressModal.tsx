"use client";

import { Icon } from "@iconify/react";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";

type AddressModalProps = {
    address: string;
    onClose: () => void;
    title?: string;
    icon?: string;
    iconClassName?: string;
};

export default function AddressModal({
    address,
    onClose,
    title = "ที่อยู่",
    icon = "solar:home-2-linear",
    iconClassName = "text-emerald-500",
}: AddressModalProps) {
    useEscapeToClose(true, onClose);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95 duration-200">
                <div className="mb-4 flex items-center justify-between border-b pb-3">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Icon icon={icon} className={iconClassName} />
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                        <Icon icon="solar:close-circle-linear" className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                <div className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{address}</p>
                </div>
            </div>
        </div>
    );
}
