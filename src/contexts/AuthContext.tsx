import React, { createContext, useContext, useState, useEffect } from "react";

interface User {
  mobile: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isHydrating: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    // Load auth from localStorage on mount with safe parsing
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("auth_user");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch (error) {
        console.warn("Failed to parse stored auth_user, clearing it", error);
        localStorage.removeItem("auth_user");
      }
    }

    setIsHydrating(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    localStorage.setItem("auth_token", newToken);

    if (newUser) {
      setUser(newUser);
      localStorage.setItem("auth_user", JSON.stringify(newUser));
    } else {
      setUser(null);
      localStorage.removeItem("auth_user");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isHydrating,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
