#!/usr/bin/env node
/**
 * Generates js/firebase-config.js from environment variables (frontend/.env locally,
 * or the platform's env vars on Vercel) so real Firebase project values never need to
 * be hardcoded in committed source. Run via `npm run build` / `npm run dev`.
 */
const fs = require('fs');
const path = require('path');

function loadDotEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const root = path.join(__dirname, '..');
const env = { ...loadDotEnv(path.join(root, '.env')), ...process.env };

const firebaseConfig = {
  apiKey: env.FIREBASE_API_KEY || 'YOUR_API_KEY',
  authDomain: env.FIREBASE_AUTH_DOMAIN || 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: env.FIREBASE_PROJECT_ID || 'YOUR_PROJECT_ID',
  storageBucket: env.FIREBASE_STORAGE_BUCKET || 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: env.FIREBASE_MESSAGING_SENDER_ID || 'YOUR_MESSAGING_SENDER_ID',
  appId: env.FIREBASE_APP_ID || 'YOUR_APP_ID',
  measurementId: env.FIREBASE_MEASUREMENT_ID || 'YOUR_MEASUREMENT_ID',
};

const output = `/**
 * Firebase Project Configuration - GENERATED FILE, do not edit by hand.
 *
 * Generated from environment variables by scripts/generate-firebase-config.js
 * (see frontend/.env.example). Set these in frontend/.env for local development,
 * or under your Vercel project's Environment Variables for deployment - the build
 * command already runs this generator.
 *
 * See the root README's "Firebase Setup" section for the full walkthrough.
 *
 * These values are safe to ship in client-side code - Firebase access control comes from
 * Authentication + Firestore Security Rules, not from keeping this config secret.
 */
window.SKILLPATH_FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig, null, 2)};
`;

fs.writeFileSync(path.join(root, 'js', 'firebase-config.js'), output);
console.log('[generate-firebase-config] Wrote js/firebase-config.js from environment variables.');
