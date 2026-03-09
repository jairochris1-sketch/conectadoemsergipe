import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ReportButton from "@/components/ReportButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface MarketItem {
  id: string;
  title: string;
  price: string;
  description: string;
  seller: string;
  sellerId: string;
  category: string;
  city: string;
  imageUrl: string;
  images?: string[];
  whatsapp?: string;
  isSponsored?: boolean;
  sold?: boolean;
  condition?: string;
}

const CONDITION_LABELS: Record<string, string> = {
  new: "marketplace.condition_new",
  used: "marketplace.condition_used",
  recently_bought: "marketplace.condition_recently_bought",
};

const formatPriceDisplay = (price: string): string => {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

interface Props {
  item: MarketItem;
  variant: "grid" | "list";
  currentUserId?: string;
  onTrackClick: (id: string, category: string) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string) => void;
  onContact: (sellerId: string) => void;
}

const WhatsAppButton = ({ whatsapp, title, t, size = "normal" }: { whatsapp: string; title: string; t: (k: string) => string; size?: "small" | "normal" }) => {
  const cleanNumber = whatsapp.replace(/\D/g, "");
  const fullNumber = cleanNumber.startsWith("55") ? cleanNumber : `55${cleanNumber}`;
  const url = `https://wa.me/${fullNumber}?text=${encodeURIComponent(t("marketplace.whatsapp_message") + " " + title)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={`inline-flex items-center gap-1.5 bg-[hsl(142,70%,40%)] text-white border-none cursor-pointer hover:opacity-90 rounded-sm ${
        size === "small" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className={size === "small" ? "w-4 h-4" : "w-5 h-5"}>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      WhatsApp
    </a>
  );
};

const ShareButton = ({ item, t, size = "normal" }: { item: { title: string; price: string; id: string }; t: (k: string) => string; size?: "small" | "normal" }) => {
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Use the edge function URL for sharing so social media crawlers get proper OG meta tags
    // The edge function serves OG tags and redirects the user to the actual page
    const ogUrl = `https://rkzjhpmoijnixmfljgip.supabase.co/functions/v1/og-marketplace?id=${item.id}`;
    const text = `${item.title} - ${formatPriceDisplay(item.price)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, text, url: ogUrl });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(`${text}\n${ogUrl}`);
      const { toast } = await import("sonner");
      toast.success(t("marketplace.link_copied"));
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1.5 bg-muted text-foreground border border-border cursor-pointer hover:bg-accent rounded-sm ${
        size === "small" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm"
      }`}
    >
      🔗 {t("marketplace.share")}
    </button>
  );
};

