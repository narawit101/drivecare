"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Avatar from "@/components/admin/manager-users/Avatar";
import StatusBadge from "@/components/admin/manager-users/StatusBadge";
import type { AdminUserRow, UserGroup } from "@/types/admin/manager-users";

type Props = {
    groupFilter: UserGroup;
    loading: boolean;
    users: AdminUserRow[];
    isEmpty: boolean;
    roleLabelMap: Record<string, string>;
    onOpenAddress: (address: string) => void;
    onEdit: (user: AdminUserRow) => void;
    onDelete: (userId: number, userName: string) => void;
};

export default function AdminUsersTable({
    groupFilter,
    loading,
    users,
    isEmpty,
    roleLabelMap,
    onOpenAddress,
    onEdit,
    onDelete,
}: Props) {
    const isDriverView = groupFilter === "driver";
    const columnCount = isDriverView ? 8 : 6;

    return (
        <section className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200">
                <table className="min-w-full lg:w-full divide-y divide-slate-200 text-sm" style={{ minWidth: "1150px" }}>
                    <thead className="bg-[#78C6A0] text-white uppercase tracking-wide">
                        <tr>
                            <th className="w-[300px] px-6 py-3 text-left text-xs font-semibold uppercase">ชื่อ</th>
                            <th className="w-[150px] px-6 py-3 text-left text-xs font-semibold uppercase">เบอร์โทรศัพท์</th>
                            {isDriverView && (
                                <th className="w-[200px] px-6 py-3 text-left text-xs font-semibold uppercase">การยืนยัน</th>
                            )}
                            {!isDriverView && (
                                <th className="w-[250px] px-6 py-3 text-left text-xs font-semibold uppercase">ที่อยู่</th>
                            )}
                            {isDriverView && (
                                <th className="w-[130px] px-6 py-3 text-left text-xs font-semibold uppercase">สถานะ</th>
                            )}
                            <th className="w-[120px] px-6 py-3 text-left text-xs font-semibold uppercase">บทบาท</th>
                            {isDriverView && (
                                <th className="w-[140px] px-6 py-3 text-left text-xs font-semibold uppercase">จังหวัด</th>
                            )}
                            <th className="w-[180px] px-6 py-3 text-left text-xs font-semibold uppercase">วันที่สมัคร</th>
                            <th className="w-[100px] px-6 py-3 text-center text-xs font-semibold uppercase">จัดการ</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 relative">
                        {loading && (
                            <tr>
                                <td colSpan={columnCount} className="text-center py-20">
                                    <div className="flex flex-col items-center gap-2">
                                        <Icon icon="line-md:loading-twotone-loop" className="text-3xl text-emerald-500" />
                                        <p className="text-slate-500">กำลังดึงข้อมูล...</p>
                                    </div>
                                </td>
                            </tr>
                        )}

                        {!loading && isEmpty && (
                            <tr>
                                <td colSpan={columnCount} className="px-6 py-12 text-center text-slate-500">
                                    ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่เลือก
                                </td>
                            </tr>
                        )}

                        {!loading &&
                            users.map((user) => {
                                const isDriver = user.role === "driver";

                                return (
                                    <tr key={user.id} className="hover:bg-slate-50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar path={user.avatar} name={user.name} />
                                                <span className="font-medium text-slate-800">{user.name}</span>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-slate-600">{user.phone}</td>

                                        {isDriverView && isDriver && (
                                            <td className="px-1 py-1 2xl:px-6 xl:py-4">
                                                <StatusBadge
                                                    tone={user.verification === "approved" ? "emerald" : "amber"}
                                                    text={user.verification === "approved" ? "ตรวจสอบแล้ว" : "รอตรวจสอบ"}
                                                />
                                            </td>
                                        )}

                                        {!isDriverView && user.role === "user" && (
                                            <td className="px-6 py-4 max-w-[200px]">
                                                <div className="w-full overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => onOpenAddress(user.address || "ไม่ระบุที่อยู่")}
                                                        className="block text-left text-slate-600 hover:text-[#70C5BE] hover:underline transition-all font-light"
                                                    >
                                                        {user.address || "-"}
                                                    </button>
                                                </div>
                                            </td>
                                        )}

                                        {isDriverView && isDriver && (
                                            <td className="px-6 py-4">
                                                <StatusBadge
                                                    tone={
                                                        user.status === "active"
                                                            ? "emerald"
                                                            : user.status === "inactive"
                                                                ? "slate"
                                                                : "rose"
                                                    }
                                                    text={
                                                        user.status === "active"
                                                            ? "ออนไลน์"
                                                            : user.status === "inactive"
                                                                ? "ออฟไลน์"
                                                                : "แบน"
                                                    }
                                                />
                                            </td>
                                        )}

                                        <td className="px-6 py-4 text-slate-600">{roleLabelMap[user.role]}</td>

                                        {isDriverView && isDriver && (
                                            <td className="px-6 py-4 text-slate-600">{user.city || "-"}</td>
                                        )}

                                        <td className="px-2 py-2 text-slate-600">{user.joinedAt}</td>

                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onEdit(user)}
                                                    className="inline-flex items-center justify-center rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-[#70C5BE] transition"
                                                    title="จัดการ"
                                                >
                                                    <Icon icon="solar:settings-linear" className="text-lg" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onDelete(user.id, user.name)}
                                                    className="inline-flex items-center justify-center rounded-full p-2 text-rose-500 hover:bg-rose-50 transition"
                                                    title="ลบ"
                                                >
                                                    <Icon icon="solar:trash-bin-trash-linear" className="text-lg" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
