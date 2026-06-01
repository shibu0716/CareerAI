/**
 * CareerAI India — Gemini AI Service
 * Real AI calls with fallback to high-quality simulated responses
 */

const GEMINI_MODEL = 'gemini-1.5-flash-latest';

// ── CORE API CALL ─────────────────────────────────────────────
async function callGemini(prompt, opts = {}) {
  if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_API_KEY_HERE') {
    console.warn('[Gemini] Not configured — using simulated response');
    return null; // will fall through to simulation
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature:     opts.temperature     ?? 0.8,
            maxOutputTokens: opts.maxTokens       ?? 2048,
            topP:            opts.topP            ?? 0.9,
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ],
        }),
      }
    );
    const data = await res.json();
    if (data.error) {
      console.error('[Gemini] API error:', data.error.message);
      return null;
    }
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (e) {
    console.error('[Gemini] Network error:', e);
    return null;
  }
}

// ── RESUME GENERATION ─────────────────────────────────────────
async function aiGenerateResume({ name, role, exp, skills, edu, lang }) {
  const langNote = lang === 'hi' ? 'Write the summary and experience in English but add a short Hindi note at the bottom.' : '';
  const prompt = `You are an expert Indian resume writer and ATS specialist.

Create a professional, ATS-optimized resume for an Indian job seeker with these details:
- Name: ${name}
- Target Role: ${role}
- Experience: ${exp}
- Skills: ${skills}
- Education: ${edu}

Instructions:
1. Write powerful, quantified bullet points (use numbers like "increased by 30%", "reduced by 2 hours", "saved ₹2 lakhs")
2. Use strong action verbs: Spearheaded, Orchestrated, Delivered, Optimized, Architected
3. Make it ATS-friendly with relevant keywords for "${role}" jobs in India
4. Format as plain text with clear sections: SUMMARY, EXPERIENCE, SKILLS, EDUCATION
5. Keep it concise — suitable for Indian job market (Naukri, LinkedIn, company portals)
6. Include a realistic ATS score estimate (number out of 100) at the very end like: ATS_SCORE:87
${langNote}

Generate the resume now:`;

  const result = await callGemini(prompt, { temperature: 0.7 });
  return result;
}

// ── INTERVIEW FEEDBACK ────────────────────────────────────────
async function aiInterviewFeedback({ company, interviewType, question, answer }) {
  if (!answer || answer.trim().length < 10) return null;

  const prompt = `You are an expert HR interviewer and career coach specializing in Indian job market (TCS, Infosys, Wipro, Google India, Banks, UPSC, SSC).

Interview Context:
- Company: ${company}
- Interview Type: ${interviewType}
- Question asked: "${question}"
- Candidate's answer: "${answer}"

Provide detailed, actionable feedback in this exact format:

SCORE: [0-100]
STRENGTHS:
- [strength 1]
- [strength 2]
IMPROVEMENTS:
- [improvement 1]
- [improvement 2]
MODEL_ANSWER:
[Write a 3-4 sentence model answer using the STAR method that would score 90+]
QUICK_TIPS:
- [tip 1 specific to ${company}]
- [tip 2]

Be honest, specific, and use Indian job market context. Mention if the answer would impress a ${company} HR.`;

  return await callGemini(prompt, { temperature: 0.6 });
}

// ── COVER LETTER ──────────────────────────────────────────────
async function aiGenerateCoverLetter({ name, role, company, jd, achievement }) {
  const prompt = `You are an expert cover letter writer for the Indian job market.

Write a compelling, personalized cover letter for:
- Applicant: ${name} applying for ${role}
- Company: ${company}
- Job Description highlights: ${jd}
- Key achievement to highlight: ${achievement}

Instructions:
1. Write in a professional but warm Indian business English tone
2. Keep it to 3 paragraphs + greeting/closing
3. Specifically reference ${company}'s values or work
4. Quantify the achievement
5. End with a confident, action-oriented closing
6. Make it feel personal, not templated
7. Total length: 200-250 words

Generate the cover letter (just the letter body, no meta-text):`;

  return await callGemini(prompt, { temperature: 0.8 });
}

// ── SALARY INSIGHTS ───────────────────────────────────────────
async function aiSalaryInsights({ role, exp, city }) {
  const prompt = `You are a salary data expert for the Indian job market (2025-2026 data).

Provide salary insights for:
- Role: ${role}
- Experience: ${exp}
- City: ${city}

Give response in this exact format:
LOW_LPA: [number]
MEDIAN_LPA: [number]  
HIGH_LPA: [number]
MARKET_INSIGHT: [2 sentences about this role's demand in India]
NEGOTIATION_TIP: [1 specific, actionable negotiation tip for this role/city]
GROWTH_OUTLOOK: [1 sentence about career growth]
HOT_SKILLS: [3 skills that can boost salary by 20-30% for this role]

Use realistic 2025-26 Indian market data in LPA (Lakhs Per Annum).`;

  return await callGemini(prompt, { temperature: 0.4 });
}

