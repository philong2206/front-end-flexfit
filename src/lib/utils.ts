import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    
    // Normalize C# SOAP claims to standard JWT claim names
    if (payload) {
      if (payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] && !payload.sub) {
        payload.sub = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"];
      }
      if (payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"] && !payload.email) {
        payload.email = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"];
      }
    }

    return payload;
  } catch {
    return null;
  }
}

export function determineUserRole(email: string, payload?: Record<string, unknown>): "admin" | "partner" | "staff" | "member" {
  // 1. Try to get role from JWT payload first (most reliable)
  if (payload) {
    // Check standard role claim
    const jwtRole = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    if (jwtRole) {
      const roleStr = String(jwtRole).toLowerCase();
      
      // Map exact DB roles
      if (roleStr === "admin") return "admin";
      if (roleStr === "gympartner" || roleStr === "partner") return "partner";
      if (roleStr === "staff") return "staff";
      if (roleStr === "member" || roleStr === "user") return "member";
    }
  }

  // 2. Fallback to email-based detection (less reliable)
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes("admin")) return "admin";
  if (lowerEmail.includes("partner") || lowerEmail.includes("gym")) return "partner";
  if (lowerEmail.includes("staff")) return "staff";
  
  // 3. Default to member
  return "member";
}
