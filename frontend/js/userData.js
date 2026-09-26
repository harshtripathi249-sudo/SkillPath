/**
 * SkillPath Firestore User Data Client
 * Per-user personalization: saved questionnaire/path and a daily-activity streak.
 * Every method safely no-ops if Firebase isn't configured, so guest mode is unaffected.
 */
(function () {
  function getDb() {
    if (!window.skillpathAuth || !window.skillpathAuth.isConfigured || !window.firebase) return null;
    return firebase.firestore();
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  }

  async function getUserProfile(uid) {
    const db = getDb();
    if (!db || !uid) return null;
    const snap = await db.collection('users').doc(uid).get();
    return snap.exists ? snap.data() : null;
  }

  /**
   * Initializes a brand-new user's document with genuinely fresh defaults
   * (zero streak, no saved path) - but ONLY if the document doesn't already
   * exist. Never overwrites an existing user's real progress on sign-in or
   * page refresh. Returns the profile (freshly created, or the existing one
   * untouched).
   */
  async function ensureUserProfile(uid, basicInfo = {}) {
    const db = getDb();
    if (!db || !uid) return null;

    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
      return snap.data();
    }

    const freshProfile = {
      email: basicInfo.email || null,
      displayName: basicInfo.displayName || null,
      photoURL: basicInfo.photoURL || null,
      currentPath: null,
      questionnaire: null,
      streak: { count: 0, longest: 0, lastActiveDate: null },
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await ref.set(freshProfile);
    return freshProfile;
  }

  async function saveUserProfile(uid, data) {
    const db = getDb();
    if (!db || !uid) return;
    await db.collection('users').doc(uid).set(
      { ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );
  }

  async function savePersonalizedPath(uid, path, questionnaire) {
    return saveUserProfile(uid, { currentPath: path, questionnaire });
  }

  /**
   * Records that the user was active today and updates their streak.
   * Returns the updated { count, longest, lastActiveDate }, or null if not configured.
   */
  async function recordDailyActivity(uid) {
    const db = getDb();
    if (!db || !uid) return null;

    const today = todayKey();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    const existing = (snap.exists && snap.data().streak) || { count: 0, longest: 0, lastActiveDate: null };

    if (existing.lastActiveDate === today) {
      return existing; // Already recorded today - avoid double-incrementing.
    }

    const count = existing.lastActiveDate === yesterday ? existing.count + 1 : 1;
    const streak = {
      count,
      longest: Math.max(existing.longest || 0, count),
      lastActiveDate: today
    };

    await ref.set(
      { streak, updatedAt: firebase.firestore.FieldValue.serverTimestamp() },
      { merge: true }
    );

    return streak;
  }

  window.skillpathUserData = {
    getUserProfile,
    ensureUserProfile,
    saveUserProfile,
    savePersonalizedPath,
    recordDailyActivity
  };
})();
