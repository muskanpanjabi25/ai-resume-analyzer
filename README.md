# 📄 AI Resume Analyzer

A small GenAI web app that compares a resume with a job description and returns a match score, matched/missing skills, strengths, improvement tips and a suggested professional summary. It uses the Google Gemini API.

**Live demo:** https://YOUR-USERNAME.github.io/ai-resume-analyzer/  *(replace after deploying)*

## Features
- Match score (AI estimate) with a visual ring
- Matched and missing skills
- Strengths and actionable improvements
- Suggested professional summary with copy button
- Load resume from a `.txt` file, sample data button
- Input validation, loading state, readable error messages (invalid key, rate limit, timeout)
- Light and dark mode, responsive layout

## Tech stack
HTML5, CSS3, vanilla JavaScript, Google Gemini API (`generateContent`).

## Run locally
1. Download or clone the repo.
2. Open `index.html` in a browser (or use VS Code Live Server).
3. Get a free API key from https://aistudio.google.com/apikey.
4. Paste the key in **Settings** and click **Save settings**.
5. Click **Load sample data** and then **Analyze resume**.

## Security
- The API key is typed by the user in the browser and stored only in that browser's `localStorage`.
- **Never hardcode your key in the code or commit it to GitHub.**
- Your resume text is sent to Google's Gemini API only when you click Analyze.

## Deploy with GitHub Pages
1. Push this repo to GitHub.
2. Repo → **Settings → Pages**.
3. Source: **Deploy from a branch**, Branch: **main**, Folder: **/ (root)** → Save.
4. After a minute, your site is live at `https://<username>.github.io/<repo-name>/`.

## Project structure
```
ai-resume-analyzer/
├── index.html   # page structure
├── style.css    # styling (light + dark)
├── app.js       # UI logic + Gemini API call
├── README.md
└── .gitignore
```

## Limitations and future work
- AI score is an estimate, not an official ATS result.
- Only plain-text resumes (PDF/DOCX upload can be added).
- Future: PDF parsing, cover-letter generator, saved history, backend proxy for the API key.

## Disclaimer
AI output is informational guidance and may contain mistakes.
