"use client";

import React from "react";
import { Icon } from "@iconify/react";
import Image from "next/image";
import { toast } from "react-toastify";

import Button from "@/components/Button";
import * as FormatDatetime from "@/utils/format-datetime";

import EmptyState from "@/components/driver/driver-job/EmptyState";
import JobPassengerCard from "@/components/driver/cards/JobPassengerCard";
import JobScheduleRouteCard from "@/components/driver/cards/JobScheduleRouteCard";
import DriverMapWithActions from "@/components/driver/map/DriverMapWithActions";

import type { Job } from "@/types/driver/job";
import type { DisplayRoute, MapPoint, MapRenderRoute, RouteLabel } from "@/types/driver/route";

interface Props {
    jobs: Job[];
    uiRoute: DisplayRoute | null;
    mapRoute: MapRenderRoute | null;
    routeMetrics?: { distanceKm: number; durationMin: number } | null;
    initMap: (id: string) => void;
    onMapReady: () => void;
    mapReady: boolean;
    showMyLocation: () => void;
    openGoogleMap: (start: MapPoint, end: MapPoint) => void;
    onViewDetail: (id: Job["booking_id"]) => void;
    getRouteLabels: (status: string) => RouteLabel;
}

export default function InProgressLayout({
    jobs,
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
}: Props) {
    if (!jobs || jobs.length === 0) {
        return (
            <EmptyState
                title="ยังไม่มีงานที่กำลังดำเนินการ"
                description="เมื่อคุณเริ่มงานแล้ว ข้อมูลจะแสดงที่นี่"
            />
        );
    }

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "accepted":
                return { label: "รับงานแล้ว", color: "" };
            case "in_progress":
                return { label: "กำลังดำเนินงาน", color: "" };
            case "going_pickup":
                return { label: "กำลังไปรับผู้ป่วย", color: "" };
            case "picked_up":
                return { label: "รับผู้ป่วยแล้ว", color: "" };
            case "heading_to_hospital":
                return { label: "กำลังไปโรงพยาบาล", color: "" };
            case "arrived_at_hospital":
                return { label: "ถึงโรงพยาบาลแล้ว", color: "" };
            case "waiting_for_return":
                return { label: "รอรับกลับ", color: "" };
            case "heading_home":
                return { label: "กำลังเดินทางกลับ", color: "" };
            case "arrived_home":
                return { label: "ถึงบ้านแล้ว", color: "" };
            case "pending_payment":
                return { label: "รอชำระเงิน", color: "" };
            case "paymented":
                return { label: "ชำระเงินแล้ว", color: "" };
            case "success":
                return { label: "ปิดงานเรียบร้อย", color: "" };
            case "cancelled":
                return { label: "ยกเลิกแล้ว", color: "" };
            default:
                return { label: "ไม่ระบุสถานะ", color: "" };
        }
    };

    return (
        <>
            {jobs.map((job) => {
                const status = getStatusInfo(job.status);

                return (
                    <div key={job.booking_id} className="">
                        <div className="grid gap-10 pb">
                            <div className="pb-10">
                                {/* <p className="font-bold text-xl">งานที่อยู่ระหว่างการปฏิบัติงาน</p> */}

                                <div className="shadow-[0_0_10px_rgba(120,198,160,0.3)] mt-2 rounded-xl">
                                    <div className="flex flex-col gap-8 p-2 sm:p-6">
                                        <DriverMapWithActions
                                            initMap={initMap}
                                            onMapReady={onMapReady}
                                            mapReady={mapReady}
                                            showMyLocation={showMyLocation}
                                            openGoogleMap={openGoogleMap}
                                            mapRoute={mapRoute}
                                            routeMetrics={routeMetrics}
                                            wrapperClassName=""
                                            innerClassName="bg-white p-2 sm:p-4 rounded-xl shadow relative"
                                        />

                                        <div className="flex flex-col gap-6 p-2 md:p-6 bg-white rounded-2xl">
                                            <JobScheduleRouteCard
                                                job={job}
                                                route={uiRoute}
                                                getRouteLabels={getRouteLabels}
                                            />

                                            <JobPassengerCard
                                                name={`${job.first_name} ${job.last_name}`}
                                                phone={job.phone_number}
                                                imageSrc={job.profile_img}
                                                allergies={job.allergies ?? []}
                                                congenital_diseases={job.congenital_diseases ?? []}
                                                rightBadge={
                                                    <div className="px-3 py-1 rounded-lg text-[11px] font-bold shadow-sm bg-[#70C5BE]/20">
                                                        <p className="text-[#70C5BE] flex items-center justify-center">
                                                            {status.label}
                                                        </p>
                                                    </div>
                                                }
                                            />
                                        </div>

                                        <div className="flex gap-4 md:flex-row flex-col">
                                            <Button
                                                className="w-full"
                                                variant="primary"
                                                onClick={() => onViewDetail(job.booking_id)}
                                            >
                                                <div className="flex gap-2 justify-center items-center">
                                                    <Icon
                                                        icon="bi:skip-start-fill"
                                                        width="24"
                                                        height="24"
                                                    />
                                                    เข้าสู่การดำเนินงาน
                                                </div>
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </>
    );
}
