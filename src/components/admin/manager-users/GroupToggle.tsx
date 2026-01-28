"use client";

import type { UserGroup } from "@/types/admin/manager-users";

type GroupToggleProps = {
    value: UserGroup;
    onChange: (value: UserGroup) => void;
};

export default function GroupToggle({ value, onChange }: GroupToggleProps) {
    const options: Array<{ label: string; value: UserGroup }> = [
        { label: "คนขับ", value: "driver" },
        { label: "ผู้ป่วย", value: "user" },
    ];

    return (
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
            {options.map((option) => {
                const isActive = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onChange(option.value)}
                        aria-pressed={isActive}
                        className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-[#70C5BE] text-white" : "text-slate-600 hover:text-slate-900"}`}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
