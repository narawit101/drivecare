import { AdminProfile } from "@/types/admin/admin"

export interface AdminContextType {
    admin: AdminProfile | null
    isLoading: boolean
    logout: () => void
    setAdmin: React.Dispatch<React.SetStateAction<AdminProfile | null>>
}