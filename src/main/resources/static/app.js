// ── Constants ─────────────────────────────────────────────────────────────────

const GOALS = { calories: 2000, protein: 100, water: 2.5 };

const ICON_EDIT = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`;
const ICON_TRASH = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`;

// ── User context ──────────────────────────────────────────────────────────────

let activeUserId = null;

function userHeaders() {
  return { 'Content-Type': 'application/json', 'X-User-Id': String(activeUserId) };
}

async function initUsers() {
  const res = await fetch('/api/users');
  const users = await res.json();
  const savedId = localStorage.getItem('activeUserId');
  activeUserId = savedId ? Number(savedId) : users[0]?.id;

  document.getElementById('user-switcher').innerHTML = users.map(u => `
    <button id="user-btn-${u.id}" onclick="switchUser(${u.id})"
      title="${u.displayName}"
      class="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition ${
        u.id === activeUserId
          ? 'bg-emerald-600 text-white shadow-sm'
          : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}">
      ${u.displayName.charAt(0).toUpperCase()}
    </button>`).join('');
}

function switchUser(id) {
  activeUserId = id;
  localStorage.setItem('activeUserId', id);
  document.querySelectorAll('[id^="user-btn-"]').forEach(btn => {
    const active = btn.id === `user-btn-${id}`;
    btn.className = `w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition ${
      active ? 'bg-emerald-600 text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`;
  });
  refreshAll();
}

// ── Panel management ──────────────────────────────────────────────────────────

let insightsPeriod = 7;
let currentPanel = 'feed';

const NAV_ACTIVE   = 'text-emerald-600';
const NAV_INACTIVE = 'text-stone-400 hover:text-stone-600';

function setActiveNav(tab) {
  ['home', 'history', 'insights'].forEach(t => {
    const btn = document.getElementById(`nav-${t}`);
    btn.className = btn.className
      .replace(NAV_ACTIVE, '').replace(NAV_INACTIVE, '').trim()
      + ' flex flex-col items-center gap-1 px-6 py-1 transition '
      + (t === tab ? NAV_ACTIVE : NAV_INACTIVE);
  });
}

function showFeed() {
  currentPanel = 'feed';
  document.getElementById('panel-feed').classList.remove('hidden');
  document.getElementById('panel-history').classList.add('hidden');
  document.getElementById('panel-insights').classList.add('hidden');
  setActiveNav('home');
}

function showHistory() {
  currentPanel = 'history';
  document.getElementById('panel-feed').classList.add('hidden');
  document.getElementById('panel-history').classList.remove('hidden');
  document.getElementById('panel-insights').classList.add('hidden');
  setActiveNav('history');
  refreshHistory();
}

function showInsights() {
  currentPanel = 'insights';
  document.getElementById('panel-feed').classList.add('hidden');
  document.getElementById('panel-history').classList.add('hidden');
  document.getElementById('panel-insights').classList.remove('hidden');
  setActiveNav('insights');
  refreshInsights();
}

// ── API ───────────────────────────────────────────────────────────────────────

const api = {
  get:    (path)       => fetch(path, { headers: userHeaders() }).then(r => r.json()),
  post:   (path, body) => fetch(path, { method: 'POST',   headers: userHeaders(), body: JSON.stringify(body) }),
  put:    (path, body) => fetch(path, { method: 'PUT',    headers: userHeaders(), body: JSON.stringify(body) }),
  delete: (path)       => fetch(path, { method: 'DELETE', headers: userHeaders() }),
};

// ── Feed (last 10 hours) ──────────────────────────────────────────────────────

async function refreshFeed() {
  const [mealSession, waterSession] = await Promise.all([
    api.get('/api/meals/current-session'),
    api.get('/api/hydration/current-session'),
  ]);

  document.getElementById('stat-calories').textContent = mealSession.totalCalories;
  document.getElementById('stat-protein').textContent  = mealSession.totalProteinGrams.toFixed(1);
  document.getElementById('stat-water').textContent    = waterSession.totalLitres.toFixed(1);
  document.getElementById('progress-calories').style.width = Math.min(100, (mealSession.totalCalories / GOALS.calories) * 100) + '%';
  document.getElementById('progress-protein').style.width  = Math.min(100, (mealSession.totalProteinGrams / GOALS.protein) * 100) + '%';
  document.getElementById('progress-water').style.width    = Math.min(100, (waterSession.totalLitres / GOALS.water) * 100) + '%';

  renderMealFeed(mealSession.entries, 'meal-feed', 'meal-timeline-line', true);
  renderWaterFeed(waterSession.entries, 'water-feed', 'water-timeline-line', true);
}

