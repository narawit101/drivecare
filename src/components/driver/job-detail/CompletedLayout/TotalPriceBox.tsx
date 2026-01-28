export default function TotalPriceBox({ price }: { price: string }) {
    return (
        <div className="w-full max-w-md flex justify-between bg-gray-100 px-4 py-3 rounded-xl">
            <p className="font-medium text-[#70C5BE]">ค่าตอบแทนทั้งหมด</p>
            <p className="font-bold text-[#70C5BE]">฿ {price} บาท</p>
        </div>
    );
}
