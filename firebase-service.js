/**
 * CareerAI India — Firebase Service
 * Handles: Auth (Email + Google), Firestore, Subscription state
 */

let db, auth, googleProvider;
let currentUser = null;
let userProfile  = null;

// ── INIT ──────────────────────────────────────────────────────
function initFirebase() {
  if (!CONFIG.FIREBASE.apiKey || CONFIG.FIREBASE.apiKey === 'YOUR_FIREBASE_API_KEY') {
    console.warn('[Firebase] Not configured — running in demo mode');
    return;
  }
  try {
    firebase.initializeApp(CONFIG.FIREBASE);
    db   = firebase.firestore();
    auth = firebase.auth();
    googleProvider = new firebase.auth.GoogleAuthProvider();
    listenAuthState();
  } catch (e) {
    console.error('[Firebase] Init error:', e);
  }
}

// ── AUTH STATE LISTENER ───────────────────────────────────────
function listenAuthState() {
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
      userProfile = await fetchOrCreateProfile(user);
      updateNavForUser(user);
    } else {
      userProfile = null;
      updateNavForGuest();
    }
  });
}

async function fetchOrCreateProfile(user) {
  const ref = db.collection('users').doc(user.uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data();

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
}

// ── SIGN IN / SIGN UP ─────────────────────────────────────────
async function signUpWithEmail(name, email, password, referralCode) {
  if (!auth) return demoSuccess('signup');
  try {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName: name });
    if (referralCode) await applyReferral(cred.user.uid, referralCode);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyError(e.code) };
  }
}

async function signInWithEmail(email, password) {
  if (!auth) return demoSuccess('login');
  try {
    await auth.signInWithEmailAndPassword(email, password);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyError(e.code) };
  }
}

async function signInWithGoogle() {
  if (!auth) return demoSuccess('login');
  try {
    await auth.signInWithPopup(googleProvider);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: friendlyError(e.code) };
  }
}

async function signOut() {
  if (!auth) return;
  await auth.signOut();
  location.reload();
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
  navActions.innerHTML = `
    <span style="color:var(--text-muted);font-size:0.85rem">Hi, ${user.displayName?.split(' ')[0] || 'User'}!</span>
    <button class="btn-primary" onclick="window.location='dashboard.html'">Dashboard →</button>
    <button class="btn-ghost" onclick="signOut()">Logout</button>
  `;
}

function updateNavForGuest() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  navActions.innerHTML = `
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

