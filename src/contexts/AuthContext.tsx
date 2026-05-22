import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { parseJwt } from "@/lib/utils";

export type Role = "member" | "partner" | "admin" | "staff" | null;

export interface User {
  userId?: string;
  fullName: string;
  email: string;
  role: Role;
  avatar?: string;
  phoneNumber?: string;
}

interface AuthContextType {
  role: Role;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const applyTheme = (newRole: Role) => {
  document.documentElement.classList.remove("theme-partner", "theme-admin", "theme-staff");
  if (newRole === "partner") document.documentElement.classList.add("theme-partner");
  if (newRole === "admin") document.documentElement.classList.add("theme-admin");
  if (newRole === "staff") document.documentElement.classList.add("theme-staff");
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const token = localStorage.getItem("access_token");
    const savedUser = localStorage.getItem("flexfit_user");
    // Avoid "logged in" UI without a token — protected APIs will 401
    if (savedUser && !token) {
      localStorage.removeItem("flexfit_user");
      return null;
    }
    if (!savedUser) return null;
    let parsed = JSON.parse(savedUser);
    if (parsed && !parsed.userId) {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const payload = parseJwt(token);
          if (payload?.sub) {
            parsed = { ...parsed, userId: payload.sub };
            localStorage.setItem("flexfit_user", JSON.stringify(parsed));
          }
        } catch (e) {
          console.error("Failed to repair user session at init", e);
        }
      }
    }
    return parsed;
  });
  
  const role = user?.role || null;
  
  useEffect(() => {
    if (role) {
      applyTheme(role);
    }
  }, [role]);

  const login = useCallback((newUser: User) => {
    setUser(newUser);
    localStorage.setItem("flexfit_user", JSON.stringify(newUser));
    applyTheme(newUser.role);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("flexfit_user");
    localStorage.removeItem("access_token");
    applyTheme(null);
  }, []);

  return (
    <AuthContext.Provider value={{ role, user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
