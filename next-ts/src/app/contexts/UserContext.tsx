import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  plan: 'free' |'starter' | 'premium';
}

interface UserContextType {
  user: User | null;
  isLoading: boolean;
  isPremium: boolean;
  isStarter: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user data from your API
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      // Replace with your actual API call
      const response = await fetch('/api/user');
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      isPremium: user?.plan === 'premium',
      isStarter: user?.plan === 'starter'
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};