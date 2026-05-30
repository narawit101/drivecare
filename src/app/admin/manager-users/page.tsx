"use client";

import { Suspense, useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { toast } from "react-toastify";
import { useAdmin } from "@/context/AdminContext";
import Pagination from "@/components/admin/common/Pagination";

import GroupToggle from "@/components/admin/manager-users/GroupToggle";
import FilterSelect from "@/components/admin/manager-users/FilterSelect";
import AddressModal from "@/components/admin/manager-users/AddressModal";
import ConfirmDeleteModal from "@/components/admin/manager-users/ConfirmDeleteModal";
import EditUserModal from "@/components/admin/manager-users/EditUserModal";
import AdminUsersTable from "@/components/admin/manager-users/AdminUsersTable";

import type {
  AdminUserRow,
  CityFilter,
  DeleteTarget,
  EditUserData,
  StatusFilter,
  UserGroup,
  UserStatus,
  VerificationFilter,
  VerificationStatus,
} from "@/types/admin/manager-users";

function AdminManagerUserInner() {
  const { admin, isLoading } = useAdmin();

  const searchParams = useSearchParams();
  const initialGroup = useMemo<UserGroup>(() => {
    const g = searchParams.get("group");
    return g === "user" ? "user" : "driver";
  }, [searchParams]);

  const [groupFilter, setGroupFilter] = useState<UserGroup>(initialGroup);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ทั้งหมด");
  const [verificationFilter, setVerificationFilter] =
    useState<VerificationFilter>("ทั้งหมด");
  const [searchText, setSearchText] = useState("");
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  // 🔥 เพิ่ม State สำหรับเก็บข้อมูลจริงจาก API
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [dataIsLoading, setDataIsLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleteIsLoading, setDeleteIsLoading] = useState(false);
  const [editData, setEditData] = useState<EditUserData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processLoading, setProcessLoading] = useState(false);
  const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
    { label: "ทั้งหมด", value: "ทั้งหมด" },
    { label: "ออนไลน์", value: "active" },
    { label: "ออฟไลน์", value: "inactive" },
    { label: "แบน", value: "banned" },
  ];
  const [cityFilter, setCityFilter] = useState<CityFilter>("ทั้งหมด");

  const CITY_FILTERS: Array<{ label: string; value: CityFilter }> = [
    { label: "ทั้งหมด", value: "ทั้งหมด" },
    { label: "ขอนแก่น", value: "ขอนแก่น" },
    { label: "ร้อยเอ็ด", value: "ร้อยเอ็ด" },
    { label: "มหาสารคาม", value: "มหาสารคาม" },
  ];

  const VERIFY_FILTERS: Array<{ label: string; value: VerificationFilter }> = [
    { label: "ทั้งหมด", value: "ทั้งหมด" },
    { label: "ตรวจสอบแล้ว", value: "approved" },
    { label: "รอตรวจสอบ", value: "pending_approval" },
  ];
  const roleLabelMap: Record<string, string> = {
    driver: "ผู้ขับ",
    user: "ผู้ป่วย",
  };
  const router = useRouter();
  useEffect(() => {
    if (isLoading) return;
    if (!admin) {
      router.replace("/admin/login");
    }
  }, [admin, isLoading, router]);

  useEffect(() => {
    setGroupFilter(initialGroup);
  }, [initialGroup]);

  const USER_STATUS_VALUES: readonly UserStatus[] = [
    "active",
    "inactive",
    "banned",
  ];
  const VERIFICATION_VALUES: readonly VerificationStatus[] = [
    "approved",
    "pending_approval",
    "rejected",
  ];

  const toUserStatus = (value: unknown): UserStatus => {
    const s = typeof value === "string" ? (value as UserStatus) : undefined;
    return s && USER_STATUS_VALUES.includes(s) ? s : "inactive";
  };

  const toVerificationStatus = (value: unknown): VerificationStatus => {
    const v =
      typeof value === "string" ? (value as VerificationStatus) : undefined;
    return v && VERIFICATION_VALUES.includes(v) ? v : "pending_approval";
  };

  // 🔥 ฟังก์ชัน Fetch ข้อมูลแยกตามกลุ่ม
  const fetchUsers = async () => {
    setDataIsLoading(true);
    try {
      // เลือก Endpoint ตามที่โครงสร้างโฟลเดอร์ระบุไว้
      const endpoint =
        groupFilter === "driver"
          ? "/api/admin/admin-controller/fetch-driver"
          : "/api/admin/admin-controller/fetch-user";

      const res = await fetch(endpoint);
      const data = (await res.json()) as {
        users?: unknown[];
        message?: string;
      };

      if (res.ok) {
        const rawUsers = Array.isArray(data.users) ? data.users : [];
        console.log("RAW USERS:", rawUsers);

        // แปลงข้อมูลจาก Database ให้เข้ากับ Type UserRow ของหน้าบ้าน
        const mappedUsers: AdminUserRow[] = rawUsers.map((item) => {
          const o = (item ?? {}) as Record<string, unknown>;
          const first_name = String(o.first_name ?? "");
          const last_name = String(o.last_name ?? "");
          const phone_number = String(o.phone_number ?? "");
          const name = `${first_name} ${last_name}`.trim();
          const address = String(o.address ?? "");
          const avatar = String(o.profile_img ?? "images/avatar.jpg");
          const createdAtRaw = o.create_at ?? o.created_at;
          const createdAt = createdAtRaw
            ? new Date(String(createdAtRaw))
            : new Date();
          const joinedAt = createdAt.toLocaleDateString("th-TH", {
            month: "long",
            day: "numeric",
            year: "numeric",
          });

          if (groupFilter === "driver") {
            const id = Number(o.driver_id ?? 0);
            return {
              id,
              role: "driver",
              first_name,
              last_name,
              phone_number,
              name: name || "-",
              phone: phone_number,
              verification: toVerificationStatus(o.verified ?? "approved"),
              status: toUserStatus(o.status),
              city: typeof o.city === "string" ? o.city : undefined,
              address,
              joinedAt,
              avatar,
            };
          }

          const id = Number(o.user_id ?? 0);
          return {
            id,
            role: "user",
            first_name,
            last_name,
            phone_number,
            name: name || "-",
            phone: phone_number,
            address,
            joinedAt,
            avatar,
          };
        });
        setUsers(mappedUsers);
        console.log("MAPPED USERS:", mappedUsers);
      } else {
        toast.error(data.message || "ไม่สามารถโหลดข้อมูลได้");
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setDataIsLoading(false);
    }
  };

  // 🔥 โหลดข้อมูลใหม่ทุกครั้งที่สลับกลุ่ม (drivers/customers)
  useEffect(() => {
    fetchUsers();
    setSearchText("");
    setCurrentPage(1);

    if (groupFilter === "driver") {
      setStatusFilter("ทั้งหมด");
      setVerificationFilter("ทั้งหมด");
      setCityFilter("ทั้งหมด");
    }

    if (groupFilter === "user") {
      setStatusFilter("ทั้งหมด");
      setVerificationFilter("ทั้งหมด");
      setCityFilter("ทั้งหมด");
    }
  }, [groupFilter]);

  const filteredUsers = useMemo(() => {
    // ใช้ข้อมูลจาก State users แทน Mock Data เดิม
    return users.filter((user) => {
      const isDriver = user.role === "driver";
      const matchStatus =
        statusFilter === "ทั้งหมด"
          ? true
          : isDriver
            ? user.status === statusFilter
            : true;
      // ✅ ถ้าเป็นลูกค้า ไม่ต้องกรองเรื่องการยืนยัน
      const matchVerification =
        groupFilter === "user"
          ? true
          : isDriver
            ? verificationFilter === "ทั้งหมด"
              ? true
              : user.verification === verificationFilter
            : true;
      const matchCity =
        groupFilter !== "driver" || cityFilter === "ทั้งหมด"
          ? true
          : isDriver
            ? user.city === cityFilter
            : true;
      const matchKeyword = user.name
        .toLowerCase()
        .includes(searchText.toLowerCase());
      return matchStatus && matchVerification && matchKeyword && matchCity;
    });
  }, [
    users,
    groupFilter,
    statusFilter,
    verificationFilter,
    searchText,
    cityFilter,
  ]);

  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage]);

  const handleDelete = async (id: number, name: string): Promise<boolean> => {
    console.log(id);
    console.log(name);
    console.log(groupFilter);
    if (!id) {
      toast.error("ID ผู้ใช้ไม่ถูกต้อง");
      return false;
    }
    try {
      setDeleteIsLoading(true);
      const res = await fetch(
        `/api/admin/admin-controller/delete?id=${id}&role=${groupFilter}`,
        { method: "DELETE", credentials: "include" },
      );

      const data = (await res.json()) as { message?: string };

      if (!res.ok) {
        toast.error(data.message || "ลบไม่สำเร็จ");
        return false;
      }

      toast.success(data.message || "ลบสำเร็จ");

      // ✅ ลบออกจาก state ทันที (ไม่ต้อง fetch ใหม่)
      setUsers((prev) => prev.filter((u) => u.id !== id));

      return true;
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      return false;
    } finally {
      setDeleteIsLoading(false);
    }
  };

  const handleEdit = (item: AdminUserRow) => {
    if (item.role === "user") {
      setEditData({
        id: item.id,
        role: "user",
        first_name: item.first_name,
        last_name: item.last_name,
        phone_number: item.phone_number,
        address: item.address ?? "",
      });
    } else {
      setEditData({
        id: item.id,
        role: "driver",
        first_name: item.first_name,
        last_name: item.last_name,
        phone_number: item.phone_number,
        status: item.status,
        city: item.city ?? "",
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditData(null);
    setIsModalOpen(false);
  };

  const handleUpdate = async () => {
    if (!editData) return;
    try {
      setProcessLoading(true);

      const { id, role, first_name, last_name, phone_number } = editData;
      const address = role === "user" ? editData.address : undefined;
      const status = role === "driver" ? editData.status : undefined;
      const city = role === "driver" ? editData.city : undefined;
      if (!first_name || !last_name || !phone_number) {
        toast.error("กรุณากรอกข้อมูลให้ครบ");
        return;
      }
      if (role === "user" && !address) {
        toast.error("กรุณากรอกที่อยู่");
        return;
      }
      if (
        role === "driver" &&
        (!status || !["active", "inactive", "banned"].includes(status))
      ) {
        toast.error("สถานะไม่ถูกต้อง");
        return;
      }
      if (role === "driver" && !city) {
        toast.error("กรุณาเลือกจังหวัด");
        return;
      }

      await fetch(`/api/admin/admin-controller/update?id=${id}&role=${role}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          first_name,
          last_name,
          phone_number,
          ...(role === "driver" && { status }),
          ...(role === "driver" && { city }),
        }),
      });

      // ✅ update state ทันที
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                first_name,
                last_name,
                phone_number,
                name: `${first_name} ${last_name}`,
                address: address ?? u.address,
                phone: phone_number,
                ...(u.role === "driver" && role === "driver"
                  ? { status: status ?? u.status, city: city ?? u.city }
                  : {}),
              }
            : u,
        ),
      );

      toast.success("แก้ไขข้อมูลสำเร็จ");
      closeModal();
    } catch {
      toast.error("ไม่สามารถแก้ไขข้อมูลได้");
    } finally {
      setProcessLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <AdminSidebar activeLabel="จัดการผู้ใช้" />

      <main className="flex-1 p-4 md:p-8 overflow-x-hidden text-slate-900">
        <header>
          <div className="flex flex-col gap-4 mb-4">
            <p className="mt-4 text-3xl font-semibold text-[#70C5BE]">
              จัดการผู้ใช้
            </p>
            <p className="text-sm text-slate-500">
              ตรวจสอบสถานะและจัดการข้อมูลของผู้ใช้งานระบบ
            </p>
          </div>
        </header>

        <section className="flex flex-wrap items-center gap-4 rounded-2xl bg-white p-4 shadow-sm mb-4">
          <GroupToggle value={groupFilter} onChange={setGroupFilter} />
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">
            <Icon icon="solar:magnifer-linear" className="h-4 w-4" />
            <input
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              className="w-48 border-none bg-transparent text-slate-600 rounded-lg px-3 py-2 text-sm transition-all duration-200
                                                  focus:outline-none focus:ring-1 focus:ring-[#70C5BE]"
              placeholder="ค้นหาชื่อ"
            />
          </div>
          {groupFilter === "driver" && (
            <>
              <FilterSelect
                label="สถานะ"
                icon="solar:checklist-linear"
                value={statusFilter}
                onChange={(value) => setStatusFilter(value)}
                options={STATUS_FILTERS}
              />

              <FilterSelect
                label="การยืนยัน"
                icon="solar:shield-check-linear"
                value={verificationFilter}
                onChange={(value) => setVerificationFilter(value)}
                options={VERIFY_FILTERS}
              />
              <FilterSelect<CityFilter>
                label="จังหวัด"
                icon="solar:map-point-linear"
                value={cityFilter}
                onChange={setCityFilter}
                options={CITY_FILTERS}
              />
            </>
          )}
        </section>

        <AdminUsersTable
          groupFilter={groupFilter}
          loading={dataIsLoading}
          users={paginatedUsers}
          isEmpty={filteredUsers.length === 0}
          roleLabelMap={roleLabelMap}
          onOpenAddress={(address) => setSelectedAddress(address)}
          onEdit={handleEdit}
          onDelete={(id, name) => setDeleteTarget({ id, name })}
        />
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredUsers.length}
          itemsPerPage={ITEMS_PER_PAGE}
          onChangePage={setCurrentPage}
        />
        {/* Modal แสดงที่อยู่ทั้งหมด */}
        {selectedAddress && (
          <AddressModal
            address={selectedAddress}
            onClose={() => setSelectedAddress(null)}
          />
        )}
        {deleteTarget && (
          <ConfirmDeleteModal
            name={deleteTarget.name}
            isLoading={deleteIsLoading}
            onCancel={() => {
              if (deleteIsLoading) return;
              setDeleteTarget(null);
            }}
            onConfirm={async () => {
              const ok = await handleDelete(deleteTarget.id, deleteTarget.name);
              if (ok) setDeleteTarget(null);
            }}
          />
        )}
        {isModalOpen && editData && (
          <EditUserModal
            data={editData}
            onChange={(next) => setEditData(next)}
            onClose={closeModal}
            onManageVerification={
              editData.role === "driver"
                ? () => {
                    closeModal();
                    router.push(`/admin/driver/${editData.id}`);
                  }
                : undefined
            }
            onSave={handleUpdate}
            loading={processLoading}
          />
        )}
      </main>
    </div>
  );
}

export default function AdminManagerUser() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
      <AdminManagerUserInner />
    </Suspense>
  );
}
