"use client";

import { useState } from "react";

type AvatarProps = {
    path: string;
    name: string;
};

export default function Avatar({ path, name }: AvatarProps) {
    const [imgError, setImgError] = useState(false);
    return (
        <div className="relative h-10 w-10 shrink-0 rounded-full overflow-hidden bg-slate-200 flex items-center justify-center border border-slate-100 shadow-sm">
            {!imgError && path && (
                <img
                    src={path}
                    alt={name}
                    className="absolute inset-0 h-full w-full object-cover z-10"
                    onError={() => setImgError(true)}
                />
            )}
            {(imgError || !path) && (
                <span className="text-sm font-semibold text-slate-500 select-none">
                    {name?.charAt(0).toUpperCase()}
                </span>
            )}
        </div>
    );
}
