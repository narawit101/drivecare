"use client";



import React, { useCallback, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { useUser } from '@/context/UserContext';

import { toast } from "react-toastify";

import { DriverProfile } from "@/types/profile";

import { useLongdoMapDriver } from "@/services/map/useLongdoMapDriver";

import InProgressLayout from "@/components/driver/driver-job/InProgressLayout";

import UpcomingLayout from "@/components/driver/driver-job/UpcomingLayout";

import type { Job } from "@/types/driver/job";

import type { DisplayRoute, MapPoint, MapRenderRoute, RouteLabel } from "@/types/driver/route";

import { openGoogleMapsDirections } from "@/utils/google-maps";

import * as FormatDatetime from "@/utils/format-datetime";

import Pusher from "pusher-js";

import type { BookingAssignedEvent } from "@/types/realtime/pusher";



type TabGroup = "jobinprogress" | "jobupcomingwork";



export default function DriverJob() {

    const [activeTab, setActiveTab] = useState<TabGroup>("jobinprogress");

    const [jobs, setJobs] = useState<Job[]>([]);

    const currentJob = jobs[0]; // งานที่กำลังทำ (มีได้แค่งานเดียว)

    const [loading, setLoading] = useState(false);

    const { token, isLoad, userData, setUserData } = useUser();

    const { initMap, renderRoute, calculateDistance, showMyLocation, locationReady, resizeMap, currentLocationRef } = useLongdoMapDriver();

    const [mapReady, setMapReady] = useState(false);

    const router = useRouter();

    const [statusFilter, setStatusFilter] = useState<"accepted" | string>("accepted");

    const [selectedDate, setSelectedDate] = useState<string>(""); // yyyy-mm-dd

    const [currentPage, setCurrentPage] = useState(1);

    const PAGE_SIZE = 9;

    const [routeMetrics, setRouteMetrics] = useState<{ distanceKm: number; durationMin: number } | null>(null);





    useEffect(() => {

        if (!isLoad) return



        if (!token) {

            router.replace("/login")

            return

        }



        if (!userData) return // รอ fetch



        if (userData.role !== "driver") {

            router.replace("/")

        }

    }, [isLoad, token, userData])



    const driverData = userData as DriverProfile;







    useEffect(() => {

        if (!driverData) return;

        if (driverData.status === "banned") {

            toast.info("บัญชีของคุณถูกระงับ โปรดติดต่อแอดมินเพื่อขอข้อมูลเพิ่มเติม");

            router.replace("/driver-dashboard");

            return;

        }

    }, []);

    const isOparation: boolean = (

        driverData?.status === "active" &&

        driverData?.verified === "approved"

    ) ?? false;



    const fetchJobs = useCallback(async () => {

        if (!driverData?.driver_id) return;



        setLoading(true);

        try {

            const tab = activeTab === "jobinprogress" ? "current" : "upcoming";



            const res = await fetch(`/api/booking/drivers/my-job?tab=${tab}`, {

                headers: {

                    Authorization: `Bearer ${token}`,

                },

            });

            const data = (await res.json()) as { jobs?: Job[] };

             console.log("test data",data.jobs)

            setJobs(data.jobs ?? []);

        } catch (error) {

            console.error("Fetch jobs error:", error);

        } finally {

            setLoading(false);

        }

    }, [activeTab, driverData?.driver_id, token]);





    useEffect(() => {

        fetchJobs();

    }, [fetchJobs]); // เพิ่ม dependency ให้ครบ



    // Realtime: งานถูกมอบหมาย/รับงาน/ยกเลิก/อัปเดตสถานะ ให้รีเฟรชหน้านี้ทันที

    useEffect(() => {

        if (!driverData?.driver_id) return;

        if (!token) return;



        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {

            cluster: "ap1",

            authEndpoint: "/api/pusher/auth",

            auth: {

                headers: {

                    Authorization: `Bearer ${token}`,

                },

            },

        });



        const channelGlobal = pusher.subscribe("private-driver");

        const channelPersonal = pusher.subscribe(`private-driver-${driverData.driver_id}`);



        channelGlobal.bind(

            "booking.assigned",

            ({ driver_id }: BookingAssignedEvent) => {

                if (String(driver_id) !== String(driverData.driver_id)) return;

                fetchJobs();

                toast.info("คุณได้รับมอบหมายงานใหม่");

            }

        );



        channelGlobal.bind(

            "booking.accepted",

            ({ driver_id }: BookingAssignedEvent) => {

                // driver self-accept: just refresh (no "assigned" toast)

                if (String(driver_id) !== String(driverData.driver_id)) return;

                fetchJobs();

            }

        );



        channelPersonal.bind("booking-updated", (data: any) => {

            // user cancelled this job

            if (data?.type === "USER_CANCEL_BOOKING") {

                toast.info("ผู้ป่วยยกเลิกงานนี้แล้ว");

                fetchJobs();

            }



            if (data?.type === "BOOKING_DELETED") {

                toast.warning("งานนี้ถูกลบโดยแอดมิน");

                fetchJobs();

            }



            // admin status updates (optional but useful)

            if (data?.type === "ADMIN_STATUS_UPDATE") {

                fetchJobs();

            }

        });



        channelPersonal.bind("booking.reassigned", (data: any) => {

            // job reassigned to another driver

            toast.info(data?.message || "งานนี้ถูกมอบหมายให้คนขับคนอื่นแล้ว");

            fetchJobs();

        });



        return () => {

            channelGlobal.unbind_all();

            channelPersonal.unbind_all();

            pusher.unsubscribe("private-driver");

            pusher.unsubscribe(`private-driver-${driverData.driver_id}`);

            pusher.disconnect();

        };

    }, [driverData?.driver_id, fetchJobs, token]);



    useEffect(() => {

        setStatusFilter("accepted");

        setSelectedDate("");

    }, [activeTab]);



    const viewDetail = (bookingId: Job["booking_id"]) => {

        router.push(`/job-detail/${bookingId}`);

    };



    async function cancelJob(booking_id: Job["booking_id"]) {

        if (!token) return



        try {

            const res = await fetch(`/api/booking/drivers/${booking_id}/cancel-task`, {

                method: "PATCH",

                headers: {

                    "Content-Type": "application/json",

                    Authorization: `Bearer ${token}`,

                },

            })



            const data = await res.json()



            if (!res.ok) {

                toast.error(data.message || "ยกเลิกงานไม่สำเร็จ")

                return

            }



            toast.success("ยกเลิกงานและคืนงานกลับเข้าระบบเรียบร้อย")

            fetchJobs();

        } catch (error) {

            console.error(error)

            toast.error("เกิดข้อผิดพลาดในการยกเลิกงาน")

        }

    }



    const startJob = async (booking_id: Job["booking_id"]) => {

        try {

            const res = await fetch(`/api/booking/drivers/${booking_id}/start`, {

                method: "PATCH",

                headers: {

                    Authorization: `Bearer ${token}`,

                },

            });



            const data = await res.json();

           



            if (!res.ok) {

                toast.error(data.message);

                return;

            }

            toast.success(data.message);

            setActiveTab("jobinprogress");

            window.location.reload();



        } catch (err) {

            toast.error("เริ่มงานไม่สำเร็จ");

        }

    };



    const dateFilteredJobs = selectedDate

        ? jobs.filter((job) => {

            const jobDate = FormatDatetime.formatToSearchDate(job.booking_date);

            return jobDate === selectedDate;

        })

        : jobs;



    const filteredUpcomingJobs =

        statusFilter === "all"

            ? dateFilteredJobs

            : dateFilteredJobs.filter((job) => job.status === statusFilter);



    const totalPages = Math.ceil(filteredUpcomingJobs.length / PAGE_SIZE);



    const startIndex = (currentPage - 1) * PAGE_SIZE;

    const paginatedJobs = filteredUpcomingJobs.slice(

        startIndex,

        startIndex + PAGE_SIZE

    );



    useEffect(() => {

        setCurrentPage(1);

    }, [statusFilter, selectedDate]);



    const getUIRoute = (): DisplayRoute | null => {

        if (!currentJob) return null;



        const isReturn = [

            "waiting_for_return",

            "heading_home",

            "arrived_home",

            "pending_payment",

        ].includes(currentJob.status);



        return {

            startAddress: isReturn

                ? currentJob.dropoff_address   // รพ.

                : currentJob.pickup_address,   // บขส.3

            endAddress: isReturn

                ? currentJob.pickup_address    // บขส.3

                : currentJob.dropoff_address,  // รพ.

            isReturn,

        };

    };



    const getMapRoute = (): MapRenderRoute | null => {

        if (!currentJob) return null;



        if (

            currentJob.pickup_lat == null ||

            currentJob.pickup_lng == null ||

            currentJob.dropoff_lat == null ||

            currentJob.dropoff_lng == null

        ) {

            return null;

        }



        const pickup: MapPoint = {

            lat: currentJob.pickup_lat,

            lon: currentJob.pickup_lng,

        };



        const dropoff: MapPoint = {

            lat: currentJob.dropoff_lat,

            lon: currentJob.dropoff_lng,

        };





        switch (currentJob.status) {

            // 📍 เรา → จุดรับ

            // case "accepted":

            case "in_progress":

            case "going_pickup":

                if (!currentLocationRef.current) return null;

                return { start: currentLocationRef.current, end: pickup };



            // จุดรับ → รพ.

            case "picked_up":

            case "heading_to_hospital":

            case "paymented":

                return { start: pickup, end: dropoff };



            // รพ. → จุดรับ

            case "waiting_for_return":

            case "heading_home":

            case "arrived_home":

            case "pending_payment":

            case "arrived_at_hospital":

                return { start: dropoff, end: pickup };



            default:

                return null;

        }

    };



    const mapRoute = getMapRoute();



    const drawRoute = async () => {

        const route = getMapRoute();

        if (!route) return;



        renderRoute(route.start, route.end);

        const metrics = await calculateDistance(route.start, route.end);

        setRouteMetrics(metrics);



    };



    useEffect(() => {

        if (!mapReady) return;



        if (

            !locationReady &&

            (

                currentJob?.status === "in_progress" ||

                currentJob?.status === "going_pickup" ||

                currentJob?.status === "accepted"

            )

        ) {

            showMyLocation();

        }



        const timer = setTimeout(() => {

            drawRoute();

        }, 500);

        return () => clearTimeout(timer);



    }, [mapReady, currentJob?.status, currentJob?.booking_id]);



    useEffect(() => {

        setRouteMetrics(null);

    }, [activeTab, currentJob?.booking_id, currentJob?.status]);



    console.log("mapReady:", mapReady);

    console.log("jobs:", jobs);

    console.log("currentJob:", currentJob);

    console.log("currentLocation:", currentLocationRef?.current);



    // use shared openGoogleMapsDirections() utility





    useEffect(() => {

        if (activeTab === "jobinprogress") {

            setTimeout(() => {

                resizeMap();

            }, 300);

        }

    }, [activeTab]);



    useEffect(() => {

        if (activeTab !== "jobinprogress") return;

        if (!mapReady) return;



        // รอ DOM + layout เสร็จ

        const t = setTimeout(() => {

            resizeMap();

        }, 200);



        return () => clearTimeout(t);

    }, [jobs, activeTab, mapReady]);



    const getRouteLabels = (status: string): RouteLabel => {

        const beforePickup = [

            "in_progress",

            "going_pickup",

        ];



        if (beforePickup.includes(status)) {

            return {

                startLabel: "จุดรับ",

                endLabel: "จุดส่ง",

            };

        }



        return {

            startLabel: "จุดเริ่มต้น",

            endLabel: "จุดส่ง",

        };

    };





    return (

        <section className="w-full min-h-screen bg-slate-50">

            <header className="bg-white border-b border-neutral-200">

                <div className="max-w-5xl mx-auto px-8 py-4">

                    <h2 className="text-2xl text-gray-800 font-semibold">งานของฉัน</h2>

                </div>

            </header>



            <main className="max-w-5xl mx-auto p-2 sm:p-6 space-y-1">

                <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 w-full">

                    <button

                        onClick={() => setActiveTab("jobinprogress")}

                        className={`w-full px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "jobinprogress"

                            ? "bg-[#70C5BE] text-white shadow-md"

                            : "text-slate-400 hover:text-slate-600"

                            }`}

                    >

                        กำลังดำเนินการ

                    </button>

                    <button

                        onClick={() => setActiveTab("jobupcomingwork")}

                        className={`w-full px-6 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${activeTab === "jobupcomingwork"

                            ? "bg-[#70C5BE] text-white shadow-md"

                            : "text-slate-400 hover:text-slate-600"

                            }`}

                    >

                        งานของฉัน

                    </button>

                </div>

                <section className="space-y-4">

                    {loading ? (

                        <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">

                            <div className="h-9 w-9 rounded-full border-4 border-slate-200 border-t-[#70C5BE] animate-spin" />

                            <p className="text-sm">กำลังโหลดงาน...</p>

                        </div>

                    ) : (

                        <>

                            <div className={activeTab === "jobinprogress" ? "block" : "hidden"}>

                                <InProgressLayout

                                    getRouteLabels={getRouteLabels}

                                    jobs={jobs}

                                    uiRoute={getUIRoute()}

                                    mapRoute={mapRoute}

                                    routeMetrics={routeMetrics}

                                    initMap={initMap}

                                    onMapReady={() => setMapReady(true)}

                                    mapReady={mapReady}

                                    showMyLocation={showMyLocation}

                                    openGoogleMap={openGoogleMapsDirections}

                                    onViewDetail={viewDetail}

                                />

                            </div>



                            <div className={activeTab === "jobupcomingwork" ? "block" : "hidden"}>

                                <UpcomingLayout

                                    totalPages={totalPages}

                                    currentPage={currentPage}

                                    setCurrentPage={setCurrentPage}

                                    paginatedJobs={paginatedJobs}

                                    onCancelJob={cancelJob}

                                    isOparation={isOparation}

                                    allJobs={dateFilteredJobs}

                                    jobs={filteredUpcomingJobs}

                                    onStartJob={startJob}

                                    onViewDetail={viewDetail}

                                    statusFilter={statusFilter}

                                    setStatusFilter={setStatusFilter}

                                    selectedDate={selectedDate}

                                    setSelectedDate={setSelectedDate}

                                    onRefresh={() => fetchJobs()}

                                />

                            </div>

                        </>

                    )}

                </section>

            </main>

        </section>

    );

}