// ── History (all entries) ─────────────────────────────────────────────────────

async function refreshHistory() {
  const [meals, water] = await Promise.all([
    api.get('/api/meals'),
    api.get('/api/hydration'),
  ]);

  const mealsSorted = meals.slice().sort((a, b) => new Date(b.eatenAt)  - new Date(a.eatenAt));
  const waterSorted = water.slice().sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));

  renderMealFeed(mealsSorted,  'hist-meal-feed',  'hist-meal-timeline-line',  false);
  renderWaterFeed(waterSorted, 'hist-water-feed', 'hist-water-timeline-line', false);
}

async function refreshAll() {
  await refreshFeed();
  if (currentPanel === 'history')  refreshHistory();
  if (currentPanel === 'insights') refreshInsights();
}

// ── Feed rendering ────────────────────────────────────────────────────────────

function renderMealFeed(entries, listId, lineId, isRecent) {
  const list = document.getElementById(listId);
  if (entries.length === 0) {
    const msg = isRecent
      ? 'Nothing logged in the last 10 hours.'
      : 'No meals logged yet.';
    list.innerHTML = `<li class="text-stone-400 text-sm pl-8 py-2">${msg}</li>`;
    setColumnGradient(lineId, [], 'eatenAt');
    return;
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const firstDate = entries[0].eatenAt.split('T')[0];
  let html = firstDate === todayStr ? todayHeader() : dateSeparator(firstDate);
  entries.forEach((entry, i) => {
    if (i > 0) {
      const prevDate = entries[i - 1].eatenAt.split('T')[0];
      const currDate = entry.eatenAt.split('T')[0];
      const mins = (new Date(entries[i - 1].eatenAt) - new Date(entry.eatenAt)) / 60000;
      html += mealGapView(mins);
      if (prevDate !== currDate) html += dateSeparator(currDate);
    }
    html += mealReadView(entry);
  });
  list.innerHTML = html;
  setColumnGradient(lineId, entries, 'eatenAt');
}

function renderWaterFeed(entries, listId, lineId, isRecent) {
  const list = document.getElementById(listId);
  if (entries.length === 0) {
    const msg = isRecent
      ? 'Nothing logged in the last 10 hours.'
      : 'No water logged yet.';
    list.innerHTML = `<li class="text-stone-400 text-sm pl-8 py-2">${msg}</li>`;
    setColumnGradient(lineId, [], 'loggedAt');
    return;
  }

  const todayStr = new Date().toLocaleDateString('en-CA');
  const firstDate = entries[0].loggedAt.split('T')[0];
  let html = firstDate === todayStr ? todayHeader() : dateSeparator(firstDate);
  entries.forEach((entry, i) => {
    if (i > 0) {
      const prevDate = entries[i - 1].loggedAt.split('T')[0];
      const currDate = entry.loggedAt.split('T')[0];
      const mins = (new Date(entries[i - 1].loggedAt) - new Date(entry.loggedAt)) / 60000;
      html += waterGapView(mins);
      if (prevDate !== currDate) html += dateSeparator(currDate);
    }
    html += waterReadView(entry);
  });
  list.innerHTML = html;
  setColumnGradient(lineId, entries, 'loggedAt');
}

// ── Insights ──────────────────────────────────────────────────────────────────

async function refreshInsights() {
  const [mealIns, waterIns] = await Promise.all([
    api.get(`/api/meals/insights?days=${insightsPeriod}`),
    api.get(`/api/hydration/insights?days=${insightsPeriod}`),
  ]);
  renderInsights(mealIns, waterIns);
}

function switchInsightsPeriod(days) {
  insightsPeriod = days;
  [7, 30].forEach(d => {
    const btn = document.getElementById(`insights-btn-${d}`);
    const active = d === days;
    btn.className = `px-4 py-1.5 rounded-full text-sm font-medium transition ${
      active ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`;
  });
  refreshInsights();
}

function renderInsights(mealIns, waterIns) {
  document.getElementById('ins-avg-cal').textContent   = mealIns.avgCalories;
  document.getElementById('ins-avg-prot').textContent  = mealIns.avgProteinGrams.toFixed(1);
  document.getElementById('ins-avg-water').textContent = waterIns.avgLitres.toFixed(1);
  document.getElementById('ins-days-logged').textContent = `${mealIns.daysLogged}/${insightsPeriod}`;

  renderBarChart('chart-calories',  'chart-cal-labels',   mealIns.days,  'totalCalories', 'bg-orange-400', 'bg-stone-100');
  renderBarChart('chart-water',     'chart-water-labels', waterIns.days, 'totalLitres',   'bg-sky-400',    'bg-stone-100');
}

function renderBarChart(chartId, labelsId, days, valueKey, activeColor, emptyColor) {
  const values = days.map(d => d[valueKey] || 0);
  const maxVal = Math.max(...values, 1);
  const show7  = days.length <= 7;

  document.getElementById(chartId).innerHTML = days.map((d, i) => {
    const pct = Math.round((values[i] / maxVal) * 100);
    const label = formatDateShort(d.date);
    const tip = `${label}: ${typeof values[i] === 'number' ? values[i].toFixed(values[i] % 1 === 0 ? 0 : 1) : values[i]}`;
    return `<div class="flex-1 self-stretch relative min-w-[20px] group" title="${tip}">
      <div class="absolute bottom-0 left-0 right-0 rounded-t ${values[i] > 0 ? activeColor : emptyColor} group-hover:opacity-80 transition-all"
           style="height:${Math.max(pct, values[i] > 0 ? 4 : 2)}%"></div>
    </div>`;
  }).join('');

  document.getElementById(labelsId).innerHTML = days.map((d, i) => {
    const label = formatDateShort(d.date);
    const visible = show7 || i % 5 === 0 || i === days.length - 1;
    return `<div class="flex-1 text-center text-[10px] text-stone-400 min-w-[20px] ${visible ? '' : 'invisible'}">${label}</div>`;
  }).join('');
}

// ── Entry views ───────────────────────────────────────────────────────────────

function mealReadView(entry) {
  const safeName = entry.name.replace(/'/g, "\\'");
  return `
    <li class="flex items-start min-w-0" data-id="${entry.id}">
      <div class="shrink-0 w-5 flex justify-center pt-[14px]">
        <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white shadow-sm"></div>
      </div>
      <div class="flex-1 min-w-0 bg-white rounded-xl px-4 py-3 shadow-sm border border-stone-100">
        <div class="flex justify-between items-start gap-2">
          <div class="min-w-0">
            <div class="font-medium text-sm text-stone-900 break-words">${entry.name}</div>
            <div class="text-xs text-stone-400 mt-0.5">
              <span class="text-orange-500 font-medium">${entry.calories} kcal</span>
              <span class="mx-1.5 text-stone-200">·</span>
              <span class="text-violet-500 font-medium">${entry.proteinGrams}g protein</span>
            </div>
          </div>
          <div class="flex items-center gap-1 shrink-0">
            <span class="text-[11px] text-stone-400 mr-1">${formatTime(entry.eatenAt)}</span>
            <button onclick="showMealEdit(${entry.id}, '${safeName}', ${entry.calories}, ${entry.proteinGrams}, '${entry.eatenAt}')"
              class="p-1.5 text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition" title="Edit">
              ${ICON_EDIT}
            </button>
            <button onclick="handleDeleteMeal(${entry.id})"
              class="p-1.5 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete">
              ${ICON_TRASH}
            </button>
          </div>
        </div>
      </div>
    </li>`;
}

function mealEditView(id, name, calories, protein, eatenAt) {
  const timeVal = eatenAt ? extractHHMM(eatenAt) : currentHHMM();
  const dateVal = eatenAt ? eatenAt.split('T')[0] : new Date().toLocaleDateString('en-CA');
  return `
    <li class="bg-white rounded-xl px-4 py-3 space-y-2 shadow-sm border border-emerald-200" data-id="${id}">
      <div class="flex gap-2">
        <input id="edit-meal-name-${id}" value="${name}" type="text"
          class="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        <button type="button" onclick="handleAnalyzeEdit(${id}, this)"
          class="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-xs text-stone-600 font-medium rounded-lg transition whitespace-nowrap">
          Analyze
        </button>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <input id="edit-meal-cal-${id}"  value="${calories}" type="number"
          class="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
        <input id="edit-meal-prot-${id}" value="${protein}"  type="number" step="0.1"
          class="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-stone-400 shrink-0">eaten at</span>
        <input id="edit-meal-time-${id}" value="${timeVal}" type="time"
          class="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
      </div>
      <div class="flex gap-2">
        <button onclick="handleUpdateMeal(${id}, '${dateVal}')"
          class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 rounded-lg font-medium transition">Save</button>
        <button onclick="refreshFeed()"
          class="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs py-1.5 rounded-lg font-medium transition">Cancel</button>
      </div>
    </li>`;
}

function waterReadView(entry) {
  return `
    <li class="flex items-start" data-id="${entry.id}">
      <div class="shrink-0 w-5 flex justify-center pt-[14px]">
        <div class="w-2.5 h-2.5 rounded-full bg-sky-400 ring-2 ring-white shadow-sm"></div>
      </div>
      <div class="flex-1 bg-white rounded-xl px-4 py-3 shadow-sm border border-stone-100 flex justify-between items-center gap-2">
        <span class="text-sky-500 font-semibold text-sm">${entry.amountLitres}L</span>
        <div class="flex items-center gap-1 shrink-0">
          <span class="text-[11px] text-stone-400 mr-1">${formatTime(entry.loggedAt)}</span>
          <button onclick="showWaterEdit(${entry.id}, ${entry.amountLitres}, '${entry.loggedAt}')"
            class="p-1.5 text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition" title="Edit">
            ${ICON_EDIT}
          </button>
          <button onclick="handleDeleteWater(${entry.id})"
            class="p-1.5 text-stone-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition" title="Delete">
            ${ICON_TRASH}
          </button>
        </div>
      </div>
    </li>`;
}

function waterEditView(id, amount, loggedAt) {
  const timeVal = loggedAt ? extractHHMM(loggedAt) : currentHHMM();
  const dateVal = loggedAt ? loggedAt.split('T')[0] : new Date().toLocaleDateString('en-CA');
  return `
    <li class="bg-white rounded-xl px-4 py-3 space-y-2 shadow-sm border border-emerald-200" data-id="${id}">
      <input id="edit-water-${id}" value="${amount}" type="number" step="0.1"
        class="w-full bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
      <div class="flex items-center gap-2">
        <span class="text-xs text-stone-400 shrink-0">had at</span>
        <input id="edit-water-time-${id}" value="${timeVal}" type="time"
          class="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-2 py-1.5 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
      </div>
      <div class="flex gap-2">
        <button onclick="handleUpdateWater(${id}, '${dateVal}')"
          class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 rounded-lg font-medium transition">Save</button>
        <button onclick="refreshFeed()"
          class="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs py-1.5 rounded-lg font-medium transition">Cancel</button>
      </div>
    </li>`;
}

// ── Edit / delete handlers ────────────────────────────────────────────────────

function showMealEdit(id, name, calories, protein, eatenAt) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.outerHTML = mealEditView(id, name, calories, protein, eatenAt);
}

function showWaterEdit(id, amount, loggedAt) {
  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.outerHTML = waterEditView(id, amount, loggedAt);
}

async function handleUpdateMeal(id, dateVal) {
  const name     = document.getElementById(`edit-meal-name-${id}`).value.trim();
  const calories = parseInt(document.getElementById(`edit-meal-cal-${id}`).value);
  const protein  = parseFloat(document.getElementById(`edit-meal-prot-${id}`).value);
  if (!name || !calories) return;
  const timeVal = document.getElementById(`edit-meal-time-${id}`).value;
  const eatenAt = timeVal ? buildDateTime(dateVal, timeVal) : null;
  await api.put(`/api/meals/${id}`, { name, calories, proteinGrams: protein || 0, eatenAt });
  refreshAll();
}

async function handleDeleteMeal(id) {
  await api.delete(`/api/meals/${id}`);
  refreshAll();
}

async function handleUpdateWater(id, dateVal) {
  const amount = parseFloat(document.getElementById(`edit-water-${id}`).value);
  if (!amount) return;
  const timeVal = document.getElementById(`edit-water-time-${id}`).value;
  const loggedAt = timeVal ? buildDateTime(dateVal, timeVal) : null;
  await api.put(`/api/hydration/${id}`, { amountLitres: amount, loggedAt });
  refreshAll();
}

async function handleDeleteWater(id) {
  await api.delete(`/api/hydration/${id}`);
  refreshAll();
}

// ── Analyze ───────────────────────────────────────────────────────────────────

async function runAnalyze(nameId, calId, protId, btn) {
  const name = document.getElementById(nameId).value.trim();
  if (!name) return;
  const orig = btn.textContent;
  btn.disabled = true;
  btn.textContent = '…';
  try {
    const est = await api.post('/api/meals/analyze', { name }).then(r => r.json());
    document.getElementById(calId).value = est.calories;
    document.getElementById(protId).value = est.proteinGrams;
    btn.disabled = false;
    btn.textContent = orig;
  } catch {
    btn.textContent = 'Error';
    setTimeout(() => { btn.disabled = false; btn.textContent = orig; }, 2000);
  }
}

async function handleAnalyze() {
  const calSpinner  = document.getElementById('cal-spinner');
  const protSpinner = document.getElementById('prot-spinner');
  calSpinner.classList.remove('hidden');
  protSpinner.classList.remove('hidden');
  await runAnalyze('meal-name', 'meal-calories', 'meal-protein', document.getElementById('analyze-btn'));
  calSpinner.classList.add('hidden');
  protSpinner.classList.add('hidden');
}

function handleAnalyzeEdit(id, btn) {
  runAnalyze(`edit-meal-name-${id}`, `edit-meal-cal-${id}`, `edit-meal-prot-${id}`, btn);
}

// ── Forms ─────────────────────────────────────────────────────────────────────

document.getElementById('meal-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const name     = document.getElementById('meal-name').value.trim();
  const calories = parseInt(document.getElementById('meal-calories').value);
  const protein  = parseFloat(document.getElementById('meal-protein').value);
  if (!name || !calories) return;
  const timeVal = document.getElementById('meal-time').value;
  const dateVal = document.getElementById('meal-date').value || new Date().toLocaleDateString('en-CA');
  const eatenAt = timeVal ? buildDateTime(dateVal, timeVal) : null;
  await api.post('/api/meals', { name, calories, proteinGrams: protein || 0, eatenAt });
  e.target.reset();
  resetFormTimes();
  refreshAll();
});

