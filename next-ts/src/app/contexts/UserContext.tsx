"use client"
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { UsageStats } from "@/types/usage";
import { User, UserContextType } from "@/types/user";

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    fetchUser();
    fetchUsage();
    setIsLoading(false);
  }, []);

  const fetchUser = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch("/api/user");
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
    }
  };
  const fetchUsage = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch("/api/usage");
      const userData = await response.json();
      setUsage(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
    }
  };
  const loading = (loading: boolean) => setIsLoading(loading);
  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        loading,
        isPremium: user?.plan === "premium",
        isStarter: user?.plan === "starter",
        usage,
        fetchUser,
        fetchUsage,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
};
