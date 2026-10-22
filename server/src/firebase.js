import admin from "firebase-admin";
import { config } from "./config.js";

function loadCredential() {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return null; // ADC
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON (see server/.env.example)."
    );
  }
  return admin.credential.cert(JSON.parse(raw));
}

const credential = loadCredential();

admin.initializeApp({
  ...(credential ? { credential } : {}),
  databaseURL: config.firebaseDatabaseURL,
});

export const db = admin.database();
export const auth = admin.auth();
export { admin };
