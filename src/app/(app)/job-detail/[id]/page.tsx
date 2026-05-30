"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Icon } from "@iconify/react";
import { toast } from "react-toastify";
import { useUser } from "@/context/UserContext";
import { DriverProfile } from "@/types/profile";
import Pusher from "pusher-js";
import { useLongdoMapDriver } from "@/services/map/useLongdoMapDriver";
import ReportModal from "@/components/modals/ReportModal";
import { DRIVER_REPORT_TYPES } from "@/constants/reports/report-types";
import CompletedLayout from "@/components/driver/job-detail/CompletedLayout/CompletedLayout";
import InProgressLayout from "@/components/driver/job-detail/InProgressLayout/InProgressLayout";
import { TimelineItemType } from "@/types/driver/timeline";
import { Job } from "@/types/driver/job";
import { openGoogleMapsDirections } from "@/utils/google-maps";

export default function JobDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { token, isLoad, userData } = useUser();
  const [timeline, setTimeline] = useState<TimelineItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [canProcess, setCanProcess] = useState(false);
  const [hasDriverReported, setHasDriverReported] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const {
    initMap,
    renderRoute,
    showMyLocation,
    currentLocationRef,
    calculateDistance,
  } = useLongdoMapDriver();
  const [mapReady, setMapReady] = useState(false);
  const [routeMetrics, setRouteMetrics] = useState<{
    distanceKm: number;
    durationMin: number;
  } | null>(null);
  const [openReportModal, setOpenReportModal] = useState(false);
  const [reportType, setReportType] = useState("");
  const [message, setMessage] = useState("");

  // ตรวจสอบ authentication และสถานะบัญชี
  const driver = userData as DriverProfile;

  useEffect(() => {
    // 1. รอให้ UserContext โหลดเสร็จก่อน
    if (!isLoad) return;

    // 2. ถ้าไม่มี Token ให้ไปหน้า Login
    if (!token) {
      router.replace("/login");
      return;
    }

    // 3. ถ้าโหลดข้อมูล User มาได้แล้ว
    if (userData) {
      // เช็ค Role ถ้าไม่ใช่ driver ให้ดีดออก
      if (userData.role !== "driver") {
        router.replace("/");
        return;
      }

      // 4. เช็คสถานะ Banned (ใช้ userData โดยตรงเพื่อความชัวร์)
      if (driver.status !== "active") {
        toast.info("บัญชีของคุณไม่ออนไลน์ในขณะนี้");
        router.replace("/driver-dashboard"); // หรือหน้าอื่นที่คุณต้องการ
      }
      if (driver.verified !== "approved") {
        toast.info("โปรไฟล์ของคุณยังไม่ผ่านการอนุมัติ");
        router.replace("/driver-dashboard");
      }
    }
  }, [isLoad, token, userData, router]); // ใส่ Dependency ให้ครบ

  const fetchJob = useCallback(async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(
        `/api/booking/drivers/my-job-detail?booking_id=${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await res.json();
      console.log(data);

      if (!res.ok) {
        toast.error(data.message);
        return;
      }

      setJob(data.job || []);

      setCanProcess(data.canProcess);
      setHasDriverReported(data.hasDriverReported);
      setReadOnly(Boolean(data.readOnly));
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  const getRoutePoints = () => {
    if (!job) return null;

    const isReturn = isReturnStatus(job.status);

    return {
      isReturn,
      startAddress: isReturn
        ? job.dropoff_address // รพ.
        : job.pickup_address, // บขส.
      endAddress: isReturn
        ? job.pickup_address // บขส.
        : job.dropoff_address, // รพ.
    };
  };

  const isReturnStatus = (status: string) =>
    [
      "waiting_for_return",
      "heading_home",
      "arrived_home",
      "pending_payment",
    ].includes(status);

  const getMapRoute = () => {
    if (!job) return null;

    const isGoingPickup =
      job.status === "accepted" ||
      job.status === "in_progress" ||
      job.status === "going_pickup";

    const isReturn = isReturnStatus(job.status);

    // 🟢 in_progress / going_pickup
    // 📍 ตำแหน่งปัจจุบัน → จุดรับ (บขส.3)
    if (isGoingPickup) {
      if (!currentLocationRef.current) return null;
      console.log("CURRENT LOC:", currentLocationRef.current);
      return {
        start: currentLocationRef.current,
        end: {
          lat: job.pickup_lat!,
          lon: job.pickup_lng!,
        },
      };
    }

    // 🔁 logic เดิม
    return {
      start: isReturn
        ? { lat: job.dropoff_lat!, lon: job.dropoff_lng! } // รพ.
        : { lat: job.pickup_lat!, lon: job.pickup_lng! }, // บขส.
      end: isReturn
        ? { lat: job.pickup_lat!, lon: job.pickup_lng! } // บขส.
        : { lat: job.dropoff_lat!, lon: job.dropoff_lng! }, // รพ.
    };
  };

  const drawRoute = async () => {
    const route = getMapRoute();
    if (!route) return;

    renderRoute(route.start, route.end);
    const metrics = await calculateDistance(route.start, route.end);
    setRouteMetrics(metrics);
  };

  useEffect(() => {
    if (!mapReady || !job) return;
    if (
      job.status === "in_progress" ||
      job.status === "going_pickup" ||
      job.status === "accepted"
    ) {
      showMyLocation();
    }
    // 🔥 หน่วง 300–500ms ให้ Longdo Route พร้อม
    const timer = setTimeout(() => {
      drawRoute();
    }, 400);
    return () => clearTimeout(timer);
  }, [mapReady, job?.booking_id, job?.status]); // เพิ่ม booking_id เผื่อเปลี่ยนหน้างาน

  useEffect(() => {
    setRouteMetrics(null);
  }, [job?.booking_id, job?.status]);

  const routePoints = getRoutePoints();

  const fetchTimeline = useCallback(async () => {
    if (!token || !id) return;

    try {
      const res = await fetch(`/api/booking/drivers/${id}/log-time-line`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "โหลด timeline ไม่สำเร็จ");
        return;
      }

      setTimeline(data.timeline);
    } catch (err) {
      console.error(err);
      toast.error("โหลด timeline ล้มเหลว");
    }
  }, [id, token]);

  useEffect(() => {
    if (!driver?.driver_id) return;
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

    const channel = pusher.subscribe(`private-driver-${driver?.driver_id}`);

    channel.bind("booking-updated", (data: any) => {
      if (data?.booking_id != null && String(data.booking_id) !== String(id))
        return;
      if (data.type === "USER_SUBMIT_SLIP") {
        toast.success("ผู้ป่วยชำระเงินเรียบร้อยแล้ว");
        console.log("REALTIME:", data);
        fetchJob();
        fetchTimeline();
      }
      if (data.type === "USER_CANCEL_BOOKING") {
        console.log("REALTIME:", data);
        toast.info("ผู้ป่วยยกเลิกงานนี้แล้ว");
        fetchJob();
        fetchTimeline();
      }
      if (data.type === "ADMIN_VERIFY_PAYMENT") {
        toast.success("แอดมินยืนยันการชำระเงินเรียบร้อยแล้ว");
        console.log("REALTIME:", data);
        fetchJob();
        fetchTimeline();
      }
      if (data.type === "ADMIN_REJECT_PAYMENT") {
        toast.warning("แอดมินปฏิเสธการชำระเงิน");
        console.log("REALTIME:", data);
        fetchJob();
        fetchTimeline();
      }

      if (data.type === "ADMIN_STATUS_UPDATE") {
        toast.info("แอดมินอัปเดตสถานะงานแล้ว");
        console.log("REALTIME:", data);
        fetchJob();
        fetchTimeline();
      }

      if (data.type === "DRIVER_ACCEPT_JOB") {
        toast.success("รับงานเรียบร้อย");
        console.log("REALTIME:", data);
        fetchJob();
        fetchTimeline();
      }
    });

    channel.bind("report-created", (data: any) => {
      if (data.type === "REPORT_FROM_USER") {
        toast.info("ผู้ป่วยได้รายงานปัญหางานนี้");
        fetchJob();
        fetchTimeline();
      }
      if (data.type === "ADMIN_REPLY_REPORT") {
        toast.info("แอดมินได้ตอบกลับรายงานของคุณแล้ว");
        fetchJob();
        fetchTimeline();
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`private-driver-${driver?.driver_id}`);
      pusher.disconnect();
    };
  }, [driver?.driver_id, token, id, fetchJob, fetchTimeline]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  async function updateJobStatus(newStatus: string) {
    if (!token || !job) return;

    try {
      const res = await fetch(`/api/booking/drivers/${job.booking_id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "อัปเดตสถานะไม่สำเร็จ");
        if (res.status === 429) {
          router.replace("/driver-job");
        }
        return;
      }

      toast.success("อัปเดตสถานะสำเร็จ");

      // ✅ อัปเดต job ในหน้า
      setJob((prev) => (prev ? { ...prev, status: data.status } : prev));
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาด");
    }
  }

  async function endJob() {
    if (!token || !job) return;

    try {
      const res = await fetch(`/api/booking/drivers/${job.booking_id}/end`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "ปิดงานไม่สำเร็จ");
        return;
      }

      toast.success(data.message || "รอชำระเงินเรียบร้อย");

      // อัปเดตสถานะหน้า UI
      setJob((prev) => (prev ? { ...prev, status: "pending_payment" } : prev));
    } catch (error) {
      console.error(error);
      toast.error("เกิดข้อผิดพลาด");
    }
  }

  async function finishJob() {
    if (!token || !job) return;

    try {
      const res = await fetch(`/api/booking/drivers/${job.booking_id}/finish`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "ปิดงานไม่สำเร็จ");
        return;
      }

      toast.success("ปิดงานเรียบร้อย");

      // อัปเดตสถานะหน้า UI
      setJob((prev) => (prev ? { ...prev, status: "success" } : prev));
      await fetchTimeline();
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาด");
    }
  }

  const getRouteLabels = (status: string) => {
    const beforePickup = ["in_progress", "going_pickup", "accepted"];

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

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-slate-600">
          <div className="h-9 w-9 rounded-full border-4 border-slate-200 border-t-[#70C5BE] animate-spin" />
          <div className="text-sm">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="text-slate-500 hover:underline"
        >
          ← กลับ
        </button>
        <div className="text-center py-20 text-red-500">ไม่พบข้อมูลงาน</div>
      </div>
    );
  }

  const mapRoute = getMapRoute();

  const isCompleted =
    job.status === "paymented" ||
    job.status === "success" ||
    job.status === "cancelled";

  async function submitReport() {
    try {
      const res = await fetch("/api/reports/drivers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          booking_id: job?.booking_id,
          report_type: reportType,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "ส่งรายงานไม่สำเร็จ");
        return;
      }
      toast.success("ส่งรายงานเรียบร้อยแล้ว");
      await fetchJob();
      await fetchTimeline();
    } catch (err) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setOpenReportModal(false);
      setMessage("");
      setReportType("");
    }
  }

  return (
    <div className="bg-gray-50 min-h-screen pb-30">
      <div className="max-w-5xl mx-auto sm:p-6 p-2 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <button
              onClick={() => router.back()}
              className="text-slate-500 hover:underline"
            >
              ← กลับ
            </button>

            <p className="text-2xl font-bold">รายละเอียดงาน</p>
          </div>
          {!readOnly && !hasDriverReported ? (
            <div>
              <div
                className="flex flex-col items-center justify-center cursor-pointer space-y-1"
                onClick={() => setOpenReportModal(true)}
              >
                <div className="bg-amber-100/40 rounded-full p-3">
                  <Icon
                    icon="material-symbols:report-outline-rounded"
                    className="text-amber-300"
                    width="32"
                    height="32"
                  />
                </div>
                <p className="text-amber-400 font-bold"> รายงาน</p>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex flex-col items-center justify-center space-y-1 opacity-80">
                <div className="bg-gray-200 rounded-full p-3">
                  <Icon
                    icon="material-symbols:report-outline-rounded"
                    className="text-gray-500"
                    width="32"
                    height="32"
                  />
                </div>
                <p className="text-gray-500 font-bold">
                  {readOnly ? "ดูได้อย่างเดียว" : "รายงานงานแล้ว"}
                </p>
              </div>
            </div>
          )}
        </div>

        {isCompleted && (
          <CompletedLayout
            job={job}
            timeline={timeline}
            onFinishJob={finishJob}
          />
        )}

        {!isCompleted && (
          <InProgressLayout
            getRouteLabels={getRouteLabels}
            displayRoute={routePoints}
            mapRoute={mapRoute}
            routeMetrics={routeMetrics}
            onMapReady={() => setMapReady(true)}
            mapReady={mapReady}
            showMyLocation={showMyLocation}
            openGoogleMap={openGoogleMapsDirections}
            initMap={initMap}
            job={job}
            canProcess={canProcess}
            readOnly={readOnly}
            onChangeStatus={updateJobStatus}
            onEndJob={endJob}
          />
        )}
      </div>
      {openReportModal && !readOnly && (
        <div>
          <ReportModal
            open={openReportModal}
            title="แจ้งปัญหางานนี้"
            reportType={reportType}
            setReportType={setReportType}
            message={message}
            setMessage={setMessage}
            reportTypes={DRIVER_REPORT_TYPES}
            onClose={() => {
              setOpenReportModal(false);
              setReportType("");
              setMessage("");
            }}
            onSubmit={submitReport}
          />
        </div>
      )}
    </div>
  );
}
