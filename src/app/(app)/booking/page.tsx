"use client"
import React, { Suspense, useEffect, useState } from 'react'
import { toast } from "react-toastify";
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LongdoMap from "@/services/map/LongdoMap";
import PlaceSearch from "@/services/map/PlaceSearch";
import { Locations } from "@/services/map/location";
import { useLongdoMap } from "@/services/map/useLongdoMap";
import { getAddressFromCoords, fetchNearbyHospitals } from '@/services/้hospital/get-near-find'
import { useSearchParams } from 'next/navigation';

function BookingPageInner() {
    const router = useRouter();
    const { token, isLoad, userData } = useUser();
    const searchParams = useSearchParams();
    const [pickup, setPickup] = useState<Locations | null>(null);
    const [dropoff, setDropoff] = useState<Locations | null>(null);
    const [bookingDate, setBookingDate] = useState("");
    const [startTime, setStartTime] = useState("");
    const [loading, setLoading] = useState(false);
    const [isMapReady, setIsMapReady] = useState(false);
    const [minTime, setMinTime] = useState("");

    const { initMap, mapRef, renderRoute } = useLongdoMap();

    const handleInitMap = (map: any) => {
        initMap(map);
        setIsMapReady(true);
    };

    // เช็คสิทธิ์การเข้าใช้งาน
    useEffect(() => {
        if (!isLoad) return;
        if (!token && !userData) {
            router.replace("/login");
        }
    }, [token, isLoad, userData]);

    useEffect(() => {
        const pAddr = searchParams.get('pickup');
        const pLat = searchParams.get('p_lat');
        const pLon = searchParams.get('p_lon');

        const dAddr = searchParams.get('dropoff');
        const dLat = searchParams.get('d_lat');
        const dLon = searchParams.get('d_lon');

        if (pAddr && pLat && pLon) {
            setPickup({
                address: pAddr,
                lat: parseFloat(pLat),
                lon: parseFloat(pLon)
            });
        }

        if (dAddr && dLat && dLon) {
            setDropoff({
                address: dAddr,
                lat: parseFloat(dLat),
                lon: parseFloat(dLon)
            })
        }

    }, [searchParams])

    // วาดเส้นทางเมื่อมีทั้งจุดรับและจุดส่ง
    useEffect(() => {
        if (isMapReady && pickup && dropoff && mapRef.current) {
            renderRoute(pickup, dropoff);
        }
    }, [pickup, dropoff, mapRef.current, isMapReady]);

    // อัปเดต min time เมื่อเลือกวันที่
    useEffect(() => {
        if (!bookingDate) {
            setMinTime("");
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        if (bookingDate === today) {
            // ถ้าเลือกวันนี้ ให้เวลาเริ่มต้นเป็นเวลาปัจจุบัน + 30 นาที
            const now = new Date();
            now.setMinutes(now.getMinutes() + 30);
            const minTimeStr = now.toTimeString().slice(0, 5); // HH:MM
            setMinTime(minTimeStr);
        } else {
            setMinTime("");
        }
    }, [bookingDate]);

    const handleBooking = async () => {
        if (!pickup || !dropoff || !bookingDate || !startTime) {
            toast.warn("กรุณากรอกข้อมูลให้ครบถ้วน");
            return;
        }

        setLoading(true);
        try {
            const combinedTimestamp = `${bookingDate}T${startTime}`;
            const payload = {
                booking_date: bookingDate,
                start_time: combinedTimestamp,
                pickup_address: pickup.address,
                pickup_lat: pickup.lat,
                pickup_lng: pickup.lon,
                dropoff_address: dropoff.address,
                dropoff_lat: dropoff.lat,
                dropoff_lng: dropoff.lon
            };

            const response = await fetch('/api/booking/users/comfirm-booking', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("จองสำเร็จ!");
                router.push("/")
            } else {
                console.log("error",data.message)
                toast.error(data.message || "เกิดข้อผิดพลาด");
            }
        } catch (error) {
            console.log(error)
            toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
        } finally {
            setLoading(false);
        }
    };

    const handleCurrentLocation = () => {
        if (!navigator.geolocation) return toast.error("GPS ไม่ทำงาน");

        setLoading(true);
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const addressName = await getAddressFromCoords(latitude, longitude);

            const currentLoc = {
                address: addressName,
                lat: latitude,
                lon: longitude,
            };
            setPickup(currentLoc);

            if (mapRef.current) {
                mapRef.current.location({ lon: longitude, lat: latitude }, true);
                mapRef.current.zoom(10);
            }

            setLoading(false);
            toast.success("ระบุตำแหน่งปัจจุบันเรียบร้อย");
        }, (err) => {
            setLoading(false);
            toast.error("กรุณาเปิดสิทธิ์เข้าถึงพิกัด");
        });
    };

    return (
        <section className="w-full bg-gray-50 min-h-screen pb-24">
            <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
                <div className="max-w-5xl mx-auto px-6 py-4">
                    <h2 className="text-xl font-bold text-gray-800">จองบริการรถรับส่ง</h2>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-6 py-6 space-y-6">
                {/* แผนที่ */}
                <div className="rounded-2xl overflow-hidden shadow-lg border border-[#70C5BE] bg-white h-[350px]   ">
                    <LongdoMap initMap={handleInitMap} />
                </div>

                <div className=" flex flex-col">
                    {/* ส่วนค้นหาสถานที่ */}
                    <div className="space-y-4 bg-white rounded-2xl py-3 shadow-sm">
                        {/* จุดรับ */}
                        <div className="px-5">
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-bold text-gray-700">จุดรับ</label>
                                <button
                                    onClick={handleCurrentLocation}
                                    className="text-xs flex items-center gap-1 text-[#70C5BE] hover:text-blue-800 font-semibold"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
                                    ใช้ตำแหน่งปัจจุบัน
                                </button>
                            </div>
                            <PlaceSearch
                                label=""
                                value={pickup?.address || ""}
                                onSelect={(loc: Locations) => {
                                    setPickup(loc);
                                    if (mapRef.current) {
                                        mapRef.current.location({ lon: loc.lon, lat: loc.lat }, true); 
                                        mapRef.current.zoom(15); 
                                    }
                                }}
                            />
                            {pickup &&(
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#70C5BE] bg-green-50 p-2 rounded-lg border border-green-100">
                                    <span className="">ยืนยันแล้ว:</span> {pickup.address}
                                </div>
                            ) 
                        }
                        </div>

                        {/* โรงพยาบาล (พิมพ์ค้นหาแบบจำกัดระยะ) */}
                        <div className="px-5 ">
                            {!pickup ? (
                                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 italic">
                                    กรุณาเลือกจุดรับก่อน เพื่อค้นหาโรงพยาบาลในพื้นที่
                                </div>
                            ) : (
                                <div className="  rounded-xl shadow-sm ">
                                    <PlaceSearch
                                        label="เลือกโรงพยาบาล"
                                        value={dropoff?.address || ""}
                                        isHospitalSearch
                                        nearby={pickup ? { lat: pickup.lat, lon: pickup.lon } : undefined}
                                        onSelect={(loc) => {
                                            setDropoff(loc);
                                            if (mapRef.current) {
                                                mapRef.current.location({ lon: loc.lon, lat: loc.lat }, true);
                                                mapRef.current.zoom(15);
                                            }
                                        }}
                                    />

                                    {!pickup && (
                                        <p className="text-[10px] text-amber-500 mt-1 italic">* กรุณาเลือกจุดรับก่อนค้นหาโรงพยาบาล</p>
                                    )}
                                </div>
                            )}

                            {dropoff && (
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-[#70C5BE] bg-green-50 p-2 rounded-lg border border-green-100">
                                    <span className="">ยืนยันแล้ว:</span> {dropoff.address}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ส่วนเลือกวันเวลา */}
                    <div className="bg-white mt-6 px-5 py-5 rounded-2xl flex flex-col justify-center space-y-5 shadow-sm">
                        <h3 className="font-bold text-gray-800 ">นัดหมายการเดินทาง</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">วันที่ต้องการไป</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#70C5BE] outline-none pr-5 text-xs"
                                    onChange={(e) => setBookingDate(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">เวลานัดหมาย</label>
                                <input
                                    type="time"
                                    min={minTime}
                                    className="w-full p-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-[#70C5BE] outline-none pr-5 text-xs"
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleBooking}
                    disabled={loading || !dropoff}
                    className={`w-full py-2 rounded-2xl text-white font-bold text-sm transition-all  active:scale-95 ${loading || !dropoff ? 'bg-gray-200 cursor-not-allowed' : 'bg-[#70C5BE] hover:bg-[#3a8b85]'
                        }`}
                >
                    {loading ? "กำลังจอง..." : "ยืนยันการจอง"}
                </button>
            </main>
        </section>
    );
}

export default function BookingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
            <BookingPageInner />
        </Suspense>
    );
}