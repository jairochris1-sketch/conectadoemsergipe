import { usePresenceHeartbeat } from "@/hooks/usePresence";
import { useBrowserNotifications } from "@/hooks/useBrowserNotifications";

export const PresenceProvider = () => {
  usePresenceHeartbeat();
  useBrowserNotifications();
  return null;
};
