import { UsageStats } from "./usage";

export interface User {
  id: string;
  email: string;
  plan: 'free' |'starter' | 'premium';
}

export interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isPremium: boolean;
  isStarter: boolean;
  usage: UsageStats | null;
  loading: (loading:boolean) => void;
  fetchUsage: () => Promise<void>;
  fetchUser: () => Promise<void>;

}