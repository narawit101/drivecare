"use client"

import React from 'react'
import { Icon } from "@iconify/react"

interface StatusTrackerProps {
    statusList: { key: string; label: string; icon: string }[];
    currentStatus: string;
    currentStatusIndex: number;
}

const StatusTrackerCard: React.FC<StatusTrackerProps> = ({ 
    statusList, 
    currentStatus, 
    currentStatusIndex 
}) => {
    // คำนวณความกว้างของเส้น Progress (0 ถึง 100)
    const progressWidth = (currentStatusIndex / (statusList.length - 1)) * 100;

    return (
        <div className="bg-white p-6 rounded-4xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <span className="text-sm font-bold text-gray-400 tracking-widest uppercase">
                    สถานะการเดินทาง
                </span>
                <div className="px-4 py-1.5 rounded-full text-[10px] md:text-xs font-bold bg-[#70C5BE]/10 text-[#70C5BE] border border-[#70C5BE]/20 transition-all">
                    {statusList[currentStatusIndex]?.label || currentStatus}
                </div>
            </div>

            {/* Scrollable Wrapper */}
            <div className="overflow-x-auto pb-1 pt-1  px-2 scrollbar-hide">
                <div 
                    className="relative flex justify-between items-start"
                    style={{ minWidth: `${statusList.length * 85}px` }} 
                >
                    {/* เส้นเชื่อมต่อ (Background Line) - ปรับให้อยู่กึ่งกลางวงกลม (18px จากด้านบน) */}
                    <div className="absolute top-[18px] left-0 w-full h-0.5 bg-gray-100 z-0">
                        {/* เส้นสี Progress ที่วิ่งตามสถานะ */}
                        <div 
                            className="h-full bg-[#70C5BE] transition-all duration-700 ease-in-out shadow-[0_0_8px_rgba(112,197,190,0.5)]" 
                            style={{ width: `${progressWidth}%` }}
                        />
                    </div>

                    {statusList.map((s, i) => (
                        <div key={s.key} className="flex flex-col items-center flex-1 z-10">
                            {/* จุดวงกลมสถานะ */}
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                                i <= currentStatusIndex 
                                    ? 'bg-[#70C5BE] text-white shadow-lg shadow-[#70C5BE]/30 scale-110' 
                                    : 'bg-gray-100 text-gray-400'
                            }`}>
                                <Icon 
                                    icon={i < currentStatusIndex ? "solar:check-read-bold" : s.icon} 
                                    className={`${i <= currentStatusIndex ? 'animate-in zoom-in' : ''} text-xl`} 
                                />
                            </div>
                            
                            {/* ข้อความใต้จุดสถานะ */}
                            <span className={`text-[10px] mt-3 text-center leading-tight transition-all duration-500 wrap-break-word w-full px-1 ${
                                i <= currentStatusIndex ? 'text-[#70C5BE] font-bold' : 'text-gray-300'
                            }`}>
                                {s.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* บอกใบ้ว่าเลื่อนได้ */}
            <div className="mt-2 text-center md:hidden border-t border-gray-50 pt-2">
                <div className="flex items-center justify-center gap-1 text-gray-300">
                    <Icon icon="solar:double-alt-arrow-left-linear" className="animate-pulse" />
                    <p className="text-[9px] italic font-medium">ปัดเพื่อดูขั้นตอนทั้งหมด</p>
                    <Icon icon="solar:double-alt-arrow-right-linear" className="animate-pulse" />
                </div>
            </div>
        </div>
    )
}

export default StatusTrackerCard