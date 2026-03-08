import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

export const useModerator = () => {
  const { user } = useAuth();
  const [isModerator, setIsModerator] = useState(false);

  useEffect(() => {
    if (!user) { setIsModerator(false); return; }
    (supabase.rpc as any)("has_role", { _user_id: user.id, _role: "moderator" })
      .then(({ data }: { data: boolean }) => setIsModerator(!!data))
      .catch(() => setIsModerator(false));
  }, [user]);

  return { isModerator };
};
