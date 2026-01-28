import Timeline from "@/components/driver/job-detail/timeline/Timeline";
import { TimelineItemType } from "@/types/driver/timeline";

export default function TimelineSection({
    items,
}: {
    items: TimelineItemType[];
}) {
    return (
        <div className="w-full max-w-md bg-gray-100 rounded-xl p-4">
            <Timeline items={items} />
        </div>
    );
}
