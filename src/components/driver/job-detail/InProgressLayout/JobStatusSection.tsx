import JobStatusCard from "@/components/driver/job-detail/jobStatus/JobStatusCard";

export default function JobStatusSection({
    canProcess,
    status,
    onChangeStatus,
    onEndJob,
}: {
    canProcess: boolean;
    status: string;
    onChangeStatus: (status: string) => void;
    onEndJob: () => Promise<void>;
}) {
    if (!canProcess) return null;

    return (
        <JobStatusCard
            disabled={!canProcess}
            currentStatus={status}
            onChangeStatus={onChangeStatus}
            onEndJob={onEndJob}
        />
    );
}
