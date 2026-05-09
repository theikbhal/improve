let cursorTimeTracker;
let isEnabled = true;
let offsetX = 15; // Distance from cursor
let offsetY = 15;

// Create the tracker element
function createTrackerElement() {
  if (document.getElementById('cursor-time-tracker')) return;

  cursorTimeTracker = document.createElement('div');
  cursorTimeTracker.id = 'cursor-time-tracker';
  cursorTimeTracker.className = 'cursor-time-hidden'; // Initially hidden until mouse moves
  
  // Format the current time
  updateTime();

  document.body.appendChild(cursorTimeTracker);
  
  // Update time every second to catch minute changes precisely
  setInterval(updateTime, 1000); 
}

function updateTime() {
  if (!cursorTimeTracker) return;
  const now = new Date();
  let hours = now.getHours();
  let minutes = now.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const strTime = hours + ':' + minutes + ' ' + ampm;
  cursorTimeTracker.innerText = strTime;
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

  // Update position based on viewport coordinates (fixed positioning)
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

// Check storage for enabled state
chrome.storage.sync.get(['isEnabled'], (result) => {
  if (result.isEnabled !== undefined) {
    isEnabled = result.isEnabled;
  }
  if (!isEnabled && cursorTimeTracker) {
    cursorTimeTracker.classList.add('cursor-time-hidden');
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggle") {
    isEnabled = request.isEnabled;
    if (!isEnabled && cursorTimeTracker) {
      cursorTimeTracker.classList.remove('cursor-time-visible');
      cursorTimeTracker.classList.add('cursor-time-hidden');
    }
  }
});
