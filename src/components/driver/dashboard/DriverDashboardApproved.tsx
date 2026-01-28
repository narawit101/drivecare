"use client";

import React from "react";
import { Icon } from "@iconify/react";

import JobCard from "@/components/driver/cards/JobCard";
import EmptyState from "@/components/driver/driver-job/EmptyState";
import InProgressLayout from "@/components/driver/driver-job/InProgressLayout";
import Pagination from "@/components/driver/Pagination";
import DistanceEta from "@/components/driver/DistanceEta";
import Button from "@/components/Button";

import PastDatetimeContent from "@/utils/past-datetime-content";
import * as FormatDatetime from "@/utils/format-datetime";

import type { Job } from "@/types/driver/job";
import type { DriverDashboardBooking } from "@/types/driver/dashboard";
import type { DisplayRoute, MapPoint, MapRenderRoute, RouteLabel } from "@/types/driver/route";

type Props = {
    todayThai: string;
    bookingCount: number;
    totalTrips: number;

    inProgressJobs: Job[];
    uiRoute: DisplayRoute | null;
    mapRoute: MapRenderRoute | null;
    routeMetrics: { distanceKm: number; durationMin: number } | null;
    initMap: (elementId: string) => void;
    onMapReady: () => void;
    mapReady: boolean;
    showMyLocation: () => void;
    openGoogleMap: (start: { lat: number; lon: number }, end: { lat: number; lon: number }) => void;
    onViewDetail: (bookingId: Job["booking_id"]) => void;
    getRouteLabels: (status: string) => RouteLabel;

    coords: MapPoint | null;

    openBookings: DriverDashboardBooking[];
    loadingBooking: boolean;
    currentBookings: DriverDashboardBooking[];
    currentPage: number;
    totalPages: number;
    onChangePage: (page: number) => void;

    onRefresh: () => void;
    refreshing: boolean;

    sortMode: "schedule_asc" | "created_desc";
    onChangeSortMode: (mode: "schedule_asc" | "created_desc") => void;

    onAcceptBooking: (bookingId: number) => void;
};

