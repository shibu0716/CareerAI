/**
 * CareerAI India — UPI Payment Service
 * Fallback flow (when Razorpay not configured):
 * QR / UPI ID → User pays → Enters UTR → WhatsApp sent to owner → Owner activates in Firebase
 */

// Read from CONFIG (single source of truth — set in config.js)
const UPI_ID   = CONFIG?.UPI_ID   || 'your-upi@bank';
const UPI_NAME = CONFIG?.UPI_NAME || 'CareerAI India';

// ── OPEN UPI PAYMENT MODAL ────────────────────────────────────
async function openUpiPayment(planKey) {
  const plan = CONFIG.PLANS[planKey];
  if (!plan) { showToast('Invalid plan selected', 'error'); return; }

  const amountRupees = plan.amount / 100;

  // Reset Order Bump
  window._orderBumpActive = false;
  const bumpCheckbox = document.getElementById('order-bump-checkbox');
  if (bumpCheckbox) bumpCheckbox.checked = false;

  // Update summary labels
  const planLabelEl = document.getElementById('pay-plan-label');
  const totalEl     = document.getElementById('pay-total-amount');
  if (planLabelEl) planLabelEl.textContent = plan.label;
  if (totalEl)     totalEl.textContent     = `₹${amountRupees}`;
  
  // Save base amount for order bump toggling
  window._baseAmountRupees = amountRupees;

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
  
  // Track Lead Intent (Abandoned Cart Tracking)
  trackLeadIntent(planKey, amountRupees);
}

// ── LEAD TRACKING (Abandoned Carts) ───────────────────────────
async function trackLeadIntent(planKey, amount) {
  if (!db || !currentUser) return;
  try {
    const leadRef = db.collection('leads').doc(currentUser.uid);
    await leadRef.set({
      uid: currentUser.uid,
      email: currentUser.email || 'guest',
      name: currentUser.displayName || 'No Name',
      phone: currentUser.phoneNumber || '',
      lastPlanIntent: planKey,
      lastAmountIntent: amount,
      status: 'abandoned_cart', // Will be overwritten if they submit UTR
      lastActivityAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  } catch (e) {
    console.warn('[Tracking] Lead intent not saved', e);
  }
}

// ── ORDER BUMP (Upsell) ───────────────────────────────────────
function toggleOrderBump() {
  const checkbox = document.getElementById('order-bump-checkbox');
  if (!checkbox) return;
  
  // If clicked directly on the div, toggle the checkbox. If clicked on checkbox, it toggles itself natively.
  // We handle both gracefully:
  if (event.target !== checkbox) checkbox.checked = !checkbox.checked;
  
  window._orderBumpActive = checkbox.checked;
  const bumpAmount = 499;
  const finalAmount = window._baseAmountRupees + (window._orderBumpActive ? bumpAmount : 0);
  
  // Update UI
  const totalEl = document.getElementById('pay-total-amount');
  const amountEl = document.getElementById('upi-amount-display');
  if (totalEl) totalEl.textContent = `₹${finalAmount}`;
  if (amountEl) amountEl.textContent = `₹${finalAmount}`;
  
  // Re-generate QR Code
  const plan = CONFIG.PLANS[window._pendingPlanKey];
  const planLabel = plan ? plan.label : 'Pro';
  const finalLabel = planLabel + (window._orderBumpActive ? ' + Expert Review' : '');
  
  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(UPI_NAME)}&am=${finalAmount}&cu=INR&tn=${encodeURIComponent('CareerAI ' + finalLabel)}`;
  const qrUrl   = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=FF6B35&bgcolor=0f1018&data=${encodeURIComponent(upiLink)}`;
  const qrImg = document.getElementById('upi-qr-img');
  if (qrImg) qrImg.src = qrUrl;
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
  const baseRupees   = plan ? plan.amount / 100 : 0;
  const bumpAmount   = 499;
  const amountRupees = baseRupees + (window._orderBumpActive ? bumpAmount : 0);
  const planLabel    = (plan ? plan.label : planKey) + (window._orderBumpActive ? ' + Expert Review' : '');

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
    
    // Update Lead status so we know they didn't abandon cart
    if (currentUser) {
      await db.collection('leads').doc(currentUser.uid).update({
        status: 'submitted_utr',
        lastActivityAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
  } catch (e) {
    console.warn('[UPI] Could not save payment record:', e);
  }
}
