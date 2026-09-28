// Two separate 30-minute TTL sessions in sessionStorage:
// - santander.session    → client user
// - santander.admin.session → admin

const CLIENT_KEY = "santander.session";
const ADMIN_KEY = "santander.admin.session";
const TTL_MS = 30 * 60 * 1000; // 30 minutes

type ClientSession = {
  userId: string;
  email: string;
  expiresAt: number;
};

type AdminSession = {
  expiresAt: number;
};

// ── CLIENT AUTH ──────────────────────────────────────────────────────────────

export function getClientSession(): ClientSession | null {
  try {
    const raw = sessionStorage.getItem(CLIENT_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as ClientSession;
    if (Date.now() > s.expiresAt) {
      sessionStorage.removeItem(CLIENT_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function setClientSession(userId: string, email: string): void {
  const s: ClientSession = {
    userId,
    email,
    expiresAt: Date.now() + TTL_MS,
  };
  sessionStorage.setItem(CLIENT_KEY, JSON.stringify(s));
}

export function clearClientSession(): void {
  sessionStorage.removeItem(CLIENT_KEY);
}

export function isClientAuthed(): boolean {
  return getClientSession() !== null;
}

// ── ADMIN AUTH ───────────────────────────────────────────────────────────────

const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL as string | undefined;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string | undefined;
const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN as string | undefined;

// Fallback defaults for local dev when env vars not set
export const adminCredentials = {
  email: ADMIN_EMAIL || "admin@santander.app",
  password: ADMIN_PASSWORD || "admin1234",
  pin: ADMIN_PIN || "1234",
};

export function getAdminSession(): AdminSession | null {
  try {
    const raw = sessionStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as AdminSession;
    if (Date.now() > s.expiresAt) {
      sessionStorage.removeItem(ADMIN_KEY);
      return null;
    }
    return s;
  } catch {
    return null;
  }
}

export function setAdminSession(): void {
  const s: AdminSession = { expiresAt: Date.now() + TTL_MS };
  sessionStorage.setItem(ADMIN_KEY, JSON.stringify(s));
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_KEY);
}

export function isAdminAuthed(): boolean {
  return getAdminSession() !== null;
}
