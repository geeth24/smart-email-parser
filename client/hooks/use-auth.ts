import { useState, useEffect, useCallback } from 'react';
import { apiClient, User } from '@/lib/api-client';
import { toast } from 'sonner';

export function useAuth() {
  const [userId, setUserId] = useState<number | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  // Logout function declaration (will be defined below)
  const logout = useCallback(async () => {
    setIsLoading(true);
    
    try {
      if (userId) {
        await apiClient.logout(userId);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    } finally {
      localStorage.removeItem('userId');
      setUserId(null);
      setUser(null);
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch user data function
  const fetchUser = useCallback(async (id: number) => {
    setIsLoading(true);
    setIsError(false);
    
    try {
      const userData = await apiClient.getUser(id);
      setUser(userData);
      
      // If token is expired, clear state
      if (!userData.is_authenticated) {
        logout();
        toast.error("Session expired", {
          description: "Please sign in again to continue.",
        });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      setIsError(true);
      setUser(null);
      
      // Clear userId if user not found
      if ((error as Error).message.includes('404')) {
        logout();
      }
    } finally {
      setIsLoading(false);
    }
  }, [logout]);

  // Load userId from localStorage on component mount
  useEffect(() => {
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) {
      try {
        const id = Number(storedUserId);
        if (isNaN(id) || id <= 0) {
          console.error('Invalid user ID in localStorage:', storedUserId);
          localStorage.removeItem('userId');
          return;
        }
        setUserId(id);
        fetchUser(id);
      } catch (error) {
        console.error('Error parsing user ID:', error);
        localStorage.removeItem('userId');
      }
    }
  }, [fetchUser]);

  // Login function
  const login = useCallback((newUserId: number) => {
    try {
      // Validate user ID
      if (isNaN(newUserId) || newUserId <= 0) {
        throw new Error('Invalid user ID provided');
      }
      
      localStorage.setItem('userId', String(newUserId));
      setUserId(newUserId);
      fetchUser(newUserId);
    } catch (error) {
      console.error('Error during login:', error);
      toast.error('Login failed', {
        description: (error as Error).message
      });
    }
  }, [fetchUser]);

  return {
    userId,
    user,
    isAuthenticated: !!user?.is_authenticated,
    isLoading,
    isError,
    login,
    logout
  };
} 