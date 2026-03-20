import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    const t = localStorage.getItem("token");
    // console.log("Initial token from localStorage:", t); // 👈 add this
    return t;
  });
  const [loading, setLoading] = useState(true);

  // 🔥 RESTORE SESSION
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error();

        const data = await res.json();
        setUser(data);
      } catch {
        logout(); // ❌ invalid token
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = (newToken: string) => {
    console.log("login() called with:", newToken); // 👈
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, isLoading: loading,  isAuthenticated: !!user, }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthContext not found");
  return context;
};