import { Job } from "@/types/driver/job";
import LongdoMap from "@/services/map/LongdoMap";
import ProcessNotice from "@/components/driver/job-detail/InProgressLayout/ProcessNotice";
import JobStatusSection from "@/components/driver/job-detail/InProgressLayout/JobStatusSection";
import MapSection from "@/components/driver/job-detail/InProgressLayout/MapSection";
import JobScheduleRouteCard from "@/components/driver/cards/JobScheduleRouteCard";
import JobPassengerCard from "@/components/driver/cards/JobPassengerCard";
import { DisplayRoute } from "@/types/driver/route";
import { MapRenderRoute } from "@/types/driver/route";
import type { MapPoint, RouteLabel } from "@/types/driver/route";


interface Props {
    job: Job;
    canProcess: boolean;
    readOnly?: boolean;

    // สำหรับแผนที่
    mapRoute: MapRenderRoute | null;

    // สำหรับแสดงผล
    displayRoute: DisplayRoute | null;

    routeMetrics?: { distanceKm: number; durationMin: number } | null;

    getRouteLabels: (status: string) => RouteLabel;

    onChangeStatus: (status: string) => void;
    onEndJob: () => Promise<void>;

    initMap: (map: string) => void;
    onMapReady: () => void;
    mapReady: boolean;
    showMyLocation: () => void;
    openGoogleMap: (start: MapPoint, end: MapPoint) => void;
}

export default function InProgressLayout(props: Props) {
    const { job, canProcess, readOnly } = props;

    return (
        <>


            <MapSection
                initMap={props.initMap}
                onMapReady={props.onMapReady}
                mapReady={props.mapReady}
                showMyLocation={props.showMyLocation}
                openGoogleMap={props.openGoogleMap}
                mapRoute={props.mapRoute}
                routeMetrics={props.routeMetrics}
            />
            <div className="flex flex-col lg:flex-row gap-4 ">
                <div className="lg:w-[67%] w-full flex flex-col gap-4">
                    {readOnly ? (
                        <div className="text-center text-gray-500 p-4 text-sm rounded-2xl bg-gray-300/30 border border-gray-100 h-130 items-center flex justify-center">
                            คุณสามารถดูรายละเอียดได้ แต่ยังไม่สามารถรายงาน/อัปเดตสถานะงานได้จนกว่าจะรับงาน
                        </div>
                    ) : (
                        !canProcess && <ProcessNotice />
                    )}
                    <JobStatusSection
                        canProcess={canProcess}
                        status={job.status}
                        onChangeStatus={props.onChangeStatus}
                        onEndJob={props.onEndJob}
                    />
                </div>
                <div className="lg:w-[33%] w-full flex flex-col gap-4 p-4 bg-white rounded-2xl">
                    <JobPassengerCard
                        name={`${job.first_name} ${job.last_name}`}
                        phone={job.phone_number}
                        imageSrc={job.profile_img}
                        allergies={job.allergies ?? []}
                        congenital_diseases={job.congenital_diseases ?? []}
                    />
                    <JobScheduleRouteCard job={job} route={props.displayRoute} getRouteLabels={props.getRouteLabels} />
                </div>
            </div>
        </>
    );
}
