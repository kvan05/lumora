/**
 * Staff authentication utilities.
 * Staff uses standalone localStorage token (no NextAuth) to avoid
 * conflicting with Seller/Buyer/Admin sessions.
 */

const STAFF_TOKEN_KEY = "lumora_staff_token";
const STAFF_USER_KEY = "lumora_staff_user";
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export interface StaffUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  avatar: string | null;
}

// ─── Token management ─────────────────────────────────────────────────────────
export function getStaffToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STAFF_TOKEN_KEY);
}

export function getStaffUser(): StaffUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STAFF_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStaffSession(token: string, user: StaffUser): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STAFF_TOKEN_KEY, token);
  localStorage.setItem(STAFF_USER_KEY, JSON.stringify(user));
  updateLastActivity();
}

export function clearStaffSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STAFF_TOKEN_KEY);
  localStorage.removeItem(STAFF_USER_KEY);
  localStorage.removeItem("lumora_staff_last_activity");
}

export function isStaffLoggedIn(): boolean {
  return !!getStaffToken() && !!getStaffUser();
}

// ─── Inactivity auto-logout ───────────────────────────────────────────────────
function updateLastActivity(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("lumora_staff_last_activity", Date.now().toString());
}

export function checkInactivityTimeout(): boolean {
  if (typeof window === "undefined") return false;
  const lastActivity = localStorage.getItem("lumora_staff_last_activity");
  if (!lastActivity) return false;
  return Date.now() - parseInt(lastActivity) > INACTIVITY_TIMEOUT_MS;
}

export function setupInactivityTimer(onLogout: () => void): () => void {
  if (typeof window === "undefined") return () => {};

  const activityEvents = ["mousemove", "keydown", "click", "touchstart", "scroll"];
  let timer: ReturnType<typeof setTimeout>;

  function resetTimer() {
    updateLastActivity();
    clearTimeout(timer);
    timer = setTimeout(() => {
      clearStaffSession();
      onLogout();
    }, INACTIVITY_TIMEOUT_MS);
  }

  // Start timer
  resetTimer();

  // Add event listeners
  activityEvents.forEach((event) => {
    window.addEventListener(event, resetTimer, { passive: true });
  });

  // Cleanup function
  return () => {
    clearTimeout(timer);
    activityEvents.forEach((event) => {
      window.removeEventListener(event, resetTimer);
    });
  };
}
