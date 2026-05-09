let cursorTimeTracker;
let isEnabled = true;
let goalIcon = "🎯";
let goalText = "FOCUS";
let thanksCount = 0;
let sorryCount = 0;
let thanksShortcut = 't';
let sorryShortcut = 's';
let offsetX = 15; 
let offsetY = 15;

// Visibility Settings
let showGoal = true;
let showCounters = true;
let showThanks = true;
let showSorry = true;

// 1. Initial Load from Storage
function loadSettings() {
  chrome.storage.sync.get(['isEnabled', 'goalIcon', 'goalText', 'thanksCount', 'sorryCount', 'thanksShortcut', 'sorryShortcut', 'showGoal', 'showCounters', 'showThanks', 'showSorry'], (result) => {
    applySettings(result);
  });
}

function applySettings(result) {
  if (result.isEnabled !== undefined) isEnabled = result.isEnabled;
  if (result.goalIcon !== undefined) goalIcon = result.goalIcon || "🎯";
  if (result.goalText !== undefined) goalText = result.goalText || "FOCUS";
  thanksCount = result.thanksCount || 0;
  sorryCount = result.sorryCount || 0;
  thanksShortcut = result.thanksShortcut || 't';
  sorryShortcut = result.sorryShortcut || 's';
  
  showGoal = result.showGoal !== undefined ? result.showGoal : true;
  showCounters = result.showCounters !== undefined ? result.showCounters : true;
  showThanks = result.showThanks !== undefined ? result.showThanks : true;
  showSorry = result.showSorry !== undefined ? result.showSorry : true;

  if (cursorTimeTracker) {
    if (!isEnabled) {
      cursorTimeTracker.classList.remove('cursor-time-visible');
      cursorTimeTracker.classList.add('cursor-time-hidden');
    } else {
      updateContent();
    }
  }
}

// 2. Listen for Storage Changes (Robust cross-tab syncing)
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'sync') {
    chrome.storage.sync.get(['isEnabled', 'goalIcon', 'goalText', 'thanksCount', 'sorryCount', 'thanksShortcut', 'sorryShortcut', 'showGoal', 'showCounters', 'showThanks', 'showSorry'], (result) => {
      applySettings(result);
    });
  }
});

loadSettings();

// Create the tracker element
function createTrackerElement() {
  if (document.getElementById('cursor-time-tracker')) return;

  cursorTimeTracker = document.createElement('div');
  cursorTimeTracker.id = 'cursor-time-tracker';
  cursorTimeTracker.className = 'cursor-time-hidden'; 
  
  const iconSpan = document.createElement('span');
  iconSpan.id = 'cursor-goal-icon';
  
  const textSpan = document.createElement('span');
  textSpan.id = 'cursor-goal-text';
  
  const divider1 = document.createElement('span');
  divider1.id = 'cursor-divider-1';
  divider1.className = 'cursor-divider';
  divider1.innerText = '|';

  const thanksSpan = document.createElement('span');
  thanksSpan.id = 'cursor-thanks';
  
  const space = document.createElement('span');
  space.id = 'cursor-counter-space';
  space.innerText = ' ';

  const sorrySpan = document.createElement('span');
  sorrySpan.id = 'cursor-sorry';
  
  const divider2 = document.createElement('span');
  divider2.id = 'cursor-divider-2';
  divider2.className = 'cursor-divider';
  divider2.innerText = '|';

  const timeSpan = document.createElement('span');
  timeSpan.id = 'cursor-time-text';

  cursorTimeTracker.appendChild(iconSpan);
  cursorTimeTracker.appendChild(textSpan);
  cursorTimeTracker.appendChild(divider1);
  cursorTimeTracker.appendChild(thanksSpan);
  cursorTimeTracker.appendChild(space);
  cursorTimeTracker.appendChild(sorrySpan);
  cursorTimeTracker.appendChild(divider2);
  cursorTimeTracker.appendChild(timeSpan);

  document.body.appendChild(cursorTimeTracker);
  
  updateContent();
  setInterval(updateContent, 1000); 
}

function updateContent() {
  if (!cursorTimeTracker) return;
  
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; 
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const strTime = hours + ':' + minutes + ' ' + ampm;
  
  document.getElementById('cursor-goal-icon').innerText = goalIcon;
  document.getElementById('cursor-goal-text').innerText = goalText;
  document.getElementById('cursor-thanks').innerText = `T:${thanksCount}`;
  document.getElementById('cursor-sorry').innerText = `S:${sorryCount}`;
  document.getElementById('cursor-time-text').innerText = strTime;

  // Visibility
  document.getElementById('cursor-goal-icon').style.display = showGoal ? 'inline' : 'none';
  document.getElementById('cursor-goal-text').style.display = showGoal ? 'inline' : 'none';
  document.getElementById('cursor-divider-1').style.display = showGoal && (showCounters || true) ? 'inline' : 'none';
  const showAnyCounter = showCounters && (showThanks || showSorry);
  document.getElementById('cursor-thanks').style.display = (showCounters && showThanks) ? 'inline' : 'none';
  document.getElementById('cursor-counter-space').style.display = (showCounters && showThanks && showSorry) ? 'inline' : 'none';
  document.getElementById('cursor-sorry').style.display = (showCounters && showSorry) ? 'inline' : 'none';
  document.getElementById('cursor-divider-2').style.display = (showGoal || showAnyCounter) ? 'inline' : 'none';
}

// KEYBOARD SHORTCUTS
document.addEventListener('keydown', (e) => {
  const activeEl = document.activeElement;
  if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) {
    return;
  }

  const pressedKey = e.key.toLowerCase();
  if (pressedKey === thanksShortcut) {
    thanksCount++;
    saveData();
    updateContent();
  } else if (pressedKey === sorryShortcut) {
    sorryCount++;
    saveData();
    updateContent();
  }
});

// MOUSE CLICK SHORTCUTS
document.addEventListener('click', (e) => {
  if (e.ctrlKey || e.metaKey) {
    thanksCount++;
    saveData();
    updateContent();
    e.preventDefault();
  } 
  else if (e.altKey) {
    sorryCount++;
    saveData();
    updateContent();
    e.preventDefault();
  }
});

function saveData() {
  chrome.storage.sync.set({
    thanksCount: thanksCount,
    sorryCount: sorryCount
  });
}

// Track mouse movement
document.addEventListener('mousemove', (e) => {
  if (!isEnabled) return;
  
  if (!cursorTimeTracker) {
    createTrackerElement();
  }
  
  if (cursorTimeTracker.classList.contains('cursor-time-hidden')) {
    cursorTimeTracker.classList.remove('cursor-time-hidden');
    cursorTimeTracker.classList.add('cursor-time-visible');
  }

  cursorTimeTracker.style.left = (e.clientX + offsetX) + 'px';
  cursorTimeTracker.style.top = (e.clientY + offsetY) + 'px';
});

document.addEventListener('mouseleave', () => {
  if (cursorTimeTracker) {
    cursorTimeTracker.classList.remove('cursor-time-visible');
    cursorTimeTracker.classList.add('cursor-time-hidden');
  }
});

document.addEventListener('mouseenter', () => {
  if (cursorTimeTracker && isEnabled) {
    cursorTimeTracker.classList.remove('cursor-time-hidden');
    cursorTimeTracker.classList.add('cursor-time-visible');
  }
});
