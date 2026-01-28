import Image from "next/image";
import { Icon } from "@iconify/react";
import { Job } from "@/types/driver/job";

export default function PatientInfoCard({ job }: { job: Job }) {
    return (
        <div className="flex gap-4 items-center p-4 border border-[#70C5BE] rounded-xl">
            <Image
                src={job.profile_img || "/images/noprofile-avatar.jpg"}
                width={64}
                height={64}
                className="rounded-full object-cover"
                alt=""
            />
            <div className="flex w-full flex-col gap-2">
                <div>
                    <p className="text-xl font-bold">
                        {job.first_name} {job.last_name}
                    </p>
                </div>
                <div className="flex gap-2 items-center text-button-primary font-bold">
                    {job.phone_number}
                    {/* <Icon icon="solar:phone-linear" /> */}
                </div>
            </div>
        </div>
    );
}
