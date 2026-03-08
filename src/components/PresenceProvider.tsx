import { usePresenceHeartbeat } from "@/hooks/usePresence";

export const PresenceProvider = () => {
  usePresenceHeartbeat();
  return null;
};
