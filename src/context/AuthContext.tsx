import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

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
          
          // Check if user has an order
          authAPI.getMyOrders()
            .then(orders => {
              setHasOrder(orders.length > 0);
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

  const login = (token: string) => {
    localStorage.setItem('token', token);
    authAPI.getCurrentUser()
      .then(userData => {
        setUser(userData);
        
        // Check if user has an order
        authAPI.getMyOrders()
          .then(orders => {
            setHasOrder(orders.length > 0);
          })
          .catch(() => {
            localStorage.removeItem('token');
          });
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      await authAPI.register({ name, email, password });
      await login(email);
      
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

  const logout = () => {
    localStorage.removeItem('token');
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