document.getElementById('water-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const amount = parseFloat(document.getElementById('water-amount').value);
  if (!amount) return;
  const timeVal  = document.getElementById('water-time').value;
  const dateVal  = document.getElementById('water-date').value || new Date().toLocaleDateString('en-CA');
  const loggedAt = timeVal ? buildDateTime(dateVal, timeVal) : null;
  await api.post('/api/hydration', { amountLitres: amount, loggedAt });
  e.target.reset();
  resetFormTimes();
  refreshAll();
});

// ── Time-of-day gradient (light mode palette) ─────────────────────────────────

const TIME_STOPS = [
  { h:  0, r: 129, g: 140, b: 248 },  // midnight  — indigo-400
  { h:  5, r: 167, g: 139, b: 250 },  // pre-dawn  — violet-400
  { h:  6, r: 251, g: 146, b:  60 },  // dawn      — orange-400
  { h:  9, r: 251, g: 191, b:  36 },  // morning   — amber-400
  { h: 12, r: 163, g: 230, b:  53 },  // noon      — lime-400
  { h: 15, r: 251, g: 191, b:  36 },  // afternoon — amber-400
  { h: 18, r: 251, g: 113, b: 133 },  // sunset    — rose-400
  { h: 21, r: 192, g: 132, b: 252 },  // evening   — purple-400
  { h: 24, r: 129, g: 140, b: 248 },  // midnight  — indigo-400
];

