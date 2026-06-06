/**
 * CareerAI India — Firebase Service
 * Handles: Auth (Email + Google), Firestore, Subscription state
 * v2 — Promise-based auth, profile refresh, better error handling
 */

let db, auth, googleProvider;
let currentUser = null;
let userProfile  = null;

// ── AUTH READY PROMISE ─────────────────────────────────────────
// Allows other code to `await authReady` instead of polling
let _authResolve;
let authReady = new Promise(resolve => { _authResolve = resolve; });

// ── INIT ──────────────────────────────────────────────────────
function initFirebase() {
  if (!CONFIG.FIREBASE.apiKey || CONFIG.FIREBASE.apiKey === 'YOUR_FIREBASE_API_KEY') {
    console.warn('[Firebase] Not configured — running in demo mode');
    _authResolve({ user: null, profile: null, demo: true });
    return;
  }
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(CONFIG.FIREBASE);
    }
    db   = firebase.firestore();
    auth = firebase.auth();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    googleProvider.setCustomParameters({ prompt: 'select_account' }); // Forces account selector
    
    // Only listen to auth state if we haven't already resolved the promise
    // To prevent multiple listeners from being attached
    if (!currentUser && userProfile === null) {
      listenAuthState();
    }
  } catch (e) {
    console.error('[Firebase] Init error:', e);
    _authResolve({ user: null, profile: null, error: e });
  }
}

// ── AUTH STATE LISTENER ───────────────────────────────────────
function listenAuthState() {
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
      try {
        userProfile = await fetchOrCreateProfile(user);
        updateNavForUser(user);
      } catch (e) {
        console.error('[Firebase] Profile fetch error:', e);
        userProfile = null;
      }
      _authResolve({ user, profile: userProfile });
    } else {
      userProfile = null;
      updateNavForGuest();
      _authResolve({ user: null, profile: null });
    }
  });
}

async function fetchOrCreateProfile(user) {
  if (!db) return null;
  try {
    const ref = db.collection('users').doc(user.uid);
    const snap = await ref.get();
    if (snap.exists) {
      // Update photoURL if changed (e.g. Google profile pic change)
      const data = snap.data();
      if (user.photoURL && data.photoURL !== user.photoURL) {
        await ref.update({ photoURL: user.photoURL });
        data.photoURL = user.photoURL;
      }
      if (user.displayName && data.name !== user.displayName) {
        await ref.update({ name: user.displayName });
        data.name = user.displayName;
      }
      return data;
    }

    const profile = {
      uid:         user.uid,
      name:        user.displayName || '',
      email:       user.email,
      photoURL:    user.photoURL || '',
      plan:        'free',
      usageCount:  0,
      referralCode: generateCode(user.uid),
      referredBy:  null,
      resumes:     [],
      createdAt:   firebase.firestore.FieldValue.serverTimestamp(),
    };
    await ref.set(profile);
    return profile;
  } catch (e) {
    console.error('[Firebase] fetchOrCreateProfile error:', e);
    // Return a minimal profile so the UI doesn't break
    return {
      uid: user.uid,
      name: user.displayName || '',
      email: user.email,
      photoURL: user.photoURL || '',
      plan: 'free',
      usageCount: 0,
      referralCode: generateCode(user.uid),
    };
  }
}

// ── REFRESH PROFILE ───────────────────────────────────────────
// Re-fetch the latest profile from Firestore on demand
async function refreshProfile() {
  if (!db || !currentUser) return null;
  try {
    const snap = await db.collection('users').doc(currentUser.uid).get();
    if (snap.exists) {
      userProfile = snap.data();
      return userProfile;
    }
  } catch (e) {
    console.error('[Firebase] refreshProfile error:', e);
  }
  return userProfile;
}

// ── SIGN IN / SIGN UP ─────────────────────────────────────────
async function signUpWithEmail(name, email, password, referralCode) {
  if (!auth) return demoSuccess('signup');
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    // Ensure profile is created with the updated displayName
    userProfile = await fetchOrCreateProfile({ ...cred.user, displayName: name });
    if (referralCode) await applyReferral(cred.user.uid, referralCode);
    return { ok: true, user: cred.user, profile: userProfile };
  } catch (e) {
    return { ok: false, error: friendlyError(e.code) };
  }
}

