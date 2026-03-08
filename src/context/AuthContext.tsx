import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  name: string;
  email: string;
  bio: string;
  photoUrl: string;
  school: string;
  birthdate: string;
  city: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (identifier: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string, school: string, birthdate: string, city: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<User | null> {
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();
  if (!data) return null;
  return {
    id: data.user_id,
    name: data.name,
    email: data.email,
    bio: data.bio || "",
    photoUrl: data.photo_url || "",
    school: data.school || "",
    birthdate: data.birthdate || "",
    city: data.city || "",
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (identifier: string, password: string): Promise<boolean> => {
    // Check if identifier looks like a phone number
    const isPhone = identifier.startsWith("+") || /^\d{10,}$/.test(identifier.trim());

    if (isPhone) {
      const phone = identifier.startsWith("+") ? identifier : `+55${identifier}`;
      const { error } = await supabase.auth.signInWithPassword({ phone, password });
      return !error;
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: identifier, password });
      return !error;
    }
  };

  const register = async (name: string, email: string, password: string, school: string, birthdate: string, city: string, phone?: string): Promise<boolean> => {
    const options: any = {
      email,
      password,
      options: { data: { name } },
    };
    if (phone) {
      options.phone = phone;
    }

    const { data, error } = await supabase.auth.signUp(options);
    if (error || !data.user) return false;

    // Update profile with extra info
    await supabase
      .from("profiles")
      .update({ school, name, birthdate, city })
      .eq("user_id", data.user.id);

    return true;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!user) return;
    const updates: Record<string, string> = {};
    if (data.bio !== undefined) updates.bio = data.bio;
    if (data.school !== undefined) updates.school = data.school;
    if (data.name !== undefined) updates.name = data.name;
    if (data.photoUrl !== undefined) updates.photo_url = data.photoUrl;

    await supabase.from("profiles").update(updates).eq("user_id", user.id);
    setUser({ ...user, ...data });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
