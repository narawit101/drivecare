import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'reject' | 'line';
    className?: string;
    children: React.ReactNode;
    buttonIsLoading?: boolean; // เพิ่มสถานะการโหลด
}

export default function Button({
    variant = 'primary',
    className = '',
    children,
    buttonIsLoading = false, // ค่าเริ่มต้นคือไม่โหลด
    disabled,
    ...props
}: ButtonProps) {

    const baseStyles = "flex items-center justify-center lg:p-3 p-2 rounded-xl transition-all hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-[#70C5BE] text-white hover:bg-[#5bb1aa] hover:cursor-pointer",
        secondary: "bg-white text-black border border-[#70C5BE] hover:bg-gray-100 hover:cursor-pointer",
        outline: "border-2 border-[#70C5BE] text-[#70C5BE] hover:bg-[#70C5BE] hover:text-white hover:cursor-pointer",
        danger: "bg-white-500 text-red-400 hover:bg-gray-100 border-1 border-red-500 hover:cursor-pointer",
        reject: "bg-rose-500 text-white hover:bg-rose-600 hover:cursor-pointer",
        line: "bg-green-500 text-white hover:bg-green-600 hover:cursor-pointer",
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            disabled={disabled || buttonIsLoading} // ปิดการกดถ้ากำลังโหลด
            {...props}
        >
            {/* แสดง Spinner เมื่อ isLoading เป็น true */}
            {buttonIsLoading && (
                <svg className="animate-spin  h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            )}

            {/* ข้อความบนปุ่ม */}
            <span>{buttonIsLoading ? "" : children}</span>
        </button>
    );
}