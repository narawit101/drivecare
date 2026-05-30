"use client";
import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useUser } from "@/context/UserContext";
import { DriverProfile } from "@/types/profile";
import Button from "@/components/Button";
import { toast } from "react-toastify";
import Pusher from "pusher-js";
import { useLongdoMapDriver } from "@/services/map/useLongdoMapDriver";
import * as FormatDatetime from "@/utils/format-datetime";
import type {
  DisplayRoute,
  MapPoint,
  MapRenderRoute,
  RouteLabel,
} from "@/types/driver/route";
import { openGoogleMapsDirections } from "@/utils/google-maps";

import DriverPendingApprovalNotice from "@/components/driver/dashboard/DriverPendingApprovalNotice";
import DriverRejectedNotice from "@/components/driver/dashboard/DriverRejectedNotice";
import DriverDashboardApproved from "@/components/driver/dashboard/DriverDashboardApproved";

import type { Job } from "@/types/driver/job";

import type { DriverDashboardBooking } from "@/types/driver/dashboard";
import type {
  BookingAssignedEvent,
  BookingAcceptedEvent,
  BookingCreatedEvent,
  BookingReturnedEvent,
  DriverStatusEvent,
  DriverVerifiedEvent,
} from "@/types/realtime/pusher";

type SortMode = "schedule_asc" | "created_desc";

