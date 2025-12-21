"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STATIC_PASSWORD = "oldenfyre123"; // In production, this should be stored securely
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    const checkSession = () => {
      const sessionData = localStorage.getItem("oldenfyre_session");
      let authenticated = false;

      if (sessionData) {
        try {
          const { timestamp } = JSON.parse(sessionData);
          const now = Date.now();

          if (now - timestamp < SESSION_DURATION) {
            authenticated = true;
          } else {
            // Session expired
            localStorage.removeItem("oldenfyre_session");
          }
        } catch (error) {
          localStorage.removeItem("oldenfyre_session");
        }
      }

      return authenticated;
    };

    const authenticated = checkSession();

    // Defer state updates to avoid synchronous setState in effect
    setTimeout(() => {
      setIsAuthenticated(authenticated);
      setIsLoading(false);
    }, 0);
  }, []);

  const login = (password: string): boolean => {
    if (password === STATIC_PASSWORD) {
      const sessionData = {
        timestamp: Date.now(),
      };
      localStorage.setItem("oldenfyre_session", JSON.stringify(sessionData));
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("oldenfyre_session");
    setIsAuthenticated(false);
  };

  // Check session expiry periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const checkSession = () => {
      const sessionData = localStorage.getItem("oldenfyre_session");
      if (sessionData) {
        try {
          const { timestamp } = JSON.parse(sessionData);
          const now = Date.now();

          if (now - timestamp >= SESSION_DURATION) {
            logout();
          }
        } catch (error) {
          logout();
        }
      }
    };

    const interval = setInterval(checkSession, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
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
