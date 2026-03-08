import { createContext, useContext, useState, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  photoUrl: string;
  school: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  register: (name: string, email: string, password: string, school: string) => boolean;
  logout: () => void;
  updateProfile: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Simple in-memory user store (will be replaced by DB later)
const users: (User & { password: string })[] = [
  {
    id: "1",
    name: "Mark Zuckerberg",
    email: "mark@harvard.edu",
    password: "facebook2004",
    bio: "I'm CEO, bitch.",
    photoUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg/220px-Mark_Zuckerberg_F8_2019_Keynote_%2832830578717%29_%28cropped%29.jpg",
    school: "Harvard University",
  },
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = (email: string, password: string): boolean => {
    const found = users.find((u) => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...userData } = found;
      setUser(userData);
      return true;
    }
    return false;
  };

  const register = (name: string, email: string, password: string, school: string): boolean => {
    if (users.find((u) => u.email === email)) return false;
    const newUser = {
      id: String(Date.now()),
      name,
      email,
      password,
      bio: "",
      photoUrl: "",
      school,
    };
    users.push(newUser);
    const { password: _, ...userData } = newUser;
    setUser(userData);
    return true;
  };

  const logout = () => setUser(null);

  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    const idx = users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...data };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