function timeOfDayColor(isoString) {
  const d = new Date(isoString);
  const hours = d.getHours() + d.getMinutes() / 60;
  let from, to;
  for (let i = 0; i < TIME_STOPS.length - 1; i++) {
    if (hours >= TIME_STOPS[i].h && hours < TIME_STOPS[i + 1].h) {
      from = TIME_STOPS[i];
      to   = TIME_STOPS[i + 1];
      break;
    }
  }
  if (!from) return 'rgb(129,140,248)';
  const t = (hours - from.h) / (to.h - from.h);
  const r = Math.round(from.r + t * (to.r - from.r));
  const g = Math.round(from.g + t * (to.g - from.g));
  const b = Math.round(from.b + t * (to.b - from.b));
  return `rgb(${r},${g},${b})`;
}

// ── Gap views ─────────────────────────────────────────────────────────────────

const MEAL_SNAP_MINS  = 5;
const WATER_SNAP_MINS = 3;

function gapHeight(mins) {
  return Math.round(Math.min(88, Math.max(24, mins * 0.5)));
}

function formatGapLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return h > 0 ? (m > 0 ? `${h}h ${m}m` : `${h}h`) : `${m}m`;
}

function renderGapItem(mins) {
  const h = gapHeight(mins);
  return `
    <li class="flex items-center pointer-events-none" style="height:${h}px" aria-hidden="true">
      <div class="shrink-0 w-5"></div>
      <div class="pl-3">
        <span class="text-xs text-stone-300">${formatGapLabel(mins)}</span>
      </div>
    </li>`;
}

