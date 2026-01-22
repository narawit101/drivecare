"use client";

import { Icon } from "@iconify/react";
import SelectDropdown from "@/components/common/SelectDropdown";

export type FilterSelectProps<T extends string> = {
    label: string;
    icon: string;
    value: T;
    options: Array<{ label: string; value: T }>;
    onChange: (value: T) => void;
};

export default function FilterSelect<T extends string>({
    label,
    icon,
    value,
    options,
    onChange,
}: FilterSelectProps<T>) {
    return (
        <label className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">
            <Icon icon={icon} className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">{label}</span>
            <SelectDropdown
                value={value}
                options={options}
                onChange={onChange}
                buttonClassName="min-w-[120px]"
            />
        </label>
    );
}
