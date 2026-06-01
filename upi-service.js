/**
 * CareerAI India — UPI Payment Service
 * Flow: QR / UPI ID → User pays → Enters UTR → WhatsApp sent to owner → Owner activates
 */

const UPI_ID   = 'shibuthegenius@ybl';
const UPI_NAME = 'CareerAI India';

// ── OPEN UPI PAYMENT MODAL ────────────────────────────────────
async function openUpiPayment(planKey) {
  const plan = CONFIG.PLANS[planKey];
  if (!plan) { showToast('Invalid plan selected', 'error'); return; }

  const amountRupees = plan.amount / 100;

  // Update summary labels
  const planLabelEl = document.getElementById('pay-plan-label');
  const totalEl     = document.getElementById('pay-total-amount');
  if (planLabelEl) planLabelEl.textContent = plan.label;
  if (totalEl)     totalEl.textContent     = `₹${amountRupees}`;

  // Build UPI deep-link and QR
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent('CareerAI ' + plan.label)}`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=FF6B35&bgcolor=0f1018&data=${encodeURIComponent(upiLink)}`;

  const qrImg = document.getElementById('upi-qr-img');
  if (qrImg) {
    qrImg.classList.add('loading');
    qrImg.onload  = () => qrImg.classList.remove('loading');
    qrImg.onerror = () => {
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;
    };
    qrImg.src = qrUrl;
  }

  // Update display fields
  const upiIdEl  = document.getElementById('upi-id-display');
  const amountEl = document.getElementById('upi-amount-display');
  if (upiIdEl)  upiIdEl.textContent  = UPI_ID;
  if (amountEl) amountEl.textContent = `₹${amountRupees}`;

  // Store plan + clear old input
  window._pendingPlanKey = planKey;
  const txnInput = document.getElementById('upi-txn-id');
  if (txnInput) txnInput.value = '';

  // Reset verify button
  const verifyBtn = document.getElementById('btn-verify-upi');
  if (verifyBtn) { verifyBtn.textContent = '📲 Submit & Open WhatsApp →'; verifyBtn.disabled = false; }

  showSection('payment');
}

// ── COPY UPI ID ───────────────────────────────────────────────
function copyUpiId() {
  navigator.clipboard.writeText(UPI_ID).then(() => {
    showToast('✅ UPI ID copied! Open GPay / PhonePe / Paytm to pay.', 'success');
    const btn = document.getElementById('btn-copy-upi');
    if (btn) {
      btn.textContent = '✅ Copied!';
      btn.style.background  = 'rgba(76,175,80,0.2)';
      btn.style.borderColor = 'rgba(76,175,80,0.4)';
      btn.style.color       = '#4caf50';
      setTimeout(() => {
        btn.textContent = '📋 Copy';
        btn.style.background = btn.style.borderColor = btn.style.color = '';
      }, 2500);
    }
  }).catch(() => {
    showToast('UPI ID: ' + UPI_ID, 'info');
  });
}

// ── VERIFY PAYMENT (WhatsApp flow) ────────────────────────────
async function verifyUpiPayment() {
  const txnId   = document.getElementById('upi-txn-id')?.value.trim();
  const planKey = window._pendingPlanKey;

  if (!txnId || txnId.length < 6) {
    showToast('⚠️ Please enter your UTR / Transaction ID first', 'error');
    document.getElementById('upi-txn-id')?.focus();
    return;
  }

  const plan         = CONFIG.PLANS[planKey];
  const amountRupees = plan ? plan.amount / 100 : '?';
  const planLabel    = plan ? plan.label : planKey;

  const btn = document.getElementById('btn-verify-upi');
  if (btn) { btn.textContent = '⏳ Saving & opening WhatsApp...'; btn.disabled = true; }

  // ── 1. Save pending payment to Firebase ──────────────────────
  await savePendingPayment(planKey, txnId, amountRupees);

  // ── 2. Build pre-filled WhatsApp message ─────────────────────
  const userName  = currentUser?.displayName || 'Customer';
  const userEmail = currentUser?.email        || 'Not logged in';
  const uid       = currentUser?.uid          || 'guest';

  const message = [
    `👋 Hi CareerAI!`,
    ``,
    `I've paid for *${planLabel}* (₹${amountRupees}).`,
    ``,
    `📋 *UTR / Transaction ID:* ${txnId}`,
    `👤 *Name:* ${userName}`,
    `📧 *Email:* ${userEmail}`,
    `🔑 *User ID:* ${uid}`,
    ``,
    `Please activate my Pro account. Thank you! 🙏`,
  ].join('\n');

  const waUrl = `${CONFIG.SUPPORT_WA}?text=${encodeURIComponent(message)}`;

  // ── 3. Show pending confirmation modal ───────────────────────
  showSection('pending');

  // ── 4. Open WhatsApp after a short delay ─────────────────────
  window._lastWaUrl = waUrl;          // stored so "Reopen" button works
  setTimeout(() => {
    window.open(waUrl, '_blank');
  }, 800);

  if (btn) { btn.textContent = '📲 Submit & Open WhatsApp →'; btn.disabled = false; }
}

// ── SAVE PENDING PAYMENT TO FIREBASE ─────────────────────────
async function savePendingPayment(planKey, txnId, amount) {
  if (!db) {
    // No Firebase — save locally
    localStorage.setItem('careerai_pending_plan',    planKey);
    localStorage.setItem('careerai_pending_payment', 'UPI_' + txnId);
    return;
  }

  const record = {
    planKey,
    txnId,
    amount,
    upiId:     UPI_ID,
    uid:       currentUser?.uid   || 'guest',
    email:     currentUser?.email || 'guest',
    name:      currentUser?.displayName || '',
    status:    'pending_verification',   // ← you change this to 'active' after you verify
    submittedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  try {
    // Save to top-level "payments" collection so you can review in Firebase console
    await db.collection('payments').add(record);
  } catch (e) {
    console.warn('[UPI] Could not save payment record:', e);
  }
}
