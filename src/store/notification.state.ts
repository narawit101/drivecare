import { create } from "zustand";
import { Notification } from "@/types/notification";

interface NotificationState {
    notifications: Notification[];
    setNotifications: (notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
    notifications: [],
    setNotifications: (notifications: Notification[]) => set({ notifications }),
}))