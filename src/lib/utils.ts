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

export function determineUserRole(email: string): "admin" | "partner" | "member" {
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes("admin")) {
    return "admin";
  }
  if (lowerEmail.includes("partner") || lowerEmail.includes("gym")) {
    return "partner";
  }
  return "member";
}
