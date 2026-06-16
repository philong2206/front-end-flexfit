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

function extractRoleNames(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(extractRoleNames);
  if (typeof value === "object") {
    const role = value as Record<string, unknown>;
    return [role.role, role.roleName, role.name, role.roles, role.userRoles].flatMap(extractRoleNames);
  }
  return [];
}

export function getRoleNamesFromPayload(payload?: Record<string, unknown> | null): string[] {
  if (!payload) return [];
  const jwtRole = payload["role"] || payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  return extractRoleNames(jwtRole)
    .map((role) => role.trim())
    .filter(Boolean);
}

export function getPrimaryRole(roles: string[]): "admin" | "partner" | "staff" | "member" {
  const roleNames = roles.map((role) => role.trim().toLowerCase());

  if (roleNames.includes("admin")) return "admin";
  if (roleNames.includes("gympartner") || roleNames.includes("partner")) return "partner";
  if (roleNames.includes("staff")) return "staff";
  return "member";
}

export function determineUserRole(email: string, payload?: Record<string, unknown>): "admin" | "partner" | "staff" | "member" {
  // 1. Try to get role from JWT payload first (most reliable)
  if (payload) {
    const roleNames = getRoleNamesFromPayload(payload);
    if (roleNames.length > 0) return getPrimaryRole(roleNames);
  }

  // 2. Fallback to email-based detection (less reliable)
  const lowerEmail = email.toLowerCase();
  if (lowerEmail.includes("admin")) return "admin";
  if (lowerEmail.includes("partner") || lowerEmail.includes("gym")) return "partner";
  if (lowerEmail.includes("staff")) return "staff";
  
  // 3. Default to member
  return "member";
}
