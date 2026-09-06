import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  customerId: string | null;
  login: (token: string, customerId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize from localStorage
    const savedToken = localStorage.getItem('tapnow_customer_token');
    const savedCustomerId = localStorage.getItem('tapnow_customer_id');
    if (savedToken && savedCustomerId) {
      setToken(savedToken);
      setCustomerId(savedCustomerId);
      setIsAuthenticated(true);
    }
  }, []);

  const login = (newToken: string, newCustomerId: string) => {
    localStorage.setItem('tapnow_customer_token', newToken);
    localStorage.setItem('tapnow_customer_id', newCustomerId);
    setToken(newToken);
    setCustomerId(newCustomerId);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('tapnow_customer_token');
    localStorage.removeItem('tapnow_customer_id');
    setToken(null);
    setCustomerId(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, customerId, login, logout }}>
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
