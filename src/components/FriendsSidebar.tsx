import { useLanguage } from "@/context/LanguageContext";

const FRIENDS = [
  { name: "Mark Zuckerberg", school: "Harvard '06" },
  { name: "Eduardo Saverin", school: "Harvard '06" },
  { name: "Dustin Moskovitz", school: "Harvard '06" },
  { name: "Chris Hughes", school: "Harvard '06" },
  { name: "Andrew McCollum", school: "Harvard '06" },
  { name: "Arie Hasit", school: "Harvard '05" },
];

const FriendsSidebar = () => {
  const { t } = useLanguage();

  return (
    <div className="bg-card border border-border p-2 w-full">
      <div className="border-b border-border pb-1 mb-2">
        <h3 className="text-[13px] font-bold text-primary">{t("friends")} ({FRIENDS.length})</h3>
      </div>
      <div className="space-y-2">
        {FRIENDS.map((friend, i) => (
          <div key={i} className="flex items-center gap-2 text-[11px]">
            <div className="w-[30px] h-[30px] bg-muted border border-border flex items-center justify-center text-muted-foreground text-[8px]">
              {t("photo")}
            </div>
            <div>
              <a href="#" className="font-bold">{friend.name}</a>
              <p className="text-muted-foreground text-[10px]">{friend.school}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 border-t border-border pt-2">
        <a href="#" className="text-[11px]">{t("see_all_friends")}</a>
      </div>
    </div>
  );
};

export default FriendsSidebar;
