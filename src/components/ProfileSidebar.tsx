interface ProfileSidebarProps {
  name: string;
  bio: string;
  photoUrl: string;
  school?: string;
}

const ProfileSidebar = ({ name, bio, photoUrl, school }: ProfileSidebarProps) => {
  return (
    <div className="bg-card border border-border p-2 w-full">
      <div className="border-b border-border pb-1 mb-2">
        <h3 className="text-[13px] font-bold text-primary">{name}</h3>
      </div>
      <div className="flex flex-col items-center gap-2">
        <img
          src={photoUrl}
          alt={name}
          className="w-[100px] h-[100px] border border-border object-cover"
        />
        <div className="text-[11px] w-full">
          {school && (
            <p className="mb-1"><b>School:</b> {school}</p>
          )}
          <p className="text-muted-foreground">{bio}</p>
        </div>
      </div>
      <div className="mt-3 border-t border-border pt-2 text-[11px]">
        <p className="font-bold text-primary mb-1">Info</p>
        <p>Member since: February 2004</p>
        <p>Status: Student</p>
        <p>Looking for: Friendship</p>
      </div>
    </div>
  );
};

export default ProfileSidebar;
