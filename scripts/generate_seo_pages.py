import os
import json
from datetime import datetime

# Define the target pages to generate
PAGES = [
    {
        "filename": "wipro-interview-questions-2025.html",
        "title": "Wipro Interview Questions 2025 — HR + Technical Round Q&A | CareerAI India",
        "description": "Crack the Wipro WILP and Elite interviews. Get the top 20 HR & Technical questions asked in Wipro 2025 with answers, salary insights, and free AI mock interviews.",
        "keywords": "Wipro interview questions 2025, Wipro HR round questions, Wipro WILP preparation, Wipro technical interview",
        "h1": "Wipro Interview Questions 2025 — HR & Technical Round Answers",
        "company": "Wipro",
        "salary_range": "3.5 LPA (Elite) to 6.5 LPA (Turbo)"
    },
    {
        "filename": "infosys-interview-questions-2025.html",
        "title": "Infosys Interview Questions 2025 — HR + Technical Round Q&A | CareerAI India",
        "description": "Crack the Infosys System Engineer interviews. Get the top 20 HR & Technical questions asked in Infosys 2025 with answers, salary insights, and free AI mock interviews.",
        "keywords": "Infosys interview questions 2025, Infosys HR round questions, Infosys System Engineer preparation",
        "h1": "Infosys Interview Questions 2025 — HR & Technical Round Answers",
        "company": "Infosys",
        "salary_range": "3.6 LPA (System Engineer) to 5.0 LPA (Specialist Programmer)"
    },
    {
        "filename": "cognizant-interview-questions-2025.html",
        "title": "Cognizant Interview Questions 2025 — HR + Technical Round Q&A | CareerAI India",
        "description": "Crack the Cognizant GenC interviews. Get the top 20 HR & Technical questions asked in Cognizant 2025 with answers, salary insights, and free AI mock interviews.",
        "keywords": "Cognizant interview questions 2025, Cognizant HR round questions, Cognizant GenC preparation",
        "h1": "Cognizant Interview Questions 2025 — HR & Technical Round Answers",
        "company": "Cognizant",
        "salary_range": "4.0 LPA (GenC) to 6.7 LPA (GenC Next)"
    }
]

TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{description}" />
  <meta name="keywords" content="{keywords}" />
  <link rel="canonical" href="https://careerai.in/{filename}" />
  <meta property="og:title" content="{h1}" />
  <meta property="og:description" content="Real questions + AI practice for {company} HR and Technical rounds." />
  <meta property="og:type" content="article" />
  <!-- Vercel Speed Insights -->
  <script>window.va = window.va || function () {{ (window.vaq = window.vaq || []).push(arguments); }};</script>
  <script defer src="/_vercel/insights/script.js"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Baloo+2:wght@600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="style.css" />
  <style>
    .seo-header {{ padding: 40px 24px 20px; border-bottom: 1px solid rgba(255,255,255,0.06); text-align: center; }}
    .seo-logo {{ font-family: var(--font-display); font-size: 1.5rem; font-weight: 800; color: #fff; text-decoration: none; }}
    .seo-logo span {{ color: var(--primary); }}
    .seo-article {{ max-width: 800px; margin: 0 auto; padding: 60px 24px; }}
    .seo-title {{ font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 900; line-height: 1.15; margin-bottom: 24px; }}
    .seo-meta {{ color: var(--text-muted); font-size: 0.9rem; margin-bottom: 40px; }}
    .seo-content h2 {{ font-size: 1.8rem; font-weight: 800; margin: 48px 0 20px; color: var(--text); }}
    .seo-content h3 {{ font-size: 1.4rem; font-weight: 700; margin: 32px 0 16px; color: var(--text-soft); }}
    .seo-content p {{ font-size: 1.05rem; line-height: 1.8; color: var(--text-muted); margin-bottom: 24px; }}
    .seo-content ul, .seo-content ol {{ margin-bottom: 24px; padding-left: 24px; color: var(--text-muted); font-size: 1.05rem; line-height: 1.8; }}
    .seo-content li {{ margin-bottom: 8px; }}
    .qa-box {{ background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px; }}
    .qa-q {{ font-weight: 700; color: #fff; margin-bottom: 12px; font-size: 1.1rem; }}
    .qa-a {{ color: var(--text-muted); font-size: 1rem; line-height: 1.7; }}
    .qa-tip {{ background: rgba(255,107,53,0.1); border-left: 4px solid var(--primary); padding: 12px 16px; margin-top: 16px; font-size: 0.9rem; color: #fff; }}
    .seo-cta-box {{ background: linear-gradient(135deg, rgba(255,107,53,0.1), rgba(120,75,160,0.1)); border: 1px solid rgba(255,107,53,0.3); border-radius: 16px; padding: 40px; text-align: center; margin: 48px 0; }}
    .seo-cta-box h3 {{ margin-top: 0; color: #fff; }}
    .seo-cta-box p {{ color: var(--text-soft); }}
    .seo-btn {{ display: inline-block; background: var(--grad); color: #fff; padding: 16px 32px; border-radius: 100px; font-weight: 700; font-size: 1.1rem; text-decoration: none; transition: transform 0.2s; box-shadow: 0 8px 32px rgba(255,107,53,0.4); margin-top: 16px; }}
    .seo-btn:hover {{ transform: translateY(-3px); }}
  </style>
</head>
<body>

<header class="seo-header">
  <a href="index.html" class="seo-logo">🚀 CareerAI<span>India</span></a>
</header>

<main class="seo-article">
  <h1 class="seo-title">{h1}</h1>
  <div class="seo-meta">Updated: {date} • 8 min read</div>

  <div class="seo-content">
    <p>{company} is one of the biggest IT recruiters in India. Cracking the {company} interview process in 2025 requires passing the tricky HR and Managerial rounds where many candidates fail.</p>

    <h2>{company} Hiring Process 2025 Overview</h2>
    <p>The standard {company} recruitment process consists of 3 stages:</p>
    <ol>
      <li><strong>Written Test:</strong> Aptitude, logical reasoning, and coding.</li>
      <li><strong>Technical Round (TR):</strong> Core subjects, resume deep-dive, and projects.</li>
      <li><strong>HR & Managerial Round (MR/HR):</strong> Culture fit, adaptability, and communication skills.</li>
    </ol>

    <div class="seo-cta-box">
      <h3>Don't Just Read—Practice with AI</h3>
      <p>Simulate the actual {company} Technical and HR round with our AI Interview Coach. It gives you instant feedback on your answers.</p>
      <a href="index.html#tools" class="seo-btn">Start Free Mock Interview →</a>
    </div>

    <h2>Top 10 {company} HR Round Questions</h2>
    <p>{company} HR rounds test your reliability. They are looking for long-term employees, not job-hoppers.</p>

    <div class="qa-box">
      <div class="qa-q">1. Are you willing to relocate to any location in India?</div>
      <div class="qa-a">
        "Yes, absolutely. I am quite flexible and eager to start my career with {company}. Relocating would give me a great opportunity to explore a new city, meet different people, and learn to be more independent."
        <div class="qa-tip"><strong>Pro Tip:</strong> Always say YES. Large IT companies have offices across India and require flexibility.</div>
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-q">2. Are you comfortable working in night shifts?</div>
      <div class="qa-a">
        "Yes, I am comfortable with rotational and night shifts. I understand that {company} serves global clients across different time zones, and adapting to their business hours is part of the role."
      </div>
    </div>

    <div class="qa-box">
      <div class="qa-q">3. Why should we hire you?</div>
      <div class="qa-a">
        "As a fresher, I bring a strong foundation in problem-solving and a quick learning attitude. During my final year project, I learned how to work in a team and meet deadlines. I am eager to contribute to {company}'s growth while building a long-term career here."
      </div>
    </div>

    <h2>{company} Salary Packages for Freshers 2025</h2>
    <ul>
      <li><strong>Base to Advanced Roles:</strong> ~{salary_range}</li>
    </ul>

    <div class="seo-cta-box" style="margin-top:60px">
      <h3>Ready to Ace Your {company} Interview?</h3>
      <p>Practice these exact questions with our AI Interviewer. Get feedback on your tone, grammar, and content.</p>
      <a href="index.html#tools" class="seo-btn">Start Mock Interview Now →</a>
    </div>
  </div>
</main>

<footer style="text-align:center; padding:40px; border-top:1px solid rgba(255,255,255,0.06); margin-top:60px;">
  <p style="color:var(--text-muted); font-size:0.9rem;">© 2026 CareerAI India. <a href="index.html" style="color:#FF6B35; text-decoration:none;">Back to Home</a></p>
</footer>

</body>
</html>
"""

def generate_pages():
    current_date = datetime.now().strftime("%B %Y")
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    generated_files = []
    
    for page in PAGES:
        # Fill template
        html_content = TEMPLATE.format(
            title=page["title"],
            description=page["description"],
            keywords=page["keywords"],
            filename=page["filename"],
            h1=page["h1"],
            company=page["company"],
            salary_range=page["salary_range"],
            date=current_date
        )
        
        # Write to file
        file_path = os.path.join(project_root, page["filename"])
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(html_content)
        print(f"Generated: {page['filename']}")
        generated_files.append(page["filename"])
        
    # Update sitemap
    sitemap_path = os.path.join(project_root, "sitemap.xml")
    if os.path.exists(sitemap_path):
        with open(sitemap_path, "r", encoding="utf-8") as f:
            sitemap_content = f.read()
            
        # Find where to insert new URLs (before </urlset>)
        insert_idx = sitemap_content.rfind("</urlset>")
        if insert_idx != -1:
            new_urls = []
            today_str = datetime.now().strftime("%Y-%m-%d")
            
            for filename in generated_files:
                if f"<loc>https://careerai.in/{filename}</loc>" not in sitemap_content:
                    new_urls.append(f"""  <url>
    <loc>https://careerai.in/{filename}</loc>
    <lastmod>{today_str}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
""")
            
            if new_urls:
                updated_sitemap = sitemap_content[:insert_idx] + "".join(new_urls) + sitemap_content[insert_idx:]
                with open(sitemap_path, "w", encoding="utf-8") as f:
                    f.write(updated_sitemap)
                print(f"Updated sitemap.xml with {len(new_urls)} new URLs.")
            else:
                print("Sitemap already up to date.")

if __name__ == "__main__":
    generate_pages()
