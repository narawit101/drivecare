"use client";

import { driverTermsPolicy, type PolicyDocument } from "@/constants/policy/driver-terms";
import { Icon } from "@iconify/react";
import Button from "@/components/Button";

export default function PolicyModal({
    open,
    onClose,
    policy = driverTermsPolicy,
}: {
    open: boolean;
    onClose: () => void;
    policy?: PolicyDocument;
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden">
                <div className="flex items-start justify-between gap-4 p-5 border-b border-gray-100">
                    <div>
                        <p className="text-lg sm:text-xl font-bold text-gray-900">{policy.title}</p>
                        <p className="text-xs text-gray-500 mt-1">อัปเดตล่าสุด: {policy.updatedAt}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-700 p-1"
                        aria-label="close"
                    >
                        <Icon icon="solar:close-circle-bold" className="w-7 h-7" />
                    </button>
                </div>

                <div className="p-5 max-h-[70vh] overflow-auto">
                    <p className="text-sm text-gray-700 leading-relaxed">{policy.intro}</p>

                    <div className="mt-5 space-y-4">
                        {policy.sections.map((section) => (
                            <div key={section.title} className="rounded-xl border border-gray-100 p-4">
                                <p className="font-bold text-gray-900">{section.title}</p>
                                <ul className="mt-2 list-disc pl-5 text-sm text-gray-700 space-y-1">
                                    {section.bullets.map((b) => (
                                        <li key={b}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-gray-100 flex justify-end">
                    <Button
                        type="button"
                        onClick={onClose}
                        className="bg-[#70C5BE] text-white px-4 py-2 rounded-xl hover:bg-[#5bb1aa] transition-all"
                    >
                        รับทราบ
                    </Button>
                </div>
            </div>
        </div>
    );
}