const ImageGallery = ({ images, imageUrl, title }: { images?: string[]; imageUrl: string; title: string }) => {
  const [current, setCurrent] = useState(0);
  const [open, setOpen] = useState(false);
  const allImages = images && images.length > 0 ? images : imageUrl ? [imageUrl] : [];

  if (allImages.length === 0) {
    return <span className="text-2xl">📦</span>;
  }

  return (
    <>
      <div className="relative w-full h-full">
        <img
          src={allImages[current]}
          alt={title}
          className="w-full h-full object-cover cursor-zoom-in"
          onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        />
        {allImages.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c - 1 + allImages.length) % allImages.length); }}
              className="absolute left-0 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 text-sm leading-none py-1"
            >‹</button>
            <button
              onClick={(e) => { e.stopPropagation(); setCurrent((c) => (c + 1) % allImages.length); }}
              className="absolute right-0 top-1/2 -translate-y-1/2 bg-black/50 text-white px-2 text-sm leading-none py-1"
            >›</button>
            <span className="absolute bottom-0 right-0 bg-black/60 text-white text-xs px-1.5">{current + 1}/{allImages.length}</span>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 bg-black/95 border-none flex flex-col items-center justify-center gap-2" onClick={(e) => e.stopPropagation()}>
          <img
            src={allImages[current]}
            alt={title}
            className="max-w-full max-h-[75vh] object-contain rounded"
          />
          {allImages.length > 1 && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrent((c) => (c - 1 + allImages.length) % allImages.length)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded text-lg"
              >‹</button>
              <span className="text-white text-sm">{current + 1} / {allImages.length}</span>
              <button
                onClick={() => setCurrent((c) => (c + 1) % allImages.length)}
                className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded text-lg"
              >›</button>
            </div>
          )}
          {allImages.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto max-w-full py-1">
              {allImages.map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`${title} ${i + 1}`}
                  onClick={() => setCurrent(i)}
                  className={`w-14 h-14 object-cover cursor-pointer rounded border-2 transition-all ${
                    i === current ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"
                  }`}
                />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

const MarketplaceItemCard = ({ item, variant, currentUserId, onTrackClick, onDelete, onMarkSold, onContact }: Props) => {
  const { t } = useLanguage();
  const [soldChecked, setSoldChecked] = useState(false);
  const [showSoldConfirm, setShowSoldConfirm] = useState(false);
  const isOwner = currentUserId && item.sellerId === currentUserId;

  const handleSoldCheck = (checked: boolean) => {
    setSoldChecked(checked);
    if (checked) {
      setShowSoldConfirm(true);
    }
  };

  const handleConfirmSold = () => {
    onDelete(item.id);
    setShowSoldConfirm(false);
  };

  const handleCancelSold = () => {
    setSoldChecked(false);
    setShowSoldConfirm(false);
  };

  if (variant === "grid") {
    return (
      <div
        className={`relative border p-3 cursor-pointer hover:bg-accent transition-colors rounded-sm ${
          item.isSponsored ? "border-primary/50 bg-primary/5" : "border-primary/30 bg-accent/50"
        }`}
        onClick={() => onTrackClick(item.id, item.category)}
      >
        {item.isSponsored && (
          <span className="absolute top-0 right-0 text-xs font-bold text-primary-foreground bg-primary px-2 py-0.5">
            ⭐ {t("ads.sponsored")}
          </span>
        )}
        <div className="w-full h-[100px] bg-muted border border-border flex items-center justify-center overflow-hidden mb-2 rounded-sm">
          <ImageGallery images={item.images} imageUrl={item.imageUrl} title={item.title} />
        </div>
        <p className="text-sm font-bold truncate">{item.title}</p>
        <p className="text-sm font-bold text-primary">{formatPriceDisplay(item.price)}</p>
        {item.condition && (
          <p className="text-xs text-muted-foreground">{t(CONDITION_LABELS[item.condition] || "marketplace.condition_used")}</p>
        )}
        <p className="text-xs text-muted-foreground truncate">
          {item.city && <>📍 {item.city} · </>}
          {item.seller}
        </p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {item.whatsapp && (
            <WhatsAppButton whatsapp={item.whatsapp} title={item.title} t={t} size="small" />
          )}
          <ShareButton item={item} t={t} size="small" />
          {currentUserId && item.sellerId && item.sellerId !== currentUserId && !item.whatsapp && (
            <button
              onClick={(e) => { e.stopPropagation(); onContact(item.sellerId); }}
              className="bg-primary text-primary-foreground border-none px-3 py-1 text-xs cursor-pointer hover:opacity-90 rounded-sm"
            >
              💬 {t("marketplace.contact")}
            </button>
          )}
        </div>
        {isOwner && (
          <div className="flex flex-col gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
              <Checkbox checked={soldChecked} onCheckedChange={(c) => handleSoldCheck(c === true)} className="h-4 w-4" />
              {t("marketplace.mark_sold_check")}
            </label>
            <AlertDialog open={showSoldConfirm} onOpenChange={(open) => { if (!open) handleCancelSold(); }}>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("marketplace.sold_confirm_title")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("marketplace.sold_confirm_desc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleCancelSold}>{t("marketplace.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmSold}>{t("marketplace.confirm_sold")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="bg-destructive text-destructive-foreground border-none px-3 py-1 text-xs cursor-pointer hover:opacity-80 rounded-sm">
                  🗑 {t("marketplace.delete_item")}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("marketplace.delete_confirm_title")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("marketplace.delete_confirm_desc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("marketplace.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(item.id)}>{t("marketplace.delete_item")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {currentUserId && !isOwner && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <ReportButton contentType="marketplace_item" contentId={item.id} reportedUserId={item.sellerId} className="text-xs" />
          </div>
        )}
      </div>
    );
  }

  // List variant
  return (
    <div
      className={`relative border p-3 flex gap-4 cursor-pointer hover:bg-accent/30 transition-colors rounded-sm ${
        item.isSponsored ? "border-primary/50 bg-primary/5" : "border-border"
      }`}
      onClick={() => onTrackClick(item.id, item.category)}
    >
      {item.isSponsored && (
        <span className="absolute top-0 right-0 text-xs font-bold text-primary-foreground bg-primary px-2 py-0.5">
          ⭐ {t("ads.sponsored")}
        </span>
      )}
      <div className="w-[90px] h-[90px] bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden rounded-sm">
        <ImageGallery images={item.images} imageUrl={item.imageUrl} title={item.title} />
      </div>
      <div className="text-sm flex-1">
        <div className="flex justify-between">
          <a href="#" className="font-bold text-base">{item.title}</a>
          <span className="font-bold text-primary text-base">{formatPriceDisplay(item.price)}</span>
        </div>
        {item.condition && (
          <span className="text-xs text-muted-foreground">{t(CONDITION_LABELS[item.condition] || "marketplace.condition_used")}</span>
        )}
        <p className="text-muted-foreground mt-1">{item.description}</p>
        <p className="mt-1 flex items-center gap-1 flex-wrap">
          {t("marketplace.seller")}: <a href="#">{item.seller}</a>
          {item.city && <> · 📍 {item.city}</>}
          {" · "}<span className="text-muted-foreground">{t(CATEGORY_KEYS[item.category] || "marketplace.other")}</span>
        </p>
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          {item.whatsapp && (
            <WhatsAppButton whatsapp={item.whatsapp} title={item.title} t={t} />
          )}
          <ShareButton item={item} t={t} />
          {currentUserId && item.sellerId && item.sellerId !== currentUserId && (
            <button
              onClick={(e) => { e.stopPropagation(); onContact(item.sellerId); }}
              className="bg-primary text-primary-foreground border-none px-3 py-1.5 text-sm cursor-pointer hover:opacity-90 rounded-sm"
            >
              💬 {t("marketplace.contact")}
            </button>
          )}
        </div>
        {isOwner && (
          <div className="flex flex-col gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground">
              <Checkbox checked={soldChecked} onCheckedChange={(c) => handleSoldCheck(c === true)} className="h-4 w-4" />
              {t("marketplace.mark_sold_check")}
            </label>
            <AlertDialog open={showSoldConfirm} onOpenChange={(open) => { if (!open) handleCancelSold(); }}>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("marketplace.sold_confirm_title")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("marketplace.sold_confirm_desc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={handleCancelSold}>{t("marketplace.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmSold}>{t("marketplace.confirm_sold")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="bg-destructive text-destructive-foreground border-none px-3 py-1 text-xs cursor-pointer hover:opacity-80 rounded-sm">
                  🗑 {t("marketplace.delete_item")}
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t("marketplace.delete_confirm_title")}</AlertDialogTitle>
                  <AlertDialogDescription>{t("marketplace.delete_confirm_desc")}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t("marketplace.cancel")}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(item.id)}>{t("marketplace.delete_item")}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
        {currentUserId && !isOwner && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <ReportButton contentType="marketplace_item" contentId={item.id} reportedUserId={item.sellerId} className="text-xs" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceItemCard;
