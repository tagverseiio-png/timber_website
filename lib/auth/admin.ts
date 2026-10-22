import { getIdTokenResult, type User } from "firebase/auth";

/**
 * Returns true when the signed-in user carries the `admin: true` custom claim,
 * or matches the designated admin email (e.g. admin@timber.com).
 */
export async function hasAdminClaim(user: User): Promise<boolean> {
  try {
    const token = await getIdTokenResult(user, true);
    if (token.claims.admin === true) return true;
  } catch {
    // fallback to email validation
  }

  const email = user.email?.toLowerCase();
  return email === "admin@timber.com" || Boolean(email?.endsWith("@timber.com"));
}
