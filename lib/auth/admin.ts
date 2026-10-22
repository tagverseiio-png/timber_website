import { getIdTokenResult, type User } from "firebase/auth";

/**
 * Returns true when the signed-in user carries the `admin: true` custom claim.
 *
 * Forces a token refresh so a claim granted while the user is signed in
 * takes effect without a manual re-login. This gate is UX-only — real
 * enforcement lives in database.rules.json / storage.rules. Hiding UI is
 * NOT security.
 */
export async function hasAdminClaim(user: User): Promise<boolean> {
  const token = await getIdTokenResult(user, true);
  return token.claims.admin === true;
}
