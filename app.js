const moodBtns = document.querySelectorAll('.mood');
const energyBtns = document.querySelectorAll('.energy-btn');
const noteInput = document.getElementById('note');
const saveBtn = document.getElementById('save-btn');
const gridEl = document.getElementById('mood-grid');
const insightsEl = document.getElementById('insights');
const todayDateEl = document.getElementById('today-date');
const clearBtn = document.getElementById('clear-btn');

let selectedMood = null;
let selectedEnergy = null;

const moodEmojis = ['', '😞', '😕', '😐', '🙂', '😄'];
const moodLabels = ['', 'Bardzo źle', 'Słabo', 'Neutralnie', 'Dobrze', 'Świetnie'];

// Date helpers
function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
}

// Storage
function loadData() {
  return JSON.parse(localStorage.getItem('moodglow') || '{}');
}

function saveData(data) {
  localStorage.setItem('moodglow', JSON.stringify(data));
}

// UI selection
moodBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    moodBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedMood = parseInt(btn.dataset.mood);
  });
});

energyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    energyBtns.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedEnergy = parseInt(btn.dataset.energy);
  });
});

// Save today
saveBtn.addEventListener('click', () => {
  if (!selectedMood) {
    alert('Wybierz nastrój');
    return;
  }

  const data = loadData();
  const key = todayKey();
  
  data[key] = {
    mood: selectedMood,
    energy: selectedEnergy || 3,
    note: noteInput.value.trim(),
    ts: Date.now()
  };

  saveData(data);
  renderGrid();
  renderInsights();
  
  saveBtn.textContent = 'Zapisano ✨';
  setTimeout(() => saveBtn.textContent = 'Zapisz dzień', 1500);
});

// Render grid (last 28 days)
function renderGrid() {
  const data = loadData();
  const days = [];
  
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }

  const today = todayKey();
  
  gridEl.innerHTML = days.map(date => {
    const entry = data[date];
    const isToday = date === today;
    
    if (entry) {
      return `<div class="day has-mood mood-${entry.mood} ${isToday ? 'today' : ''}" title="${formatDate(date)}: ${moodLabels[entry.mood]}${entry.note ? ' – ' + entry.note : ''}">${moodEmojis[entry.mood]}</div>`;
    }
    return `<div class="day ${isToday ? 'today' : ''}" title="${formatDate(date)}">${new Date(date + 'T12:00:00').getDate()}</div>`;
  }).join('');
}

// Insights
function renderInsights() {
  const data = loadData();
  const entries = Object.entries(data)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 28);

  if (entries.length === 0) {
    insightsEl.innerHTML = 'Zapisuj nastrój przez kilka dni, a tutaj pojawią się ciekawe podsumowania.';
    return;
  }

  const moods = entries.map(([, e]) => e.mood);
  const avg = (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1);
  const best = Math.max(...moods);
  const count = entries.length;
  
  // Most common mood
  const freq = {};
  moods.forEach(m => freq[m] = (freq[m] || 0) + 1);
  const mostCommon = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];

  let html = `Zapisanych dni: <strong>${count}</strong><br>`;
  html += `Średni nastrój: <strong>${avg}/5</strong> ${moodEmojis[Math.round(avg)]}<br>`;
  html += `Najczęstszy stan: <strong>${moodLabels[mostCommon]}</strong> ${moodEmojis[mostCommon]}<br>`;

  if (count >= 5) {
    const recent = moods.slice(0, 5);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    if (recentAvg >= 4) {
      html += `<br>Ostatnie dni wyglądają naprawdę dobrze. Tak trzymaj!`;
    } else if (recentAvg <= 2.5) {
      html += `<br>Ostatnio bywa ciężko. Pamiętaj, że to tylko chwila – małe rzeczy też się liczą.`;
    }
  }

  insightsEl.innerHTML = html;
}

// Clear all
clearBtn.addEventListener('click', () => {
  if (confirm('Na pewno chcesz usunąć wszystkie zapisy?')) {
    localStorage.removeItem('moodglow');
    selectedMood = null;
    selectedEnergy = null;
    moodBtns.forEach(b => b.classList.remove('selected'));
    energyBtns.forEach(b => b.classList.remove('selected'));
    noteInput.value = '';
    renderGrid();
    renderInsights();
  }
});

// Load today's entry if exists
function loadToday() {
  const data = loadData();
  const entry = data[todayKey()];
  if (entry) {
    selectedMood = entry.mood;
    selectedEnergy = entry.energy;
    noteInput.value = entry.note || '';
    
    moodBtns.forEach(b => b.classList.toggle('selected', parseInt(b.dataset.mood) === entry.mood));
    energyBtns.forEach(b => b.classList.toggle('selected', parseInt(b.dataset.energy) === entry.energy));
  }
}

// Init
todayDateEl.textContent = formatDate(todayKey());
loadToday();
renderGrid();
renderInsights();