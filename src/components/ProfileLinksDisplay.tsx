import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileLink {
  label: string;
  url: string;
}

const ProfileLinksDisplay = ({ userId }: { userId: string }) => {
  const [links, setLinks] = useState<ProfileLink[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("profiles")
      .select("profile_links")
      .eq("user_id", userId)
      .single()
      .then(({ data }) => {
        const raw = (data as any)?.profile_links;
        if (Array.isArray(raw) && raw.length > 0) setLinks(raw);
      });
  }, [userId]);

  if (links.length === 0) return null;

  return (
    <div className="pt-1 space-y-1">
      <b className="text-sm">🔗 Links:</b>
      {links.map((link, i) => (
        <a
          key={i}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-primary hover:underline truncate"
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

export default ProfileLinksDisplay;
