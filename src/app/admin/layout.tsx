import { AdminProvider } from "@/context/AdminContext"
import AdminRouteLoader from "@/components/admin/AdminRouteLoader"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminProvider>
            <AdminRouteLoader minDurationMs={200}>{children}</AdminRouteLoader>
        </AdminProvider>
    )
}