async function signInWithEmail(email, password) {
  if (!auth) return demoSuccess('login');
  try {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    userProfile = await fetchOrCreateProfile(cred.user);
    return { ok: true, user: cred.user, profile: userProfile };
  } catch (e) {
    return { ok: false, error: friendlyError(e.code) };
  }
}

async function signInWithGoogle() {
  if (!auth) return demoSuccess('login');
  try {
    const cred = await auth.signInWithPopup(googleProvider);
    userProfile = await fetchOrCreateProfile(cred.user);
    return { ok: true, user: cred.user, profile: userProfile };
  } catch (e) {
    if (e.code === 'auth/popup-closed-by-user') {
      return { ok: false, error: 'Sign-in popup was closed. Please try again.' };
    }
    if (e.code === 'auth/popup-blocked') {
      return { ok: false, error: 'Popup was blocked by your browser. Please allow popups and try again.' };
    }
    return { ok: false, error: friendlyError(e.code) };
  }
}

// ── PASSWORD RESET ────────────────────────────────────────────
async function sendPasswordReset(email) {
  if (!auth) return { ok: false, error: 'Firebase not configured' };
  try {
    await auth.sendPasswordResetEmail(email);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyError(e.code) };
  }
}

async function signOut() {
  if (!auth) return;
  await auth.signOut();
  currentUser = null;
  userProfile = null;
  // Reset the authReady promise for the next session
  authReady = new Promise(resolve => { _authResolve = resolve; });
  location.reload();
}

// ── UPDATE PROFILE ────────────────────────────────────────────
async function updateDisplayName(newName) {
  if (!auth || !currentUser) return { ok: false, error: 'Not logged in' };
  try {
    await currentUser.updateProfile({ displayName: newName });
    if (db) {
      await db.collection('users').doc(currentUser.uid).update({ name: newName });
    }
    if (userProfile) userProfile.name = newName;
    return { ok: true };
  } catch (e) {
    return { ok: false, error: 'Could not update name. Please try again.' };
  }
}

