import { Dispatch, SetStateAction } from "react";
import { AnyUserProfile } from "@/types/profile";


export interface UserContextType {
    token: string | null
    setToken: (t: string | null) => void
    isLoad: boolean
    logout: () => void
    userData: AnyUserProfile | null
    setUserData: Dispatch<SetStateAction<AnyUserProfile | null>>;
}