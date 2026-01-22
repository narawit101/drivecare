import Button from "@/components/Button";

export default function ConfirmFinishModal({
    onConfirm,
    onClose,
}: {
    onConfirm: () => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-500 px-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-sm space-y-4">
                <h3 className="font-bold text-lg text-center">ยืนยันปิดงาน</h3>
                <p className="text-center text-gray-600">
                    เมื่อปิดงานแล้ว จะไม่สามารถแก้ไขข้อมูลได้
                </p>
                <div className="flex gap-3">
                    <Button variant="secondary" className="w-full" onClick={onClose}>
                        ยกเลิก
                    </Button>
                    <Button className="w-full" onClick={onConfirm}>
                        ยืนยัน
                    </Button>
                </div>
            </div>
        </div>
    );
}
