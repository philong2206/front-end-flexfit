import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

export type Role = "member" | "partner" | "admin" | null;

export interface User {
  fullName: string;
  email: string;
  role: Role;
  avatar?: string;
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
  document.documentElement.classList.remove("theme-partner", "theme-admin");
  if (newRole === "partner") document.documentElement.classList.add("theme-partner");
  if (newRole === "admin") document.documentElement.classList.add("theme-admin");
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem("flexfit_user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  
  const role = user?.role || null;
  
  useEffect(() => {
    if (role) {
      applyTheme(role);
    }
  }, [role]);

  const login = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem("flexfit_user", JSON.stringify(newUser));
    applyTheme(newUser.role);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("flexfit_user");
    localStorage.removeItem("access_token");
    applyTheme(null);
  };

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
