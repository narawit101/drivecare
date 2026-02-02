"use client";

import Button from "@/components/Button";
import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAdmin } from "@/context/AdminContext";
import { Icon } from "@iconify/react";

export default function AdminLogin() {
    const { admin, setAdmin, isLoading } = useAdmin();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(false);
    const [username, setUsername] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [showPassword, setShowPassword] = useState(false);

    const isSubmitting = loading || isLoading;
    const canSubmit = useMemo(() => {
        return username.trim().length > 0 && password.trim().length > 0;
    }, [password, username]);

    useEffect(() => {
        if (!admin) return;
        if (admin) {
            router.replace('/admin')
        }
    }, [admin])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!canSubmit) return;
        setLoading(true);
        try {
            const res = await fetch('/api/auth/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_name: username, password: password }),
            })
            const data = await res.json();
            if (res.ok) {
                const resAdmin = await fetch('/api/admin/me', {
                    credentials: 'include',
                });
                if (resAdmin.ok) {
                    const adminData = await resAdmin.json();
                    setAdmin(adminData.data);
                    toast.success("เข้าสู่ระบบสำเร็จ");
                    router.replace('/admin/');
                } else {
                    const err = await resAdmin.json();
                    toast.error(err.message || "ดึงข้อมูลผู้ดูแลไม่สำเร็จ");
                }
            } else {
                toast.error(data.message);
            }

        } catch (error) {
            console.error('Login failed', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-within"
        >
            <div className="relative w-full max-w-md">
                <div className="absolute -inset-4 rounded-[28px] bg-white/25 blur-2xl" aria-hidden />

                <div className="relative rounded-[28px] bg-white/90 shadow-[0_0_30px_rgba(112,197,190,0.28)] border border-white/70 backdrop-blur p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <div className="mx-auto mb-4 h-20 w-20 rounded-xl bg-white flex items-center justify-center shadow-sm border border-slate-100 overflow-hidden">
                            <Image
                                src="/images/logo.png"
                                alt="Drive Care"
                                width={64}
                                height={64}
                                priority
                            />
                        </div>
                        <h1 className="text-2xl font-semibold text-[#70c5be]">Admin ไดฟร์ดูแล</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            เข้าสู่ระบบด้วยบัญชีผู้ดูแลของคุณ
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="username">
                                Username
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Icon icon="solar:user-linear" className="h-5 w-5" />
                                </span>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    autoComplete="username"
                                    required
                                    className="w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-3 py-2.5 text-gray-700 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1B7]/35 focus:border-[#70c5be]"
                                    placeholder="กรอก Username"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700" htmlFor="password">
                                Password
                            </label>
                            <div className="relative">
                                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                    <Icon icon="solar:lock-password-linear" className="h-5 w-5" />
                                </span>
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    className="w-full rounded-xl border border-gray-200 bg-white/80 pl-10 pr-10 py-2.5 text-gray-700 placeholder:text-gray-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#1B7]/35 focus:border-[#70c5be]"
                                    placeholder="กรอก Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                                    title={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                                >
                                    <Icon icon={showPassword ? "solar:eye-closed-linear" : "solar:eye-linear"} className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <Button
                            buttonIsLoading={isSubmitting}
                            className="w-full"
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting || !canSubmit}
                        >
                            เข้าสู่ระบบ
                        </Button>
                        <p className="text-center text-xs text-gray-500 mt-4">
                            หากลืมรหัสผ่าน โปรดติดต่อทีมพัฒนาเพื่อรีเซ็ตรหัสผ่าน
                        </p>
                    </form>
                </div>
            </div>
        </div >
    )
}
