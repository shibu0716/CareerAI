import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
        title_match = re.search(r'<title>(.*?)</title>', content, re.IGNORECASE | re.DOTALL)
        desc_match = re.search(r'<meta[^>]+name=[\'"]description[\'"][^>]+content=[\'"](.*?)[\'"]', content, re.IGNORECASE | re.DOTALL)
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', content, re.IGNORECASE | re.DOTALL)
        canonical_match = re.search(r'<link[^>]+rel=[\'"]canonical[\'"][^>]+href=[\'"](.*?)[\'"]', content, re.IGNORECASE | re.DOTALL)
        og_title = re.search(r'<meta[^>]+property=[\'"]og:title[\'"]', content, re.IGNORECASE)

        print(f"--- {f} ---")
        print(f"Title: {'PRESENT' if title_match else 'MISSING'}")
        print(f"Description: {'PRESENT' if desc_match else 'MISSING'}")
        print(f"H1: {'PRESENT' if h1_match else 'MISSING'}")
        print(f"Canonical: {'PRESENT' if canonical_match else 'MISSING'}")
        print(f"OG Title: {'PRESENT' if og_title else 'MISSING'}")