// ── LINKEDIN OPTIMIZER ────────────────────────────────────────
async function aiLinkedInOptimizer({ name, role, exp, skills }) {
  const prompt = `You are a LinkedIn optimization expert for Indian professionals.

Optimize the LinkedIn profile for:
- Name: ${name}
- Role: ${role}
- Experience: ${exp}
- Skills: ${skills}

Provide in this exact format:
HEADLINE: [Compelling LinkedIn headline under 220 chars, keyword-rich]
SUMMARY: [3-paragraph About section, 2000 chars max, first-person, includes keywords for ${role} in India]
KEYWORDS: [10 most important LinkedIn keywords for this profile]
PROFILE_TIPS:
- [tip 1]
- [tip 2]
- [tip 3]`;

  return await callGemini(prompt, { temperature: 0.7 });
}

// ── EXAM PREP ─────────────────────────────────────────────────
async function aiExamQuestion({ examType, topic }) {
  const prompt = `You are an expert coach for Indian competitive exams (SSC, UPSC, Bank PO, IBPS, RRB).

Generate 1 multiple-choice question for:
- Exam: ${examType}
- Topic: ${topic || 'Current Affairs / General Knowledge'}

Format exactly:
QUESTION: [The question]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
CORRECT: [A/B/C/D]
EXPLANATION: [2-3 sentences explaining why this answer is correct, with context relevant to India]
DIFFICULTY: [Easy/Medium/Hard]`;

  return await callGemini(prompt, { temperature: 0.5 });
}

// ── PARSE HELPERS ─────────────────────────────────────────────
function parseATSScore(text) {
  if (!text) return null;
  const match = text.match(/ATS_SCORE:(\d+)/);
  return match ? parseInt(match[1]) : Math.floor(75 + Math.random() * 20);
}

function parseSalaryData(text) {
  if (!text) return null;
  const get = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*([\\d.]+)`));
    return m ? parseFloat(m[1]) : null;
  };
  const getStr = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : '';
  };
  return {
    low:           get('LOW_LPA'),
    median:        get('MEDIAN_LPA'),
    high:          get('HIGH_LPA'),
    insight:       getStr('MARKET_INSIGHT'),
    negotiation:   getStr('NEGOTIATION_TIP'),
    growth:        getStr('GROWTH_OUTLOOK'),
    hotSkills:     getStr('HOT_SKILLS'),
  };
}

function parseInterviewFeedback(text) {
  if (!text) return null;
  const get = (key, multiline = false) => {
    if (multiline) {
      const m = text.match(new RegExp(`${key}:\\n([\\s\\S]+?)(?=\\n[A-Z_]+:|$)`));
      return m ? m[1].trim() : '';
    }
    const m = text.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : '';
  };
  return {
    score:       parseInt(get('SCORE')) || 70,
    strengths:   get('STRENGTHS', true).split('\n').filter(l => l.startsWith('-')).map(l => l.slice(2)),
    improvements:get('IMPROVEMENTS', true).split('\n').filter(l => l.startsWith('-')).map(l => l.slice(2)),
    modelAnswer: get('MODEL_ANSWER', true),
    tips:        get('QUICK_TIPS', true).split('\n').filter(l => l.startsWith('-')).map(l => l.slice(2)),
  };
}

function parseLinkedIn(text) {
  if (!text) return null;
  const get = (key, multiline = false) => {
    if (multiline) {
      const m = text.match(new RegExp(`${key}:\\s*([\\s\\S]+?)(?=\\n[A-Z_]+:|$)`));
      return m ? m[1].trim() : '';
    }
    const m = text.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : '';
  };
  return {
    headline: get('HEADLINE'),
    summary:  get('SUMMARY', true),
    keywords: get('KEYWORDS'),
    tips:     get('PROFILE_TIPS', true).split('\n').filter(l => l.startsWith('-')).map(l => l.slice(2)),
  };
}

function parseExamQuestion(text) {
  if (!text) return null;
  const get = (key) => {
    const m = text.match(new RegExp(`${key}:\\s*(.+)`));
    return m ? m[1].trim() : '';
  };
  return {
    question:    get('QUESTION'),
    a:           get('A\\)'),
    b:           get('B\\)'),
    c:           get('C\\)'),
    d:           get('D\\)'),
    correct:     get('CORRECT'),
    explanation: get('EXPLANATION'),
    difficulty:  get('DIFFICULTY'),
  };
}
