/* script.js - corrected and defensive */
console.log("Interface Loaded Successfully");

// Helper to query DOM safely
function $(id) { return document.getElementById(id); }

// DOM elements (may be null if markup changed)
const planVisitCard = $('planVisitCard');
const modal = $('planModal');
const closeBtn = document.querySelector('.close');
const cancelBtn = $('cancelBtn');
const planForm = $('planForm');
const aiResults = $('aiResults');
const recommendationsContainer = $('recommendationsContainer');
const downloadPdfBtn = $('downloadPdfBtn');
const regenerateBtn = $('regenerateBtn');

// Fallback DB (unchanged) - keep original jharkhandDestinations and getJharkhandRecommendations function
// ... copy the jharkhandDestinations and getJharkhandRecommendations from your original file here ...
// For brevity in this snippet, we'll include the function references assume they exist.
// If you removed them earlier, paste them back exactly as before.

if (typeof getJharkhandRecommendations !== 'function') {
  // Minimal fallback to avoid runtime errors - simple placeholder
  window.getJharkhandRecommendations = function(formData) {
    return [
      { title: "Recommended Destination", content: "Ranchi - The capital city with scenic beauty." },
      { title: "Top Attractions", content: "Ranchi Hill, Tagore Hill, Pahari Mandir" },
      { title: "Best Time to Visit", content: "October to March" }
    ];
  };
}

// UI helpers
function showLoading() {
  if (!recommendationsContainer) return;
  recommendationsContainer.innerHTML = `
    <div class="loading">
      <div class="loading-spinner"></div>
      <p>AI is analyzing your preferences...</p>
    </div>`;
  if (aiResults) aiResults.style.display = 'block';
  setTimeout(() => {
    if (recommendationsContainer.scrollIntoView) {
      recommendationsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 300);
}

function displayRecommendations(recommendations) {
  if (!recommendationsContainer) return;
  recommendationsContainer.innerHTML = '';
  recommendations.forEach(rec => {
    const el = document.createElement('div');
    el.className = 'recommendation-item';
    el.innerHTML = `<div class="recommendation-title">${escapeHtml(rec.title)}</div>
                    <div class="recommendation-content">${escapeHtml(rec.content)}</div>`;
    recommendationsContainer.appendChild(el);
  });
  if (aiResults) aiResults.style.display = 'block';
}

// simple HTML escape
function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/[&<>"']/g, function (m) {
    return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[m];
  });
}

// Modal controls
function openModal() {
  if (!modal) return;
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  if (planForm) planForm.reset();
  if (aiResults) aiResults.style.display = 'none';
}
function closeModal() {
  if (!modal) return;
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = 'auto';
}

// Attach listeners safely
if (planVisitCard) planVisitCard.addEventListener('click', openModal);
if (closeBtn) closeBtn.addEventListener('click', closeModal);
if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => { if (modal && e.target === modal) closeModal(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal && modal.style.display === 'block') closeModal(); });

// PDF download
if (downloadPdfBtn) {
  downloadPdfBtn.addEventListener('click', () => {
    if (!recommendationsContainer) return alert('No recommendations to export.');
    const filename = `trip-plan-${Date.now()}.pdf`;
    const opt = {
      margin: 10,
      filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
    };
    html2pdf().from(recommendationsContainer).set(opt).save().catch(err => {
      console.error('PDF error', err);
      alert('Could not generate PDF. Check console.');
    });
  });
}

// Regenerate button
let lastFormData = null;
if (regenerateBtn) {
  regenerateBtn.addEventListener('click', () => {
    if (!lastFormData) return alert('No previous preferences found. Submit the form first.');
    processFormData(lastFormData);
  });
}

// Form submit
if (planForm) {
  planForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = {
      destination: $('destination')?.value || '',
      travelDate: $('travelDate')?.value || '',
      travellers: $('travellers')?.value || '',
      tripType: $('tripType')?.value || '',
      budget: $('budget')?.value || '',
      hotelNearby: $('hotelNearby')?.checked || false,
      bestPlaces: $('bestPlaces')?.checked || false
    };
    lastFormData = formData;
    processFormData(formData);
  });
}

function processFormData(formData) {
  showLoading();
  const prompt = buildPromptFromForm(formData);

  // Use backend proxy - recommended
  callAiBackend(prompt)
    .then(aiText => {
      // try to parse structured JSON from agent, otherwise heuristically parse plain text
      const recs = parseAiTextToRecommendations(aiText, formData);
      displayRecommendations(recs);
    })
    .catch(err => {
      console.error('AI backend error:', err);
      // fallback to local generator
      const fallback = getJharkhandRecommendations(formData);
      displayRecommendations(fallback);
    });
}

function buildPromptFromForm(formData) {
  return `User preferences:
- Destination: ${formData.destination}
- Date: ${formData.travelDate}
- Travellers: ${formData.travellers}
- Trip type: ${formData.tripType}
- Budget: ${formData.budget}
- Hotel near me: ${formData.hotelNearby}
- Show best places: ${formData.bestPlaces}

Please provide: a recommended destination, top attractions, best time to visit, accommodation suggestions, travel tips, and 2-3 sample activities. Return the answer in plain text with headings.`;
}

// Backend call
async function callAiBackend(prompt) {
  const resp = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Backend error ${resp.status}: ${txt}`);
  }
  const json = await resp.json();
  // server returns { text: "..." }
  return json.text || JSON.stringify(json);
}

// Parse AI text into recommendation objects (best-effort)
function parseAiTextToRecommendations(aiText, formData) {
  if (!aiText || typeof aiText !== 'string') return getJharkhandRecommendations(formData);

  // If AI returned JSON (some models can), try to parse
  try {
    const maybeJson = JSON.parse(aiText);
    if (Array.isArray(maybeJson)) {
      return maybeJson.map(it => ({ title: it.title || 'Info', content: it.content || String(it) }));
    }
    if (maybeJson.title && maybeJson.content) return [ { title: maybeJson.title, content: maybeJson.content } ];
  } catch (e) {
    // not JSON, continue
  }

  // Heuristic parse: split by headings or blank lines
  const chunks = aiText.split(/\n{2,}/).filter(Boolean);
  const items = [];
  for (const ch of chunks.slice(0, 10)) {
    // try to extract first line as title
    const lines = ch.trim().split(/\r?\n/).filter(Boolean);
    if (lines.length === 1) {
      items.push({ title: lines[0].slice(0,60), content: '' });
    } else {
      items.push({ title: lines[0].slice(0,60), content: lines.slice(1).join(' ').slice(0,2000) });
    }
  }
  if (items.length === 0) return getJharkhandRecommendations(formData);
  return items;
}
