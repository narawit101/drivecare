"use client";
import { useEffect, useState } from "react";
import liff from "@line/liff";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useUser } from "@/context/UserContext";
import type { LineProfileSession } from "@/types/auth/line";

import Button from "@/components/Button";
import LineNotifyModal from "@/components/modals/LineNotifyModal";

export default function Login() {
    const [showLineNotifyModal, setShowLineNotifyModal] = useState(false);
    const router = useRouter();
    const { setUserData, setToken, token, isLoad, userData } = useUser();
    const [loading, setLoading] = useState(false);
    const LINE_LIFF_ID = process.env.NEXT_PUBLIC_LINE_LIFF_ID;
    const API_URL = process.env.NEXT_PUBLIC_API;
    const [showModal, setShowModal] = useState(false);

    const getHomePathByRole = (role?: string) => {
        if (role === "driver") return "/driver-dashboard";
        // if (role === "admin") return "/admin";
        return "/";
    };

    useEffect(() => {
        if (!LINE_LIFF_ID) {
            console.error("NEXT_PUBLIC_LINE_LIFF_ID is missing");
            return;
        }

        const initLiff = async () => {
            try {
                await liff.init({ liffId: LINE_LIFF_ID });

                //  ถ้า login แล้ว → login ต่อทันที
                if (liff.isLoggedIn() && !token) {
                    handleLogin();
                }
            } catch (err) {
                console.error("LIFF init error:", err);
            }
        };

        initLiff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isLoad) return
        if (token && userData) {
            router.replace(getHomePathByRole(userData.role))
        }
    }, [isLoad, token, userData, router])

    const handleLogin = async () => {
        setLoading(true);
        try {
            if (!liff.isLoggedIn()) {
                liff.login();
                return;
            }

            const profile = await liff.getProfile();
            console.log("LINE profile:", profile);

            const res = await fetch(`${API_URL}/auth/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ line_id: profile.userId }),
            });

            const data = await res.json();

            if (data.status === 100) {
                const lineProfile: LineProfileSession = {
                    line_id: profile.userId,
                    name: profile.displayName,
                    image: profile.pictureUrl,
                };
                sessionStorage.setItem(
                    "lineProfile",
                    JSON.stringify(lineProfile)
                );
                toast.info(data.message || "ไม่พบบัญชีผู้ใช้");
                setShowModal(true);
                return;
            }

            if (res.ok) {
                setToken(data.token);
                localStorage.setItem("token", data.token);
                const resUser = await fetch(`${API_URL}/users`, {
                    headers: { Authorization: `Bearer ${data.token}` },
                });

                if (resUser.ok) {
                    const dataUser = await resUser.json();
                    setUserData(dataUser.user);
                    toast.success(data.message || "เข้าสู่ระบบสำเร็จ");
                    router.replace(getHomePathByRole(dataUser.user?.role));
                } else {
                    toast.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
                }
            } else {
                toast.error(data.message || "เข้าสู่ระบบไม่สำเร็จ");
            }
        } catch (err) {
            toast.error("เกิดข้อผิดพลาด");
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <div className="min-h-screen w-full bg-linear-to-b from-[#70C5BE]/15 via-white to-white flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    <div className="rounded-3xl border border-white/60 bg-white/80 backdrop-blur shadow-xl p-6 sm:p-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="h-20 w-20 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                                <Image src="/images/drive_care.png" alt="logo" width={56} height={56} />
                            </div>
                            {/* <p className="mt-4 text-2xl sm:text-3xl font-extrabold text-button-primary">เข้าสู่ระบบ</p> */}
                            <p className="mt-1 text-base text-gray-500 pt-5">เข้าสู่ระบบด้วย LINE เพื่อเข้าใช้งาน</p>
                        </div>

                        <div className="mt-4 p-4">
                            <Button
                                onClick={handleLogin}
                                buttonIsLoading={loading}
                                variant="line"
                                className="w-full bg-[#06C755] text-white hover:bg-[#05B24A] rounded-md "
                            >
                                <div className="flex items-center justify-center gap-2 p-2">
                                    <Image src="/images/line-logo.png" width={44} height={44} alt="line" />
                                    <p className="font-semibold">เข้าสู่ระบบด้วย LINE</p>
                                </div>
                            </Button>

                            <div className="mt-6 flex items-center justify-center">
                                <button
                                    type="button"
                                    onClick={() => setShowLineNotifyModal(true)}
                                    className="cursor-pointer text-[#70C5BE] font-semibold flex items-center gap-2 hover:underline"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                    วิธีรับการแจ้งเตือนผ่าน LINE
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* <p className="mt-4 text-center text-xs text-gray-400">DriveCare • Secure Login</p> */}
                </div>
            </div>

            {/* ===== Modal ===== */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="w-[92%] max-w-xl rounded-3xl border border-white/60 bg-white/90 backdrop-blur p-6 sm:p-8 shadow-2xl">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xl sm:text-2xl font-extrabold text-gray-900">เรายังไม่พบบัญชีของคุณ</p>
                                <p className="text-gray-600 mt-1">คุณต้องการสมัครสมาชิกหรือไม่?</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-700"
                                aria-label="close"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Button onClick={() => router.push("/register-user")} variant="primary" className="w-full rounded-2xl">
                                <div className="flex items-center justify-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width={26} height={26} viewBox="0 0 24 24"><g fill="none" stroke="#fff" strokeWidth={1.5}><circle cx={12} cy={6} r={4}></circle><path strokeLinecap="round" d="M19.998 18q.002-.246.002-.5c0-2.485-3.582-4.5-8-4.5s-8 2.015-8 4.5S4 22 12 22c2.231 0 3.84-.157 5-.437"></path></g></svg>
                                    <div className="text-left">
                                        <p className="font-bold">ผู้ใช้ทั่วไป</p>
                                        <p className="text-xs opacity-90">สมัครสมาชิกสำหรับการจอง</p>
                                    </div>
                                </div>
                            </Button>

                            <Button onClick={() => router.push("/register-driver")} variant="secondary" className="w-full rounded-2xl">
                                <div className="flex items-center justify-center gap-3">
                                    <svg xmlns="http://www.w3.org/2000/svg" width={26} height={26} viewBox="0 0 36 36"><path fill="#000" d="M15 17h3v2h-3z"></path><path fill="#000" d="M26.45 14.17A22.1 22.1 0 0 0 19.38 7a9.64 9.64 0 0 0-9-.7a8.6 8.6 0 0 0-4.82 6.4c-.08.47-.14.92-.2 1.36A4 4 0 0 0 2 18v6.13a2 2 0 0 0 2 2V18a2 2 0 0 1 2-2h18.73A7.28 7.28 0 0 1 32 23.27V24h-2a4.53 4.53 0 1 0 .33 2H32a2 2 0 0 0 2-2v-.73a9.28 9.28 0 0 0-7.55-9.1M11 14H6.93c0-.31.09-.63.15-1A6.52 6.52 0 0 1 11 8Zm2 0V7.58a8.17 8.17 0 0 1 5.36 1.16A19 19 0 0 1 23.9 14Zm12.8 14.38a2.5 2.5 0 1 1 2.5-2.5a2.5 2.5 0 0 1-2.5 2.5"></path><path fill="#000" d="M14.17 24a4.53 4.53 0 1 0 .33 2h5.3v-.25A6 6 0 0 1 20 24ZM10 28.38a2.5 2.5 0 1 1 2.5-2.5a2.5 2.5 0 0 1-2.5 2.5"></path><path fill="none" d="M0 0h36v36H0z"></path></svg>
                                    <div className="text-left">
                                        <p className="font-bold">คนขับ</p>
                                        <p className="text-xs opacity-80">สมัครเป็นพาร์ทเนอร์</p>
                                    </div>
                                </div>
                            </Button>
                        </div>

                        <div className="mt-4 text-center">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-sm text-gray-500 hover:underline"
                            >
                                ยกเลิก
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showLineNotifyModal && (
                <LineNotifyModal open={showLineNotifyModal} onClose={() => setShowLineNotifyModal(false)} />
            )}
        </>
    );
}
