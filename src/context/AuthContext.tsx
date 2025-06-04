import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  name: string;
  email: string;
  image_url?: string;
  pickup_location?: string;
  time_slot?: string;
  is_admin: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (token: string) => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  hasOrder: boolean;
  refreshOrders: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [hasOrder, setHasOrder] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authAPI.getCurrentUser()
        .then(userData => {
          setUser(userData);
          if (userData.pickup_location) {
            localStorage.setItem("user_pickup_location", userData.pickup_location);
          }
          
          // Check if user has an order
          authAPI.getMyOrders()
            .then(orders => {
              setHasOrder(orders.length > 0);
              if (orders.length) {
                localStorage.setItem("user_pickup_location", orders[0].pickup_location);
              }
            })
            .catch(() => {
              localStorage.removeItem('token');
            });
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem("token", token);

    try {
      const me = await authAPI.getCurrentUser();
      setUser(me);
      if (me.pickup_location) {
        localStorage.setItem("user_pickup_location", me.pickup_location);
      }

      const orders = await authAPI.getMyOrders();
      setHasOrder(orders.length > 0);
      if (orders.length) {
        localStorage.setItem("user_pickup_location", orders[0].pickup_location);
      }
    } catch {
      localStorage.removeItem("token");
      throw new Error("token invalid");        // surface errors if you like
    }
    /* <--  nothing returned, but because the
            function is async it resolves to a Promise<void>
            that callers can await                       */
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authAPI.register({ name, email, password });
      const loginResponse = await authAPI.login(email, password);
      login(loginResponse.access_token);
      
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
    } catch (error) {
      console.error('Registration failed:', error);
      toast({
        title: "Registration failed",
        description: "Please try again with different credentials.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const refreshOrders = async () => {
    if (!token) return;
    try {
      const orders = await authAPI.getMyOrders();
      setHasOrder(orders.length > 0);
      if (orders.length) {
        localStorage.setItem("user_pickup_location", orders[0].pickup_location);
      }
    } catch (e) {
      console.error("failed to refresh orders", e);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem("user_pickup_location");
    setUser(null);
    setHasOrder(false);
    navigate('/');
    
    toast({
      title: "Logged out",
      description: "You've been successfully logged out.",
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        hasOrder,
        refreshOrders,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 