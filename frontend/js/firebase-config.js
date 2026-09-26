/**
 * Firebase Project Configuration
 *
 * 1. Go to https://console.firebase.google.com and create a project (or reuse one).
 * 2. Click the Web icon (</>) to register a Web App - Firebase gives you a config object.
 * 3. Paste that config below, replacing every placeholder value.
 * 4. In the Firebase console, enable sign-in providers under
 *    Build -> Authentication -> Sign-in method: "Email/Password" and "Google".
 * 5. Create a Firestore database under Build -> Firestore Database -> Create database,
 *    then paste the rules from firestore.rules (repo root) into the Rules tab and Publish.
 * 6. Under Authentication -> Settings -> Authorized domains, add your deployed frontend
 *    domain (e.g. your Vercel URL) so Google Sign-In works there too.
 *
 * See the root README's "Firebase Setup" section for the full walkthrough.
 *
 * These values are safe to ship in client-side code - Firebase access control comes from
 * Authentication + Firestore Security Rules, not from keeping this config secret.
 */
window.SKILLPATH_FIREBASE_CONFIG = {
  apiKey: "AIzaSyCkqMAdX0hhz-0AiBowQ-ykU6WpzLVhU38",
  authDomain: "skillspring-5892d.firebaseapp.com",
  projectId: "skillspring-5892d",
  storageBucket: "skillspring-5892d.firebasestorage.app",
  messagingSenderId: "556699112924",
  appId: "1:556699112924:web:e463435641617f913ceb19",
  measurementId: "G-LY9DF6M9NT"
};
 
