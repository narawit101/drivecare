"use client"
import React, { useEffect } from 'react'
import Link from 'next/link'
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { Icon } from '@iconify/react';

export default function page() {
  const { token, isLoad, userData, logout } = useUser()
  const router = useRouter();

  useEffect(() => {
    if (!isLoad) {
      return
    }
    if (!token && !userData) {
      router.replace("/login")
    }
  }, [token, isLoad, userData]);

  const handleLogout = () => {
    logout()
    toast.success("ออกจากระบบสำเร็จ")
    router.push("/login")
  }

  const handleLogoutDriver = async () => {
    try {
      const response = await fetch('/api/driver-controller/driver-logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const data = await response.json();

      if (response.ok) {
        logout()
        toast.success(data.message || "ออกจากระบบสำเร็จ")
        router.push("/login")
      }
      else {
        toast.error("ออกจากระบบไม่สำเร็จ")
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <section className="w-full">
      <header className="border-b border-neutral-200">
        <div className="title w-full max-w-5xl mx-auto px-8 py-4">
          <h2 className="text-2xl text-gray-800 font-semibold">ตั้งค่า</h2>
        </div>
      </header>
      <main className="w-full max-w-5xl mx-auto px-8 py-4 ">
        <div className='flex flex-col gap-4'>
          {userData && (
            <>
              <section className="bg-linear-to-br from-[#70C5BE] to-[#5bb1aa] rounded-2xl p-6 shadow-lg shadow-emerald-100 text-white flex items-center gap-4">
                <div className="w-16 h-16 rounded-full border-2 border-white/50 overflow-hidden bg-white/20">
                  <img
                    src={userData?.profile_img || "/images/avatar.jpg"}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = "/images/avatar.jpg" }}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{userData?.first_name} {userData?.last_name}</h3>
                  {/* <p className="text-white/80 text-sm font-medium">
                    {userData?.role === 'driver' ? 'คนขับรถ' : 'ผู้ใช้งาน'}
                  </p> */}
                </div>
              </section>
              <section className="space-y-3">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest px-2">ตั้งค่าโปรไฟล์</p>
                <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden">
                  <Link
                    href={userData?.role === "driver" ? "/edit-profile-driver" : "/edit-profile-user"}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 text-[#70C5BE] rounded-xl">
                        <Icon icon="solar:user-circle-bold-duotone" width="24" />
                      </div>
                      <span className="font-semibold text-slate-700">แก้ไขข้อมูลโปรไฟล์</span>
                    </div>
                    <Icon icon="solar:alt-arrow-right-linear" className="text-slate-300 group-hover:text-[#70C5BE] transition-colors" width="20" />
                  </Link>
                </div>
              </section>
              <div className="pt-10 flex justify-center">
                <button
                  onClick={userData?.role === "driver" ? handleLogoutDriver : handleLogout}
                  className="flex items-center gap-2 text-slate-400 hover:text-rose-500 cursor-pointer font-bold transition-all duration-300 active:scale-95"
                >
                  <Icon icon="solar:logout-2-linear" width="24" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </section>
  )
}
