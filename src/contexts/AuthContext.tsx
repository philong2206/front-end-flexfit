import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Role = "member" | "partner" | "admin" | null;

interface AuthContextType {
  role: Role;
  login: (role: Role) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  
  useEffect(() => {
    // Load role from localStorage if exists
    const savedRole = localStorage.getItem("flexfit_role") as Role;
    if (savedRole) {
      setRole(savedRole);
      applyTheme(savedRole);
    }
  }, []);

  const applyTheme = (newRole: Role) => {
    document.documentElement.classList.remove("theme-partner", "theme-admin");
    if (newRole === "partner") document.documentElement.classList.add("theme-partner");
    if (newRole === "admin") document.documentElement.classList.add("theme-admin");
  };

  const login = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem("flexfit_role", newRole || "");
    applyTheme(newRole);
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem("flexfit_role");
    applyTheme(null);
  };

  return (
    <AuthContext.Provider value={{ role, login, logout, isAuthenticated: !!role }}>
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
