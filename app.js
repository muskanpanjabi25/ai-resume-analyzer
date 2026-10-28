const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const list = a => Array.isArray(a) ? a.filter(Boolean) : [];

// ---- Settings (API key stays in YOUR browser only; never put it in code) ----
try {
  $("key").value = localStorage.getItem("gemini_key") || "";
  $("model").value = localStorage.getItem("gemini_model") || "gemini-2.5-flash";
} catch (e) {}
$("saveKey").onclick = () => {
  try {
    localStorage.setItem("gemini_key", $("key").value.trim());
    localStorage.setItem("gemini_model", $("model").value.trim() || "gemini-2.5-flash");
    $("err").textContent = "";
    $("saveKey").textContent = "Saved ✓";
    setTimeout(() => $("saveKey").textContent = "Save settings", 1500);
  } catch (e) { $("err").textContent = "Could not save settings in this browser."; }
};

// ---- Gemini call ----
async function callGemini(prompt) {
  const key = $("key").value.trim();
  const model = $("model").value.trim() || "gemini-2.5-flash";
  if (!key) throw new Error("Please paste your Gemini API key in Settings first.");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 60000);
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.3 }
      }),
      signal: ctrl.signal
    });
  } catch (e) {
    throw new Error(e.name === "AbortError" ? "Request timed out. Try again." : "Network error. Check your internet connection.");
  } finally { clearTimeout(timer); }
  if (!res.ok) {
    if (res.status === 400 || res.status === 403) throw new Error("API key is invalid or not allowed. Check your key.");
    if (res.status === 404) throw new Error("Model not found. Change the model name in Settings (see Google AI Studio for current names).");
    if (res.status === 429) throw new Error("Rate limit reached. Wait a minute and try again.");
    throw new Error("Gemini API error (" + res.status + "). Try again later.");
  }
  const data = await res.json();
  const parts = (data.candidates?.[0]?.content?.parts || []).filter(p => p.text && !p.thought);
  const text = parts.map(p => p.text).join("");
  if (!text) throw new Error("AI returned an empty response. Try again.");
  try { return JSON.parse(text.replace(/```json|```/g, "").trim()); }
  catch (e) { throw new Error("AI returned an invalid format. Please try again."); }
}

// ---- UI ----
$("file").onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader(); r.onload = () => { $("resume").value = r.result; }; r.readAsText(f);
};
$("demo").onclick = () => {
  $("resume").value = "Rahul Sharma\nB.Tech CSE (2026), 8.1 CGPA\nSkills: Core Java, Spring Boot, MySQL, HTML, CSS, JavaScript, Git\nProjects: Student Management System (Java, JDBC, MySQL); Library REST API (Spring Boot, Postman)\nInternship: Web developer intern, 2 months, built landing pages.";
  $("jd").value = "Junior Java Backend Developer. Required: Java, Spring Boot, REST APIs, MySQL, JPA/Hibernate, Maven, Git, unit testing (JUnit), basic Docker. Good to have: AWS, CI/CD.";
};
$("clear").onclick = () => { $("resume").value = ""; $("jd").value = ""; $("res").hidden = true; $("err").textContent = ""; };

function show(r) {
  const sc = Math.max(0, Math.min(100, Math.round(Number(r.score) || 0)));
  const col = sc >= 75 ? "var(--ok)" : sc >= 50 ? "var(--warn)" : "var(--bad)";
  const chips = (a, c) => list(a).map(x => `<span class="chip ${c}">${esc(x)}</span>`).join("") || '<span class="note">None found</span>';
  const ul = a => "<ul>" + list(a).map(x => `<li>${esc(x)}</li>`).join("") + "</ul>";
  $("res").innerHTML = `<div class="card top"><div class="ring" style="background:conic-gradient(${col} ${sc * 3.6}deg,var(--bd) 0)"><span>${sc}</span></div><div><h2>Match score (AI estimate)</h2><div>${esc(r.verdict)}</div></div></div>
  <div class="grid"><div class="card"><h2>✅ Matched skills</h2><div class="chips">${chips(r.matched, "g")}</div></div><div class="card"><h2>❌ Missing skills</h2><div class="chips">${chips(r.missing, "r")}</div></div></div>
  <div class="grid"><div class="card"><h2>💪 Strengths</h2>${ul(r.strengths)}</div><div class="card"><h2>🛠 Improvements</h2>${ul(r.improvements)}</div></div>
  <div class="card"><h2>✍️ Suggested professional summary</h2><div class="rew" id="rew">${esc(r.summary_rewrite)}</div><div class="bar"><button class="ghost" id="cp" type="button">Copy</button></div></div>`;
  $("res").hidden = false;
  $("cp").onclick = async e => {
    try { await navigator.clipboard.writeText($("rew").textContent); e.target.textContent = "Copied ✓"; }
    catch (x) { e.target.textContent = "Select and copy manually"; }
  };
}

$("go").onclick = async () => {
  const resume = $("resume").value.trim(), jd = $("jd").value.trim();
  if (resume.length < 50 || jd.length < 30) { $("err").textContent = "Please paste a longer resume (50+ characters) and job description (30+ characters)."; return; }
  $("err").textContent = "";
  const btn = $("go"); btn.disabled = true; btn.textContent = "Analyzing…";
  const prompt = `You are an experienced technical recruiter. Compare the RESUME with the JOB DESCRIPTION. Use only information present in the texts; never invent experience. Be honest and specific.
Return ONLY JSON with this shape:
{"score":0-100 integer,"verdict":"one sentence","matched":["skills present in both"],"missing":["skills required by the job but absent from resume"],"strengths":["3-4 items"],"improvements":["4-5 concrete, actionable resume edits"],"summary_rewrite":"3-line professional summary using only facts from the resume"}

RESUME:
${resume.slice(0, 6000)}

JOB DESCRIPTION:
${jd.slice(0, 4000)}`;
  try { show(await callGemini(prompt)); }
  catch (e) { $("err").textContent = e.message; }
  btn.disabled = false; btn.textContent = "Analyze resume";
};
