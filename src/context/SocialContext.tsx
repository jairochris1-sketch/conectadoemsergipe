import { createContext, useContext, useState, ReactNode } from "react";

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  timestamp: Date;
}

export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  fromPhoto: string;
  toId: string;
  status: "pending" | "accepted" | "rejected";
}

interface SocialContextType {
  posts: Post[];
  createPost: (authorId: string, authorName: string, authorPhoto: string, content: string) => void;
  friendRequests: FriendRequest[];
  sendFriendRequest: (fromId: string, fromName: string, fromPhoto: string, toId: string) => void;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  getFriends: (userId: string) => { id: string; name: string; photo: string }[];
  getPendingRequests: (userId: string) => FriendRequest[];
  isFriend: (userId: string, otherId: string) => boolean;
  hasPendingRequest: (fromId: string, toId: string) => boolean;
}

const SocialContext = createContext<SocialContextType | null>(null);

const MOCK_USERS = [
  { id: "1", name: "Mark Zuckerberg", photo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg/220px-Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg" },
  { id: "mock-2", name: "Eduardo Saverin", photo: "" },
  { id: "mock-3", name: "Dustin Moskovitz", photo: "" },
  { id: "mock-4", name: "Chris Hughes", photo: "" },
];

const INITIAL_POSTS: Post[] = [
  {
    id: "p1",
    authorId: "1",
    authorName: "Mark Zuckerberg",
    authorPhoto: MOCK_USERS[0].photo,
    content: "Welcome to thefacebook! This is a social directory for college students.",
    timestamp: new Date("2004-02-04T15:22:00"),
  },
  {
    id: "p2",
    authorId: "mock-2",
    authorName: "Eduardo Saverin",
    authorPhoto: "",
    content: "Just joined thefacebook. This is going to be big!",
    timestamp: new Date("2004-02-05T11:15:00"),
  },
  {
    id: "p3",
    authorId: "mock-3",
    authorName: "Dustin Moskovitz",
    authorPhoto: "",
    content: "Working on some new features for the site. Stay tuned!",
    timestamp: new Date("2004-02-06T09:30:00"),
  },
  {
    id: "p4",
    authorId: "mock-4",
    authorName: "Chris Hughes",
    authorPhoto: "",
    content: "Harvard students - make sure to register to connect with friends!",
    timestamp: new Date("2004-02-07T14:45:00"),
  },
];

const INITIAL_FRIENDS: FriendRequest[] = [
  { id: "fr1", fromId: "1", fromName: "Mark Zuckerberg", fromPhoto: MOCK_USERS[0].photo, toId: "mock-2", status: "accepted" },
  { id: "fr2", fromId: "1", fromName: "Mark Zuckerberg", fromPhoto: MOCK_USERS[0].photo, toId: "mock-3", status: "accepted" },
  { id: "fr3", fromId: "mock-4", fromName: "Chris Hughes", fromPhoto: "", toId: "1", status: "accepted" },
];

export const SocialProvider = ({ children }: { children: ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>(INITIAL_FRIENDS);

  const createPost = (authorId: string, authorName: string, authorPhoto: string, content: string) => {
    const post: Post = {
      id: `p-${Date.now()}`,
      authorId,
      authorName,
      authorPhoto,
      content,
      timestamp: new Date(),
    };
    setPosts((prev) => [post, ...prev]);
  };

  const sendFriendRequest = (fromId: string, fromName: string, fromPhoto: string, toId: string) => {
    if (hasPendingRequest(fromId, toId) || isFriend(fromId, toId)) return;
    const req: FriendRequest = {
      id: `fr-${Date.now()}`,
      fromId,
      fromName,
      fromPhoto,
      toId,
      status: "pending",
    };
    setFriendRequests((prev) => [...prev, req]);
  };

  const acceptFriendRequest = (requestId: string) => {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "accepted" as const } : r))
    );
  };

  const rejectFriendRequest = (requestId: string) => {
    setFriendRequests((prev) =>
      prev.map((r) => (r.id === requestId ? { ...r, status: "rejected" as const } : r))
    );
  };

  const getFriends = (userId: string) => {
    const accepted = friendRequests.filter((r) => r.status === "accepted" && (r.fromId === userId || r.toId === userId));
    return accepted.map((r) => {
      if (r.fromId === userId) {
        // Find the "to" user info - we need to look them up
        const mock = MOCK_USERS.find((u) => u.id === r.toId);
        return { id: r.toId, name: mock?.name || "User", photo: mock?.photo || "" };
      } else {
        return { id: r.fromId, name: r.fromName, photo: r.fromPhoto };
      }
    });
  };

  const getPendingRequests = (userId: string) => {
    return friendRequests.filter((r) => r.status === "pending" && r.toId === userId);
  };

  const isFriend = (userId: string, otherId: string) => {
    return friendRequests.some(
      (r) => r.status === "accepted" && ((r.fromId === userId && r.toId === otherId) || (r.fromId === otherId && r.toId === userId))
    );
  };

  const hasPendingRequest = (fromId: string, toId: string) => {
    return friendRequests.some(
      (r) => r.status === "pending" && ((r.fromId === fromId && r.toId === toId) || (r.fromId === toId && r.toId === fromId))
    );
  };

  return (
    <SocialContext.Provider
      value={{ posts, createPost, friendRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, getFriends, getPendingRequests, isFriend, hasPendingRequest }}
    >
      {children}
    </SocialContext.Provider>
  );
};

export const useSocial = () => {
  const ctx = useContext(SocialContext);
  if (!ctx) throw new Error("useSocial must be used within SocialProvider");
  return ctx;
};
