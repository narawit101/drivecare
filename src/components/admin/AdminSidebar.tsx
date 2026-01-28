"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";
import { sidebarMenu } from "./sidebar-menu";
import { useRouter } from "next/navigation";
import { useAdmin } from "@/context/AdminContext";


type AdminSidebarProps = {
  activeLabel?: string;
};

export function AdminSidebar({ activeLabel = "จัดการผู้ใช้" }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { admin, setAdmin, isLoading, logout } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!admin) {
      router.replace("/admin/login");
    }
  }, [admin, isLoading, router]);

  const pathname = usePathname();

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);



  const toggleSidebar = () => setIsOpen((prev) => !prev);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        onClick={toggleSidebar}
        className="fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-emerald-600 md:hidden"
        aria-expanded={isOpen}
        aria-controls="admin-sidebar"
      >
        <Icon icon="solar:hamburger-menu-linear" className="h-5 w-5" />
        <span>เมนู</span>
      </button>

      <div
        role="presentation"
        onClick={closeSidebar}
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity md:hidden ${isOpen ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
      />

      <aside
        id="admin-sidebar"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 shrink-0 flex-col justify-between border-r border-slate-200 bg-slate-50 px-6 py-8 transition-transform duration-200 ease-in-out md:sticky md:top-0 md:flex md:h-screen md:translate-x-0 md:shadow-none ${isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
          }`}
      >
        <div className="relative flex flex-col gap-8">
          <button
            type="button"
            onClick={closeSidebar}
            className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-md transition-colors hover:text-slate-700 md:hidden"
            aria-label="ปิดเมนู"
          >
            <Icon icon="solar:close-circle-linear" className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-[#70C5BE]/15 border border-[#70C5BE] grid place-items-center">
              <Icon icon="eos-icons:admin" width="24" height="24" className="text-emerald-600" />
            </div>

            <div className="flex flex-col">
              <span className="text-base font-semibold text-slate-800">{admin?.user_name}</span>
              <span className="text-sm text-slate-500">{admin?.role}</span>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            {sidebarMenu.map((item, index) => {
              // 🔹 SECTION (หัวข้อ + hr)
              if (item.type === "section") {
                return (
                  <div key={`section-${index}`} className="mt-4 mb-2">
                    <hr className="mb-2 border-slate-300" />
                    <p className="px-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {item.title}
                    </p>
                  </div>
                );
              }

              // 🔹 ITEM (เมนูปกติ)
              const isActive = item.label === activeLabel;

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors
          ${isActive
                      ? "bg-emerald-50 text-button-primary "
                      : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <Icon icon={item.icon} className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

        </div>

        <button
          onClick={logout}
          type="button"
          className="hover:text-red-600 cursor-pointer text-center justify-center flex items-center gap-3 rounded-full bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors duration-150 shadow-md hover:bg-red-100"
        >
          <Icon icon="solar:logout-3-linear" className="h-5 w-5 hover: " />
          <span>ออกจากระบบ</span>
        </button>
      </aside>
    </>
  );
}

export default AdminSidebar;
