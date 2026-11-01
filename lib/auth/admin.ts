import { getIdTokenResult, type User } from "firebase/auth";

/**
 * Returns true ONLY when the signed-in user carries the `admin: true` custom
 * claim (set server-side via server/set-admin-claim.mjs). No email fallback —
 * otherwise anyone who registers e.g. anything@timber.com would see the whole
 * admin UI.
 */
export async function hasAdminClaim(user: User): Promise<boolean> {
  try {
    const token = await getIdTokenResult(user, true);
    return token.claims.admin === true;
  } catch {
    return false;
  }
}
