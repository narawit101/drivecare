"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { AnyUserProfile } from "@/types/profile"
import { UserContextType } from "@/types/useContextType"

const UserContext = createContext<UserContextType>(null!)

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [token, setToken] = useState<string | null>(null)
    const [userData, setUserData] = useState<AnyUserProfile | null>(null)
    const [isLoad, setIsLoad] = useState(false)

    const API_URL = process.env.NEXT_PUBLIC_API || "/api"

    // 1️⃣ โหลด token
    // 1️⃣ โหลด token ครั้งแรก
    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            setToken(token)
            setIsLoad(false) // 👈 สำคัญ
        } else {
            setIsLoad(true)
        }
    }, [])



    useEffect(() => {
        if (!token) return

        setIsLoad(false) // 👈 เริ่มโหลด user ใหม่ทุกครั้งที่ token เปลี่ยน

        const fetchUser = async () => {
            try {
                const res = await fetch(`${API_URL}/users`, {
                    headers: { Authorization: `Bearer ${token}` }
                })

                if (!res.ok) throw new Error("unauthorized")

                const data = await res.json()
                setUserData(data.user)
            } catch {
                localStorage.removeItem("token")
                setToken(null)
                setUserData(null)
            } finally {
                setIsLoad(true) // ✅ load เสร็จจริง
            }
        }

        fetchUser()
    }, [token])



    const logout = () => {
        localStorage.removeItem("token")
        localStorage.clear()
        setToken(null)
        setUserData(null)
        setIsLoad(true)
    }

    return (
        <UserContext.Provider value={{ token, setToken, userData, setUserData, isLoad, logout }}>
            {children}
        </UserContext.Provider>
    )
}

export const useUser = () => useContext(UserContext)
