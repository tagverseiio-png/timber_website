import { getIdTokenResult, type User } from "firebase/auth";

export const AUTHORIZED_ADMIN_EMAILS = [
  "admin@timber_ts.com",
  "admin@timber-ts.com",
  "admin@tgtimber.com",
  "admin@tg-timber.com",
  "admin@tg.timber",
  "admin@timberteak.com",
] as const;

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return AUTHORIZED_ADMIN_EMAILS.some((adm) => adm === normalized);
}

/**
 * Returns true when the signed-in user carries the `admin: true` custom
 * claim OR has one of the authorized admin email addresses (e.g. Admin@timber_TS.com).
 */
export async function hasAdminClaim(user: User): Promise<boolean> {
  if (user.email && isAuthorizedAdminEmail(user.email)) {
    return true;
  }
  try {
    const token = await getIdTokenResult(user, true);
    return token.claims.admin === true;
  } catch {
    return false;
  }
}
