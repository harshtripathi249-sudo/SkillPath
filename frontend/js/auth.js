/**
 * SkillPath Firebase Auth Client
 * Wraps Firebase Authentication (Email/Password + Google) behind window.skillpathAuth.
 * If Firebase isn't configured yet (placeholder values still in firebase-config.js),
 * every method safely no-ops so the rest of the app keeps working in guest mode.
 */
(function () {
  const config = window.SKILLPATH_FIREBASE_CONFIG;
  const isConfigured = !!(config && config.apiKey && config.apiKey !== 'YOUR_API_KEY');

  let authInstance = null;

  if (isConfigured && window.firebase) {
    firebase.initializeApp(config);
    authInstance = firebase.auth();
  } else if (isConfigured) {
    console.warn('[SkillPath Auth] Firebase config found but the Firebase SDK did not load.');
  } else {
    console.info('[SkillPath Auth] Firebase not configured yet - running in guest-only mode. See frontend/js/firebase-config.js.');
  }

  async function signUp(email, password, displayName) {
    if (!authInstance) throw new Error('Sign-up is not available yet - Firebase is not configured.');
    const credential = await authInstance.createUserWithEmailAndPassword(email, password);
    if (displayName) {
      await credential.user.updateProfile({ displayName });
    }
    return credential.user;
  }

  async function signIn(email, password) {
    if (!authInstance) throw new Error('Sign-in is not available yet - Firebase is not configured.');
    const credential = await authInstance.signInWithEmailAndPassword(email, password);
    return credential.user;
  }

  async function signInWithGoogle() {
    if (!authInstance) throw new Error('Sign-in is not available yet - Firebase is not configured.');
    const provider = new firebase.auth.GoogleAuthProvider();
    const credential = await authInstance.signInWithPopup(provider);
    return credential.user;
  }

  async function signOutUser() {
    if (!authInstance) return;
    await authInstance.signOut();
  }

  function onAuthChange(callback) {
    if (!authInstance) {
      // Firebase not configured - report "no user" so the app renders guest UI.
      callback(null);
      return () => {};
    }
    return authInstance.onAuthStateChanged(callback);
  }

  function getCurrentUser() {
    return authInstance ? authInstance.currentUser : null;
  }

  window.skillpathAuth = {
    isConfigured,
    signUp,
    signIn,
    signInWithGoogle,
    signOut: signOutUser,
    onAuthChange,
    getCurrentUser
  };
})();
