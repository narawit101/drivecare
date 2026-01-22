"use client";

import { Icon } from "@iconify/react";
import { useEscapeToClose } from "@/components/admin/common/useEscapeToClose";
import type { ReactNode } from "react";

type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmText: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmActionModal({
  open,
  title,
  description,
  confirmText,
  cancelText = "ยกเลิก",
  confirmVariant = "primary",
  onCancel,
  onConfirm,
}: ConfirmActionModalProps) {
  useEscapeToClose(open, onCancel);

  if (!open) return null;

  const confirmClassName =
    confirmVariant === "danger"
      ? "bg-rose-500 hover:bg-rose-600"
      : "bg-[#70C5BE] hover:bg-[#5fb6af]";

  const icon = confirmVariant === "danger" ? "solar:danger-triangle-linear" : "solar:shield-check-linear";
  const iconClassName = confirmVariant === "danger" ? "text-rose-500" : "text-[#70C5BE]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-in zoom-in-95">
        <div className="flex items-center gap-3 mb-4">
          <Icon icon={icon} className={`h-7 w-7 ${iconClassName}`} />
          <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
        </div>

        <div className="text-slate-600 mb-6">{description}</div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-lg px-4 py-2 text-white transition shadow cursor-pointer ${confirmClassName}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
