import { Icon } from "@iconify/react";
import * as FormatDatetime from "@/utils/format-datetime";
import { Job } from "@/types/driver/job";

export default function ScheduleAndRouteCard({
    job,
    route,
    getRouteLabels,
}: {
    job: Job;
    route: {
        startAddress: string;
        endAddress: string;
    } | null;
    getRouteLabels: (status: string) => { startLabel: string; endLabel: string };
}) {
    return (
        <div className="flex flex-col gap-4 p-4 border border-[#70C5BE] rounded-xl">
            {/* date */}
            <div className="flex gap-4 items-center">
                <div className="bg-[#70C5BE] rounded-full p-4">
                    <Icon icon="solar:calendar-bold" className="text-white" />
                </div>
                <div>
                    <p className="text-sm text-gray-500">กำหนดการ</p>
                    <div className="font-bold text-lg flex flex-col gap-2">
                        <p>  {FormatDatetime.formatThaiDate(job.booking_date)}{" "}</p>
                        <div className="flex gap-2 items-center">
                            <Icon icon="iconamoon:clock-bold" width="24" height="24" className="text-button-primary" />
                            <p className='text-button-primary'>{FormatDatetime.formatThaiTime(job.start_time)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {route && (() => {
                const { startLabel, endLabel } = getRouteLabels(job.status);

                return (
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center py-1">
                            <Icon
                                icon="solar:map-point-wave-bold"
                                className="text-[#70C5BE] w-5 h-5"
                            />
                            <div className="w-0.5 grow border-l-2 border-dashed border-gray-200 my-1" />
                            <Icon
                                icon="solar:map-point-bold"
                                className="text-gray-300 w-5 h-5"
                            />
                        </div>

                        <div className="flex flex-col gap-6">
                            <RoutePoint label={startLabel} address={route.startAddress} />
                            <RoutePoint label={endLabel} address={route.endAddress} />
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}

function RoutePoint({ label, address }: { label: string; address: string }) {
    return (
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-medium">{address}</p>
        </div>
    );
}
