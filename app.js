/**
 * CareerAI India — Main Application
 * Real Gemini AI · Firebase Auth · UPI Payments · Hindi/English · Toast system
 */

// ════════════════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  setupNavScroll();
  setupIntersectionObserver();
  setupPayMethodTabs();
  restoreLanguage();
  checkPendingActivation();
  setupExitIntent();
  startCountdownTimer();

  // Capture Affiliate Referral Code
  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');
  if (refCode) {
    localStorage.setItem('careerai_referral', refCode);
  }
});

// ── NAVBAR ───────────────────────────────────────────────────
function setupNavScroll() {
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// ── PENDING PLAN (paid before login) ─────────────────────────
async function checkPendingActivation() {
  const plan = localStorage.getItem('careerai_pending_plan');
  const pid  = localStorage.getItem('careerai_pending_payment');
  if (plan && pid && currentUser) {
    await activateSubscription(currentUser.uid, plan, pid);
    localStorage.removeItem('careerai_pending_plan');
    localStorage.removeItem('careerai_pending_payment');
    showToast('✅ Your Pro plan is now active!', 'success');
    showSection('success');
  }
}

// ════════════════════════════════════════════════════════════
//  TOAST NOTIFICATION
// ════════════════════════════════════════════════════════════
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toast');
  if (existing) existing.remove();

  const colors = { success:'#4caf50', error:'#f44336', warning:'#FF6B35', info:'#1a1aff' };
  const icons  = { success:'✅', error:'❌', warning:'⚡', info:'ℹ️' };

  const toast = document.createElement('div');
  toast.id = 'toast';
  toast.style.cssText = `
    position:fixed;bottom:24px;right:24px;z-index:9999;
    background:var(--card);border:1px solid ${colors[type]}44;
    border-left:4px solid ${colors[type]};
    color:var(--text);padding:14px 20px;border-radius:12px;
    font-size:0.9rem;font-weight:500;max-width:360px;
    box-shadow:0 8px 32px rgba(0,0,0,0.4);
    animation:slideInRight 0.3s ease;font-family:var(--font);
    display:flex;align-items:center;gap:10px;
  `;
  toast.innerHTML = `<span style="font-size:1.1rem">${icons[type]}</span><span>${msg}</span>`;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'slideOutRight 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 4000);
}

// ════════════════════════════════════════════════════════════
//  LANGUAGE (Hindi / English)
// ════════════════════════════════════════════════════════════
let currentLang = 'en';
const translations = {
  en: {
    heroTitle:   'Land Your Dream Job<br/><span class="gradient-text">in 30 Days</span><br/>with AI Power',
    heroBadge:   '🇮🇳 Made for India\'s 50 Crore Job Seekers',
    heroSub:     'AI Resume Builder · Interview Coach · Cover Letter Generator<br/><strong>Used by 10,000+ Indians</strong> from IITs to tier-3 colleges',
    heroBtn:     'Start Free — ₹0 for 7 days',
    heroBtnGhost:'See Live Demo ↓',
    langBtn:     '🇮🇳 हिंदी',
  },
  hi: {
    heroTitle:   'अपनी Dream Job पाएं<br/><span class="gradient-text">30 दिनों में</span><br/>AI की शक्ति से',
    heroBadge:   '🇮🇳 भारत के 50 करोड़ नौकरी खोजने वालों के लिए',
    heroSub:     'AI रेज्युमे बिल्डर · इंटरव्यू कोच · Cover Letter Generator<br/><strong>10,000+ भारतीयों</strong> ने इस्तेमाल किया',
    heroBtn:     '7 दिन मुफ्त शुरू करें — ₹0',
    heroBtnGhost:'Live Demo देखें ↓',
    langBtn:     '🇬🇧 English',
  }
};

function toggleLanguage() {
  currentLang = currentLang === 'en' ? 'hi' : 'en';
  localStorage.setItem('careerai_lang', currentLang);
  applyLanguage();
}

function restoreLanguage() {
  currentLang = localStorage.getItem('careerai_lang') || 'en';
  applyLanguage();
}

function applyLanguage() {
  const t = translations[currentLang];
  const el = (id) => document.getElementById(id);
  if (el('hero-title'))     el('hero-title').innerHTML    = t.heroTitle;
  if (el('hero-badge'))     el('hero-badge').textContent  = t.heroBadge;
  if (el('hero-sub'))       el('hero-sub').innerHTML      = t.heroSub;
  if (el('hero-btn'))       el('hero-btn').textContent    = t.heroBtn;
  if (el('hero-btn-ghost')) el('hero-btn-ghost').textContent = t.heroBtnGhost;
  if (el('lang-toggle'))    el('lang-toggle').textContent = t.langBtn;
}