export default function DriverDashboardApproved({
    todayThai,
    bookingCount,
    totalTrips,
    inProgressJobs,
    uiRoute,
    mapRoute,
    routeMetrics,
    initMap,
    onMapReady,
    mapReady,
    showMyLocation,
    openGoogleMap,
    onViewDetail,
    getRouteLabels,
    coords,
    openBookings,
    loadingBooking,
    currentBookings,
    currentPage,
    totalPages,
    onChangePage,
    onRefresh,
    refreshing,
    sortMode,
    onChangeSortMode,
    onAcceptBooking,
}: Props) {
    return (
        <>
            <div className="flex flex-col gap-4 mx-auto pb-4 px-4 mb-4 w-full ">
                <section className="-mx-4 sm:mx-0">
                    <p className="text-xl  font-bold text-slate-900 mb-4">งานที่กำลังดำเนินการอยู่</p>
                    <InProgressLayout
                        getRouteLabels={getRouteLabels}
                        jobs={inProgressJobs}
                        uiRoute={uiRoute}
                        mapRoute={mapRoute}
                        routeMetrics={routeMetrics}
                        initMap={initMap}
                        onMapReady={onMapReady}
                        mapReady={mapReady}
                        showMyLocation={showMyLocation}
                        openGoogleMap={openGoogleMap}
                        onViewDetail={onViewDetail}
                    />
                </section>
                <div className="bg-white rounded-3xl shadow-[0_0_20px_rgba(120,198,160,0.3)] p-4 sm:p-6 border border-gray-100 overflow-hidden">
                    {/* <div className="flex mb-2 font-bold"> {todayThai}</div> */}
                    <div className="grid md:grid-cols-2 gap-10">
                        <div>
                            <div className=" rounded-xl bg-gray-50 border border-gray-200 p-4 hover:transition-all duration-150 hover:scale-[1.02] ">
                                <div className="flex flex-col sm:flex-row items-center justify-between">
                                    <div className="flex  items-center gap-2">
                                        <div className="bg-[#70C5BE] text-white rounded-full p-2">
                                            <Icon icon="si:book-fill" width="24" height="24" />
                                        </div>
                                        <p className="text-gray-500">รายการจองทั้งหมด</p>
                                    </div>
                                    <p className="text-center text-2xl font-bold text-button-primary">{bookingCount}</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 hover:transition-all duration-150 hover:scale-[1.02] ">
                                <div className="flex flex-col sm:flex-row items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-[#70C5BE]  text-white rounded-full p-2">
                                            <Icon icon="mingcute:car-line" width="24" height="24" />
                                        </div>
                                        <p className="text-gray-500">จำนวนงานที่ฉันรับ</p>
                                    </div>
                                    <p className="text-center text-2xl font-bold text-button-primary">{totalTrips}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mb-30">
                    <div className="flex flex-col items-center gap-2 md:items-start md:flex-row my-6 justify-center">
                        <div className="flex flex-col gap-2 items-center text-left grow">
                            <p className="font-bold text-2xl ">รายการจองทั้งหมด</p>
                            <p className="text-sm text-slate-500 ">{todayThai}</p>
                            <div className="text- flex  items-center my-2">
                                <span className="font-bold">เรียงตาม</span>
                                {/* <Icon icon="si:sort-fill" width="24" height="24" /> */}
                            </div>
                            <div className=" flex gap-4">
                                <Button
                                    type="button"
                                    variant={sortMode === "created_desc" ? "primary" : "secondary"}
                                    className="px-3 py-2 text-sm font-semibold"
                                    onClick={() => onChangeSortMode("created_desc")}
                                    aria-pressed={sortMode === "created_desc"}
                                >
                                    งานใหม่
                                </Button>
                                <Button
                                    type="button"
                                    variant={sortMode === "schedule_asc" ? "primary" : "secondary"}
                                    className="px-3 py-2 text-sm font-semibold"
                                    onClick={() => onChangeSortMode("schedule_asc")}
                                    aria-pressed={sortMode === "schedule_asc"}
                                >
                                    วัน/เวลานัด
                                </Button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onRefresh}
                                disabled={refreshing}
                                className={
                                    "bg-[#70C5BE]/20 p-2 rounded-xl transition cursor-pointer " +
                                    (refreshing ? "opacity-60 cursor-not-allowed" : "hover:bg-[#70C5BE]/30")
                                }
                                title="รีเฟรช"
                                aria-label={refreshing ? "กำลังรีเฟรช" : "รีเฟรช"}
                                aria-busy={refreshing}
                            >
                                {refreshing ? (
                                    <div className="h-6 w-6 rounded-full border-4 border-slate-200 border-t-[#70C5BE] animate-spin" />
                                ) : (
                                    <Icon
                                        icon="ic:twotone-refresh"
                                        width="24"
                                        height="24"
                                        className="text-button-primary"
                                    />
                                )}
                            </button>
                        </div>
                    </div>

                    {loadingBooking ? (
                        <div className="py-20 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full border-4 border-slate-200 border-t-[#70C5BE] animate-spin" />
                        </div>
                    ) : (
                        <>
                            {openBookings.length === 0 && (
                                <EmptyState
                                    title="ยังไม่มีงานใหม่"
                                    description="ระบบจะแสดงงานใหม่ที่เข้ามาที่นี่"
                                    className="border-slate-200"
                                />
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-2">
                                {currentBookings.map((job) => (
                                    <JobCard
                                        key={job.booking_id}
                                        className="mt-2"
                                        heightClassName="min-h-[620px]"
                                        headerLeft={
                                            <DistanceEta
                                                from={coords}
                                                to={{ lat: job.pickup_lat, lon: job.pickup_lng }}
                                                className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-1 py-2 w-full"
                                                unknownText="ยังไม่ทราบตำแหน่งปัจจุบัน"
                                            />
                                        }
                                        headerRight={
                                            <p className="text-[11px] text-gray-500">{PastDatetimeContent.getContent(job.create_at)}</p>
                                        }
                                        scheduleDate={FormatDatetime.formatThaiDate(job.booking_date)}
                                        scheduleTime={FormatDatetime.formatThaiTime(job.start_time)}
                                        pickupAddress={job.pickup_address}
                                        dropoffAddress={job.dropoff_address}
                                        passengerName={`${job.first_name} ${job.last_name}`}
                                        passengerPhone={job.phone_number}
                                        passengerImageSrc={job.profile_img}
                                        actions={
                                            <>
                                                <Button
                                                    className="w-full"
                                                    variant="primary"
                                                    onClick={() => onAcceptBooking(job.booking_id)}
                                                >
                                                    <div className="flex gap-2 justify-center items-center">
                                                        <Icon icon="fluent-mdl2:accept-medium" width="16" height="16" />
                                                        รับงาน
                                                    </div>
                                                </Button>
                                                <Button
                                                    className="w-full"
                                                    variant="secondary"
                                                    onClick={() => onViewDetail(job.booking_id)}
                                                >
                                                    <div className="flex gap-2 justify-center items-center">
                                                        <Icon icon="fluent:cursor-16-regular" width="16" height="16" />
                                                        ดูรายละเอียดงาน
                                                    </div>
                                                </Button>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() =>
                                                        openGoogleMap(
                                                            { lat: job.pickup_lat, lon: job.pickup_lng },
                                                            { lat: job.dropoff_lat, lon: job.dropoff_lng }
                                                        )
                                                    }
                                                >
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Icon icon="solar:map-outline" width="24" height="24" />
                                                        <p className="text-[14px]">เปิดใน Google Maps</p>
                                                    </div>
                                                </Button>
                                            </>
                                        }
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onChangePage={onChangePage}
                        siblingCount={2}
                        className="flex justify-center items-center gap-2 py-2 mt-4"
                    />
                </div>
            </div>
        </>
    );
}