// ── SUBSCRIPTION ──────────────────────────────────────────────
async function activateSubscription(uid, plan, paymentId) {
  if (!db) return;
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + (plan === 'annual' ? 12 : 1));

  await db.collection('users').doc(uid).update({
    plan,
    paymentId,
    planExpiry: firebase.firestore.Timestamp.fromDate(expiry),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
  userProfile = { ...userProfile, plan };
}

function isPro() {
  if (!userProfile) return false;
  if (userProfile.plan === 'free') return false;
  if (userProfile.planExpiry) {
    const expiry = userProfile.planExpiry.toDate?.() || new Date(userProfile.planExpiry);
    if (new Date() > expiry) return false;
  }
  return true;
}

function getSubscriptionInfo() {
  if (!userProfile) return { plan: 'free', status: 'none', daysLeft: 0 };
  
  const plan = userProfile.plan || 'free';
  if (plan === 'free') return { plan: 'free', status: 'free', daysLeft: 0 };

  if (userProfile.planExpiry) {
    const expiry = userProfile.planExpiry.toDate?.() || new Date(userProfile.planExpiry);
    const now = new Date();
    const diff = expiry - now;
    const daysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    const isActive = diff > 0;
    return {
      plan,
      status: isActive ? 'active' : 'expired',
      daysLeft,
      expiryDate: expiry,
      expiryStr: expiry.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
    };
  }
  return { plan, status: 'active', daysLeft: 999 };
}

// ── USAGE GATE ────────────────────────────────────────────────
async function checkUsageGate() {
  if (isPro()) return true;

  // Non-logged-in demo mode
  const demoCount = parseInt(localStorage.getItem('careerai_uses') || '0');
  const shared = localStorage.getItem('careerai_shared_wa'); // Viral loop check

  if (!currentUser) {
    if (demoCount >= CONFIG.FREE_TRIALS) {
      if (!shared) {
        showViralSharePopup();
        return false;
      } else if (demoCount >= CONFIG.FREE_TRIALS + 1) { // They get 1 extra free use
        showSection('signup');
        showToast('🔒 Sign up free to get 3 more uses!', 'info');
        return false;
      }
    }
    localStorage.setItem('careerai_uses', demoCount + 1);
    return true;
  }

  // Logged in free user
  const uses = userProfile?.usageCount || 0;
  if (uses >= CONFIG.FREE_TRIALS) {
    if (!shared) {
      showViralSharePopup();
      return false;
    } else if (uses >= CONFIG.FREE_TRIALS + 1) {
      showSection('payment');
      showToast('⚡ Upgrade to Pro for unlimited access!', 'warning');
      return false;
    }
  }

  // Increment usage
  if (db && currentUser) {
    await db.collection('users').doc(currentUser.uid).update({
      usageCount: firebase.firestore.FieldValue.increment(1)
    });
  }
  return true;
}

// ── SAVE RESUME ───────────────────────────────────────────────
async function saveResume(resumeData) {
  if (!db || !currentUser) return;
  const resume = {
    ...resumeData,
    id: Date.now().toString(),
    savedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };
  await db.collection('users').doc(currentUser.uid)
    .collection('resumes').doc(resume.id).set(resume);
  showToast('✅ Resume saved to your dashboard!', 'success');
  return resume.id;
}

async function getResumes() {
  if (!db || !currentUser) return [];
  const snap = await db.collection('users').doc(currentUser.uid)
    .collection('resumes').orderBy('savedAt', 'desc').limit(10).get();
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ── REFERRAL ──────────────────────────────────────────────────
function generateCode(uid) {
  return 'CAI-' + uid.substring(0, 6).toUpperCase();
}

async function applyReferral(newUid, code) {
  if (!db) return;
  const snap = await db.collection('users')
    .where('referralCode', '==', code.toUpperCase()).limit(1).get();
  if (snap.empty) return;
  const referrer = snap.docs[0];
  // Give referrer a free month extension
  await referrer.ref.update({
    referralCount: firebase.firestore.FieldValue.increment(1),
    plan: 'pro',
    planExpiry: firebase.firestore.Timestamp.fromDate(
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    ),
  });
  await db.collection('users').doc(newUid).update({ referredBy: referrer.id });
}

// ── UI HELPERS ────────────────────────────────────────────────
function updateNavForUser(user) {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;

  const firstName = user.displayName?.split(' ')[0] || 'User';
  const avatarHTML = user.photoURL
    ? `<img src="${user.photoURL}" alt="${firstName}" class="nav-avatar" />`
    : `<div class="nav-avatar nav-avatar-initials">${(firstName[0] || 'U').toUpperCase()}</div>`;

  navActions.innerHTML = `
    <div class="nav-user-info">
      ${avatarHTML}
      <span class="nav-user-name">Hi, ${firstName}!</span>
    </div>
    <button class="btn-primary" onclick="window.location='dashboard.html'">Dashboard →</button>
    <button class="btn-ghost" onclick="signOut()">Logout</button>
  `;
}

function updateNavForGuest() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  navActions.innerHTML = `
    <button id="lang-toggle" class="btn-ghost" onclick="toggleLanguage()" style="font-size:.8rem">🇮🇳 हिंदी</button>
    <button class="btn-ghost" onclick="showSection('login')">Login</button>
    <button class="btn-primary" onclick="showSection('signup')">Start Free Trial</button>
  `;
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Please login instead.',
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/user-not-found':        'No account found with this email.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/invalid-email':         'Please enter a valid email address.',
    'auth/too-many-requests':     'Too many attempts. Please try again in a few minutes.',
    'auth/network-request-failed':'Network error. Please check your connection.',
    'auth/popup-closed-by-user':  'Sign-in popup was closed. Please try again.',
    'auth/popup-blocked':         'Popup blocked by browser. Please allow popups.',
    'auth/invalid-credential':    'Invalid email or password. Please try again.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

function demoSuccess(type) {
  showSection('success');
  return { ok: true };
}

// ── ANALYTICS (lightweight, Firestore-based) ──────────────────
async function trackEvent(eventName, data = {}) {
  if (!db) return; // silently skip if Firebase not configured
  try {
    await db.collection('events').add({
      event:   eventName,
      uid:     currentUser?.uid  || 'guest',
      email:   currentUser?.email || 'guest',
      data,
      page:    window.location.pathname,
      ts:      firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (e) {
    // Non-critical — do not surface to user
    console.debug('[Analytics] Track event failed:', e);
  }
}