function mealGapView(mins) {
  if (mins < MEAL_SNAP_MINS) return '';
  return renderGapItem(mins);
}

function waterGapView(mins) {
  if (mins < WATER_SNAP_MINS) return '';
  return renderGapItem(mins);
}

// ── Column gradient ───────────────────────────────────────────────────────────

function toHoursFloat(isoString) {
  const d = new Date(isoString);
  return d.getHours() + d.getMinutes() / 60;
}

function buildColumnGradient(entries, timeField) {
  if (entries.length === 0) return '#e7e5e4';
  if (entries.length === 1) return timeOfDayColor(entries[0][timeField]);

  const newestHours = toHoursFloat(entries[0][timeField]);
  const oldestHours = toHoursFloat(entries[entries.length - 1][timeField]);
  const topColor    = timeOfDayColor(entries[0][timeField]);
  const botColor    = timeOfDayColor(entries[entries.length - 1][timeField]);
  const span        = newestHours - oldestHours;

  if (span <= 0) {
    return `linear-gradient(to bottom, ${topColor}, ${botColor})`;
  }

  const stops = [`${topColor} 0%`];
  TIME_STOPS.forEach(s => {
    if (s.h > oldestHours && s.h < newestHours) {
      const pct = ((newestHours - s.h) / span * 100).toFixed(1);
      stops.push(`rgb(${s.r},${s.g},${s.b}) ${pct}%`);
    }
  });
  stops.push(`${botColor} 100%`);

  return `linear-gradient(to bottom, ${stops.join(', ')})`;
}