export default function Home() {
  const API_URL = process.env.NEXT_PUBLIC_API!;
  const router = useRouter();
  const { token, isLoad, userData, setUserData } = useUser();
  const [openBookings, setOpenBookings] = useState<DriverDashboardBooking[]>(
    [],
  );
  const [bookingCount, setBookingCount] = useState(0);
  const [loadingBooking, setLoadingBooking] = React.useState(false);
  const [totalTrips, setTotalTrips] = useState(0);
  // เพิ่มในส่วน state ของคอมโพเนนต์
  const {
    initMap,
    renderRoute,
    calculateDistance,
    showMyLocation,
    locationReady,
    resizeMap,
    currentLocationRef,
  } = useLongdoMapDriver();
  // เพิ่ม state นี้ด้านบน
  const [coords, setCoords] = useState<MapPoint | null>(null);
  const [isOpenCurrentLocation, setIsOpenCurrentLocation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9; // แสดง 9 งานต่อหน้า
  const [inProgressJobs, setInProgressJobs] = useState<Job[]>([]);
  const currentInProgressJob = inProgressJobs[0];
  const [mapReady, setMapReady] = useState(false);
  const [routeMetrics, setRouteMetrics] = useState<{
    distanceKm: number;
    durationMin: number;
  } | null>(null);
  const [refreshingOpenBookings, setRefreshingOpenBookings] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("created_desc");

  useEffect(() => {
    if (!isLoad) return;

    if (!token) {
      router.replace("/login");
      return;
    }

    if (!userData) return; // รอ fetch

    if (userData.role !== "driver") {
      router.replace("/");
    }
  }, [isLoad, token, userData]);

  const driverData = userData as DriverProfile;
  const verifiedStatus = driverData?.verified;

  const fetchOpenBookings = async (mode?: SortMode) => {
    try {
      setLoadingBooking(true);
      const sort = mode ?? sortMode;
      const res = await fetch(`/api/booking/jobs?sort=${sort}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await res.json()) as {
        booking: DriverDashboardBooking[];
        count: number;
      };

      if (res.ok) {
        setOpenBookings(data.booking);
        console.log("Open bookings:", data.booking);
        setBookingCount(data.count);
      }
    } catch (err) {
      console.error(err);
      toast.error("ดึงรายการงานไม่สำเร็จ");
    } finally {
      setLoadingBooking(false);
    }
  };

  const fetchCurrentJob = async () => {
    if (!driverData?.driver_id) return;

    try {
      const res = await fetch(`/api/booking/drivers/my-job?tab=current`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await res.json()) as { jobs?: Job[] };
      if (res.ok) {
        setInProgressJobs(data.jobs ?? []);
      }
    } catch (error) {
      console.error("Fetch current job error:", error);
    }
  };

  useEffect(() => {
    if (driverData?.verified !== "approved") return;

    fetchOpenBookings();
    fetchCurrentJob();
  }, [driverData?.verified, token, driverData?.driver_id, sortMode]);

  const viewDetail = (bookingId: Job["booking_id"]) => {
    router.push(`/job-detail/${bookingId}`);
  };

  const getUIRoute = (): DisplayRoute | null => {
    if (!currentInProgressJob) return null;

    const isReturn = [
      "waiting_for_return",
      "heading_home",
      "arrived_home",
      "pending_payment",
    ].includes(currentInProgressJob.status);

    return {
      startAddress: isReturn
        ? currentInProgressJob.dropoff_address
        : currentInProgressJob.pickup_address,
      endAddress: isReturn
        ? currentInProgressJob.pickup_address
        : currentInProgressJob.dropoff_address,
      isReturn,
    };
  };

  const getMapRoute = (): MapRenderRoute | null => {
    if (!currentInProgressJob) return null;

    if (
      currentInProgressJob.pickup_lat == null ||
      currentInProgressJob.pickup_lng == null ||
      currentInProgressJob.dropoff_lat == null ||
      currentInProgressJob.dropoff_lng == null
    ) {
      return null;
    }

    const pickup: MapPoint = {
      lat: currentInProgressJob.pickup_lat,
      lon: currentInProgressJob.pickup_lng,
    };

    const dropoff: MapPoint = {
      lat: currentInProgressJob.dropoff_lat,
      lon: currentInProgressJob.dropoff_lng,
    };

    switch (currentInProgressJob.status) {
      case "in_progress":
      case "going_pickup":
      case "accepted":
        if (!currentLocationRef.current) return null;
        return { start: currentLocationRef.current, end: pickup };

      case "picked_up":
      case "heading_to_hospital":
      case "paymented":
        return { start: pickup, end: dropoff };

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
      (currentInProgressJob?.status === "in_progress" ||
        currentInProgressJob?.status === "going_pickup" ||
        currentInProgressJob?.status === "accepted")
    ) {
      showMyLocation();
    }

    const timer = setTimeout(() => {
      drawRoute();
    }, 500);

    return () => clearTimeout(timer);
  }, [
    mapReady,
    currentInProgressJob?.status,
    currentInProgressJob?.booking_id,
  ]);

  useEffect(() => {
    setRouteMetrics(null);
  }, [currentInProgressJob?.booking_id, currentInProgressJob?.status]);

  useEffect(() => {
    if (!mapReady) return;
    const t = setTimeout(() => {
      resizeMap();
    }, 200);
    return () => clearTimeout(t);
  }, [inProgressJobs.length, mapReady, currentInProgressJob?.status]);

  const getRouteLabels = (status: string): RouteLabel => {
    const beforePickup = ["in_progress", "going_pickup"];

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

  const sortedOpenBookings = React.useMemo(() => {
    const parseDateMs = (value: unknown) => {
      const ms = Date.parse(String(value ?? ""));
      return Number.isNaN(ms) ? 0 : ms;
    };

    const parseTimeToSeconds = (time: unknown) => {
      const raw = String(time ?? "").trim();
      // Supports both "HH:mm(:ss)" and "yyyy-MM-dd HH:mm:ss".
      const m = raw.match(/(\d{2}):(\d{2})(?::(\d{2}))?/);
      if (!m) return 0;
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      const ss = Number(m[3] ?? 0);
      return hh * 3600 + mm * 60 + ss;
    };

    const list = [...openBookings];

    list.sort((a, b) => {
      if (sortMode === "created_desc") {
        const diff = parseDateMs(b.create_at) - parseDateMs(a.create_at);
        if (diff !== 0) return diff;
        return (b.booking_id ?? 0) - (a.booking_id ?? 0);
      }

      const dateDiff =
        parseDateMs(a.booking_date) - parseDateMs(b.booking_date);
      if (dateDiff !== 0) return dateDiff;

      const timeDiff =
        parseTimeToSeconds(a.start_time) - parseTimeToSeconds(b.start_time);
      if (timeDiff !== 0) return timeDiff;

      const createdDiff = parseDateMs(a.create_at) - parseDateMs(b.create_at);
      if (createdDiff !== 0) return createdDiff;

      return (a.booking_id ?? 0) - (b.booking_id ?? 0);
    });

    return list;
  }, [openBookings, sortMode]);

  const totalPages = Math.ceil(sortedOpenBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentBookings = sortedOpenBookings.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    if (!driverData?.driver_id) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: "ap1",
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // 🔥 channel กลาง สำหรับงานใหม่
    const channel = pusher.subscribe("private-driver");

    channel.bind("booking.created", (data: BookingCreatedEvent) => {
      const newBooking = data.booking;

      setOpenBookings((prev) => {
        // กันซ้ำ (สำคัญมาก)
        if (
          prev.some(
            (b) => String(b.booking_id) === String(newBooking.booking_id),
          )
        ) {
          return prev;
        }
        return [newBooking, ...prev];
      });

      setBookingCount((prev) => prev + 1);

      toast.info("มีงานใหม่เข้ามา");
    });

    channel.bind("booking.returned", (data: BookingReturnedEvent) => {
      const returnedBooking = data?.booking;
      if (!returnedBooking) {
        console.warn("booking.returned missing payload", data);
        return;
      }

      setOpenBookings((prev) => {
        if (
          prev.some(
            (b) => String(b.booking_id) === String(returnedBooking.booking_id),
          )
        ) {
          return prev;
        }
        return [returnedBooking, ...prev];
      });

      setBookingCount((prev) => prev + 1);
      toast.info("มีงานถูกคืนเข้าระบบ");
    });

    channel.bind(
      "booking.assigned",
      ({ booking_id, driver_id }: BookingAssignedEvent) => {
        // งานถูกมอบหมายแล้ว => ต้องหายออกจากงานว่างของทุกคน
        setOpenBookings((prev) =>
          prev.filter((b) => String(b.booking_id) !== String(booking_id)),
        );
        setBookingCount((prev) => Math.max(prev - 1, 0));

        // ถ้ามอบหมายให้เรา (เช่น admin assign) ค่อยแจ้ง + รีเฟรชงานของฉัน
        if (String(driver_id) === String(driverData?.driver_id)) {
          toast.info("คุณได้รับมอบหมายงานใหม่");
          fetchCurrentJob();
          fetchTrips();
        }
      },
    );

    // งานถูก "รับ" โดยคนขับ (self-accept) => เอาออกจาก pool ของทุกคน
    channel.bind(
      "booking.accepted",
      ({ booking_id, driver_id }: BookingAcceptedEvent) => {
        setOpenBookings((prev) =>
          prev.filter((b) => String(b.booking_id) !== String(booking_id)),
        );
        setBookingCount((prev) => Math.max(prev - 1, 0));

        // ถ้าเป็นเราที่รับงาน ให้รีเฟรชงานของฉันทันที (ไม่ต้อง toast "มอบหมาย")
        if (String(driver_id) === String(driverData?.driver_id)) {
          fetchCurrentJob();
          fetchTrips();
        }
      },
    );

    // งานถูกลบโดยแอดมิน => เอาออกจาก pool ของทุกคน
    channel.bind("booking.deleted", (data: any) => {
      const bookingId = data?.booking_id;
      if (bookingId == null) return;

      setOpenBookings((prev) =>
        prev.filter((b) => String(b.booking_id) !== String(bookingId)),
      );
      setBookingCount((prev) => Math.max(prev - 1, 0));
    });

    return () => {
      pusher.unsubscribe("private-driver");
      pusher.disconnect();
    };
  }, [driverData?.driver_id, token]);

  useEffect(() => {
    if (!driverData?.driver_id) return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: "ap1",
      authEndpoint: "/api/pusher/auth",
      auth: {
        headers: {
          Authorization: `Bearer ${token}`, // token จาก state
        },
      },
    });

    const channel = pusher.subscribe(`private-driver-${driverData.driver_id}`);

    channel.bind("driver.verified.updated", (data: DriverVerifiedEvent) => {
      setUserData((prev) =>
        prev ? { ...prev, verified: data.verified } : prev,
      );
    });

    channel.bind("driver.status.updated", (data: DriverStatusEvent) => {
      setUserData((prev) => (prev ? { ...prev, status: data.status } : prev));
    });

    return () => {
      pusher.unsubscribe(`private-driver-${driverData.driver_id}`);
      pusher.disconnect();
    };
  }, [driverData?.driver_id]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error("เบราว์เซอร์ไม่รองรับ GPS");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;

        // เซตลง state เพื่อให้ UI แสดงผล
        setCoords({ lat, lon });

        // (Optional) ยังเรียกฟังก์ชันเดิมจาก hook ได้ถ้าต้องการให้มันไปอัปเดตในระบบหลังบ้าน
        showMyLocation();
      },
      () => toast.error("ไม่สามารถดึงตำแหน่งได้"),
    );
  };

  useEffect(() => {
    handleGetLocation();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ถ้ามีการคลิก และจุดที่คลิกไม่ได้อยู่ใน dropdownRef (พื้นที่ของ dropdown)
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpenCurrentLocation(false);
      }
    };

    // เพิ่ม event listener เมื่อ component mount
    document.addEventListener("mousedown", handleClickOutside);

    // ลบ event listener เมื่อ component unmount เพื่อประสิทธิภาพ
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // use shared openGoogleMapsDirections() utility

  const acceptBooking = async (booking_id: number) => {
    try {
      const res = await fetch(`/api/booking/drivers/${booking_id}/accept`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "งานนี้ถูกรับไปแล้ว");
        return;
      }

      // ✅ รับงานสำเร็จ
      toast.success("รับงานสำเร็จ");

      // ลบออกจาก list ทันที (optimistic UI)
      setOpenBookings((prev) =>
        prev.filter((b) => b.booking_id !== booking_id),
      );
      setBookingCount((prev) => Math.max(prev - 1, 0));

      // รีเฟรชงานกำลังทำทันที (ไม่ต้องรอ realtime)
      fetchCurrentJob();
      fetchTrips();
      // 👉 ไปหน้างานของฉัน
      // router.push(`/driver-job`);
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถรับงานได้");
    }
  };

  const fetchTrips = async () => {
    if (!token) return;

    try {
      const res = await fetch("/api/booking/drivers/accepted-job", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        console.warn("fetchTrips failed:", res.status, data);
        return;
      }

      setTotalTrips(data.total ?? 0);
      console.log("Total trips:", data.total);
    } catch (error) {
      console.error("fetchTrips error:", error);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchTrips();
  }, [token]);

  const verifyInThai = (verified?: string) => {
    switch (verified) {
      case "pending_approval":
        return "รอตรวจสอบการยืนยันตัวตน";
      case "approved":
        return "ผ่านการยืนยันตัวตนแล้ว";
      case "rejected":
        return "ไม่ผ่านการยืนยันตัวตน";
      default:
        return "ไม่ทราบสถานะการยืนยันตัวตน";
    }
  };

  const handeRefresh = () => {
    setRefreshingOpenBookings(true);
    fetchOpenBookings().finally(() => setRefreshingOpenBookings(false));
    setCurrentPage(1);
  };

  const handleChangeSortMode = (mode: SortMode) => {
    if (mode === sortMode) return;
    setSortMode(mode);
    setCurrentPage(1);
    setRefreshingOpenBookings(true);
    fetchOpenBookings(mode).finally(() => setRefreshingOpenBookings(false));
  };

  const roleInThai = (role: string) => {
    return role === "driver" ? "คนขับรถ" : "ไม่ทราบบทบาท";
  };

  const changeStatus = async (newStatus: "active" | "inactive") => {
    try {
      const res = await fetch(`${API_URL}/driver-controller/change-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (res.ok) {
        // ✅ อัปเดต State โดยส่ง Object ใหม่เข้าไปตรงๆ (ไม่ใช้ updater function)
        if (userData && userData.role === "driver") {
          setUserData({
            ...userData,
            status: newStatus,
          });
        }
        toast.success("เปลี่ยนสถานะเรียบร้อย");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error changing status:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    }
  };

  const todayThai = React.useMemo(
    () => FormatDatetime.formatThaiTodayWeekdayDate(),
    [],
  );

  // Prevent flashing wrong state while auth/userData is still loading
  if (!isLoad || !userData) {
    return (
      <section className="w-full">
        <div className="min-h-[50vh] flex items-center justify-center text-slate-500">
          <div className="h-8 w-8 rounded-full border-4 border-slate-200 border-t-[#70C5BE] animate-spin" />
          <span className="ml-2">กำลังโหลดข้อมูล</span>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      {driverData ? (
        <header className="mb-2 border-b border-neutral-200 ">
          <div className="w-full max-w-5xl mx-auto sm:gap-0 gap-0 px-8 py-4 flex sm:flex-row flex-col justify-between items-center">
            <div className="flex sm:flex-row flex-col gap-4 items-center justify-start h-full">
              <a href="#" className="cursor-pointer">
                <div className="user-profile">
                  <Image
                    className="w-15 h-15 md:w-20 md:h-20 rounded-full object-cover"
                    src={driverData?.profile_img}
                    alt="User Profile"
                    width={100}
                    height={100}
                  />
                </div>
              </a>
              <div className="flex flex-col user-info text-center justify-center sm:text-left gap-1">
                <div className=" flex items-center gap-2">
                  <p className="text-lg text-gray-800 font-semibold">
                    {driverData?.first_name} {driverData?.last_name}
                  </p>
                  <p className="text-sm font-light text-gray-500">
                    {roleInThai(driverData?.role)}
                  </p>
                </div>
                <button
                  // disabled={driverData?.verified === 'pending_approval'}
                  onClick={() =>
                    changeStatus(
                      driverData?.status === "active" ? "inactive" : "active",
                    )
                  }
                  className={`
    flex items-center justify-center gap-2 px-4 py-2 rounded-full
    text-sm font-semibold
    transition-all duration-200
    ${
      driverData?.status === "active"
        ? ` bg-emerald-100 text-emerald-600 cursor-pointer`
        : `bg-gray-200 text-gray-700 border-gray-300 hover:bg-gray-300 cursor-${driverData?.verified === "pending_approval" ? "not-allowed" : "pointer"}`
    }
  `}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      driverData?.status === "active"
                        ? "bg-[#43e11b]"
                        : driverData?.status === "inactive"
                          ? "bg-gray-500"
                          : "bg-red-600"
                    }`}
                  />
                  {driverData?.status === "active"
                    ? "ออนไลน์"
                    : driverData?.status === "inactive"
                      ? "ออฟไลน์"
                      : "ถูกระงับ"}
                </button>
              </div>
            </div>
            <div className="relative mt-5" ref={dropdownRef}>
              <div className=" w-full border border-emerald-200 rounded-xl overflow-hidden bg-white shadow-sm mb-4">
                {/* ส่วนหัวของ Dropdown (กดเพื่อเปิด/ปิด) */}
                <Button
                  variant="secondary"
                  onClick={() =>
                    setIsOpenCurrentLocation(!isOpenCurrentLocation)
                  }
                  className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                >
                  <div className="flex items-center gap-2 text-emerald-700">
                    <Icon
                      icon="solar:map-point-wave-bold"
                      className={`text-xl ${coords ? "animate-pulse" : ""}`}
                    />
                    <span className="font-semibold text-sm">
                      {coords ? "ใช้ตำแหน่งปัจจุบัน" : "ยังไม่ได้ระบุตำแหน่ง"}
                    </span>
                  </div>
                </Button>

                {/* ส่วนเนื้อหาที่กางออกมา */}
                <div
                  className={`transition-all duration-300 ease-in-out overflow-hidden  ${isOpenCurrentLocation ? "max-h-40 opacity-100" : "max-h-0 opacity-0"}`}
                >
                  <div className="p-4 flex flex-col gap-3 border-t border-emerald-100 absolute -left-15 mt-2 z-50 w-72 bg-white shadow-lg rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                      <div className="bg-gray-50 p-2 rounded-md border border-gray-100 flex justify-center">
                        <span className="text-emerald-700 font-bold ">
                          {coords ? coords.lat.toFixed(5) : "---"}
                        </span>
                      </div>
                      <div className="bg-gray-50 p-2 rounded-md border border-gray-100 flex justify-center">
                        <span className="text-emerald-700 font-bold">
                          {coords ? coords.lon.toFixed(5) : "---"}
                        </span>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => {
                        e.stopPropagation(); // กันไม่ให้ไป trigger การปิด dropdown
                        handleGetLocation();
                      }}
                      variant="secondary"
                      className="w-full py-2"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Icon icon="solar:gps-bold" />
                        <p className="text-sm">อัปเดตตำแหน่งปัจจุบัน</p>
                      </div>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
      ) : null}

      <main className="w-full max-w-5xl mx-auto px-2 py-4">
        <div className="flex flex-col justify-center h-full">
          {!verifiedStatus ? (
            <div className="min-h-[20vh] flex items-center justify-center text-slate-500">
              <div className="h-7 w-7 rounded-full border-4 border-slate-200 border-t-[#70C5BE] animate-spin" />
              <span className="ml-2">กำลังโหลดสถานะ...</span>
            </div>
          ) : verifiedStatus == "pending_approval" ? (
            <DriverPendingApprovalNotice
              verifiedLabel={verifyInThai(driverData?.verified)}
            />
          ) : verifiedStatus == "approved" ? (
            <DriverDashboardApproved
              todayThai={todayThai}
              bookingCount={bookingCount}
              totalTrips={totalTrips}
              inProgressJobs={inProgressJobs}
              uiRoute={getUIRoute()}
              mapRoute={mapRoute}
              routeMetrics={routeMetrics}
              initMap={initMap}
              onMapReady={() => setMapReady(true)}
              mapReady={mapReady}
              showMyLocation={showMyLocation}
              openGoogleMap={openGoogleMapsDirections}
              onViewDetail={viewDetail}
              getRouteLabels={getRouteLabels}
              coords={coords}
              openBookings={openBookings}
              loadingBooking={loadingBooking}
              currentBookings={currentBookings}
              currentPage={currentPage}
              totalPages={totalPages}
              onChangePage={setCurrentPage}
              onRefresh={handeRefresh}
              refreshing={refreshingOpenBookings}
              sortMode={sortMode}
              onChangeSortMode={handleChangeSortMode}
              onAcceptBooking={acceptBooking}
            />
          ) : (
            <DriverRejectedNotice
              verifiedLabel={verifyInThai(driverData?.verified)}
            />
          )}
        </div>
      </main>
    </section>
  );
}
