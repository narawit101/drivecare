"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { AdminProfile } from "@/types/admin/admin"
import { AdminContextType } from "@/types/admin/adminContextType"
import { toast } from "react-toastify"
import { useRouter } from "next/navigation"

const AdminContext = createContext<AdminContextType>(null!)

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter()
    const [admin, setAdmin] = useState<AdminProfile | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                const res = await fetch("/api/admin/me", {
                    credentials: "include", // 👈 cookie JWT
                })

                if (!res.ok) throw new Error("unauthorized")

                const data = await res.json()
                setAdmin(data.data)
            } catch {
                setAdmin(null)
            } finally {
                setIsLoading(false)
            }
        }

        fetchAdmin()
    }, [])

    const logout = async () => {
        try {
            const response = await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'include',
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(data.message || "ออกจากระบบสำเร็จ")
                setAdmin(null)
                router.push("/admin/login")
            }
            else {
                toast.error("ออกจากระบบไม่สำเร็จ")
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <AdminContext.Provider value={{ admin, isLoading, logout, setAdmin }}>
            {children}
        </AdminContext.Provider>
    )
}

export const useAdmin = () => useContext(AdminContext)
