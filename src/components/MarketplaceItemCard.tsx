import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import ReportButton from "@/components/ReportButton";
import { CATEGORY_KEYS } from "@/pages/Marketplace";
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
  isSponsored?: boolean;
  sold?: boolean;
}

interface Props {
  item: MarketItem;
  variant: "grid" | "list";
  currentUserId?: string;
  onTrackClick: (id: string, category: string) => void;
  onDelete: (id: string) => void;
  onMarkSold: (id: string) => void;
  onContact: (sellerId: string) => void;
}

const MarketplaceItemCard = ({ item, variant, currentUserId, onTrackClick, onDelete, onMarkSold, onContact }: Props) => {
  const { t } = useLanguage();
  const isOwner = currentUserId && item.sellerId === currentUserId;

  if (variant === "grid") {
    return (
      <div
        className={`relative border p-2 cursor-pointer hover:bg-accent transition-colors ${
          item.sold ? "opacity-60 border-muted" : item.isSponsored ? "border-primary/50 bg-primary/5" : "border-primary/30 bg-accent/50"
        }`}
        onClick={() => onTrackClick(item.id, item.category)}
      >
        {item.sold && (
          <span className="absolute top-0 left-0 text-[8px] font-bold text-destructive-foreground bg-destructive px-[6px] py-[1px] z-10">
            {t("marketplace.sold_label")}
          </span>
        )}
        {item.isSponsored && !item.sold && (
          <span className="absolute top-0 right-0 text-[7px] font-bold text-primary-foreground bg-primary px-[4px] py-[1px]">
            ⭐ {t("ads.sponsored")}
          </span>
        )}
        <div className="w-full h-[60px] bg-muted border border-border flex items-center justify-center overflow-hidden mb-1">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <span className="text-[18px]">📦</span>
          )}
        </div>
        <p className="text-[10px] font-bold truncate">{item.title}</p>
        <p className="text-[10px] font-bold text-primary">{item.price}</p>
        <p className="text-[9px] text-muted-foreground truncate">
          {item.city && <>📍 {item.city} · </>}
          {item.seller}
        </p>
        {currentUserId && item.sellerId && item.sellerId !== currentUserId && !item.sold && (
          <button
            onClick={(e) => { e.stopPropagation(); onContact(item.sellerId); }}
            className="mt-1 bg-primary text-primary-foreground border-none px-2 py-[1px] text-[9px] cursor-pointer hover:opacity-90"
          >
            💬 {t("marketplace.contact")}
          </button>
        )}
        {isOwner && !item.sold && (
          <div className="flex gap-1 mt-1">
            <button
              onClick={(e) => { e.stopPropagation(); onMarkSold(item.id); }}
              className="bg-accent text-foreground border border-border px-2 py-[1px] text-[8px] cursor-pointer hover:opacity-80"
            >
              ✅ {t("marketplace.mark_sold")}
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="bg-destructive text-destructive-foreground border-none px-2 py-[1px] text-[8px] cursor-pointer hover:opacity-80"
                >
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
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <ReportButton contentType="marketplace_item" contentId={item.id} reportedUserId={item.sellerId} className="text-[8px]" />
          </div>
        )}
      </div>
    );
  }

  // List variant
  return (
    <div
      className={`relative border p-2 flex gap-3 cursor-pointer hover:bg-accent/30 transition-colors ${
        item.sold ? "opacity-60 border-muted" : item.isSponsored ? "border-primary/50 bg-primary/5" : "border-border"
      }`}
      onClick={() => onTrackClick(item.id, item.category)}
    >
      {item.sold && (
        <span className="absolute top-0 left-0 text-[8px] font-bold text-destructive-foreground bg-destructive px-[6px] py-[1px] z-10">
          {t("marketplace.sold_label")}
        </span>
      )}
      {item.isSponsored && !item.sold && (
        <span className="absolute top-0 right-0 text-[8px] font-bold text-primary-foreground bg-primary px-[6px] py-[1px]">
          ⭐ {t("ads.sponsored")}
        </span>
      )}
      <div className="w-[70px] h-[70px] bg-muted border border-border flex items-center justify-center shrink-0 overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[20px]">📦</span>
        )}
      </div>
      <div className="text-[11px] flex-1">
        <div className="flex justify-between">
          <a href="#" className="font-bold">{item.title}</a>
          <span className="font-bold text-primary">{item.price}</span>
        </div>
        <p className="text-muted-foreground mt-1">{item.description}</p>
        <p className="mt-1 flex items-center gap-1 flex-wrap">
          {t("marketplace.seller")}: <a href="#">{item.seller}</a>
          {item.city && <> · 📍 {item.city}</>}
          {" · "}<span className="text-muted-foreground">{t(CATEGORY_KEYS[item.category] || "marketplace.other")}</span>
          {currentUserId && item.sellerId && item.sellerId !== currentUserId && !item.sold && (
            <button
              onClick={(e) => { e.stopPropagation(); onContact(item.sellerId); }}
              className="ml-1 bg-primary text-primary-foreground border-none px-2 py-[1px] text-[10px] cursor-pointer hover:opacity-90"
            >
              💬 {t("marketplace.contact")}
            </button>
          )}
        </p>
        {isOwner && (
          <div className="flex gap-1 mt-1">
            {!item.sold && (
              <button
                onClick={(e) => { e.stopPropagation(); onMarkSold(item.id); }}
                className="bg-accent text-foreground border border-border px-2 py-[1px] text-[9px] cursor-pointer hover:opacity-80"
              >
                ✅ {t("marketplace.mark_sold")}
              </button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="bg-destructive text-destructive-foreground border-none px-2 py-[1px] text-[9px] cursor-pointer hover:opacity-80"
                >
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
          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
            <ReportButton contentType="marketplace_item" contentId={item.id} reportedUserId={item.sellerId} className="text-[9px]" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketplaceItemCard;
