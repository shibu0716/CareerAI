/**
 * CareerAI India — Configuration
 * ─────────────────────────────────────────────────────────────
 * STEP 1: Fill in your API keys below.
 * See setup.html in this folder for a visual step-by-step guide.
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
  // Your UPI ID — users will scan your QR or copy this to pay
  UPI_ID: 'shibuthegenius@ybl',

  // ── PLANS ─────────────────────────────────────────────────
  PLANS: {
    monthly: { amount: 9900,  label: 'Monthly Pro',  desc: '₹99/month' },
    annual:  { amount: 79900, label: 'Annual Pro',   desc: '₹799/year (save ₹389)' },
  },

  // ── APP SETTINGS ──────────────────────────────────────────
  APP_NAME:    'CareerAI India',
  SUPPORT_WA:  'https://wa.me/919508574636', // Owner WhatsApp for payment verification
  FREE_TRIALS: 3,   // number of free AI uses before paywall
};
