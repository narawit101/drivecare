"use client";
import React, { useState } from "react";
import { Icon } from "@iconify/react";
import Button from "@/components/Button";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SystemGuideModal({ open, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"user" | "driver">("user");

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] border border-white/80 animate-scale-in">
        {/* Top Accent Gradient Bar */}
        <div className="h-2 bg-linear-to-r from-[#70C5BE] to-[#4CAF50] w-full"></div>

        {/* Decorative ambient spots */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#70C5BE]/10 rounded-full blur-2xl -z-10"></div>
        <div className="absolute bottom-16 -left-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -z-10"></div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors cursor-pointer z-10"
          aria-label="close"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        {/* Modal Title */}
        <div className="px-6 pt-8 pb-4 sm:px-8">
          <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <div className="p-1.5 bg-[#70C5BE]/10 text-[#3a8b85] rounded-xl">
              <Icon icon="solar:info-circle-linear" className="text-xl" />
            </div>
            คู่มือวิธีใช้งานระบบ DriveCare
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-1.5 font-light">
            คำแนะนำขั้นตอนเบื้องต้นสำหรับการเริ่มใช้งานสำหรับผู้จองรถและผู้เดินทาง
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 sm:px-8 mb-4 flex border-b border-gray-100 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("user")}
            className={`flex-1 py-2.5 text-center text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "user"
                ? "border-[#70C5BE] text-[#3a8b85]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Icon
                icon="solar:user-hand-up-bold-duotone"
                className="text-lg"
              />
              สำหรับผู้ใช้ทั่วไป
            </div>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("driver")}
            className={`flex-1 py-2.5 text-center text-sm font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "driver"
                ? "border-[#70C5BE] text-[#3a8b85]"
                : "border-transparent text-gray-400 hover:text-gray-600"
            }`}
          >
            <div className="flex items-center justify-center gap-1.5">
              <Icon
                icon="solar:steering-wheel-bold-duotone"
                className="text-lg"
              />
              สำหรับพาร์ทเนอร์คนขับ
            </div>
          </button>
        </div>

        {/* Content Area */}
        <div className="px-6 sm:px-8 pb-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === "user" ? (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Icon
                  icon="solar:round-alt-arrow-right-bold"
                  className="text-[#70C5BE]"
                />
                4 ขั้นตอนการจองรถและเดินทางไปโรงพยาบาล:
              </p>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex gap-4 p-3 rounded-2xl bg-sky-50/40 border border-sky-100/50 hover:bg-sky-50/70 transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-sky-100/70 flex items-center justify-center text-[#3a8b85] font-bold text-sm shrink-0 shadow-sm border border-sky-200/50">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      เข้าสู่ระบบด้วย LINE & ลงทะเบียน
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      ล็อกอินง่าย ๆ ผ่าน LINE
                      จากนั้นกรอกข้อมูลพื้นฐานอย่างชื่อจริง ที่อยู่ปัจจุบัน
                      และกรอกข้อมูลสุขภาพเพื่อเตรียมพร้อมก่อนการจอง
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-3 rounded-2xl bg-sky-50/40 border border-sky-100/50 hover:bg-sky-50/70 transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-sky-100/70 flex items-center justify-center text-[#3a8b85] font-bold text-sm shrink-0 shadow-sm border border-sky-200/50">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      ทำการจองและแนบสลิปชำระเงิน
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      เลือกโรงพยาบาลปลายทาง ระบุวันเวลาที่ไปรับ
                      และทำการโอนเงินพร้อมแนบสลิปผ่านทางหน้าเว็บเพื่อรอการอนุมัติรับงาน
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-3 rounded-2xl bg-sky-50/40 border border-sky-100/50 hover:bg-sky-50/70 transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-sky-100/70 flex items-center justify-center text-[#3a8b85] font-bold text-sm shrink-0 shadow-sm border border-sky-200/50">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      ตรวจสอบข้อมูลคนขับ & เดินทาง
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      เมื่อคนขับรับงานจองแล้ว ระบบจะแสดงข้อมูลประวัติคนขับ
                      ยานพาหนะ
                      และช่วยอัปเดตการแจ้งเตือนสถานะเมื่อคนขับเดินทางมารับคุณ
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 p-3 rounded-2xl bg-sky-50/40 border border-sky-100/50 hover:bg-sky-50/70 transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-sky-100/70 flex items-center justify-center text-[#3a8b85] font-bold text-sm shrink-0 shadow-sm border border-sky-200/50">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      เปิดรับแจ้งเตือนผ่าน LINE OA
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      แนะแนวให้กดเพิ่มเพื่อนกับระบบ LINE Official Account
                      เพื่อรับข้อความแจ้งเตือนสถานะความคืบหน้าของงานโดยไม่ต้องเปิดหน้าจอเว็บค้างไว้
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-1">
                <Icon
                  icon="solar:round-alt-arrow-right-bold"
                  className="text-emerald-500"
                />
                ขั้นตอนการสมัครและทำหน้าที่ผู้ให้บริการคนขับ:
              </p>

              <div className="space-y-3">
                {/* Step 1 */}
                <div className="flex gap-4 p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100/40 hover:bg-emerald-50/50 transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100/50 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0 shadow-sm border border-emerald-200/30">
                    1
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      ส่งรูปเอกสารสมัครพาร์ทเนอร์
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      ลงทะเบียนพร้อมอัปโหลดภาพใบขับขี่ บัตรประชาชน รูปรถยนต์ และ
                      พ.ร.บ.
                      เพื่อส่งให้ผู้ดูแลระบบตรวจสอบคุณสมบัติความปลอดภัยและอนุมัติเปิดสิทธิ์
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100/40 hover:bg-emerald-50/50 transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100/50 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0 shadow-sm border border-emerald-200/30">
                    2
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      เลือกรับงานจองจราจรทางการแพทย์
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      เข้าไปยังหน้าแดชบอร์ดค้นหางานเพื่อตรวจสอบคิวงานที่ยังไม่มีคนขับรับ
                      แล้วทำรายการเลือกรับงานจองตามพื้นที่และความสะดวก
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100/40 hover:bg-emerald-50/50 transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100/50 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0 shadow-sm border border-emerald-200/30">
                    3
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      กดอัปเดตสถานะการรับส่งจริง
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      ระหว่างดำเนินงาน ให้กดปุ่มรายงานความคืบหน้า (กำลังไปรับ →
                      รับผู้ป่วย → ถึงโรงพยาบาล → รอรับกลับ → ถึงบ้าน)
                      เพื่อส่งแจ้งเตือนให้ผู้ป่วยรับทราบแบบ Real-time
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 p-3 rounded-2xl bg-emerald-50/30 border border-emerald-100/40 hover:bg-emerald-50/50 transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-emerald-100/50 flex items-center justify-center text-emerald-600 font-bold text-sm shrink-0 shadow-sm border border-emerald-200/30">
                    4
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">
                      ตรวจสอบสถิติกำไรและประวัติงาน
                    </h4>
                    <p className="text-xs text-gray-500 mt-1 font-light leading-relaxed">
                      ประวัติการปิดคิวงานเดินทางรวมถึงรายงานปัญหาที่เคยแจ้ง
                      จะถูกบันทึกไว้ในหน้าแดชบอร์ดเพื่อให้ตรวจสอบข้อมูลย้อนหลังได้ตลอดเวลา
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 sm:px-8 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <Button
            onClick={onClose}
            className="px-6 bg-[#70C5BE] text-white hover:bg-[#5bb2ab] rounded-xl text-sm font-bold py-2 shadow-md cursor-pointer transition-all"
          >
            ตกลง เข้าใจแล้ว
          </Button>
        </div>
      </div>
    </div>
  );
}
