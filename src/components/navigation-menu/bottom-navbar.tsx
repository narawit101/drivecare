"use client"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { usePathname } from "next/navigation"
import { routesMenu } from "./nav-menu"
import { useUser } from "@/context/UserContext"

export default function BottomNavbar() {
    const pathname = usePathname()
    const { userData } = useUser()

    // 1. ฟังก์ชันสำหรับเลือก Path ให้เหมาะสมกับ Role
    const getCorrectPath = (label: string, defaultHref: string) => {
        if (userData?.role === "driver") {
            if (label === "Home") return "/driver-dashboard"
            if (label === "Booking") return "/driver-job" // เปลี่ยนหน้าจองเป็นหน้างานของฉันสำหรับคนขับ
        }
        return defaultHref
    }

    // 2. ฟังก์ชันสำหรับเลือก Title ให้เหมาะสมกับ Role
    const getCorrectTitle = (label: string, defaultTitle: string) => {
        if (userData?.role === "driver" && label === "Booking") {
            return "งานของฉัน" // เปลี่ยนชื่อเมนู "จอง" เป็น "งานของฉัน"
        }
        return defaultTitle
    }

    const isActive = (targetLabel: string, targetHref: string) => {
        const actualPath = getCorrectPath(targetLabel, targetHref)
        if (actualPath === "/") return pathname === "/"
        return pathname.startsWith(actualPath)
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-md border-t border-neutral-100 w-full flex justify-center z-99">
            <div className="flex justify-between items-center max-w-5xl px-8 py-4 w-full ">
                {routesMenu.map((route) => {
                    // กำหนดค่า Href และ Title ตาม Role
                    const finalHref = getCorrectPath(route.label, route.href)
                    const finalTitle = getCorrectTitle(route.label, route.title)

                    return (
                        <Link
                            href={finalHref}
                            key={route.label}
                            className={`flex flex-col items-center gap-1 transition-colors ${isActive(route.label, route.href)
                                ? "text-[#70C5BE]"
                                : "text-gray-400"
                                }`}
                        >
                            <Icon icon={route.icon} className="w-6 h-6" />
                            <span className="text-[10px] font-medium">{finalTitle}</span>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}