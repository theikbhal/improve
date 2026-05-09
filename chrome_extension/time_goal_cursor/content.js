let cursorTimeTracker;
let isEnabled = true;
let goalIcon = "🎯";
let goalText = "FOCUS";
let offsetX = 15; // Distance from cursor
let offsetY = 15;

// Fetch initial data
chrome.storage.sync.get(['isEnabled', 'goalIcon', 'goalText'], (result) => {
  if (result.isEnabled !== undefined) isEnabled = result.isEnabled;
  if (result.goalIcon !== undefined) goalIcon = result.goalIcon || "🎯";
  if (result.goalText !== undefined) goalText = result.goalText || "FOCUS";
});

// Create the tracker element
function createTrackerElement() {
  if (document.getElementById('cursor-time-tracker')) return;

  cursorTimeTracker = document.createElement('div');
  cursorTimeTracker.id = 'cursor-time-tracker';
  cursorTimeTracker.className = 'cursor-time-hidden'; // Initially hidden until mouse moves
  
  // Create inner elements for styling
  const iconSpan = document.createElement('span');
  iconSpan.id = 'cursor-goal-icon';
  
  const textSpan = document.createElement('span');
  textSpan.id = 'cursor-goal-text';
  
  const divider = document.createElement('span');
  divider.className = 'cursor-divider';
  divider.innerText = '|';

  const timeSpan = document.createElement('span');
  timeSpan.id = 'cursor-time-text';

  cursorTimeTracker.appendChild(iconSpan);
  cursorTimeTracker.appendChild(textSpan);
  cursorTimeTracker.appendChild(divider);
  cursorTimeTracker.appendChild(timeSpan);

  document.body.appendChild(cursorTimeTracker);
  
  updateContent();
  setInterval(updateContent, 1000); 
}

function updateContent() {
  if (!cursorTimeTracker) return;
  
  // Format the current time
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
  document.getElementById('cursor-time-text').innerText = strTime;
}

// Track mouse movement
document.addEventListener('mousemove', (e) => {
  if (!isEnabled) return;
  
  if (!cursorTimeTracker) {
    createTrackerElement();
  }
  
  // Make visible on first move
  if (cursorTimeTracker.classList.contains('cursor-time-hidden')) {
    cursorTimeTracker.classList.remove('cursor-time-hidden');
    cursorTimeTracker.classList.add('cursor-time-visible');
  }

  // Update position
  cursorTimeTracker.style.left = (e.clientX + offsetX) + 'px';
  cursorTimeTracker.style.top = (e.clientY + offsetY) + 'px';
});

// Hide when mouse leaves the window
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

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateData" || request.action === "toggle") {
    if (request.data) {
       isEnabled = request.data.isEnabled;
       goalIcon = request.data.goalIcon || "";
       goalText = request.data.goalText || "";
    } else if (request.isEnabled !== undefined) {
       isEnabled = request.isEnabled;
    }

    if (!isEnabled && cursorTimeTracker) {
      cursorTimeTracker.classList.remove('cursor-time-visible');
      cursorTimeTracker.classList.add('cursor-time-hidden');
    } else if (isEnabled && cursorTimeTracker) {
      updateContent();
    }
  }
});