// ════════════════════════════════════════════════════════════
//  MODAL SYSTEM
// ════════════════════════════════════════════════════════════
function showSection(section) {
  if (section === 'tools') {
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const overlay = document.getElementById('modal-overlay');
  document.querySelectorAll('.modal-section').forEach(s => s.style.display = 'none');
  const target = document.getElementById(`modal-${section}`);
  if (target) { target.style.display = 'block'; overlay.classList.add('active'); }
}

function closeModal() {
  document.getElementById('modal-overlay')?.classList.remove('active');
}

document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ════════════════════════════════════════════════════════════
//  AUTH MODAL HANDLERS
// ════════════════════════════════════════════════════════════

// ── AUTH LOADING OVERLAY ─────────────────────────────────────
function showAuthLoading(message = 'Signing you in...') {
  let overlay = document.getElementById('auth-loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'auth-loading-overlay';
    overlay.className = 'auth-loading-overlay';
    document.body.appendChild(overlay);
  }
  overlay.innerHTML = `
    <div class="auth-loading-card">
      <div class="auth-loading-spinner"></div>
      <div class="auth-loading-text">${message}</div>
      <div class="auth-loading-sub">Please wait a moment...</div>
    </div>`;
  overlay.classList.add('active');
}

function hideAuthLoading() {
  const overlay = document.getElementById('auth-loading-overlay');
  if (overlay) overlay.classList.remove('active');
}

async function handleSignup() {
  const name     = document.getElementById('su-name')?.value.trim();
  const email    = document.getElementById('su-email')?.value.trim();
  const password = document.getElementById('su-pass')?.value;
  const referral = document.getElementById('su-referral')?.value.trim();
  const btn      = document.getElementById('btn-signup');

  if (!name || !email || !password) { showToast('Please fill in all fields', 'warning'); return; }
  if (password.length < 6) { showToast('Password must be at least 6 characters', 'warning'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Creating account...';
  showAuthLoading('Creating your account...');

  const res = await signUpWithEmail(name, email, password, referral);
  if (res.ok) {
    hideAuthLoading();
    closeModal();
    showToast('🎉 Welcome to CareerAI India!', 'success');
    window.location = 'dashboard.html';
  } else {
    hideAuthLoading();
    showToast(res.error, 'error');
    btn.disabled = false;
    btn.innerHTML = 'Create Free Account →';
  }
}

async function handleLogin() {
  const email    = document.getElementById('li-email')?.value.trim();
  const password = document.getElementById('li-pass')?.value;
  const btn      = document.getElementById('btn-login');

  if (!email || !password) { showToast('Please enter email and password', 'warning'); return; }

  btn.disabled = true;
  btn.innerHTML = '<span class="btn-spinner"></span> Signing in...';
  showAuthLoading('Signing you in...');

  const res = await signInWithEmail(email, password);
  if (res.ok) {
    hideAuthLoading();
    closeModal();
    showToast('✅ Welcome back!', 'success');
    window.location = 'dashboard.html';
  } else {
    hideAuthLoading();
    showToast(res.error, 'error');
    btn.disabled = false;
    btn.innerHTML = 'Sign In to Dashboard →';
  }
}

async function handleGoogleAuth() {
  showAuthLoading('Connecting to Google...');
  const res = await signInWithGoogle();
  if (res.ok) {
    showAuthLoading('Loading your profile...');
    // Wait a beat for userProfile to be fully set
    await new Promise(r => setTimeout(r, 300));
    hideAuthLoading();
    closeModal();
    showToast('✅ Signed in with Google!', 'success');
    window.location = 'dashboard.html';
  } else {
    hideAuthLoading();
    showToast(res.error, 'error');
  }
}

// ── FORGOT PASSWORD ──────────────────────────────────────────
async function handleForgotPassword() {
  const email = document.getElementById('li-email')?.value.trim();
  if (!email) {
    showToast('Please enter your email address first', 'warning');
    document.getElementById('li-email')?.focus();
    return;
  }
  const btn = document.getElementById('btn-forgot-password');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending...'; }

  const res = await sendPasswordReset(email);
  if (res.ok) {
    showToast('📧 Password reset email sent! Check your inbox.', 'success');
  } else {
    showToast(res.error, 'error');
  }
  if (btn) { btn.disabled = false; btn.textContent = 'Forgot Password?'; }
}

// ── PASSWORD TOGGLE ──────────────────────────────────────────
function togglePasswordVisibility(inputId, toggleBtn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  toggleBtn.innerHTML = isPassword ? '🙈' : '👁️';
  toggleBtn.title = isPassword ? 'Hide password' : 'Show password';
}

// ── PASSWORD STRENGTH ────────────────────────────────────────
function checkPasswordStrength(password) {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const levels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['#f44336', '#ff9800', '#ffc107', '#8bc34a', '#4caf50'];
  const pct = Math.min(100, (score / 5) * 100);
  return { score, level: levels[Math.min(score, 4)], color: colors[Math.min(score, 4)], pct };
}

function updatePasswordStrength() {
  const pw = document.getElementById('su-pass')?.value || '';
  const meter = document.getElementById('password-strength-meter');
  const label = document.getElementById('password-strength-label');
  if (!meter || !label) return;

  if (!pw) {
    meter.style.width = '0%';
    label.textContent = '';
    return;
  }

  const s = checkPasswordStrength(pw);
  meter.style.width = s.pct + '%';
  meter.style.background = s.color;
  label.textContent = s.level;
  label.style.color = s.color;
}

// ════════════════════════════════════════════════════════════
//  PAYMENT MODAL
// ════════════════════════════════════════════════════════════
function setupPayMethodTabs() {
  document.querySelectorAll('.pay-method').forEach(m => {
    m.addEventListener('click', () => {
      document.querySelectorAll('.pay-method').forEach(x => x.classList.remove('active-pay'));
      m.classList.add('active-pay');
    });
  });
}

let selectedPlan = 'monthly';

function selectPlan(plan) {
  selectedPlan = plan;
  openUpiPayment(plan);   // show UPI QR + UTR form
}

function handlePayment() {
  openUpiPayment(selectedPlan);
}

// Re-open WhatsApp if it didn't launch automatically
function reopenWhatsApp() {
  if (window._lastWaUrl) {
    window.open(window._lastWaUrl, '_blank');
  } else {
    window.open(CONFIG.SUPPORT_WA, '_blank');
  }
}

// ════════════════════════════════════════════════════════════
//  UPGRADE MODAL (smarter paywall — shows social proof)
// ════════════════════════════════════════════════════════════
function showSmartUpgrade(toolName) {
  const overlay = document.getElementById('upgrade-overlay');
  if (!overlay) return;
  const nameEl = document.getElementById('upgrade-tool-name');
  if (nameEl) nameEl.textContent = toolName || 'this tool';
  overlay.classList.add('active');
  startCountdownTimer();
}

function closeUpgrade() {
  const overlay = document.getElementById('upgrade-overlay');
  if (overlay) overlay.classList.remove('active');
}

// ── COUNTDOWN TIMER (pricing urgency) ────────────────────────
function startCountdownTimer() {
  const el = document.getElementById('countdown-timer');
  if (!el) return;
  // Count down from 15 minutes (refreshes on reload — creates urgency)
  let saved = parseInt(sessionStorage.getItem('careerai_countdown') || '');
  if (!saved || saved < Date.now()) {
    saved = Date.now() + 15 * 60 * 1000;
    sessionStorage.setItem('careerai_countdown', saved);
  }
  clearInterval(window._countdownInterval);
  window._countdownInterval = setInterval(() => {
    const diff = Math.max(0, saved - Date.now());
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    el.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if (diff === 0) clearInterval(window._countdownInterval);
  }, 1000);
}

// ════════════════════════════════════════════════════════════
//  TOOL TABS
// ════════════════════════════════════════════════════════════
function switchTool(tool, btn) {
  document.querySelectorAll('.tool-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tool-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById(`tool-${tool}`)?.classList.add('active');
}

// ════════════════════════════════════════════════════════════
//  AI TOOL: RESUME BUILDER
// ════════════════════════════════════════════════════════════
async function generateResume() {
  const allowed = await checkUsageGate();
  if (!allowed) return;

  const name   = document.getElementById('res-name')?.value.trim()   || 'Your Name';
  const role   = document.getElementById('res-role')?.value.trim()   || 'Professional';
  const exp    = document.getElementById('res-exp')?.value.trim()    || 'Experienced professional';
  const skills = document.getElementById('res-skills')?.value.trim() || 'Communication, Problem Solving';
  const edu    = document.getElementById('res-edu')?.value.trim()    || 'Bachelor\'s Degree';

  const output = document.getElementById('resume-output');
  output.innerHTML = loadingHTML('🤖 Gemini AI is crafting your resume...');

  const aiText = await aiGenerateResume({ name, role, exp, skills, edu, lang: currentLang });
  const atsScore = parseATSScore(aiText);
  const cleanText = aiText?.replace(/ATS_SCORE:\d+/, '').trim() || buildFallbackResume(name, role, exp, skills, edu);
  const scoreColor = atsScore >= 80 ? '#4caf50' : atsScore >= 65 ? '#FF6B35' : '#f44336';

  const resumeData = { name, role, exp, skills, edu, content: cleanText, atsScore };

  output.innerHTML = `
    <div class="output-content">
      <div class="output-section">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">
          <h3>✅ Resume Generated!</h3>
          <div style="display:flex;gap:8px">
            <button class="copy-btn" onclick="copyText('resume-text')">📋 Copy</button>
            ${currentUser ? `<button class="copy-btn" onclick="saveCurrentResume()" style="background:rgba(76,175,80,0.15);border-color:rgba(76,175,80,0.3);color:#4caf50">💾 Save</button>` : ''}
          </div>
        </div>
        <div style="background:rgba(0,200,0,0.07);border:1px solid rgba(0,200,0,0.2);border-radius:8px;padding:14px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div style="font-size:0.8rem;color:${scoreColor};font-weight:700">🎯 ATS Score: ${atsScore}/100</div>
            <div style="font-size:0.75rem;color:var(--text-muted)">${atsScore>=80?'Excellent':'Good'} — passes most ATS filters</div>
          </div>
          <div class="score-bar" style="margin-top:8px"><div class="score-fill" style="width:${atsScore}%;background:${scoreColor}"></div></div>
        </div>
      </div>
      <div id="resume-text" class="resume-paper">${formatResumeHTML(cleanText, name, role, skills)}</div>
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="copy-btn" onclick="copyText('resume-text')" style="flex:1;padding:12px">📋 Copy Text</button>
        <button class="copy-btn" onclick="showSection('${currentUser ? 'payment' : 'signup'}')" style="flex:1;padding:12px;background:rgba(255,107,53,0.2);border-color:rgba(255,107,53,0.4)">📥 Download PDF ${isPro() ? '' : '(Pro)'}</button>
        <button class="copy-btn" onclick="generateResume()" style="flex:1;padding:12px">🔄 Regenerate</button>
      </div>
      ${!currentUser ? `<div class="upsell-banner">🔒 Sign up free to save this resume forever + get 3 more AI uses</div>` : ''}
    </div>`;

  window._currentResumeData = resumeData;
}

async function saveCurrentResume() {
  if (window._currentResumeData) {
    await saveResume(window._currentResumeData);
  }
}

function formatResumeHTML(text, name, role, skills) {
  if (!text) return '<p style="color:var(--text-muted)">AI response unavailable. Please check your Gemini API key in config.js</p>';
  // Convert plain text resume to styled HTML
  const skillList = skills.split(',').map(s => s.trim()).filter(Boolean);
  let html = text
    .replace(/^(#{1,3})\s+(.+)/gm, '<h3 style="color:#FF6B35;font-size:0.8rem;text-transform:uppercase;letter-spacing:1px;margin:16px 0 8px;font-weight:800">$2</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-•]\s+(.+)/gm, '<li style="margin-bottom:6px;color:#bbb;font-size:0.85rem">$1</li>')
    .replace(/\n\n/g, '</p><p style="margin-bottom:8px;color:#bbb;font-size:0.85rem">')
    .replace(/\n/g, '<br/>');
  return `<div style="font-family:Georgia,serif;font-size:0.875rem;line-height:1.8;color:#dde">
    <div style="text-align:center;border-bottom:2px solid #FF6B35;padding-bottom:14px;margin-bottom:18px">
      <div style="font-size:1.4rem;font-weight:900;color:#fff;letter-spacing:1px">${name.toUpperCase()}</div>
      <div style="color:#FF6B35;font-weight:600;margin-top:4px">${role}</div>
    </div>
    <div>${html}</div>
  </div>`;
}

function buildFallbackResume(name, role, exp, skills, edu) {
  const skillList = skills.split(',').map(s => s.trim());
  const m = ['30%','40%','25%','2x','50%'][Math.floor(Math.random()*5)];
  return `PROFESSIONAL SUMMARY
Results-driven ${role} with hands-on experience in ${exp.substring(0,60)}. Known for delivering measurable impact and strong collaboration.

EXPERIENCE
${role} — [Company Name] · 20XX – Present
• Spearheaded key initiatives resulting in ${m} improvement in team productivity
• ${exp.substring(0,80)}
• Collaborated cross-functionally with stakeholders to deliver projects on time
• Mentored junior team members, improving onboarding efficiency by 40%

SKILLS
${skillList.join(' · ')}

EDUCATION
${edu}

ATS_SCORE:${Math.floor(75 + Math.random() * 20)}`;
}

// ════════════════════════════════════════════════════════════
//  AI TOOL: INTERVIEW COACH
// ════════════════════════════════════════════════════════════
const interviewQs = {
  'HR Round':        ['Tell me about yourself and why you want to join {company}?', 'What is your greatest weakness and how are you working on it?', 'Where do you see yourself in 5 years?', 'Why should we hire you over other candidates?', 'Tell me about a conflict at work and how you handled it.', 'What are your salary expectations?', 'Why are you leaving your current company?'],
  'Technical Round': ['Explain the most complex technical problem you have solved.', 'Walk me through a project you built from scratch.', 'How would you optimize a slow-running system?', 'What is your approach to debugging a production issue at 3 AM?', 'How do you keep up with the latest trends in your field?'],
  'Managerial Round':['How do you prioritize tasks when everything seems urgent?', 'Describe your leadership style with a real example.', 'How do you handle an underperforming team member?', 'Tell me about a time you failed. What did you learn?'],
  'Group Discussion': ['Topic: Should social media be banned for people under 18?', 'Topic: Is work-from-home better than office work for India?', 'Topic: Brain drain — should Indian professionals work abroad?', 'Topic: Is entrepreneurship better than a stable government job?'],
};

let _currentQuestion = '';

async function startInterview() {
  const allowed = await checkUsageGate();
  if (!allowed) return;

  const company = document.getElementById('int-company')?.value.trim() || 'your target company';
  const type    = document.getElementById('int-type')?.value || 'HR Round';
  const answer  = document.getElementById('int-answer')?.value.trim();
  const output  = document.getElementById('interview-output');

  const qs = interviewQs[type] || interviewQs['HR Round'];
  if (!answer || !_currentQuestion) {
    _currentQuestion = qs[Math.floor(Math.random() * qs.length)].replace('{company}', company);
  }

  output.innerHTML = loadingHTML('🎯 AI Interviewer is analysing...');

  if (answer && _currentQuestion) {
    // Provide feedback
    const aiText   = await aiInterviewFeedback({ company, interviewType: type, question: _currentQuestion, answer });
    const feedback = aiText ? parseInterviewFeedback(aiText) : buildFallbackFeedback(answer);
    const sc       = feedback.score;
    const scColor  = sc >= 80 ? '#4caf50' : sc >= 65 ? '#FF6B35' : '#f44336';

    output.innerHTML = `
      <div class="output-content">
        <div class="output-section">
          <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">Question Asked</div>
          <div style="background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.2);border-radius:8px;padding:14px;font-style:italic;color:#eee;line-height:1.8">"${_currentQuestion}"</div>
        </div>
        <div class="output-section">
          <div style="display:flex;align-items:center;gap:16px">
            <div style="font-size:2.5rem;font-weight:900;color:${scColor}">${sc}%</div>
            <div style="flex:1">
              <div class="score-bar"><div class="score-fill" style="width:${sc}%;background:${scColor}"></div></div>
              <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">${sc>=80?'Excellent! This would impress a '+company+' interviewer.':sc>=65?'Good answer. A few tweaks will make it great.':'Needs work. Follow the tips below.'}</div>
            </div>
          </div>
        </div>
        ${feedback.strengths?.length ? `
        <div class="output-section">
          <div style="color:#4caf50;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">✅ Strengths</div>
          ${feedback.strengths.map(s => `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#c8e6c9;font-size:0.85rem">• ${s}</div>`).join('')}
        </div>` : ''}
        ${feedback.improvements?.length ? `
        <div class="output-section">
          <div style="color:#FF6B35;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">⚡ Improvements</div>
          ${feedback.improvements.map(i => `<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:#ffcdd2;font-size:0.85rem">• ${i}</div>`).join('')}
        </div>` : ''}
        ${feedback.modelAnswer ? `
        <div class="output-section">
          <div style="color:#1a1aff;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">⭐ Model Answer</div>
          <div style="background:rgba(26,26,255,0.07);border:1px solid rgba(26,26,255,0.2);border-radius:8px;padding:14px;font-size:0.85rem;color:#99aaff;line-height:1.8;font-style:italic">${feedback.modelAnswer}</div>
        </div>` : ''}
        <button class="copy-btn" onclick="nextQuestion()" style="width:100%;padding:12px;margin-top:4px">🔄 Next Question →</button>
      </div>`;
  } else {
    // Show the question
    output.innerHTML = `
      <div class="output-content">
        <div class="output-section">
          <div style="font-size:0.75rem;color:var(--primary);font-weight:700;margin-bottom:10px;text-transform:uppercase;letter-spacing:1px">Your Question from ${company}</div>
          <div style="background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.25);border-radius:10px;padding:20px;font-size:1.05rem;font-style:italic;color:#fff;line-height:1.8">"${_currentQuestion}"</div>
        </div>
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:16px;margin-top:8px;font-size:0.85rem;color:#888;line-height:1.7">
          📝 <strong style="color:#dde">Next step:</strong> Type your answer in the textarea on the left, then click "Submit Answer for AI Feedback"
        </div>
        <div class="output-section">
          <div style="color:#FF6B35;font-size:0.8rem;font-weight:700;margin-bottom:8px">💡 STAR Method Reminder</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.8rem">
            <div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:10px"><strong style="color:#fff">S</strong>ituation — Set the scene</div>
            <div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:10px"><strong style="color:#fff">T</strong>ask — Your responsibility</div>
            <div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:10px"><strong style="color:#fff">A</strong>ction — What you did</div>
            <div style="background:rgba(255,255,255,0.04);border-radius:6px;padding:10px"><strong style="color:#fff">R</strong>esult — Quantified outcome</div>
          </div>
        </div>
        <button class="copy-btn" onclick="nextQuestion()" style="width:100%;padding:12px;margin-top:4px">🔄 Different Question →</button>
      </div>`;
  }
}

function nextQuestion() {
  _currentQuestion = '';
  document.getElementById('int-answer').value = '';
  startInterview();
}

function buildFallbackFeedback(answer) {
  const score = Math.floor(55 + answer.length / 10 + (answer.match(/\d+/) ? 10 : 0));
  return {
    score: Math.min(score, 95),
    strengths:    ['You provided a response — that shows confidence', answer.length > 80 ? 'Good detail in your answer' : 'Clear and concise'],
    improvements: ['/d+/.test(answer) ? "" : "Add specific numbers and metrics to quantify your achievements"', 'Use the STAR method for structure', 'Tailor your answer more specifically to the company'],
    modelAnswer:  'Use the STAR method: Describe the Situation, your Task, the Action you took, and the quantified Result. Always tie your answer back to the company\'s goals.',
    tips:         ['Research the company before the interview', 'Practice aloud 3x before the real interview'],
  };
}

// ════════════════════════════════════════════════════════════
//  AI TOOL: COVER LETTER
// ════════════════════════════════════════════════════════════
async function generateCoverLetter() {
  const allowed = await checkUsageGate();
  if (!allowed) return;

  const name        = document.getElementById('cov-name')?.value.trim()        || 'Your Name';
  const company     = document.getElementById('cov-company')?.value.trim()     || 'the Company';
  const jd          = document.getElementById('cov-jd')?.value.trim()          || 'this position';
  const achievement = document.getElementById('cov-achievement')?.value.trim() || 'delivered strong results';
  const role        = name.includes(',') ? name.split(',')[1].trim() : 'Professional';
  const output      = document.getElementById('cover-output');

  output.innerHTML = loadingHTML('✉️ Writing your personalized cover letter...');

  const aiText = await aiGenerateCoverLetter({ name: name.split(',')[0], role, company, jd, achievement });
  const letter = aiText || buildFallbackLetter(name, company, jd, achievement);

  output.innerHTML = `
    <div class="output-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <h3>✅ Cover Letter Ready!</h3>
        <button class="copy-btn" onclick="copyText('cover-letter-content')">📋 Copy</button>
      </div>
      <div id="cover-letter-content" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:24px;font-size:0.875rem;line-height:2;color:#dde;white-space:pre-wrap">${letter}</div>
      <div style="display:flex;gap:8px;margin-top:12px">
        <button class="copy-btn" onclick="copyText('cover-letter-content')" style="flex:1;padding:12px">📋 Copy Letter</button>
        <button class="copy-btn" onclick="generateCoverLetter()" style="flex:1;padding:12px">🔄 Regenerate</button>
      </div>
      ${!currentUser ? `<div class="upsell-banner">🔒 Sign up to save your cover letters + generate unlimited</div>` : ''}
    </div>`;
}

function buildFallbackLetter(name, company, jd, achievement) {
  const firstName = name.split(',')[0].split(' ')[0];
  const date = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
  return `${date}

Dear Hiring Manager,
${company}

Subject: Application for the Advertised Position — ${firstName}

Dear Hiring Manager,

I am writing to express my strong interest in joining ${company}. With my background and proven track record, I am confident I can contribute meaningfully to your team from day one.

${jd.length > 20 ? `Having reviewed your requirements around "${jd.substring(0, 80)}", I am excited to bring my skills to align with exactly these needs.` : 'I am excited about this opportunity to bring my expertise to your growing organization.'}

A key achievement that demonstrates my capabilities: ${achievement}. This experience has equipped me with the mindset and skills to drive similar impact at ${company}.

I thrive in collaborative environments, adapt quickly, and am committed to continuous growth. I would welcome the opportunity to discuss how my background aligns with your vision.

Thank you for your time and consideration. I look forward to hearing from you.

Warm regards,
${name.split(',')[0]}`;
}

// ════════════════════════════════════════════════════════════
//  AI TOOL: SALARY CHECKER
// ════════════════════════════════════════════════════════════
async function checkSalary() {
  const allowed = await checkUsageGate();
  if (!allowed) return;

  const role   = document.getElementById('sal-role')?.value.trim()  || 'Professional';
  const exp    = document.getElementById('sal-exp')?.value           || 'Fresher (0-1 year)';
  const city   = document.getElementById('sal-city')?.value          || 'Tier-2 City';
  const output = document.getElementById('salary-output');

  output.innerHTML = loadingHTML(`💰 Analysing market data for ${city}...`);

  const aiText = await aiSalaryInsights({ role, exp, city });
  const data   = aiText ? parseSalaryData(aiText) : buildFallbackSalary(role, exp, city);

  if (!data || !data.low) {
    output.innerHTML = `<div class="output-placeholder"><p>Could not retrieve salary data. Please check your API key.</p></div>`;
    return;
  }

  const max = data.high;
  const barLow  = Math.round((data.low  / max) * 100);
  const barMid  = Math.round((data.median / max) * 100);

  output.innerHTML = `
    <div class="output-content">
      <h3>💰 ${role} Salary — ${city}</h3>
      <div style="color:var(--text-muted);font-size:0.8rem;margin-bottom:20px">${exp} · 2025–26 market data</div>
      <div class="output-section">
        <div style="display:grid;gap:14px">
          ${salaryBar('Entry Level',    data.low,    data.low+1,    barLow,  '#64b5f6')}
          ${salaryBar('Market Median ⭐', data.median, data.median+1.5, barMid, 'var(--grad)')}
          ${salaryBar('Top 10% Earner', data.high,   null,          100,    '#4caf50')}
        </div>
      </div>
      ${data.insight ? `
      <div class="output-section">
        <div style="color:#FF6B35;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">📊 Market Insight</div>
        <p style="font-size:0.85rem;color:var(--text-soft);line-height:1.8">${data.insight}</p>
        ${data.growth ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:4px">📈 ${data.growth}</p>` : ''}
      </div>` : ''}
      ${data.negotiation ? `
      <div class="output-section">
        <div style="color:#FF6B35;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">🎯 Negotiation Script</div>
        <div style="background:rgba(255,107,53,0.06);border:1px solid rgba(255,107,53,0.2);border-radius:8px;padding:14px;font-size:0.85rem;color:#dde;line-height:1.8;font-style:italic">"${data.negotiation}"</div>
      </div>` : ''}
      ${data.hotSkills ? `
      <div style="margin-top:4px">
        <div style="color:#4caf50;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">🔥 Skills That Boost Salary by 20-30%</div>
        <div>${data.hotSkills.split(',').map(s => `<span style="background:rgba(76,175,80,0.12);border:1px solid rgba(76,175,80,0.25);color:#4caf50;padding:4px 12px;border-radius:100px;font-size:0.8rem;margin:3px;display:inline-block">${s.trim()}</span>`).join('')}</div>
      </div>` : ''}
    </div>`;
}

function salaryBar(label, low, high, pct, color) {
  const highStr = high ? `₹${low}–₹${high.toFixed(1)} LPA` : `₹${low}+ LPA`;
  return `<div>
    <div style="display:flex;justify-content:space-between;margin-bottom:6px">
      <div style="font-size:0.8rem;color:var(--text-muted)">${label}</div>
      <div style="font-weight:700;color:#fff">${highStr}</div>
    </div>
    <div class="score-bar"><div class="score-fill" style="width:${pct}%;background:${color}"></div></div>
  </div>`;
}

function buildFallbackSalary(role, exp, city) {
  const base = { 'Bangalore':8, 'Mumbai':7.5, 'Delhi/NCR':7, 'Hyderabad':8, 'Pune':7, 'Chennai':7, 'Kolkata':5.5, 'Dehradun':4.5, 'Tier-2 City':4 };
  const expAdd = { 'Fresher (0-1 year)':0, 'Junior (1-3 years)':1.5, 'Mid-level (3-6 years)':3, 'Senior (6-10 years)':6, 'Lead/Manager (10+ years)':10 };
  const b = base[city] || 5;
  const e = expAdd[exp] || 0;
  return { low: +(b * 0.5 + e * 0.8).toFixed(1), median: +(b + e).toFixed(1), high: +(b * 2 + e * 1.2).toFixed(1), negotiation: `Based on the ${city} market for ${role} with ${exp.toLowerCase()}, the typical range is ₹${(b*0.5+e*0.8).toFixed(1)}–₹${(b*2+e*1.2).toFixed(1)} LPA. I'm targeting ₹${(b+e).toFixed(1)}–₹${(b*1.5+e).toFixed(1)} LPA given my specific experience. Is there flexibility to reach that range?` };
}

// ════════════════════════════════════════════════════════════
//  AI TOOL: LINKEDIN OPTIMIZER
// ════════════════════════════════════════════════════════════
async function optimizeLinkedIn() {
  const allowed = await checkUsageGate();
  if (!allowed) return;

  const name   = document.getElementById('li-opt-name')?.value.trim()   || 'Your Name';
  const role   = document.getElementById('li-opt-role')?.value.trim()   || 'Professional';
  const exp    = document.getElementById('li-opt-exp')?.value.trim()    || 'Work experience';
  const skills = document.getElementById('li-opt-skills')?.value.trim() || 'Key skills';
  const output = document.getElementById('linkedin-output');

  output.innerHTML = loadingHTML('💼 Optimizing your LinkedIn profile...');

  const aiText = await aiLinkedInOptimizer({ name, role, exp, skills });
  const data   = aiText ? parseLinkedIn(aiText) : null;

  if (!data) {
    output.innerHTML = `<div class="output-placeholder"><p>LinkedIn optimization unavailable. Please configure your Gemini API key.</p></div>`;
    return;
  }

  output.innerHTML = `
    <div class="output-content">
      <h3>💼 LinkedIn Profile Optimized!</h3>
      <div class="output-section">
        <div style="color:#FF6B35;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">🏷️ Headline</div>
        <div style="background:rgba(255,107,53,0.08);border:1px solid rgba(255,107,53,0.2);border-radius:8px;padding:14px;font-weight:600;color:#fff;line-height:1.6">${data.headline}</div>
        <button class="copy-btn" onclick="copyRaw('${escapeForAttr(data.headline)}')" style="margin-top:8px">📋 Copy Headline</button>
      </div>
      <div class="output-section">
        <div style="color:#FF6B35;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">📝 About Section</div>
        <div style="background:rgba(255,255,255,0.04);border-radius:8px;padding:14px;font-size:0.85rem;color:#dde;line-height:1.8;white-space:pre-wrap" id="li-summary-text">${data.summary}</div>
        <button class="copy-btn" onclick="copyText('li-summary-text')" style="margin-top:8px">📋 Copy About Section</button>
      </div>
      ${data.keywords ? `
      <div class="output-section">
        <div style="color:#FF6B35;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">🔑 Keywords to Add</div>
        <div>${data.keywords.split(',').map(k => `<span style="background:rgba(26,26,255,0.12);border:1px solid rgba(26,26,255,0.25);color:#99aaff;padding:4px 12px;border-radius:100px;font-size:0.8rem;margin:3px;display:inline-block">${k.trim()}</span>`).join('')}</div>
      </div>` : ''}
      ${data.tips?.length ? `
      <div>
        <div style="color:#FF6B35;font-size:0.8rem;font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:1px">💡 Profile Tips</div>
        ${data.tips.map(t => `<div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);color:var(--text-soft);font-size:0.85rem">→ ${t}</div>`).join('')}
      </div>` : ''}
    </div>`;
}

// ════════════════════════════════════════════════════════════
//  AI TOOL: EXAM PREP
// ════════════════════════════════════════════════════════════
let _lastQuestion = null;

async function getExamQuestion() {
  const allowed = await checkUsageGate();
  if (!allowed) return;

  const examType = document.getElementById('exam-type')?.value || 'SSC CGL';
  const topic    = document.getElementById('exam-topic')?.value.trim() || '';
  const output   = document.getElementById('exam-output');

  output.innerHTML = loadingHTML('📚 Generating your exam question...');

  const aiText = await aiExamQuestion({ examType, topic });
  _lastQuestion = aiText ? parseExamQuestion(aiText) : null;

  if (!_lastQuestion) {
    output.innerHTML = `<div class="output-placeholder"><p>Exam question generation requires Gemini API key.</p></div>`;
    return;
  }

  const q = _lastQuestion;
  output.innerHTML = `
    <div class="output-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-size:0.75rem;color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:1px">${examType} · ${q.difficulty || 'Medium'}</div>
        <button class="copy-btn" onclick="getExamQuestion()">Next Question →</button>
      </div>
      <div style="background:rgba(255,255,255,0.04);border-radius:10px;padding:20px;margin-bottom:16px;font-size:0.95rem;color:#fff;line-height:1.7;font-weight:500">${q.question}</div>
      <div id="exam-options" style="display:grid;gap:10px">
        ${['A','B','C','D'].map(opt => `
          <button onclick="answerExam('${opt}')" id="opt-${opt}" style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);color:var(--text-soft);border-radius:8px;padding:12px 16px;text-align:left;cursor:pointer;font-size:0.9rem;transition:all 0.2s;font-family:var(--font)" onmouseover="this.style.borderColor='rgba(255,107,53,0.4)'" onmouseout="if(!this.dataset.answered)this.style.borderColor='rgba(255,255,255,0.1)'">
            <strong style="color:#FF6B35;margin-right:8px">${opt})</strong> ${q[opt.toLowerCase()] || 'Option ' + opt}
          </button>`).join('')}
      </div>
    </div>`;
}

function answerExam(chosen) {
  if (!_lastQuestion) return;
  const correct = _lastQuestion.correct?.trim().toUpperCase();
  ['A','B','C','D'].forEach(opt => {
    const btn = document.getElementById(`opt-${opt}`);
    if (!btn) return;
    btn.dataset.answered = '1';
    btn.onclick = null;
    btn.style.cursor = 'default';
    if (opt === correct) {
      btn.style.background = 'rgba(76,175,80,0.15)';
      btn.style.borderColor = '#4caf50';
      btn.style.color = '#c8e6c9';
    } else if (opt === chosen && chosen !== correct) {
      btn.style.background = 'rgba(244,67,54,0.15)';
      btn.style.borderColor = '#f44336';
      btn.style.color = '#ffcdd2';
    }
  });

  const container = document.getElementById('exam-options');
  const isCorrect = chosen === correct;
  container.insertAdjacentHTML('afterend', `
    <div style="margin-top:16px">
      <div style="font-size:1.1rem;font-weight:700;color:${isCorrect ? '#4caf50' : '#f44336'};margin-bottom:8px">${isCorrect ? '✅ Correct!' : `❌ Incorrect — Answer is ${correct}`}</div>
      <div style="background:rgba(26,26,255,0.08);border:1px solid rgba(26,26,255,0.2);border-radius:8px;padding:14px;font-size:0.85rem;color:#99aaff;line-height:1.8">${_lastQuestion.explanation}</div>
      <button class="copy-btn" onclick="getExamQuestion()" style="width:100%;margin-top:12px;padding:12px">📚 Next Question →</button>
    </div>`);
}

// ════════════════════════════════════════════════════════════
//  FAQ TOGGLE
// ════════════════════════════════════════════════════════════
function toggleFaq(el) { el.classList.toggle('open'); }

// ════════════════════════════════════════════════════════════
//  INTERSECTION OBSERVER — ANIMATIONS
// ════════════════════════════════════════════════════════════
function setupIntersectionObserver() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('animated');
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('.feature-card, .testi-card, .price-card, .faq-item').forEach(el => {
    el.classList.add('will-animate');
    obs.observe(el);
  });
}

// ════════════════════════════════════════════════════════════
//  WHATSAPP SHARE (viral growth tool)
// ════════════════════════════════════════════════════════════
function shareOnWhatsApp(toolName, result) {
  const referralCode = userProfile?.referralCode || '';
  const refText = referralCode ? `\n\n🎁 Use my referral code *${referralCode}* for 1 extra free use: ${CONFIG.SITE_URL}` : '';
  const msg = `🚀 Just used CareerAI India's ${toolName} (powered by Google Gemini AI!)\n\n${result ? result.substring(0, 200) + '...' : ''}${refText}\n\n👉 Try it free: ${CONFIG.SITE_URL}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  trackEvent('whatsapp_share', { tool: toolName });
}

function showViralSharePopup() {
  const existing = document.getElementById('viral-popup');
  if (existing) existing.remove();

  const popup = document.createElement('div');
  popup.id = 'viral-popup';
  popup.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.85); backdrop-filter: blur(8px);
    z-index: 9999; display: flex; align-items: center; justify-content: center; padding: 24px;
  `;
  
  popup.innerHTML = `
    <div style="background:var(--card);border:1px solid rgba(37,211,102,0.4);border-radius:24px;padding:40px 32px;max-width:440px;width:100%;text-align:center;box-shadow:0 20px 80px rgba(37,211,102,0.15)">
      <div style="font-size:3.5rem;margin-bottom:16px">🎁</div>
      <h2 style="font-size:1.6rem;font-weight:900;margin-bottom:12px">You're out of free credits!</h2>
      <p style="color:var(--text-muted);margin-bottom:24px;line-height:1.6">You've reached your free limit. But wait — you can <strong style="color:#fff">unlock 1 more free AI generation</strong> right now by sharing CareerAI with a friend on WhatsApp!</p>
      
      <button onclick="executeViralShare()" style="width:100%;background:#25D366;color:#fff;border:none;border-radius:12px;padding:16px;font-size:1.1rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:16px;transition:transform 0.2s;box-shadow:0 8px 24px rgba(37,211,102,0.3)">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
        Share to Unlock Free Use
      </button>
      
      <button onclick="closeViralPopupAndPay()" style="background:none;border:none;color:var(--text-muted);font-size:0.9rem;text-decoration:underline;cursor:pointer">No thanks, I'll pay ₹99 for Pro</button>
    </div>
  `;
  document.body.appendChild(popup);
}

function executeViralShare() {
  const msg = `🚀 Check out CareerAI India! It's an AI that builds ATS-friendly resumes and preps you for TCS/Infosys interviews in 5 minutes.\n\n👉 Try it free: ${CONFIG.SITE_URL}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  
  // They clicked share, so we unlock it for them
  localStorage.setItem('careerai_shared_wa', '1');
  
  const popup = document.getElementById('viral-popup');
  if (popup) {
    popup.innerHTML = `
      <div style="background:var(--card);border:1px solid #4caf50;border-radius:24px;padding:40px 32px;max-width:440px;width:100%;text-align:center">
        <div style="font-size:3.5rem;margin-bottom:16px">✅</div>
        <h2 style="font-size:1.6rem;font-weight:900;margin-bottom:12px;color:#4caf50">Unlocked!</h2>
        <p style="color:var(--text-muted);margin-bottom:24px">Thank you for sharing! Your extra free AI generation has been unlocked.</p>
        <button onclick="document.getElementById('viral-popup').remove()" class="btn-primary" style="width:100%">Continue Using App →</button>
      </div>
    `;
  }
}

function closeViralPopupAndPay() {
  document.getElementById('viral-popup')?.remove();
  if (!currentUser) showSection('signup');
  else showSection('payment');
}


// ════════════════════════════════════════════════════════════
//  REFERRAL NUDGE (show after each generation for free users)
// ════════════════════════════════════════════════════════════
function showReferralNudge(outputEl) {
  if (!currentUser || isPro()) return;
  const code = userProfile?.referralCode;
  if (!code) return;
  const existing = outputEl.querySelector('.referral-nudge');
  if (existing) return; // don't duplicate
  const nudge = document.createElement('div');
  nudge.className = 'referral-nudge';
  nudge.innerHTML = `
    <div class="ref-nudge-inner">
      <span class="ref-icon">🎁</span>
      <div>
        <div class="ref-title">Refer a friend → Get 1 FREE month!</div>
        <div class="ref-code-row">
          <span class="ref-code" id="ref-code-display">${code}</span>
          <button onclick="copyRaw('${code}');showToast('Code copied! Share on WhatsApp 🚀','success')" class="ref-copy-btn">📋 Copy</button>
        </div>
        <div class="ref-sub">Share your code. When they subscribe, you both win!</div>
      </div>
    </div>`;
  outputEl.appendChild(nudge);
}

// ════════════════════════════════════════════════════════════
//  EXIT-INTENT POPUP
// ════════════════════════════════════════════════════════════
function setupExitIntent() {
  let shown = sessionStorage.getItem('exit_intent_shown');
  if (shown) return;
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY < 10 && !shown && !currentUser) {
      shown = '1';
      sessionStorage.setItem('exit_intent_shown', '1');
      showExitPopup();
    }
  });
}

function showExitPopup() {
  const popup = document.getElementById('exit-popup');
  if (popup) popup.classList.add('active');
}

function closeExitPopup() {
  const popup = document.getElementById('exit-popup');
  if (popup) popup.classList.remove('active');
}

// ════════════════════════════════════════════════════════════
//  UTILITY
// ════════════════════════════════════════════════════════════
function loadingHTML(msg) {
  return `<div class="loading-spinner"><div class="spinner"></div> ${msg}</div>`;
}

function copyText(id) {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.innerText).then(() => {
    showToast('✅ Copied to clipboard!', 'success');
  });
}

function copyRaw(text) {
  const decoded = text.replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"');
  navigator.clipboard.writeText(decoded).then(() => showToast('✅ Copied!', 'success'));
}

function escapeForAttr(str) {
  return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&/g, '&amp;');
}