function setColumnGradient(lineId, entries, timeField) {
  const el = document.getElementById(lineId);
  if (el) el.style.background = buildColumnGradient(entries, timeField);
}

// ── Date separator ────────────────────────────────────────────────────────────

function todayHeader() {
  return `
    <li class="flex items-center py-3 pointer-events-none" aria-hidden="true">
      <div class="shrink-0 w-5 flex justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
      </div>
      <div class="flex-1 flex items-center gap-2 pl-2">
        <span class="text-xs font-semibold text-emerald-600 shrink-0">Today</span>
        <div class="h-px flex-1 bg-stone-100"></div>
      </div>
    </li>`;
}

function dateSeparator(dateStr) {
  return `
    <li class="flex items-center py-3 pointer-events-none" aria-hidden="true">
      <div class="shrink-0 w-5 flex justify-center">
        <div class="w-1.5 h-1.5 rounded-full bg-stone-300"></div>
      </div>
      <div class="flex-1 flex items-center gap-2 pl-2">
        <span class="text-xs text-stone-400 shrink-0">${formatDateLong(dateStr)}</span>
        <div class="h-px flex-1 bg-stone-100"></div>
      </div>
    </li>`;
}

// ── Time helpers ──────────────────────────────────────────────────────────────

function currentHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function extractHHMM(isoString) {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}

function buildDateTime(dateStr, timeHHMM) {
  return `${dateStr}T${timeHHMM}:00`;
}

function resetFormTimes() {
  const t = currentHHMM();
  const d = new Date().toLocaleDateString('en-CA');
  ['meal-time', 'water-time'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = t;
  });
  ['meal-date', 'water-date'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = d;
  });
}

// ── Date formatting ───────────────────────────────────────────────────────────

function formatTime(isoString) {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDateLong(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString([], {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function formatDateShort(dateStr) {
  const d = new Date(String(dateStr) + 'T12:00:00');
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

document.getElementById('today-date').textContent = new Date().toLocaleDateString([], {
  weekday: 'long', month: 'long', day: 'numeric',
});

setActiveNav('home');
initUsers().then(() => { refreshFeed(); resetFormTimes(); });
