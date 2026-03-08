import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const REPORT_REASONS = [
  "report.adult_content",
  "report.spam",
  "report.violence",
  "report.hate_speech",
];

interface Props {
  contentType: "post" | "marketplace_item" | "comment";
  contentId: string;
  reportedUserId: string;
  className?: string;
}

const ReportButton = ({ contentType, contentId, reportedUserId, className }: Props) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);

  if (!user || user.id === reportedUserId) return null;

  const handleReport = async (reasonKey: string) => {
    setSending(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      content_type: contentType,
      content_id: contentId,
      reason: t(reasonKey),
    } as any);

    if (error) {
      toast.error(t("report.error"));
    } else {
      toast.success(t("report.sent"));
    }
    setSending(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className={`text-muted-foreground hover:text-destructive bg-transparent border-none cursor-pointer ${className || "text-[9px]"}`}>
          🚩 {t("report.button")}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[320px] p-4">
        <DialogHeader>
          <DialogTitle className="text-[14px]">{t("report.title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          {REPORT_REASONS.map((reasonKey) => (
            <button
              key={reasonKey}
              disabled={sending}
              onClick={() => handleReport(reasonKey)}
              className="w-full text-left bg-accent hover:bg-muted border border-border px-3 py-2 text-[11px] cursor-pointer transition-colors disabled:opacity-50"
            >
              {t(reasonKey)}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportButton;
