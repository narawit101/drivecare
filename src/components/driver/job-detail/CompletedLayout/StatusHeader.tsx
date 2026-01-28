import { Icon } from "@iconify/react";
import { Job } from "@/types/driver/job";

export default function StatusHeader({ job }: { job: Job }) {
    if (job.status === "paymented" && job.payment_status === "waiting_verify") {
        return (
            <>
                <Circle border="amber" icon="uiw:pay" />
                <Text color="amber">รอการยืนยันการชำระเงิน</Text>
            </>
        );
    }

    if (job.status === "paymented" && job.payment_status === "verified") {
        return (
            <>
                <Circle border="emerald" icon="mdi:check-circle-outline" />
                <Text color="emerald">ยืนยันการชำระเงินเรียบร้อย</Text>
            </>
        );
    }

    if (job.status === "paymented" && job.payment_status === "rejected") {
        return (
            <>
                <Circle border="red" icon="mdi:close-circle-outline" />
                <Text color="red">การชำระเงินถูกปฏิเสธโดยแอดมิน</Text>
            </>
        );
    }

    if (job.status === "success") {
        return (
            <>
                <Circle border="primary" icon="mdi:check" />
                <Text color="primary">งานเสร็จสมบูรณ์แล้ว</Text>
            </>
        );
    }

    if (job.status === "cancelled") {
        return (
            <>
                <Circle border="red" icon="mdi:cancel" />
                <Text color="red">งานถูกยกเลิก</Text>
            </>
        );
    }

    return null;
}

/* ---------- helper ---------- */

function Circle({
    icon,
    border,
}: {
    icon: string;
    border: "amber" | "emerald" | "red" | "primary";
}) {
    const colorMap = {
        amber: "border-amber-400 text-amber-300",
        emerald: "border-emerald-400 text-emerald-300",
        red: "border-red-400 text-red-400",
        primary: "border-[#70C5BE] text-[#70C5BE]",
    };

    return (
        <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center ${colorMap[border]}`}>
            <Icon icon={icon} className="text-4xl" />
        </div>
    );
}

function Text({
    children,
    color,
}: {
    children: React.ReactNode;
    color: "amber" | "emerald" | "red" | "primary";
}) {
    const colorMap = {
        amber: "text-amber-400",
        emerald: "text-emerald-400",
        red: "text-red-400",
        primary: "text-[#70C5BE]",
    };

    return (
        <p className={`text-lg font-medium ${colorMap[color]}`}>
            {children}
        </p>
    );
}
