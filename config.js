/**
 * CareerAI India — Configuration
 * ─────────────────────────────────────────────────────────────
 * Fill in your API keys below before going live.
 * ─────────────────────────────────────────────────────────────
 */
const CONFIG = {

  // ── GEMINI AI ─────────────────────────────────────────────
  // Get free key at: https://aistudio.google.com/app/apikey
  // Free tier: 1,500 requests/day (enough for 300+ users/day)
  GEMINI_API_KEY: 'YOUR_GEMINI_API_KEY_HERE',

  // ── FIREBASE ──────────────────────────────────────────────
  // Create project at: https://console.firebase.google.com
  // Enable: Authentication (Email + Google) + Firestore Database
  FIREBASE: {
    apiKey:            'YOUR_FIREBASE_API_KEY',
    authDomain:        'YOUR_PROJECT_ID.firebaseapp.com',
    projectId:         'YOUR_PROJECT_ID',
    storageBucket:     'YOUR_PROJECT_ID.appspot.com',
    messagingSenderId: 'YOUR_SENDER_ID',
    appId:             'YOUR_APP_ID',
  },

  // ── UPI PAYMENT ───────────────────────────────────────────
  // ★ UPDATE THESE WITH YOUR OWN DETAILS
  UPI_ID:   'shibuthegenius@ybl',     // ← your UPI ID (e.g. name@upi)
  UPI_NAME: 'CareerAI India',          // displayed in QR / UPI apps

  // ── PLANS ─────────────────────────────────────────────────
  PLANS: {
    single:  { amount: 4900,  label: 'Single AI Resume', desc: '₹49 (One-Time)' },
    monthly: { amount: 9900,  label: 'CareerAI Pro Monthly', desc: '₹99/month'  },
    annual:  { amount: 79900, label: 'CareerAI Pro Annual',  desc: '₹799/year (save ₹389)' },
  },

  // ── APP SETTINGS ──────────────────────────────────────────
  APP_NAME:     'CareerAI India',
  SITE_URL:     'https://careerai.in',  // Update with your live domain
  SUPPORT_WA:   'https://wa.me/919508574636', // Owner WhatsApp
  SUPPORT_WA_NUMBER: '919508574636',
  SUPPORT_EMAIL:'support@careerai.in',
  INSTAGRAM:    'https://instagram.com/careerai.india',
  LINKEDIN:     'https://linkedin.com/company/careerai-india',
  TWITTER:      'https://twitter.com/careerai_india',
  FREE_TRIALS:  3,   // number of free AI uses before paywall
};
